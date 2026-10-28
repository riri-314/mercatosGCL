const { performance } = require("node:perf_hooks");
const projectId = process.env.GCLOUD_PROJECT;
if (!projectId?.startsWith("demo-") || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || "")) {
  throw new Error("The benchmark requires a local Firestore emulator and a demo- project");
}
const handlers = require("../lib/index.js");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getApp, deleteApp } = require("firebase-admin/app");
const db = getFirestore();
const ref = db.doc("editions/benchmark-edition");
const size = 20;
const circleCount = 10;

async function sample(concurrency) {
  const now = Date.now();
  const cercles = Object.fromEntries(Array.from({ length: circleCount }, (_, i) => [
    `bench-${i}`, { name: `Synthetic circle ${i}`, nbFut: 100, comitards: {} },
  ]));
  cercles.seller = { name: "Synthetic seller", nbFut: 100, comitards: {} };
  for (let i = 0; i < size; i++) cercles.seller.comitards[`target-${i}`] = {
    name: `Synthetic profile ${i}`, picture: "/assets/placeholder.svg",
    enchereStart: Timestamp.fromMillis(now - 3600000), enchereStop: Timestamp.fromMillis(now + 3600000),
    enchereProcessed: false,
    encheres: Object.fromEntries(Array.from({ length: 20 }, (_, j) => [
      `history-${j}`, { sender: `bench-${j % circleCount}`, vote: j + 1, date: Timestamp.fromMillis(now - 60000 + j) },
    ])),
  };
  await ref.set({ edition: 1, active: true, start: Timestamp.fromMillis(now - 3600000),
    stop: Timestamp.fromMillis(now + 86400000), duration: 1, enchereMin: 1, enchereMax: 100, jobs: size, cercles });
  const before = Buffer.byteLength(JSON.stringify((await ref.get()).data()));
  let next = 0;
  const durations = [];
  const errors = {};
  let successes = 0;
  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < size) {
      const index = next++;
      const start = performance.now();
      try {
        await handlers.vote.run({ auth: { uid: `bench-${index % circleCount}` }, data: {
          editionId: ref.id, comitardId: `target-${index}`, vote: 21, clientTime: new Date().toISOString(),
        } });
        successes++;
      } catch (error) {
        const code = String(error.code || "unknown");
        errors[code] = (errors[code] || 0) + 1;
      }
      durations.push(performance.now() - start);
    }
  }));
  const elapsedMs = Math.round(performance.now() - started);
  durations.sort((a, b) => a - b);
  const current = (await ref.get()).data();
  const balance = Object.entries(current.cercles).filter(([id]) => id !== "seller").reduce((sum, [, circle]) => sum + circle.nbFut, 0);
  if (balance !== circleCount * 100 - 21 * successes) throw new Error("Benchmark balance invariant failed");
  return { concurrency, attempts: size, successes, errors, elapsedMs,
    p50Ms: Math.round(durations[Math.floor(durations.length * 0.5)]),
    p95Ms: Math.round(durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]),
    documentJsonBytesBefore: before, documentJsonBytesAfter: Buffer.byteLength(JSON.stringify(current)) };
}
(async () => {
  console.log(JSON.stringify({ projectId, profiles: size, existingBids: 400,
    samples: [await sample(1), await sample(5), await sample(20)] }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await ref.delete();
  await deleteApp(getApp());
});
