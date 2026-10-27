const assert = require("node:assert/strict");
const { after, beforeEach, mock, test } = require("node:test");

const projectId = "demo-mercatos-security";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulatorHost || !/^(127\.0\.0\.1|localhost):\d+$/.test(emulatorHost) ||
    process.env.GCLOUD_PROJECT !== projectId) {
  throw new Error("Run npm test: backend tests require the local demo Firestore emulator");
}

const handlers = require("../lib/index.js");
const { getFirestore, Timestamp, DocumentReference } = require("firebase-admin/firestore");
const { getApp, deleteApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (!authHost || !/^(127\.0\.0\.1|localhost):\d+$/.test(authHost)) {
  throw new Error("Backend tests require the local Authentication emulator");
}
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
  const users = (await getAuth().listUsers()).users;
  if (users.length) await getAuth().deleteUsers(users.map((user) => user.uid));
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

test("invalid bid types, unsafe amounts and identifiers never change auction state", async () => {
  await seedUnstartedAuctions();
  const before = (await editionRef.get()).data();
  for (const value of ["not-a-number", "10", null, {}, [], true, NaN, Infinity,
    -Infinity, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(bid("buyer", value), { code: "invalid-argument" });
  }
  for (const comitardId of ["target.encheres.injected", "__proto__", "constructor", "", null]) {
    await assert.rejects(bid("buyer", 10, comitardId), { code: "invalid-argument" });
  }
  for (const data of [null, [], "bad", {}, {
    editionId: editionRef.id, comitardId: "target", vote: 10, clientTime: "invalid-date",
  }, {
    editionId: editionRef.id, comitardId: "target", vote: 10,
    clientTime: new Date(now).toISOString(), sender: "seller",
  }]) {
    await assert.rejects(handlers.vote.run({ auth: { uid: "buyer" }, data }),
      { code: "invalid-argument" });
  }
  assert.deepEqual((await editionRef.get()).data(), before);
});

function profileData(overrides = {}) {
  return {
    editionId: editionRef.id,
    name: "Test", firstname: "Person", nickname: "Tester", post: "Member",
    teneurTaule: 1, age: 20, nbEtoiles: 1, campus: 1,
    etatCivil: "Example", pointFort: "Example", pointFaible: "Example", estLeSeul: "Example",
    picture: "https://example.test/profile.png", cercle: null,
    ...overrides,
  };
}

test("profile creation and editing reject malformed fields without storing them", async () => {
  await seedUnstartedAuctions();
  await editionRef.update({ "cercles.buyer.comitards.own": { name: "Own" } });
  const before = (await editionRef.get()).data();
  const invalidFields = [
    { name: { broken: true } }, { firstname: [] }, { nickname: true }, { post: 2 },
    { name: "a".repeat(31) }, { name: "   " }, { pointFort: "a".repeat(151) },
    { age: -1000 }, { age: 100 }, { age: "20" }, { age: null }, { age: 1.5 },
    { teneurTaule: -1 }, { teneurTaule: 11 }, { nbEtoiles: 16 }, { nbEtoiles: NaN },
    { campus: 0 }, { campus: 5 }, { campus: "1" },
    { picture: {} }, { picture: "javascript:alert(1)" }, { picture: "x".repeat(2049) },
    { nbFut: 999 }, { encheres: {} },
  ];
  for (const fields of invalidFields) {
    await assert.rejects(handlers.addcomitard.run({
      auth: { uid: "buyer" }, data: profileData(fields),
    }), { code: "invalid-argument" });
    await assert.rejects(handlers.editcomitard.run({
      auth: { uid: "buyer" }, data: { ...profileData(fields), comitardId: "own" },
    }), { code: "invalid-argument" });
  }
  assert.deepEqual((await editionRef.get()).data(), before);
});

test("valid profiles persist and partial edits can save numeric zero", async () => {
  await seedUnstartedAuctions();
  const result = await handlers.addcomitard.run({
    auth: { uid: "buyer" }, data: profileData(),
  });
  assert.equal(result.success, true);
  const profiles = (await editionRef.get()).data().cercles.buyer.comitards;
  const id = Object.keys(profiles)[0];
  assert.equal(profiles[id].name, "Test");
  await handlers.editcomitard.run({ auth: { uid: "buyer" }, data: {
    editionId: editionRef.id, comitardId: id, age: 0, teneurTaule: 0, nbEtoiles: 0,
  } });
  const updated = (await editionRef.get()).data().cercles.buyer.comitards[id];
  assert.equal(updated.age, 0);
  assert.equal(updated.teneurTaule, 0);
  assert.equal(updated.nbEtoiles, 0);
  assert.equal(updated.name, "Test");
});

test("profile validation preserves server-side ownership and admin selection", async () => {
  await seedUnstartedAuctions();
  await assert.rejects(handlers.editcomitard.run({ auth: { uid: "buyer" }, data: {
    editionId: editionRef.id, comitardId: "target", cercleId: "seller", name: "Stolen",
  } }), { code: "permission-denied" });
  await handlers.editcomitard.run({ auth: { uid: "admin" }, data: {
    editionId: editionRef.id, comitardId: "target", cercleId: "seller", name: "Updated",
    cercle: "Seller display name",
  } });
  assert.equal((await editionRef.get()).data().cercles.seller.comitards.target.name, "Updated");
  await handlers.addcomitard.run({ auth: { uid: "admin" },
    data: profileData({ cercle: "seller" }) });
  assert.equal(Object.keys((await editionRef.get()).data().cercles.seller.comitards).length, 3);
});

function defer() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

for (const operation of ["addcomitard", "editcomitard"]) {
  test(`${operation} waits for persistence before reporting success`, async () => {
    await seedUnstartedAuctions();
    await editionRef.update({ "cercles.buyer.comitards.own": { name: "Own" } });
    const started = defer();
    const release = defer();
    const update = DocumentReference.prototype.update;
    mock.method(DocumentReference.prototype, "update", async function (...args) {
      started.resolve();
      await release.promise;
      return update.apply(this, args);
    });
    let finished = false;
    const pending = handlers[operation].run({ auth: { uid: "buyer" },
      data: operation === "addcomitard" ? profileData() : {
        editionId: editionRef.id, comitardId: "own", name: "Updated",
      } }).then((result) => { finished = true; return result; });
    try {
      await started.promise;
      await new Promise(setImmediate);
      assert.equal(finished, false);
    } finally {
      release.resolve();
    }
    assert.equal((await pending).success, true);
  });

  test(`${operation} propagates a failed database write`, async () => {
    await seedUnstartedAuctions();
    await editionRef.update({ "cercles.buyer.comitards.own": { name: "Own" } });
    const before = (await editionRef.get()).data();
    mock.method(DocumentReference.prototype, "update", async () => {
      throw new Error("simulated profile write failure");
    });
    await assert.rejects(handlers[operation].run({ auth: { uid: "buyer" },
      data: operation === "addcomitard" ? profileData() : {
        editionId: editionRef.id, comitardId: "own", name: "Updated",
      } }), /simulated profile write failure/);
    assert.deepEqual((await editionRef.get()).data(), before);
  });
}

function signup(data = {}) {
  return handlers.signupuser.run({ auth: { uid: "admin" }, data: {
    editionId: editionRef.id, email: "new-circle@example.test",
    displayName: "New circle", description: "Example description", ...data,
  } });
}

test("account creation waits until Authentication and Firestore both finish", async () => {
  await seed();
  const started = defer();
  const release = defer();
  const update = DocumentReference.prototype.update;
  mock.method(DocumentReference.prototype, "update", async function (...args) {
    started.resolve();
    await release.promise;
    return update.apply(this, args);
  });
  let finished = false;
  const pending = signup().then((result) => { finished = true; return result; });
  try {
    await started.promise;
    assert.equal(finished, false);
    assert.equal((await getAuth().listUsers()).users.length, 1);
    assert.equal(Object.keys((await editionRef.get()).data().cercles).length, 3);
  } finally {
    release.resolve();
  }
  assert.equal((await pending).success, true);
  const user = await getAuth().getUserByEmail("new-circle@example.test");
  const circle = (await editionRef.get()).data().cercles[user.uid];
  assert.equal(circle.name, "New circle");
  assert.equal(circle.nbFut, 100);
});

test("failed account database writes roll back the new Authentication account", async () => {
  await seed();
  const before = (await editionRef.get()).data();
  mock.method(DocumentReference.prototype, "update", async () => {
    throw new Error("simulated account write failure");
  });
  await assert.rejects(signup(), { code: "unavailable" });
  assert.equal((await getAuth().listUsers()).users.length, 0);
  assert.deepEqual((await editionRef.get()).data(), before);
});

test("a lost database acknowledgement preserves an account that was linked", async () => {
  await seed();
  const update = DocumentReference.prototype.update;
  mock.method(DocumentReference.prototype, "update", async function (...args) {
    await update.apply(this, args);
    throw new Error("simulated lost acknowledgement");
  });
  assert.equal((await signup()).success, true);
  const user = await getAuth().getUserByEmail("new-circle@example.test");
  assert.equal((await editionRef.get()).data().cercles[user.uid].name, "New circle");
});

test("authentication failures never create a circle or report success", async () => {
  await seed();
  const before = (await editionRef.get()).data();
  await assert.rejects(signup({ email: "not-an-email" }), { code: "unavailable" });
  assert.deepEqual((await editionRef.get()).data(), before);
  assert.equal((await getAuth().listUsers()).users.length, 0);
});

test("account creation rejects unauthorized callers and invalid edition balances", async () => {
  await seed();
  await assert.rejects(handlers.signupuser.run({ data: {} }), { code: "unauthenticated" });
  await assert.rejects(handlers.signupuser.run({ auth: { uid: "buyer" }, data: {} }),
    { code: "permission-denied" });
  await editionRef.update({ nbFut: NaN });
  await assert.rejects(signup(), { code: "failed-precondition" });
  assert.equal((await getAuth().listUsers()).users.length, 0);
});

test("anonymous bids and missing editions or profiles never spend funds", async () => {
  await seedUnstartedAuctions();
  const before = (await editionRef.get()).data();
  await assert.rejects(handlers.vote.run({ data: {} }), { code: "unauthenticated" });
  await assert.rejects(bid("buyer", 10, "unknown"), { code: "not-found" });
  await assert.rejects(handlers.vote.run({ auth: { uid: "buyer" }, data: {
    editionId: "unknown", comitardId: "target", vote: 10,
    clientTime: new Date(now).toISOString(),
  } }), { code: "not-found" });
  assert.deepEqual((await editionRef.get()).data(), before);
});

for (const [label, updates, vote, code] of [
  ["before the edition starts", { start: Timestamp.fromMillis(now + 1) }, 10, "failed-precondition"],
  ["after the edition ends", { stop: Timestamp.fromMillis(now - 1) }, 10, "failed-precondition"],
  ["below the minimum", { enchereMin: 11 }, 10, "invalid-argument"],
  ["above the maximum", { enchereMax: 9 }, 10, "invalid-argument"],
  ["above the balance", { "cercles.buyer.nbFut": 9 }, 10, "invalid-argument"],
  ["with an empty balance", { "cercles.buyer.nbFut": 0 }, 10, "failed-precondition"],
  ["with a fractional balance", { "cercles.buyer.nbFut": 10.5 }, 10, "failed-precondition"],
  ["with invalid limits", { enchereMin: 11, enchereMax: 10 }, 10, "failed-precondition"],
  ["with a zero duration", { duration: 0 }, 10, "failed-precondition"],
  ["with an excessive duration", { duration: 24 * 365 + 1 }, 10, "failed-precondition"],
]) {
  test(`bids ${label} leave the edition unchanged`, async () => {
    await seedUnstartedAuctions();
    await editionRef.update(updates);
    const before = (await editionRef.get()).data();
    await assert.rejects(bid("buyer", vote), { code });
    assert.deepEqual((await editionRef.get()).data(), before);
  });
}

test("the first bid sets the auction duration and accepts an exact-balance bid", async () => {
  await seedUnstartedAuctions();
  await bid("buyer", 100);
  const current = (await editionRef.get()).data();
  const target = current.cercles.seller.comitards.target;
  assert.equal(current.cercles.buyer.nbFut, 0);
  assert.equal(current.jobs, 1);
  assert.equal(target.enchereStart.toMillis(), now);
  assert.equal(target.enchereStop.toMillis(), now + 3600000);
  assert.equal(target.enchereProcessed, false);
  const votes = Object.values(target.encheres);
  assert.equal(votes.length, 1);
  assert.equal(votes[0].sender, "buyer");
  assert.equal(votes[0].date.toMillis(), now);
});

for (const [label, delay, clientOffset, accepted] of [
  ["delivered at the grace deadline", 2500, 0, true],
  ["sent at the earliest permitted client time", 2500, -5000, true],
  ["delivered after the grace deadline", 2501, 0, false],
  ["sent after the auction stopped", 1000, 1, false],
  ["sent before the client tolerance window", 1000, -5001, false],
]) {
  test(`counterbids ${label} are ${accepted ? "accepted" : "rejected"}`, async () => {
    const stop = now - delay;
    const edition = await seed();
    edition.cercles.seller.comitards.target.enchereStop = Timestamp.fromMillis(stop);
    await editionRef.set(edition);
    const before = (await editionRef.get()).data();
    const request = { auth: { uid: "buyer" }, data: {
      editionId: editionRef.id, comitardId: "target", vote: 11,
      clientTime: new Date(stop + clientOffset).toISOString(),
    } };
    if (accepted) {
      assert.equal((await handlers.vote.run(request)).success, true);
      const current = (await editionRef.get()).data();
      assert.equal(current.cercles.buyer.nbFut, 89);
      assert.equal(Object.keys(current.cercles.seller.comitards.target.encheres).length, 3);
      assert.equal(current.jobs, 1);
    } else {
      await assert.rejects(handlers.vote.run(request), { code: "failed-precondition" });
      assert.deepEqual((await editionRef.get()).data(), before);
    }
  });
}

test("profile creation requires authentication and membership even with a selected circle", async () => {
  await seedUnstartedAuctions();
  const before = (await editionRef.get()).data();
  await assert.rejects(handlers.addcomitard.run({ data: profileData() }), { code: "unauthenticated" });
  await assert.rejects(handlers.editcomitard.run({ data: {} }), { code: "unauthenticated" });
  await assert.rejects(handlers.addcomitard.run({ auth: { uid: "outsider" },
    data: profileData({ cercle: "seller" }),
  }), { code: "permission-denied" });
  assert.deepEqual((await editionRef.get()).data(), before);
  await handlers.addcomitard.run({ auth: { uid: "buyer" }, data: profileData({ cercle: "seller" }) });
  const current = (await editionRef.get()).data();
  assert.equal(Object.keys(current.cercles.buyer.comitards).length, 1);
  assert.deepEqual(current.cercles.seller, before.cercles.seller);
});

test("only administrators can add profiles after the edition ends", async () => {
  await seed({ stop: Timestamp.fromMillis(now - 1) });
  const before = (await editionRef.get()).data();
  await assert.rejects(handlers.addcomitard.run({ auth: { uid: "buyer" }, data: profileData() }),
    { code: "failed-precondition" });
  assert.deepEqual((await editionRef.get()).data(), before);
  assert.equal((await handlers.addcomitard.run({ auth: { uid: "admin" },
    data: profileData({ cercle: "buyer" }),
  })).success, true);
});

async function seedCircleUsers() {
  await seed();
  for (const uid of ["buyer", "loser", "seller"]) {
    await getAuth().createUser({ uid, email: `${uid}@example.test`, password: "test-password" });
  }
}

for (const operation of ["disableuser", "enableuser", "deleteuser", "resetpassworduser",
  "resetpasswords", "getdisabledstatus"]) {
  test(`${operation} rejects anonymous and ordinary callers without changing accounts`, async () => {
    await seedCircleUsers();
    const data = { uid: "buyer", editionId: editionRef.id, password: "new-test-password" };
    const before = (await editionRef.get()).data();
    await assert.rejects(handlers[operation].run({ data }), { code: "permission-denied" });
    await assert.rejects(handlers[operation].run({ auth: { uid: "loser" }, data }),
      { code: "permission-denied" });
    assert.equal((await getAuth().getUser("buyer")).disabled, false);
    assert.equal((await getAuth().listUsers()).users.length, 3);
    assert.deepEqual((await editionRef.get()).data(), before);
  });
}

test("admins can disable and re-enable accounts and read their status", async () => {
  await seedCircleUsers();
  const request = { auth: { uid: "admin" }, data: { uid: "buyer" } };
  await handlers.disableuser.run(request);
  assert.equal((await getAuth().getUser("buyer")).disabled, true);
  const status = await handlers.getdisabledstatus.run({ auth: { uid: "admin" },
    data: { editionId: editionRef.id } });
  assert.deepEqual(status.status, { buyer: true, loser: false, seller: false });
  await handlers.enableuser.run(request);
  assert.equal((await getAuth().getUser("buyer")).disabled, false);
});

test("admin deletion removes the selected circle and authentication account only", async () => {
  await seedCircleUsers();
  const before = (await editionRef.get()).data();
  await handlers.deleteuser.run({ auth: { uid: "admin" },
    data: { uid: "buyer", editionId: editionRef.id } });
  await assert.rejects(getAuth().getUser("buyer"), { code: "auth/user-not-found" });
  const current = (await editionRef.get()).data();
  assert.equal(Object.hasOwn(current.cercles, "buyer"), false);
  assert.deepEqual(current.cercles.loser, before.cercles.loser);
  assert.deepEqual(current.cercles.seller, before.cercles.seller);
  assert.equal((await getAuth().listUsers()).users.length, 2);
});

test("password reset validates the UID and password before contacting Authentication", async () => {
  for (const data of [null, {}, { uid: "" }, { uid: " " }, { uid: 1 },
    { uid: "buyer", password: "" }, { uid: "buyer", password: "     " },
    { uid: "buyer", password: "short" }, { uid: "buyer", password: 123456 }]) {
    await assert.rejects(handlers.resetpassworduser.run({ auth: { uid: "admin" }, data }),
      { code: "invalid-argument" });
  }
  assert.equal((await getAuth().listUsers()).users.length, 0);
});

test("password reset confirms success without logging passwords or account records", async () => {
  await seedCircleUsers();
  const logs = [];
  mock.method(console, "log", (...args) => logs.push(args));
  const password = "private-test-password";
  const result = await handlers.resetpassworduser.run({ auth: { uid: "admin" },
    data: { uid: "buyer", password } });
  assert.equal(result.success, true);
  const output = JSON.stringify(logs);
  assert.equal(output.includes(password), false);
  assert.equal(output.includes("passwordHash"), false);
  assert.equal(output.includes("passwordSalt"), false);
  assert.equal(output.includes("buyer@example.test"), false);
});
