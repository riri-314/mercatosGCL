const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const projectId = process.env.GCLOUD_PROJECT;
for (const variable of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST"]) {
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(process.env[variable] || "")) {
    throw new Error(`${variable} must point to a local emulator`);
  }
}
if (!projectId?.startsWith("demo-")) throw new Error("Seeding requires a demo- project");

const app = initializeApp({ projectId });
(async () => {
  const auth = getAuth(app);
  for (const uid of ["demo-admin", "demo-buyer", "demo-seller"]) {
    const details = { email: `${uid}@example.test`, password: "EmulatorOnly123!", displayName: uid };
    try {
      await auth.getUser(uid);
      await auth.updateUser(uid, details);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
      await auth.createUser({ uid, ...details });
    }
  }
  const db = getFirestore(app);
  await db.doc("admin/admin").set({ admins: { "demo-admin@example.test": "demo-admin" } });
  await db.doc("editions/demo-edition").set({
    edition: 1, active: true, rules: "Édition de démonstration", jobs: 0,
    start: Timestamp.fromMillis(Date.now() - 3600000),
    stop: Timestamp.fromMillis(Date.now() + 7 * 86400000),
    duration: 1, nbFut: 100, nbComitard: 3, enchereMin: 1, enchereMax: 100,
    remboursementGagnant: 0, remboursementPerdant: 1, remboursementVendeur: 0.5,
    cercles: {
      "demo-buyer": { name: "Cercle Alpha", description: "Démonstration", nbFut: 100, comitards: {} },
      "demo-seller": { name: "Cercle Beta", description: "Démonstration", nbFut: 100, comitards: {
        "demo-profile": {
          name: "Exemple", firstname: "Camille", nickname: "Démo", post: "Membre",
          age: 20, nbEtoiles: 1, teneurTaule: 1, campus: 1,
          etatCivil: "Exemple", pointFort: "Exemple", pointFaible: "Exemple", estLeSeul: "Exemple",
          picture: "/assets/placeholder.svg",
        },
      } },
    },
  });
  console.log("Synthetic fixtures ready. Accounts: demo-{admin,buyer,seller}@example.test; password: EmulatorOnly123!");
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => deleteApp(app));
