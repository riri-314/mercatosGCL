const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where } = require("firebase/firestore");

const projectId = "demo-mercatos-security";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulatorHost || !/^(127\.0\.0\.1|localhost):\d+$/.test(emulatorHost) ||
    process.env.GCLOUD_PROJECT !== projectId) {
  throw new Error("Run npm test: rule tests require the local demo Firestore emulator");
}

let environment;
const adminEmail = "admin@example.test";
const regularUser = { uid: "member", email: "member@example.test" };

before(async () => {
  const [host, port] = emulatorHost.split(":");
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { host, port: Number(port),
      rules: readFileSync(path.resolve(__dirname, "../../firestore.rules"), "utf8") },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "admin/admin"), { admins: { [adminEmail]: "admin" } }),
      setDoc(doc(db, "editions/active"), { active: true, edition: 2 }),
      setDoc(doc(db, "editions/archive"), { active: false, edition: 1 }),
      setDoc(doc(db, "editions/unspecified"), { edition: 0 }),
    ]);
  });
});

after(async () => {
  if (environment) await environment.cleanup();
});

function client(user) {
  return user
    ? environment.authenticatedContext(user.uid, user.email ? { email: user.email } : {}).firestore()
    : environment.unauthenticatedContext().firestore();
}

for (const [label, user] of [["anonymous visitor", null], ["ordinary member", regularUser]]) {
  test(`${label} can read and query the active edition`, async () => {
    const db = client(user);
    await assertSucceeds(getDoc(doc(db, "editions/active")));
    // Match the public pages' real query, including its ordering and limit.
    const active = await assertSucceeds(getDocs(query(collection(db, "editions"),
      where("active", "==", true), orderBy("edition", "desc"), limit(1))));
    assert.deepEqual(active.docs.map((edition) => edition.id), ["active"]);
  });

  test(`${label} cannot read or enumerate archives`, async () => {
    const db = client(user);
    await assertFails(getDoc(doc(db, "editions/archive")));
    await assertFails(getDoc(doc(db, "editions/unspecified")));
    await assertFails(getDocs(collection(db, "editions")));
    await assertFails(getDocs(query(collection(db, "editions"), where("active", "==", false))));
  });

  test(`${label} cannot modify editions or make an archive public`, async () => {
    const db = client(user);
    await assertFails(updateDoc(doc(db, "editions/archive"), { active: true }));
    await assertFails(updateDoc(doc(db, "editions/active"), { edition: 99 }));
    await assertFails(setDoc(doc(db, "editions/injected"), { active: true, edition: 99 }));
  });
}

test("mapped admins can read archives, list all editions, and manage editions", async () => {
  const db = client({ uid: "admin", email: adminEmail });
  await assertSucceeds(getDoc(doc(db, "editions/archive")));
  await assertSucceeds(getDoc(doc(db, "editions/unspecified")));
  const all = await assertSucceeds(getDocs(collection(db, "editions")));
  assert.equal(all.size, 3);
  await assertSucceeds(updateDoc(doc(db, "editions/archive"), { edition: 10 }));
});

test("admin access requires the matching UID and email", async () => {
  for (const identity of [
    { uid: "intruder", email: adminEmail },
    { uid: "admin", email: "wrong@example.test" },
    { uid: "admin" },
  ]) {
    const db = client(identity);
    await assertFails(getDoc(doc(db, "editions/archive")));
    await assertFails(getDocs(collection(db, "editions")));
    await assertFails(updateDoc(doc(db, "editions/archive"), { active: true }));
    await assertSucceeds(getDoc(doc(db, "editions/active")));
  }
});

test("deactivating an edition immediately blocks subsequent public reads", async () => {
  const guest = client(null);
  await assertSucceeds(getDoc(doc(guest, "editions/active")));
  await assertSucceeds(updateDoc(doc(client({ uid: "admin", email: adminEmail }),
    "editions/active"), { active: false }));
  await assertFails(getDoc(doc(guest, "editions/active")));
});

test("the client role lookup stays readable but cannot be modified", async () => {
  const guest = client(null);
  await assertSucceeds(getDoc(doc(guest, "admin/admin")));
  await assertFails(updateDoc(doc(guest, "admin/admin"), { admins: {} }));
  await assertFails(updateDoc(doc(client({ uid: "admin", email: adminEmail }),
    "admin/admin"), { admins: {} }));
});
