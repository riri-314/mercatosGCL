const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { doc, setDoc, updateDoc } = require("firebase/firestore");
const { ref, uploadBytes, getBytes, deleteObject, listAll, updateMetadata } = require("firebase/storage");

const projectId = "demo-mercatos-security";
for (const name of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST"]) {
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(process.env[name] || "") ||
      process.env.GCLOUD_PROJECT !== projectId) {
    throw new Error(`Storage rule tests require the local demo emulators (${name})`);
  }
}

const bucket = `gs://${projectId}.appspot.com`;
const admin = { uid: "admin", email: "admin@example.test" };
const member = { uid: "member", email: "member@example.test" };
const bytes = new Uint8Array([1, 2, 3]);
let environment;

before(async () => {
  const [firestoreHost, firestorePort] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  const [storageHost, storagePort] = process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(":");
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { host: firestoreHost, port: Number(firestorePort) },
    storage: { host: storageHost, port: Number(storagePort),
      rules: readFileSync(path.resolve(__dirname, "../../storage.rules"), "utf8") },
  });
});

beforeEach(async () => {
  await Promise.all([environment.clearFirestore(), environment.clearStorage()]);
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "admin/admin"), { admins: { [admin.email]: admin.uid } }),
      setDoc(doc(db, "editions/active"), { active: true }),
      setDoc(doc(db, "editions/archive"), { active: false }),
      setDoc(doc(db, "editions/unspecified"), {}),
    ]);
    for (const edition of ["active", "archive", "unspecified", "missing"]) {
      await uploadBytes(ref(context.storage(bucket), `${edition}/member/photo.jpg`), bytes,
        { contentType: "image/jpeg" });
    }
  });
});

after(async () => {
  if (environment) await environment.cleanup();
});

function client(user) {
  return (user
    ? environment.authenticatedContext(user.uid, user.email ? { email: user.email } : {})
    : environment.unauthenticatedContext()).storage(bucket);
}

for (const [label, user] of [["visitor", null], ["member", member], ["member without email", { uid: member.uid }]]) {
  test(`${label} can read active pictures but cannot read archives or missing editions`, async () => {
    const storage = client(user);
    assert.deepEqual(new Uint8Array(await assertSucceeds(getBytes(ref(storage, "active/member/photo.jpg")))), bytes);
    for (const edition of ["archive", "unspecified", "missing"]) {
      await assertFails(getBytes(ref(storage, `${edition}/member/photo.jpg`)));
    }
  });
}

test("members can upload images only to their own active-edition folder", async () => {
  const storage = client(member);
  await assertSucceeds(uploadBytes(ref(storage, "active/member/new.jpg"), bytes, { contentType: "image/jpeg" }));
  for (const filename of ["active/other/new.jpg", "archive/member/new.jpg", "missing/member/new.jpg"]) {
    await assertFails(uploadBytes(ref(storage, filename), bytes, { contentType: "image/jpeg" }));
  }
  await assertFails(uploadBytes(ref(client(null), "active/member/anonymous.jpg"), bytes, { contentType: "image/jpeg" }));
});

test("member uploads require an image MIME type and a size below five MiB", async () => {
  const storage = client(member);
  await assertFails(uploadBytes(ref(storage, "active/member/text.jpg"), bytes, { contentType: "text/plain" }));
  await assertFails(uploadBytes(ref(storage, "active/member/oversize.jpg"), new Uint8Array(5 * 1024 * 1024),
    { contentType: "image/jpeg" }));
});

test("members cannot overwrite, change metadata, delete, or enumerate pictures", async () => {
  const storage = client(member);
  const picture = ref(storage, "active/member/photo.jpg");
  await assertFails(uploadBytes(picture, new Uint8Array([9]), { contentType: "image/jpeg" }));
  await assertFails(updateMetadata(picture, { customMetadata: { arbitrary: "change" } }));
  await assertFails(deleteObject(picture));
  await assertFails(listAll(ref(storage, "active/member")));
  assert.deepEqual(new Uint8Array(await getBytes(picture)), bytes);
});

test("mapped admins can read and manage archived pictures, but cannot enumerate through the client", async () => {
  const storage = client(admin);
  const picture = ref(storage, "archive/member/photo.jpg");
  assert.deepEqual(new Uint8Array(await assertSucceeds(getBytes(picture))), bytes);
  await assertSucceeds(uploadBytes(ref(storage, "archive/member/new.jpg"), bytes, { contentType: "image/jpeg" }));
  await assertSucceeds(updateMetadata(picture, { customMetadata: { approved: "true" } }));
  await assertSucceeds(deleteObject(picture));
  await assertFails(listAll(ref(storage, "archive/member")));
});

test("an admin email or UID alone cannot grant archive access or administrator writes", async () => {
  for (const identity of [{ uid: "intruder", email: admin.email }, { uid: admin.uid, email: "wrong@example.test" },
    { uid: admin.uid }]) {
    const storage = client(identity);
    await assertFails(getBytes(ref(storage, "archive/member/photo.jpg")));
    await assertFails(deleteObject(ref(storage, "active/member/photo.jpg")));
    await assertFails(uploadBytes(ref(storage, "archive/member/new.jpg"), bytes, { contentType: "image/jpeg" }));
  }
});

test("deactivating an edition immediately blocks public SDK reads", async () => {
  const picture = ref(client(null), "active/member/photo.jpg");
  await assertSucceeds(getBytes(picture));
  await environment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), "editions/active"), { active: false });
  });
  await assertFails(getBytes(picture));
});

test("a transition freezes public picture reads and member uploads", async () => {
  await environment.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), "editions/active"), { transitioning: true }));
  await assertFails(getBytes(ref(client(null), "active/member/photo.jpg")));
  await assertFails(getBytes(ref(client(member), "active/member/photo.jpg")));
  await assertFails(uploadBytes(ref(client(member), "active/member/late.jpg"), bytes, { contentType: "image/jpeg" }));
  await assertSucceeds(getBytes(ref(client(admin), "active/member/photo.jpg")));
});
