/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import * as test from "firebase-admin/firestore";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { lockEditionFiles, unlockEditionFiles } from "./edition-pictures";
import { beginEditionOperation, resumeEditionOperation, retryEditionOperations } from "./edition-workflow";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { randomInt, randomUUID as uuidv4 } from "node:crypto";
import { onSchedule } from "firebase-functions/scheduler";
import { setGlobalOptions } from "firebase-functions/options";
import { identifier, parseProfile, parseVote } from "./validation";
//import { Timestamp, increment } from "@firebase/firestore";

initializeApp();

setGlobalOptions({ region: "europe-west1" });

/**
 * Get the UID of the admin user.
 * @returns {string} - The UID of the admin user.
 * TODO: get the admin(s) uid from a doc in a collection
 */
async function getAdminUid(uid: string): Promise<boolean> {
  const adminsDocRef = getFirestore().collection("admin").doc("admin"); // Assuming `admin.admin` is the document reference to the admin document
  const adminsDoc = await adminsDocRef.get();
  const adminsMap = adminsDoc.data()?.admins || {};
  //console.log("map: ", Object.values(adminsMap));
  //const adminUids = Object.values(adminsMap);
  const containsValue = Object.values(adminsMap).includes(uid);
  return containsValue;
}

/**
 * Ensure the caller is an authenticated admin, throw otherwise.
 * @param {any} request - The onCall request object.
 */
async function assertAdmin(request: any): Promise<void> {
  const contextAuth = request.auth;
  if (!contextAuth) {
    throw new HttpsError("unauthenticated", "Unauthorized request!");
  }
  const isAdmin = await getAdminUid(contextAuth.uid);
  if (!isAdmin) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }
}

exports.becomecercle = onCall(async (request) => {
  await assertAdmin(request);
  if (request.auth?.token?.cercleSession === true) {
    throw new HttpsError("permission-denied", "Reconnectez-vous avec votre compte administrateur.");
  }
  const uid = identifier(request.data?.uid, "uid");
  const editionId = identifier(request.data?.editionId, "editionId");
  if (await getAdminUid(uid)) {
    throw new HttpsError("permission-denied", "Vous ne pouvez pas vous connecter à un compte administrateur.");
  }
  const edition = (await getFirestore().collection("editions").doc(editionId).get()).data();
  if (!edition || !Object.prototype.hasOwnProperty.call(edition.cercles ?? {}, uid)) {
    throw new HttpsError("not-found", "Ce cercle ne fait pas partie de cette édition.");
  }
  const target = await getAuth().getUser(uid).catch((error: { code?: string }) => {
    if (error.code === "auth/user-not-found") {
      throw new HttpsError("not-found", "Le compte de ce cercle n’existe plus.");
    }
    throw error;
  });
  if (target.disabled) {
    throw new HttpsError("failed-precondition", "Le compte de ce cercle est désactivé.");
  }
  const name = edition.cercles[uid]?.name;
  const cercleSessionName = (typeof name === "string" && name.trim() ? name : target.displayName || uid).slice(0, 160);
  // Session claims identify the warning banner without changing the user's own
  // claims, password, permissions, or other existing sessions.
  const token = await getAuth().createCustomToken(uid, { cercleSession: true, cercleSessionName });
  return { success: true, token };
});

// Revoke the public picture URLs of a past edition (admin only).
exports.lockeditionpictures = onCall(async (request) => {
  await assertAdmin(request);
  const editionId = request.data?.editionId;
  if (!editionId || typeof editionId !== "string") {
    throw new HttpsError("invalid-argument", "Missing editionId!");
  }
  const locked = await lockEditionFiles(editionId);
  return { editionId, locked };
});

// Restore the public picture URLs of an edition being re-activated (admin only).
exports.unlockeditionpictures = onCall(async (request) => {
  await assertAdmin(request);
  const editionId = request.data?.editionId;
  if (!editionId || typeof editionId !== "string") {
    throw new HttpsError("invalid-argument", "Missing editionId!");
  }
  const unlocked = await unlockEditionFiles(editionId);
  return { editionId, unlocked };
});

// One-time migration: lock every currently inactive edition (admin only).
exports.lockallpasteditions = onCall(async (request) => {
  await assertAdmin(request);
  const editionsSnap = await getFirestore()
    .collection("editions")
    .where("active", "==", false)
    .get();
  const results = [];
  for (const ed of editionsSnap.docs) {
    const locked = await lockEditionFiles(ed.id);
    results.push({ editionId: ed.id, edition: ed.data().edition, locked });
  }
  return { editions: results };
});

// disable user sign up
export const beforecreated = beforeUserCreated((_event) => {
  throw new HttpsError("permission-denied", "Unauthorized request!");
});

exports.vote = onCall(async (request) => {
  // Receipt time determines deadline eligibility, even if a transaction waits.
  const now = test.Timestamp.now();
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Unauthorized request!");
  }
  const data = parseVote(request.data);
  const editionRef = await getEdition(data.editionId);

  return getFirestore().runTransaction(async (transaction) => {
    // Every decision and mutation uses the same transaction snapshot. A
    // competing bid or settlement forces a retry before any balance is spent.
    const snapshot = await transaction.get(editionRef);
    const edition = snapshot.data();
    if (!edition) {
      throw new HttpsError("not-found", "Pas d'édition trouvée");
    }
    const cercles = edition.cercles || {};
    const senderId = auth.uid;
    if (!Object.prototype.hasOwnProperty.call(cercles, senderId)) {
      throw new HttpsError("permission-denied", "Unauthorized request!");
    }
    if (!edition.active || edition.transitioning === true || !(edition.start instanceof test.Timestamp) ||
        !(edition.stop instanceof test.Timestamp) || now < edition.start || now > edition.stop) {
      throw new HttpsError("failed-precondition", "Pas dans le temps imparti pour les enchères");
    }

    const minimum = edition.enchereMin;
    const maximum = edition.enchereMax;
    const balance = cercles[senderId].nbFut;
    if (!Number.isSafeInteger(minimum) || minimum <= 0 || !Number.isSafeInteger(maximum) ||
        maximum < minimum || !Number.isSafeInteger(balance) || balance <= 0) {
      throw new HttpsError("failed-precondition", "Le nombre de fûts est invalide");
    }
    if (data.vote < minimum || data.vote > maximum || data.vote > balance) {
      throw new HttpsError("invalid-argument", "Le nombre de fûts est invalide");
    }

    const cercleId = getCercleId(data.comitardId, cercles);
    if (!cercleId) {
      throw new HttpsError("not-found", "L'id du comitard n'est pas valide");
    }
    if (cercleId === senderId) {
      throw new HttpsError("permission-denied", "Vous ne pouvez pas voter pour vous-même");
    }
    const comitard = cercles[cercleId].comitards[data.comitardId];
    if (comitard.enchereProcessed === true) {
      throw new HttpsError("failed-precondition", "Cette enchère est déjà terminée");
    }

    const path = `cercles.${cercleId}.comitards.${data.comitardId}`;
    const updates: Record<string, any> = {
      // Timestamp acceptance in Firestore so overlapping requests are displayed
      // in commit order, including when an earlier request commits later.
      [`${path}.encheres.${uuidv4()}`]: {
        vote: data.vote, sender: senderId, date: test.FieldValue.serverTimestamp(),
      },
      [`cercles.${senderId}.nbFut`]: test.FieldValue.increment(-data.vote),
    };
    if (!comitard.enchereStart || !comitard.enchereStop) {
      if (typeof edition.duration !== "number" || !Number.isFinite(edition.duration) ||
          edition.duration <= 0 || edition.duration > 24 * 365) {
        throw new HttpsError("failed-precondition", "Aucune durée d'enchère trouvée");
      }
      updates[`${path}.enchereStart`] = now;
      updates[`${path}.enchereStop`] = test.Timestamp.fromMillis(
        now.toMillis() + edition.duration * 60 * 60 * 1000
      );
      updates[`${path}.enchereProcessed`] = false;
      updates.jobs = test.FieldValue.increment(1);
    } else {
      const bids = Object.values(comitard.encheres || {}) as { vote: number }[];
      if (!bids.length || bids.some((bid) => !bid || !Number.isSafeInteger(bid.vote) || bid.vote <= 0) ||
          !(comitard.enchereStart instanceof test.Timestamp) ||
          !(comitard.enchereStop instanceof test.Timestamp)) {
        throw new HttpsError("failed-precondition", "Invalid existing auction");
      }
      const highest = Math.max(...bids.map((bid) => bid.vote));
      if (data.vote < Math.max(highest + 1, minimum)) {
        throw new HttpsError("failed-precondition", "L'enchère doit être plus élevée que la dernière enchère");
      }
      const clientTime = Date.parse(data.clientTime);
      const stop = comitard.enchereStop.toMillis();
      if (!(now >= comitard.enchereStart && now <= comitard.enchereStop) &&
          !(now.toMillis() <= stop + 2500 && clientTime <= stop && clientTime >= stop - 5000)) {
        throw new HttpsError("failed-precondition", "Pas dans le temps imparti");
      }
    }
    transaction.update(editionRef, updates);
    return { success: true, message: "Nouvelle enchère ajoutée" };
  });
});

async function remboursement(): Promise<void> {
  const editionRef = await getActiveEdition();

  // Credit every due auction and mark it processed in the same transaction.
  // Concurrent manual/scheduled calls retry against the committed state, and a
  // failed transaction cannot leave a partially paid auction behind.
  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(editionRef);
    const edition = snapshot.data();
    if (!edition || !edition.active || edition.transitioning === true) return;

    const now = test.Timestamp.now().toMillis();
    const cercles = edition.cercles || {};
    const updates: Record<string, any> = {};
    const credits = new Map<string, number>();
    let pendingJobs = 0;

    const credit = (uid: string, amount: number) => {
      if (!Object.prototype.hasOwnProperty.call(cercles, uid) ||
          !Number.isFinite(amount) || amount < 0) {
        throw new HttpsError("failed-precondition", "Invalid reimbursement recipient or amount");
      }
      // Preserve rounding per bid, even when a user receives multiple credits.
      credits.set(uid, (credits.get(uid) || 0) + Math.ceil(amount));
    };

    for (const [cercleId, cercle] of Object.entries(cercles) as [string, any][]) {
      for (const [comitardId, comitard] of Object.entries(cercle.comitards || {}) as [string, any][]) {
        if (comitard.enchereProcessed !== false) continue;
        pendingJobs++;

        // Voting permits a 2.5 second delivery grace period. Do not settle
        // before that period finishes.
        if (!(comitard.enchereStop instanceof test.Timestamp) ||
            now <= comitard.enchereStop.toMillis() + 2500) continue;

        const rates = [edition.remboursementGagnant, edition.remboursementPerdant,
          edition.remboursementVendeur];
        if (rates.some((rate) => typeof rate !== "number" || !Number.isFinite(rate) || rate < 0)) {
          throw new HttpsError("failed-precondition", "Invalid reimbursement rates");
        }

        const bids = Object.values(comitard.encheres || {}) as any[];
        if (!bids.length || bids.some((bid) => !bid || !Number.isSafeInteger(bid.vote) ||
            bid.vote <= 0 || typeof bid.sender !== "string" ||
            !(bid.date instanceof test.Timestamp))) {
          throw new HttpsError("failed-precondition", "Invalid auction bids");
        }
        bids.sort((a, b) => b.vote - a.vote || b.date.toMillis() - a.date.toMillis());

        bids.forEach((bid, index) => {
          credit(bid.sender, bid.vote * (index === 0 ? rates[0] : rates[1]));
          if (index === 0) credit(cercleId, bid.vote * rates[2]);
        });
        updates[`cercles.${cercleId}.comitards.${comitardId}.enchereProcessed`] = true;
        pendingJobs--;
      }
    }

    for (const [uid, amount] of credits) {
      if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(cercles[uid].nbFut) ||
          !Number.isSafeInteger(cercles[uid].nbFut + amount)) {
        throw new HttpsError("failed-precondition", "Invalid reimbursement balance");
      }
      updates[`cercles.${uid}.nbFut`] = test.FieldValue.increment(amount);
    }
    // Recompute the counter from the same snapshot so it cannot become negative.
    if (Object.keys(updates).length || edition.jobs !== pendingJobs) {
      transaction.update(editionRef, { ...updates, jobs: pendingJobs });
    }
  });
}

exports.rembour = onCall(async (request) => {
  await assertAdmin(request);
  await remboursement();
  return { message: "Remboursement done" };
});

//old V1 function
//export const taskRunner = functions
//  .runWith({ memory: "2GB" })
//  .pubsub.schedule("*/10 * * * *")
//  .onRun(async (_context) => {
//    // Consistent timestamp
//    await remboursement();
//  });

//new V2 function
exports.taskrunner = onSchedule("*/10 * * * *", async (_event: any) => {
  // Consistent timestamp
  await remboursement();
});

function getCercleId(comitardId: string, cercles: any): string | null {
  for (const [cercleId, cercle] of Object.entries(cercles) as [string, any][]) {
    if (cercle.comitards && Object.prototype.hasOwnProperty.call(cercle.comitards, comitardId)) {
      return cercleId;
    }
  }
  return null;
}

function assertMemberEdition(edition: FirebaseFirestore.DocumentData, isAdmin: boolean) {
  if (edition.transitioning === true) {
    throw new HttpsError("failed-precondition", "Edition transition in progress");
  }
  if (!isAdmin && (!edition.active || !(edition.stop instanceof test.Timestamp) ||
      test.Timestamp.now() > edition.stop)) {
    throw new HttpsError("failed-precondition", "This edition is closed");
  }
}

exports.editcomitard = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Unauthorized request!");
  const data = parseProfile(request.data, true);
  const isAdmin = await getAdminUid(request.auth.uid);
  const cercleId = isAdmin ? data.cercleId : request.auth.uid;
  if (!cercleId) throw new HttpsError("invalid-argument", "Missing cercleId");
  const editionRef = await getEdition(data.editionId);
  await getFirestore().runTransaction(async (tx) => {
    const edition = (await tx.get(editionRef)).data();
    if (!edition) throw new HttpsError("not-found", "Edition not found");
    const profiles = edition.cercles?.[cercleId]?.comitards;
    if (!profiles || !Object.prototype.hasOwnProperty.call(profiles, data.comitardId!)) {
      throw new HttpsError("permission-denied", "Unauthorized profile update");
    }
    assertMemberEdition(edition, isAdmin);
    const path = `cercles.${cercleId}.comitards.${data.comitardId}`;
    const fields = { ...data.profile };
    // Legacy clients replacing a picture must not retain the previous thumbnail.
    if (fields.picture && !fields.pictureThumbnail && fields.picture !== profiles[data.comitardId!].picture) {
      fields.pictureThumbnail = fields.picture;
    }
    tx.update(editionRef, Object.fromEntries(Object.entries(fields)
      .map(([field, value]) => [`${path}.${field}`, value])));
  });
  return { success: true, message: "Comitard updated in edition map" };
});

exports.addcomitard = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Unauthorized request!");
  const data = parseProfile(request.data, false);
  const isAdmin = await getAdminUid(request.auth.uid);
  const cercleId = isAdmin ? data.cercleId : request.auth.uid;
  if (!cercleId) throw new HttpsError("invalid-argument", "Missing cercle");
  const editionRef = await getEdition(data.editionId);
  const profileId = uuidv4();
  await getFirestore().runTransaction(async (tx) => {
    const edition = (await tx.get(editionRef)).data();
    if (!edition?.cercles || !Object.prototype.hasOwnProperty.call(edition.cercles, cercleId)) {
      throw new HttpsError("permission-denied", "Unauthorized profile creation");
    }
    assertMemberEdition(edition, isAdmin);
    if (!isAdmin && (!Number.isSafeInteger(edition.nbComitard) || edition.nbComitard <= 0 ||
        Object.keys(edition.cercles[cercleId].comitards || {}).length >= edition.nbComitard)) {
      throw new HttpsError("failed-precondition", "Maximum number of profiles reached");
    }
    tx.update(editionRef, { [`cercles.${cercleId}.comitards.${profileId}`]: data.profile });
  });
  return { success: true, message: "Comitard added to edition map" };
});

/**
 * Reset password for a specific user.
 * This function can only be called by an admin.
 *
 * @param {Object} data - The data passed to the function.
 * @param {Object} context - The context object containing information about the authenticated user.
 * @returns {Promise<Object>} - A promise that resolves to an object with a success message.
 * @throws {functions.https.HttpsError} - Throws an error if the request is unauthorized or if there is an internal error.
 */

exports.resetpassworduser = onCall(async (request) => {
  const auth = request.auth;
  const data = request.data;

  // AuthZ: only admins
  if (!auth || !(await getAdminUid(auth.uid))) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  // Validate uid
  if (!data || typeof data.uid !== "string" || data.uid.trim().length === 0) {
    throw new HttpsError("invalid-argument", "User id is invalid");
  }

  // Validate password
  if (typeof data.password !== "string" || data.password.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Password is invalid");
  }
  if (data.password.length < 6) {
    throw new HttpsError("invalid-argument", "Password must be at least 6 characters");
  }

  try {
    await getAuth().updateUser(data.uid, { password: data.password });
    console.log("Password reset completed", { uid: data.uid });
    return { success: true, message: "Password reset for user." };
  } catch (err) {
    console.log("Error resetting password for user:", data.uid, err);
    throw new HttpsError("internal", "Failed to reset password for user.");
  }
});
/**
 * Reset all passwords for users in the cercle and send reset password emails.
 * This function can only be called by an admin.
 *
 * @param {Object} data - The data passed to the function.
 * @param {Object} context - The context object containing information about the authenticated user.
 * @returns {Promise<Object>} - A promise that resolves to an object with a success message.
 * @throws {functions.https.HttpsError} - Throws an error if the request is unauthorized or if there is an internal error.
 */

exports.resetpasswords = onCall({ timeoutSeconds: 540 }, async (request) => {
  if (!request.auth || !(await getAdminUid(request.auth.uid))) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }
  return beginEditionOperation("passwords", request.data, request.auth.uid);
});

exports.createedition = onCall({ timeoutSeconds: 540 }, async (request) => {
  await assertAdmin(request);
  return beginEditionOperation("create", request.data, request.auth!.uid);
});

exports.activateedition = onCall({ timeoutSeconds: 540 }, async (request) => {
  await assertAdmin(request);
  return beginEditionOperation("activate", request.data, request.auth!.uid);
});

exports.retryeditionoperation = onCall({ timeoutSeconds: 540 }, async (request) => {
  await assertAdmin(request);
  return resumeEditionOperation(identifier(request.data?.operationId, "operationId"));
});

exports.retryeditionoperations = onSchedule({ schedule: "every 5 minutes", timeoutSeconds: 540 }, retryEditionOperations);

/**
 * Generate a random password.
 *
 * @return {string} - A randomly generated password.
 */
function generateRandomPassword(): string {
  // Generate a random string as a password
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let newPassword = "";

  for (let i = 0; i < 10; i++) {
    newPassword += chars.charAt(randomInt(chars.length));
  }

  // add a special character
  const specialChars = "!@#$%^&*()_+[]{}|;:,.<>?";
  newPassword += specialChars.charAt(randomInt(specialChars.length));

  // add a uppercase letter
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  newPassword += upperChars.charAt(randomInt(upperChars.length));

  // add a number
  const numberChars = "0123456789";
  newPassword += numberChars.charAt(randomInt(numberChars.length));

  return newPassword+"1!Ab"; // Ensure the password meets complexity requirements
  //return "123456";
}

exports.disableuser = onCall(async (request) => {
  const auth = request.auth;
  const data = request.data;
  const uid = data.uid; //user uid

  if (!auth || !(await getAdminUid(auth.uid))) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  if (!uid) {
    throw new HttpsError("invalid-argument", "User id is invalid");
  }

  try {
    await getAuth().updateUser(uid, {
      disabled: true,
    });
    return { message: "User disabled" };
  } catch (error: any) {
    throw new HttpsError(
      "internal",
      "Failed to disable user: " + error.message
    );
  }
});

exports.enableuser = onCall(async (request) => {
  const auth = request.auth;
  const data = request.data;
  const uid = data.uid; //user uid

  if (!auth || !(await getAdminUid(auth.uid))) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  if (!uid) {
    throw new HttpsError("invalid-argument", "User id is invalid");
  }

  try {
    await getAuth().updateUser(uid, {
      disabled: false,
    });
    return { message: "User enabled" };
  } catch (error: any) {
    throw new HttpsError(
      "internal",
      "Failed to enable user: " + error.message
    );
  }
});

exports.deleteuser = onCall(async (request) => {
  if (!request.auth || !(await getAdminUid(request.auth.uid))) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }
  const uid = identifier(request.data?.uid, "uid");
  const editionId = identifier(request.data?.editionId, "editionId");
  if (await getAdminUid(uid)) throw new HttpsError("failed-precondition", "Cannot delete an administrator");
  const db = getFirestore();
  const editionRef = db.collection("editions").doc(editionId);
  const deletionRef = db.doc(`accountDeletions/${editionId}/users/${uid}`);
  const needsAuthDeletion = await db.runTransaction(async (tx) => {
    const [snapshot, deletion] = await tx.getAll(editionRef, deletionRef);
    if (deletion.data()?.state === "completed") return false;
    if (snapshot.data()?.transitioning === true) throw new HttpsError("failed-precondition", "Edition transition in progress");
    const cercles = snapshot.data()?.cercles || {};
    if (!Object.prototype.hasOwnProperty.call(cercles, uid)) {
      if (deletion.exists) return true; // Resume an interrupted Authentication deletion.
      throw new HttpsError("not-found", "Circle not found");
    }
    for (const [sellerId, circle] of Object.entries(cercles) as [string, any][]) {
      for (const profile of Object.values(circle.comitards || {}) as any[]) {
        const bids = Object.values(profile.encheres || {}) as any[];
        if (profile.enchereProcessed !== true && bids.length &&
            (sellerId === uid || bids.some((bid) => bid.sender === uid))) {
          throw new HttpsError("failed-precondition", "Settle or cancel this circle's auctions before deleting it");
        }
      }
    }
    tx.update(editionRef, { [`cercles.${uid}`]: test.FieldValue.delete() });
    tx.set(deletionRef, { uid, editionId, state: "pending", createdAt: test.Timestamp.now() });
    return true;
  });
  if (needsAuthDeletion) {
    await deleteUserAuth(uid);
    await deletionRef.update({ state: "completed" });
  }
  return { success: true, message: "User deleted" };
});

// Bid corrections use the current transaction snapshot for both the bid and its
// balance adjustment. The client supplies an expected amount, never a refund.
async function changeBid(request: any, remove: boolean) {
  await assertAdmin(request);
  const data = request.data;
  const editionId = identifier(data?.editionId, "editionId");
  const bidId = identifier(data?.bidId, "bidId");
  if (!Number.isSafeInteger(data.expectedAmount) || data.expectedAmount <= 0 ||
      typeof data.refund !== "boolean" ||
      (!remove && (!Number.isSafeInteger(data.amount) || data.amount <= 0))) {
    throw new HttpsError("invalid-argument", "Invalid bid correction");
  }
  const editionRef = getFirestore().collection("editions").doc(editionId);
  await getFirestore().runTransaction(async (tx) => {
    const edition = (await tx.get(editionRef)).data();
    if (!edition) throw new HttpsError("not-found", "Edition not found");
    if (edition.transitioning === true) throw new HttpsError("failed-precondition", "Edition transition in progress");
    const cercles = edition.cercles || {};
    let selected: { sellerId: string; profileId: string; profile: any; bid: any } | undefined;
    for (const [sellerId, circle] of Object.entries(cercles) as [string, any][]) {
      for (const [profileId, profile] of Object.entries(circle.comitards || {}) as [string, any][]) {
        if (Object.prototype.hasOwnProperty.call(profile.encheres || {}, bidId)) {
          selected = { sellerId, profileId, profile, bid: profile.encheres[bidId] };
        }
      }
    }
    if (!selected) throw new HttpsError("not-found", "Bid not found");
    const { sellerId, profileId, profile, bid } = selected;
    if (profile.enchereProcessed === true) {
      throw new HttpsError("failed-precondition", "Settled auctions cannot be corrected");
    }
    if (bid.vote !== data.expectedAmount) {
      throw new HttpsError("aborted", "This bid changed. Refresh before retrying.");
    }
    if (!remove && (data.amount < edition.enchereMin || data.amount > edition.enchereMax)) {
      throw new HttpsError("invalid-argument", "Bid amount is outside edition limits");
    }
    const balance = cercles[bid.sender]?.nbFut;
    const delta = data.refund ? bid.vote - (remove ? 0 : data.amount) : 0;
    if (!Number.isSafeInteger(balance) || !Number.isSafeInteger(balance + delta) || balance + delta < 0) {
      throw new HttpsError("failed-precondition", "Insufficient or invalid balance");
    }
    const path = `cercles.${sellerId}.comitards.${profileId}`;
    const updates: Record<string, unknown> = {};
    if (remove && Object.keys(profile.encheres).length === 1) {
      for (const field of ["encheres", "enchereStart", "enchereStop", "enchereProcessed"]) {
        updates[`${path}.${field}`] = test.FieldValue.delete();
      }
      let jobs = 0;
      for (const [circleId, circle] of Object.entries(cercles) as [string, any][]) {
        for (const [id, candidate] of Object.entries(circle.comitards || {}) as [string, any][]) {
          if (!(circleId === sellerId && id === profileId) && candidate.enchereProcessed === false) jobs++;
        }
      }
      updates.jobs = jobs;
    } else if (remove) {
      updates[`${path}.encheres.${bidId}`] = test.FieldValue.delete();
    } else {
      updates[`${path}.encheres.${bidId}.vote`] = data.amount;
    }
    if (delta) updates[`cercles.${bid.sender}.nbFut`] = test.FieldValue.increment(delta);
    tx.update(editionRef, updates);
  });
  return { success: true };
}

exports.editbid = onCall((request) => changeBid(request, false));
exports.deletebid = onCall((request) => changeBid(request, true));

exports.signupuser = onCall(async (request) => {
  await assertAdmin(request);
  const data = request.data;
  const editionId = identifier(data?.editionId, "editionId");
  if (typeof data.email !== "string" || !data.email.trim() || data.email.length > 320 ||
      typeof data.displayName !== "string" || !data.displayName.trim() || data.displayName.length > 150 ||
      (data.description !== undefined &&
       (typeof data.description !== "string" || data.description.length > 150))) {
    throw new HttpsError("invalid-argument", "Invalid account details");
  }

  const editionRef = await getEdition(editionId);
  const edition = (await editionRef.get()).data();
  if (!edition || edition.transitioning === true || !Number.isSafeInteger(edition.nbFut) || edition.nbFut < 0) {
    throw new HttpsError("failed-precondition", "Invalid edition starting balance");
  }

  const authClient = getAuth();
  const user = await authClient.createUser({
    email: data.email.trim(),
    password: generateRandomPassword(),
    displayName: data.displayName,
  }).catch(() => {
    throw new HttpsError("unavailable", "Could not create authentication account");
  });

  try {
    await getFirestore().runTransaction(async tx => {
      const current = (await tx.get(editionRef)).data();
      if (!current || current.transitioning === true || !Number.isSafeInteger(current.nbFut) || current.nbFut < 0) {
        throw new HttpsError("failed-precondition", "Edition cannot accept accounts");
      }
      tx.update(editionRef, { [`cercles.${user.uid}`]: {
        description: data.description ?? "", nbFut: current.nbFut,
        name: data.displayName, comitards: {}, admins: [],
      } });
    });
  } catch {
    // A lost write acknowledgement can mean the document was actually updated.
    // Verify the outcome before deleting an account that may already be linked.
    let linked;
    try {
      linked = (await editionRef.get()).data()?.cercles?.[user.uid];
    } catch {
      console.error("Could not verify account creation", { uid: user.uid, editionId });
      throw new HttpsError("unavailable", "Account creation could not be verified. Contact an administrator.");
    }
    if (!linked) {
      try {
        await authClient.deleteUser(user.uid);
      } catch {
        console.error("Could not roll back account creation", { uid: user.uid, editionId });
        throw new HttpsError("internal", "Account creation failed and cleanup is required. Contact an administrator.");
      }
      throw new HttpsError("unavailable", "Could not add account to edition. Account creation was rolled back.");
    }
  }

  return { success: true, message: "User created and added to edition map" };
});

exports.getdisabledstatus = onCall(async (request) => {
  const auth = request.auth;
  const data = request.data;
  const editionId = data.editionId;

  if (!auth || !(await getAdminUid(auth.uid))) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  if (!editionId) {
    throw new HttpsError("invalid-argument", "Edition id is invalid");
  }
  // get all cercles uid

  const activeEdition = await getEdition(editionId);
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  console.log("activeEditionCercle: ", activeEditionCercle);

  if (Object.keys(activeEditionCercle).length === 0) {
    // No editions found
    throw new HttpsError("unavailable", "No editions found!");
  }

  const statusDict: { [key: string]: boolean } = {};

  try {
    const userUIDs = Object.keys(activeEditionCercle);
    for (const uid of userUIDs) {
      const user = await getAuth().getUser(uid);
      statusDict[uid] = user.disabled;
    }
  } catch (error: any) {
    console.log("Error retrieving user status:", error);
  }

  return { status: statusDict };
});

async function deleteUserAuth(uid: string): Promise<void> {
  const admin_auth = getAuth();
  // Delete the user
  try {
    await admin_auth.deleteUser(uid);
  } catch (error: any) {
    if (error.code !== "auth/user-not-found") {
      throw new HttpsError("unavailable", "Account removal is pending. Retry the same deletion to finish it.");
    }
  }

  return;
}

/**
 * Retrieves the active edition from Firestore.
 * @returns {Firestore.DocumentReference} The Firestore document reference for the active edition.
 */

async function getEdition(
  editionId: string
): Promise<FirebaseFirestore.DocumentReference> {
  const editionCollection = getFirestore()
    .collection("editions")
    .doc(editionId);
  return editionCollection;
}

async function getActiveEdition(): Promise<FirebaseFirestore.DocumentReference> {
  const db = test.getFirestore();
  const editionCollection = db.collection("editions");
  const querySnapshot = await editionCollection
    .where("active", "==", true)
    .orderBy("edition", "desc")
    .limit(1)
    .get();

  //const queryBis = await db.collection("editions").doc("rHiqrhsVIKrvsWCv0onw");
  //
  if (querySnapshot.empty) {
    throw new HttpsError("unavailable", "No editions found!");
  }
  //return queryBis;
  return querySnapshot.docs[0].ref;
  //return test3;
}

