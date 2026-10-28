const assert = require("node:assert/strict");
const { after, beforeEach, mock, test } = require("node:test");
const projectId = "demo-mercatos-security";
for (const name of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST"]) {
  if (process.env.GCLOUD_PROJECT !== projectId || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env[name] || "")) {
    throw new Error("Edition workflow tests require local demo emulators");
  }
}
const handlers = require("../lib/index.js");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { getAuth } = require("firebase-admin/auth");
const { getApp, deleteApp } = require("firebase-admin/app");
const db = getFirestore();
const bucket = getStorage().bucket(`${projectId}.appspot.com`);
const auth = getAuth();
const admin = { auth: { uid: "admin" } };
const config = { operationId: "create-operation", rules: "Demo", startMs: 1800000000000,
  stopMs: 1800014400000, nbFut: 100, duration: 1, nbComitard: 3, enchereMin: 1, enchereMax: 100,
  remboursementVendeur: 0.5, remboursementPerdant: 1, remboursementGagnant: 0 };
const activate = { operationId: "activate-operation", edition: 2 };
const oldFile = bucket.file("old/member/photo.jpg");
const targetFile = bucket.file("target/member/photo.jpg");

beforeEach(async () => {
  mock.restoreAll();
  assert.equal((await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: "DELETE" })).status, 200);
  const users = (await auth.listUsers()).users;
  if (users.length) await auth.deleteUsers(users.map(user => user.uid));
  await bucket.deleteFiles({ force: true });
  await db.doc("admin/admin").set({ admins: { "admin@example.test": "admin" } });
  await db.doc("editions/old").set({ active: true, edition: 1, start: Timestamp.fromMillis(config.startMs),
    stop: Timestamp.fromMillis(config.stopMs), cercles: { member: { name: "Demo", nbFut: 100, comitards: {} } } });
  await db.doc("editions/target").set({ active: false, edition: 2, cercles: {} });
  await oldFile.save(Buffer.from("old"), { metadata: { metadata: { firebaseStorageDownloadTokens: "old-token" } } });
  await targetFile.save(Buffer.from("target"), { metadata: { metadata: { firebaseStorageDownloadTokens: "", lockedToken: "target-token" } } });
  // Firebase's Storage emulator merges download tokens instead of replacing or
  // deleting them (metadata.js:setDownloadTokensFromCustomMetadata). Model the
  // production GCS metadata semantics for token fields; listing and file I/O,
  // Firestore transactions and Authentication still use the real emulators.
  const metadata = new Map([
    [oldFile.name, { firebaseStorageDownloadTokens: "old-token" }],
    [targetFile.name, { firebaseStorageDownloadTokens: "", lockedToken: "target-token" }],
  ]);
  const prototype = Object.getPrototypeOf(oldFile);
  const get = prototype.getMetadata;
  const set = prototype.setMetadata;
  mock.method(prototype, "getMetadata", async function (...args) {
    const result = await get.apply(this, args);
    if (metadata.has(this.name)) result[0] = { ...result[0], metadata: { ...metadata.get(this.name) } };
    return result;
  });
  mock.method(prototype, "setMetadata", async function (...args) {
    const result = await set.apply(this, args);
    const fields = { ...metadata.get(this.name) };
    for (const [key, value] of Object.entries(args[0].metadata || {})) {
      if (value === null) delete fields[key]; else fields[key] = value;
    }
    metadata.set(this.name, fields);
    return result;
  });
});
after(async () => { mock.restoreAll(); await deleteApp(getApp()); });

function failPictureChange(which) {
  const prototype = Object.getPrototypeOf(oldFile);
  const original = prototype.setMetadata;
  return mock.method(prototype, "setMetadata", async function (...args) {
    if (this.name.startsWith(which + "/")) throw new Error("Storage unavailable");
    return original.apply(this, args);
  });
}

test("activation revokes old tokens before publishing the target and restores its URL", async () => {
  const prototype = Object.getPrototypeOf(oldFile);
  const original = prototype.setMetadata;
  mock.method(prototype, "setMetadata", async function (...args) {
    if (this.name.startsWith("old/")) {
      assert.equal((await db.doc("editions/old").get()).data().active, true);
      assert.equal((await db.doc("editions/old").get()).data().transitioning, true);
      assert.equal((await db.doc("editions/target").get()).data().active, false);
    }
    return original.apply(this, args);
  });
  assert.equal((await handlers.activateedition.run({ ...admin, data: activate })).success, true);
  assert.equal((await db.doc("editions/old").get()).data().active, false);
  const target = (await db.doc("editions/target").get()).data();
  assert.equal(target.active, true);
  assert.equal(target.transitioning, false);
  assert.equal((await oldFile.getMetadata())[0].metadata.firebaseStorageDownloadTokens || "", "");
  assert.equal((await targetFile.getMetadata())[0].metadata.firebaseStorageDownloadTokens, "target-token");
});

test("failed photo locking remains pending, blocks other transitions and resumes safely", async () => {
  const failure = failPictureChange("old");
  const result = await handlers.activateedition.run({ ...admin, data: activate });
  assert.equal(result.success, false);
  assert.equal(result.state, "pending");
  assert.equal((await db.doc("editions/old").get()).data().active, true);
  assert.equal((await db.doc("editions/target").get()).data().active, false);
  assert.equal((await db.doc("editionOperations/activate-operation").get()).data().phase, "lock");
  await assert.rejects(handlers.createedition.run({ ...admin, data: config }), { code: "failed-precondition" });
  failure.mock.restore();
  assert.equal((await handlers.retryeditionoperation.run({ ...admin, data: { operationId: activate.operationId } })).success, true);
  assert.equal((await db.doc("editions/target").get()).data().active, true);
});

test("failed target unlock keeps archived tokens revoked and retries the remaining stage", async () => {
  const failure = failPictureChange("target");
  assert.equal((await handlers.activateedition.run({ ...admin, data: activate })).state, "pending");
  assert.equal((await db.doc("editions/old").get()).data().active, false);
  assert.equal((await oldFile.getMetadata())[0].metadata.firebaseStorageDownloadTokens || "", "");
  assert.equal((await db.doc("editions/target").get()).data().transitioning, true);
  failure.mock.restore();
  await handlers.retryeditionoperation.run({ ...admin, data: { operationId: activate.operationId } });
  assert.equal((await db.doc("editions/target").get()).data().transitioning, false);
});

test("a failed edition preparation cannot reset passwords or create a target", async () => {
  const update = mock.method(auth, "updateUser", async () => { throw new Error("must not reset"); });
  const run = db.runTransaction.bind(db);
  mock.method(db, "runTransaction", callback => run(async tx => {
    await callback(tx);
    throw new Error("prepare failed");
  }));
  await assert.rejects(handlers.createedition.run({ ...admin, data: config }), /prepare failed/);
  assert.equal(update.mock.calls.length, 0);
  assert.equal((await db.doc(`editions/${config.operationId}`).get()).exists, false);
});

test("email failure resumes without resetting completed passwords or duplicating an edition", async () => {
  await auth.createUser({ uid: "member", email: "member@example.test", password: "old-test-password" });
  const originalUpdate = auth.updateUser.bind(auth);
  const updates = mock.method(auth, "updateUser", originalUpdate);
  const originalFetch = global.fetch;
  const emails = mock.method(global, "fetch", async (url, options) => {
    if (String(url).includes("accounts:sendOobCode")) return new Response("unavailable", { status: 503 });
    return originalFetch(url, options);
  });
  assert.equal((await handlers.createedition.run({ ...admin, data: config })).state, "pending");
  const operation = (await db.doc(`editionOperations/${config.operationId}`).get()).data();
  assert.equal(operation.accounts.member.reset, true);
  assert.equal(operation.accounts.member.notified, false);
  assert.equal(updates.mock.calls.length, 1);
  emails.mock.restore();
  assert.equal((await handlers.createedition.run({ ...admin, data: config })).success, true);
  assert.equal(updates.mock.calls.length, 1);
  const codes = await (await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${projectId}/oobCodes`)).json();
  assert.equal(codes.oobCodes.filter(code => code.email === "member@example.test").length, 1);
  const edition = (await db.doc(`editions/${config.operationId}`).get()).data();
  assert.deepEqual(edition.cercles.member.comitards, {});
  assert.equal(edition.cercles.member.nbFut, 100);
  assert.equal((await handlers.createedition.run({ ...admin, data: config })).success, true);
  assert.equal((await db.collection("editions").get()).size, 3);
  assert.equal(updates.mock.calls.length, 1);
});

test("scheduled retries respect leases and finish interrupted operations", async () => {
  const failure = failPictureChange("old");
  await handlers.activateedition.run({ ...admin, data: activate });
  failure.mock.restore();
  const ref = db.doc(`editionOperations/${activate.operationId}`);
  await ref.update({ nextAttemptAt: 0, leaseOwner: "other-worker", leaseUntil: Date.now() + 60000 });
  assert.equal((await handlers.retryeditionoperation.run({ ...admin, data: { operationId: activate.operationId } })).state, "pending");
  await ref.update({ leaseUntil: 0 });
  await handlers.retryeditionoperations.run({});
  assert.equal((await ref.get()).data().state, "completed");
});

test("edition workflows reject unauthorized callers, malformed settings and reused operation IDs", async () => {
  for (const name of ["createedition", "activateedition", "retryeditionoperation"]) {
    await assert.rejects(handlers[name].run({ data: config }), { code: "unauthenticated" });
    await assert.rejects(handlers[name].run({ auth: { uid: "member" }, data: config }), { code: "permission-denied" });
  }
  await assert.rejects(handlers.createedition.run({ ...admin, data: { ...config, nbComitard: 0 } }), { code: "invalid-argument" });
  await handlers.activateedition.run({ ...admin, data: activate });
  await assert.rejects(handlers.activateedition.run({ ...admin, data: { ...activate, edition: 1 } }), { code: "invalid-argument" });
});

test("unconfirmed token revocation cannot report a completed activation", async () => {
  const prototype = Object.getPrototypeOf(oldFile);
  const original = prototype.getMetadata;
  mock.method(prototype, "getMetadata", async function (...args) {
    const result = await original.apply(this, args);
    if (this.name === oldFile.name) result[0].metadata.firebaseStorageDownloadTokens = "old-token";
    return result;
  });
  const result = await handlers.activateedition.run({ ...admin, data: activate });
  assert.equal(result.state, "pending");
  assert.equal((await db.doc("editions/target").get()).data().active, false);
});
