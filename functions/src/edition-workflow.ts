import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { randomBytes, randomUUID } from "node:crypto";
import { identifier } from "./validation";
import { lockEditionFiles, unlockEditionFiles } from "./edition-pictures";

type Kind = "create" | "activate" | "passwords";
type Phase = "lock" | "activate" | "unlock" | "passwords" | "complete";
type Settings = {
  rules: string; startMs: number; stopMs: number; nbFut: number; duration: number;
  nbComitard: number; enchereMin: number; enchereMax: number;
  remboursementVendeur: number; remboursementPerdant: number; remboursementGagnant: number;
};
type Operation = {
  kind: Kind; targetId: string; closeIds: string[]; phase: Phase;
  state: "pending" | "completed"; signature: string; attempts: number;
  accounts: Record<string, { reset: boolean; notified: boolean }>;
  leaseOwner?: string; leaseUntil: number; nextAttemptAt: number; lastError?: string;
};
const controlPath = "system/editionTransition";

function settings(value: Record<string, unknown>): Settings {
  const ints = ["nbFut", "nbComitard", "enchereMin", "enchereMax"];
  const rates = ["remboursementVendeur", "remboursementPerdant", "remboursementGagnant"];
  if (typeof value.rules !== "string" || !value.rules.trim() || value.rules.length > 100000 ||
      ints.some(key => !Number.isSafeInteger(value[key]) || (value[key] as number) <= 0) ||
      rates.some(key => typeof value[key] !== "number" || !Number.isFinite(value[key]) ||
        (value[key] as number) < 0 || (value[key] as number) > 1) ||
      !Number.isSafeInteger(value.startMs) || !Number.isSafeInteger(value.stopMs) ||
      (value.stopMs as number) <= (value.startMs as number) ||
      typeof value.duration !== "number" || !Number.isFinite(value.duration) || value.duration <= 0 ||
      value.duration > 24 * 365 || value.duration * 3600000 >= (value.stopMs as number) - (value.startMs as number) ||
      (value.enchereMin as number) > (value.enchereMax as number) ||
      (value.enchereMin as number) > (value.nbFut as number)) {
    throw new HttpsError("invalid-argument", "Invalid edition settings");
  }
  return Object.fromEntries(["rules", "startMs", "stopMs", "duration", ...ints, ...rates]
    .map(key => [key, value[key]])) as Settings;
}

export async function beginEditionOperation(kind: Kind, data: Record<string, unknown>, uid: string) {
  const operationId = identifier(data?.operationId, "operationId");
  let input: Settings | { edition: number } | { editionId: string };
  if (kind === "create") input = settings(data);
  else if (kind === "activate") {
    if (!Number.isSafeInteger(data.edition) || (data.edition as number) <= 0) {
      throw new HttpsError("invalid-argument", "Invalid edition number");
    }
    input = { edition: data.edition as number };
  } else input = { editionId: identifier(data.editionId, "editionId") };
  const signature = JSON.stringify({ kind, input });
  const db = getFirestore();
  const operationRef = db.doc(`editionOperations/${operationId}`);
  const controlRef = db.doc(controlPath);
  await db.runTransaction(async tx => {
    const [existing, control] = await tx.getAll(operationRef, controlRef);
    if (existing.exists) {
      if (existing.data()?.signature !== signature) throw new HttpsError("invalid-argument", "Operation ID already used");
      return;
    }
    if (control.exists) {
      throw new HttpsError("failed-precondition", "Finish the pending edition operation first", {
        operationId: control.data()?.operationId,
      });
    }
    const editions = await tx.get(db.collection("editions"));
    const sorted = [...editions.docs].sort((a, b) => b.data().edition - a.data().edition);
    const target = kind === "create" ? undefined : sorted.find(doc => kind === "activate"
      ? doc.data().edition === (input as { edition: number }).edition
      : doc.id === (input as { editionId: string }).editionId);
    if (kind !== "create" && !target) throw new HttpsError("not-found", "Edition not found");
    const targetId = target?.id ?? operationId;
    const closeIds = kind === "passwords" ? [] : sorted
      .filter(doc => doc.id !== targetId && doc.data().active === true).map(doc => doc.id);
    let accounts: string[] = [];
    if (kind === "create") {
      const config = input as Settings;
      const source = sorted.find(doc => doc.data().active === true) ?? sorted[0];
      const cercles = Object.fromEntries(Object.entries(source?.data().cercles || {})
        .map(([id, circle]) => {
          const value = circle as FirebaseFirestore.DocumentData;
          return [id, { name: value.name ?? "", description: value.description ?? "",
            admins: value.admins ?? [], nbFut: config.nbFut, comitards: {} }];
        }));
      accounts = Object.keys(cercles);
      const { startMs, stopMs, ...fields } = config;
      tx.create(db.doc(`editions/${targetId}`), { ...fields, cercles, jobs: 0,
        edition: (sorted[0]?.data().edition || 0) + 1,
        start: Timestamp.fromMillis(startMs), stop: Timestamp.fromMillis(stopMs),
        active: false, transitioning: true });
    } else if (kind === "passwords") accounts = Object.keys(target!.data().cercles || {});
    if (kind !== "passwords") {
      for (const id of [...closeIds, ...(target ? [target.id] : [])]) {
        tx.update(db.doc(`editions/${id}`), { transitioning: true });
      }
    }
    const operation: Operation = { kind, targetId, closeIds,
      phase: kind === "passwords" ? "passwords" : "lock", state: "pending", signature,
      accounts: Object.fromEntries(accounts.map(id => [id, { reset: false, notified: false }])),
      attempts: 0, leaseUntil: 0, nextAttemptAt: 0 };
    tx.create(operationRef, { ...operation, createdBy: uid, createdAt: Timestamp.now() });
    tx.set(controlRef, { operationId });
  });
  return resumeEditionOperation(operationId);
}

// The authenticated Identity Platform endpoint sends Firebase's configured reset
// email; no custom SMTP service or client-side email loop is needed.
// https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/sendOobCode
async function sendResetEmail(email: string) {
  const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let url: string;
  const body: Record<string, string> = { requestType: "PASSWORD_RESET", email };
  if (emulator) {
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(emulator) || !process.env.GCLOUD_PROJECT?.startsWith("demo-")) {
      throw new Error("Invalid email emulator configuration");
    }
    url = `http://${emulator}/identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=demo-key`;
  } else {
    const credential = getApp().options.credential;
    if (!credential) throw new Error("Missing application credentials");
    const access = await credential.getAccessToken();
    headers.Authorization = `Bearer ${access.access_token}`;
    body.targetProjectId = getApp().options.projectId || process.env.GCLOUD_PROJECT || "";
    url = "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode";
  }
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Reset email delivery failed (${response.status})`);
}

export async function resumeEditionOperation(operationId: string) {
  identifier(operationId, "operationId");
  const db = getFirestore();
  const ref = db.doc(`editionOperations/${operationId}`);
  const owner = randomUUID();
  const operation = await db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) throw new HttpsError("not-found", "Edition operation not found");
    const value = snapshot.data() as Operation;
    if (value.state === "completed" || value.leaseUntil > Date.now()) return value;
    const claimed = { ...value, leaseOwner: owner, leaseUntil: Date.now() + 600000, attempts: value.attempts + 1 };
    tx.update(ref, { leaseOwner: owner, leaseUntil: claimed.leaseUntil, attempts: claimed.attempts, lastError: "" });
    return claimed;
  });
  if (operation.state === "completed") return { success: true, state: "completed", operationId };
  if (operation.leaseOwner !== owner) return { success: false, state: "pending", operationId };
  const checkpoint = async (fields: Record<string, unknown>) => {
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).data()?.leaseOwner !== owner) throw new Error("Edition operation lease lost");
      tx.update(ref, fields);
    });
  };
  const advance = async (phase: Phase) => { await checkpoint({ phase }); operation.phase = phase; };
  try {
    if (operation.phase === "lock") {
      for (const id of operation.closeIds) await lockEditionFiles(id);
      await advance("activate");
    }
    if (operation.phase === "activate") {
      await db.runTransaction(async tx => {
        if ((await tx.get(ref)).data()?.leaseOwner !== owner) throw new Error("Edition operation lease lost");
        for (const id of operation.closeIds) tx.update(db.doc(`editions/${id}`), { active: false, transitioning: false });
        tx.update(db.doc(`editions/${operation.targetId}`), { active: true });
        tx.update(ref, { phase: "unlock" });
      });
      operation.phase = "unlock";
    }
    if (operation.phase === "unlock") {
      await unlockEditionFiles(operation.targetId);
      await db.runTransaction(async tx => {
        if ((await tx.get(ref)).data()?.leaseOwner !== owner) throw new Error("Edition operation lease lost");
        tx.update(db.doc(`editions/${operation.targetId}`), { transitioning: false });
        tx.update(ref, { phase: "passwords" });
      });
      operation.phase = "passwords";
    }
    if (operation.phase === "passwords") {
      for (const [uid, account] of Object.entries(operation.accounts)) {
        if (!account.reset) {
          await getAuth().updateUser(uid, { password: `${randomBytes(32).toString("base64url")}1!Ab` });
          await checkpoint({ [`accounts.${uid}.reset`]: true });
          account.reset = true;
        }
        if (!account.notified) {
          const user = await getAuth().getUser(uid);
          if (!user.email) throw new Error("Missing account email");
          await sendResetEmail(user.email);
          await checkpoint({ [`accounts.${uid}.notified`]: true });
          account.notified = true;
        }
      }
      await advance("complete");
    }
    await db.runTransaction(async tx => {
      const [current, control] = await tx.getAll(ref, db.doc(controlPath));
      if (current.data()?.leaseOwner !== owner) throw new Error("Edition operation lease lost");
      tx.update(ref, { state: "completed", completedAt: Timestamp.now(), leaseUntil: 0, lastError: "" });
      if (control.data()?.operationId === operationId) tx.delete(db.doc(controlPath));
    });
    return { success: true, state: "completed", operationId };
  } catch (error) {
    console.error("Edition operation needs retry", { operationId, phase: operation.phase,
      error: error instanceof HttpsError ? error.code : "service-unavailable" });
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).data()?.leaseOwner !== owner) return;
      tx.update(ref, { leaseUntil: 0, nextAttemptAt: Date.now() + 60000 * 2 ** Math.min(operation.attempts - 1, 5),
        lastError: `Échec de l'étape ${operation.phase}. Reprise automatique en attente.` });
    });
    return { success: false, state: "pending", operationId };
  }
}

export async function retryEditionOperations() {
  const pending = await getFirestore().collection("editionOperations").where("state", "==", "pending").limit(20).get();
  for (const operation of pending.docs) {
    if (operation.data().nextAttemptAt <= Date.now()) await resumeEditionOperation(operation.id);
  }
}
