const assert = require("node:assert/strict");
const { after, beforeEach, mock, test } = require("node:test");

const projectId = "demo-mercatos-security";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulatorHost || !/^(127\.0\.0\.1|localhost):\d+$/.test(emulatorHost) ||
    process.env.GCLOUD_PROJECT !== projectId) {
  throw new Error("Run npm test: backend tests require the local demo Firestore emulator");
}

const handlers = require("../lib/index.js");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getApp, deleteApp } = require("firebase-admin/app");
const db = getFirestore();
const editionRef = db.collection("editions").doc("test-edition");
const now = 1800000000000;
const adminRequest = { auth: { uid: "admin" }, data: {} };

function auction(overrides = {}) {
  return {
    enchereStart: Timestamp.fromMillis(now - 20000),
    enchereStop: Timestamp.fromMillis(now - 10000),
    enchereProcessed: false,
    encheres: {
      first: { sender: "loser", vote: 6, date: Timestamp.fromMillis(now - 15000) },
      second: { sender: "buyer", vote: 10, date: Timestamp.fromMillis(now - 14000) },
    },
    ...overrides,
  };
}

async function seed(overrides = {}) {
  const edition = {
    edition: 1,
    active: true,
    jobs: 1,
    start: Timestamp.fromMillis(now - 3600000),
    stop: Timestamp.fromMillis(now + 3600000),
    duration: 1,
    enchereMin: 1,
    enchereMax: 100,
    nbFut: 100,
    nbComitard: 3,
    remboursementGagnant: 0.5,
    remboursementPerdant: 1,
    remboursementVendeur: 0.2,
    cercles: {
      buyer: { nbFut: 100, comitards: {} },
      loser: { nbFut: 100, comitards: {} },
      seller: { nbFut: 100, comitards: { target: auction() } },
    },
    ...overrides,
  };
  await editionRef.set(edition);
  return edition;
}

beforeEach(async () => {
  mock.restoreAll();
  mock.method(Timestamp, "now", () => Timestamp.fromMillis(now));
  const response = await fetch(
    `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  assert.equal(response.status, 200);
  await db.doc("admin/admin").set({ admins: { "admin@example.test": "admin" } });
});

after(async () => {
  mock.restoreAll();
  await deleteApp(getApp());
});

test("settlement rejects anonymous callers and ordinary members", async () => {
  await seed();
  await assert.rejects(handlers.rembour.run({ data: {} }), { code: "unauthenticated" });
  await assert.rejects(handlers.rembour.run({ auth: { uid: "buyer" }, data: {} }),
    { code: "permission-denied" });
  assert.equal((await editionRef.get()).data().cercles.buyer.nbFut, 100);
});

test("overlapping manual and scheduled settlement pays each bid exactly once", async () => {
  await seed();
  await Promise.all([
    handlers.rembour.run(adminRequest),
    handlers.rembour.run(adminRequest),
    handlers.taskrunner.run({}),
  ]);
  const settled = (await editionRef.get()).data();
  assert.equal(settled.cercles.buyer.nbFut, 105);
  assert.equal(settled.cercles.loser.nbFut, 106);
  assert.equal(settled.cercles.seller.nbFut, 102);
  assert.equal(settled.cercles.seller.comitards.target.enchereProcessed, true);
  assert.equal(settled.jobs, 0);
  await handlers.rembour.run(adminRequest);
  assert.deepEqual((await editionRef.get()).data(), settled);
});

test("settlement respects the bid grace period and recomputes the job count", async () => {
  const edition = await seed({ jobs: -1 });
  edition.cercles.seller.comitards.target.enchereStop = Timestamp.fromMillis(now - 1000);
  await editionRef.set(edition);
  await handlers.rembour.run(adminRequest);
  const current = (await editionRef.get()).data();
  assert.equal(current.cercles.buyer.nbFut, 100);
  assert.equal(current.cercles.seller.comitards.target.enchereProcessed, false);
  assert.equal(current.jobs, 1);
});

test("a failed settlement transaction leaves all balances and markers untouched", async () => {
  await seed();
  const before = (await editionRef.get()).data();
  const runTransaction = db.runTransaction.bind(db);
  mock.method(db, "runTransaction", (callback) => runTransaction(async (transaction) => {
    await callback(transaction);
    throw new Error("simulated transaction failure");
  }));
  await assert.rejects(handlers.rembour.run(adminRequest), /simulated transaction failure/);
  assert.deepEqual((await editionRef.get()).data(), before);
});

test("settlement preserves per-bid rounding when recipients overlap", async () => {
  const edition = await seed({ remboursementPerdant: 0.5 });
  edition.cercles.seller.comitards.target.encheres = {
    first: { sender: "loser", vote: 1, date: Timestamp.fromMillis(now - 16000) },
    second: { sender: "loser", vote: 1, date: Timestamp.fromMillis(now - 15000) },
    third: { sender: "buyer", vote: 10, date: Timestamp.fromMillis(now - 14000) },
  };
  await editionRef.set(edition);
  await handlers.rembour.run(adminRequest);
  assert.equal((await editionRef.get()).data().cercles.loser.nbFut, 102);
});

test("invalid reimbursement data cannot partially credit an auction", async () => {
  const edition = await seed({ remboursementVendeur: NaN });
  const before = (await editionRef.get()).data();
  await assert.rejects(handlers.rembour.run(adminRequest), { code: "failed-precondition" });
  assert.deepEqual((await editionRef.get()).data(), before);
  assert.equal(edition.cercles.buyer.nbFut, 100);
});

function bid(uid, vote, comitardId = "target") {
  return handlers.vote.run({
    auth: { uid },
    data: { editionId: editionRef.id, comitardId, vote,
      clientTime: new Date(now).toISOString() },
  });
}

async function seedUnstartedAuctions() {
  const edition = await seed({ jobs: 0 });
  edition.cercles.seller.comitards = { target: { name: "Target" }, other: { name: "Other" } };
  await editionRef.set(edition);
}

test("parallel bids on different auctions cannot overspend one balance", async () => {
  await seedUnstartedAuctions();
  const results = await Promise.allSettled([
    bid("buyer", 60), bid("buyer", 60, "other"),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  const current = (await editionRef.get()).data();
  assert.equal(current.cercles.buyer.nbFut, 40);
  assert.equal(current.jobs, 1);
  assert.equal(Object.values(current.cercles.seller.comitards)
    .filter((profile) => profile.encheres).length, 1);
});

test("competing first bids initialize an auction and its job only once", async () => {
  await seedUnstartedAuctions();
  const results = await Promise.allSettled([bid("buyer", 10), bid("loser", 10)]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const current = (await editionRef.get()).data();
  assert.equal(current.jobs, 1);
  assert.equal(Object.keys(current.cercles.seller.comitards.target.encheres).length, 1);
  assert.equal(current.cercles.buyer.nbFut + current.cercles.loser.nbFut, 190);
});

test("counterbids use the latest highest bid and debit the committed amount", async () => {
  await seedUnstartedAuctions();
  await bid("buyer", 10);
  await assert.rejects(bid("loser", 10), { code: "failed-precondition" });
  const result = await bid("loser", 11);
  assert.equal(result.success, true);
  const current = (await editionRef.get()).data();
  assert.equal(current.cercles.buyer.nbFut, 90);
  assert.equal(current.cercles.loser.nbFut, 89);
  assert.equal(current.jobs, 1);
  assert.equal(Object.keys(current.cercles.seller.comitards.target.encheres).length, 2);
});

test("bids reject missing membership, own profiles, inactive and settled auctions", async () => {
  await seedUnstartedAuctions();
  await assert.rejects(bid("outsider", 10), { code: "permission-denied" });
  await assert.rejects(bid("seller", 10), { code: "permission-denied" });
  await editionRef.update({ active: false });
  await assert.rejects(bid("buyer", 10), { code: "failed-precondition" });
  await editionRef.update({ active: true,
    "cercles.seller.comitards.target.enchereProcessed": true });
  await assert.rejects(bid("buyer", 10), { code: "failed-precondition" });
  assert.equal((await editionRef.get()).data().cercles.buyer.nbFut, 100);
});

test("failed bid commits do not spend funds, start an auction, or report success", async () => {
  await seedUnstartedAuctions();
  const before = (await editionRef.get()).data();
  const runTransaction = db.runTransaction.bind(db);
  mock.method(db, "runTransaction", (callback) => runTransaction(async (transaction) => {
    await callback(transaction);
    throw new Error("simulated bid commit failure");
  }));
  await assert.rejects(bid("buyer", 10), /simulated bid commit failure/);
  assert.deepEqual((await editionRef.get()).data(), before);
});
