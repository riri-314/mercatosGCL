/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as test from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { randomUUID as uuidv4 } from "node:crypto";
import { onSchedule } from "firebase-functions/scheduler";
import { setGlobalOptions } from "firebase-functions/options";
import { identifier, parseProfile, parseVote } from "./validation";
//import { Timestamp, increment } from "@firebase/firestore";

admin.initializeApp();

setGlobalOptions({ region: "europe-west1" });

/**
 * Get the UID of the admin user.
 * @returns {string} - The UID of the admin user.
 * TODO: get the admin(s) uid from a doc in a collection
 */
async function getAdminUid(uid: string): Promise<boolean> {
  const adminsDocRef = admin.firestore().collection("admin").doc("admin"); // Assuming `admin.admin` is the document reference to the admin document
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

/**
 * Revoke the public download tokens of every file under an edition prefix.
 * The current token is stashed in `lockedToken` custom metadata so the exact
 * same public URL can be restored later (see unlockEditionFiles). Idempotent:
 * files already locked (no live token) are skipped so the stash is never lost.
 * @param {string} editionId - Firestore doc id used as the storage prefix.
 * @returns {Promise<number>} - Number of files locked.
 */
async function lockEditionFiles(editionId: string): Promise<number> {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({ prefix: `${editionId}/` });
  let locked = 0;
  for (const file of files) {
    const [meta] = await file.getMetadata();
    const custom = (meta.metadata || {}) as Record<string, any>;
    const current = custom.firebaseStorageDownloadTokens;
    if (current) {
      await file.setMetadata({
        metadata: { firebaseStorageDownloadTokens: "", lockedToken: current },
      });
      locked++;
    }
  }
  return locked;
}

/**
 * Restore the previously stashed download token of every file under an edition
 * prefix, re-enabling the original public URLs. Idempotent.
 * @param {string} editionId - Firestore doc id used as the storage prefix.
 * @returns {Promise<number>} - Number of files unlocked.
 */
async function unlockEditionFiles(editionId: string): Promise<number> {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({ prefix: `${editionId}/` });
  let unlocked = 0;
  for (const file of files) {
    const [meta] = await file.getMetadata();
    const custom = (meta.metadata || {}) as Record<string, any>;
    const saved = custom.lockedToken;
    if (saved) {
      await file.setMetadata({
        metadata: { firebaseStorageDownloadTokens: saved, lockedToken: null },
      });
      unlocked++;
    }
  }
  return unlocked;
}

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
  const editionsSnap = await admin
    .firestore()
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
  const now = test.Timestamp.now();
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Unauthorized request!");
  }
  const data = parseVote(request.data);
  const editionRef = await getEdition(data.editionId);

  return admin.firestore().runTransaction(async (transaction) => {
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
    if (!edition.active || !(edition.start instanceof test.Timestamp) ||
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
      [`${path}.encheres.${uuidv4()}`]: { vote: data.vote, sender: senderId, date: now },
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
  await admin.firestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(editionRef);
    const edition = snapshot.data();
    if (!edition || !edition.active) return;

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

exports.editcomitard = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Unauthorized request!");
  const data = parseProfile(request.data, true);
  const isAdmin = await getAdminUid(request.auth.uid);
  const cercleId = isAdmin ? data.cercleId : request.auth.uid;
  if (!cercleId) throw new HttpsError("invalid-argument", "Missing cercleId");

  const editionRef = await getEdition(data.editionId);
  const edition = (await editionRef.get()).data();
  const profiles = edition?.cercles?.[cercleId]?.comitards;
  if (!profiles || !Object.prototype.hasOwnProperty.call(profiles, data.comitardId!)) {
    throw new HttpsError("permission-denied", "Unauthorized profile update");
  }

  const path = `cercles.${cercleId}.comitards.${data.comitardId}`;
  const updates = Object.fromEntries(Object.entries(data.profile)
    .map(([field, value]) => [`${path}.${field}`, value]));
  await editionRef.update(updates);
  return { success: true, message: "Comitard updated in edition map" };
});

exports.addcomitard = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Unauthorized request!");
  const data = parseProfile(request.data, false);
  const isAdmin = await getAdminUid(request.auth.uid);
  const cercleId = isAdmin ? data.cercleId : request.auth.uid;
  if (!cercleId) throw new HttpsError("invalid-argument", "Missing cercle");

  const editionRef = await getEdition(data.editionId);
  const edition = (await editionRef.get()).data();
  if (!edition?.cercles || !Object.prototype.hasOwnProperty.call(edition.cercles, cercleId)) {
    throw new HttpsError("permission-denied", "Unauthorized profile creation");
  }
  if (edition.stop && test.Timestamp.now() > edition.stop && !isAdmin) {
    throw new HttpsError("failed-precondition", "Edition is finished");
  }

  await editionRef.update({
    [`cercles.${cercleId}.comitards.${uuidv4()}`]: data.profile,
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
    await admin.auth().updateUser(data.uid, { password: data.password });
    console.log("Password reset for user:", data.uid, "and password", data.password); //FOR DEBUG
    const user = await admin.auth().getUser(data.uid);
    console.log("User email: ", user);
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

exports.resetpasswords = onCall(async (request) => {
  const context_auth = request.auth;
  const data = request.data;
  //const auth = getAuth();

  // Check if the request is made by an admin
  if (!context_auth || !(await getAdminUid(context_auth.uid))) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  console.log("edition id:", data.editionId);
  if (data.editionId === undefined) {
    throw new HttpsError("invalid-argument", "Edition id is invalid");
  }

  const activeEdition = await getEdition(data.editionId);
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  console.log("activeEditionCercle: ", activeEditionCercle);

  if (Object.keys(activeEditionCercle).length === 0) {
    // No editions found
    throw new HttpsError("unavailable", "No editions found!");
  }

  //

  const userUIDs = Object.keys(activeEditionCercle);
  const emailArray = [];

  // Loop through user UIDs in the cercle
  for (const uid of userUIDs) {
    // Generate a random password
    console.log("uid: ", uid);
    const newPassword = data.password || generateRandomPassword();

    // Reset password for each user
    try {
      await admin.auth().updateUser(uid, { password: newPassword });
      //console.log("Password reset for user: ", uid, newPassword); //FOR DEBUG
    } catch (error: any) {
      console.log("Error resetting password for user: ", uid);
    }

    const user = await admin.auth().getUser(uid);
    const email = user.email;

    // Send reset password email
    // admin sdk give us email, send password reset email with firebase auth sdk
    // necessary to do that. Only way to track user eamil is with firebase admin sdk.
    // Firebase auth sdk only give us uid.
    if (email) {
      emailArray.push(email);

      console.log("email: ", email);
    } else {
      throw new Error("No email found for user!");
    }
  }

  return { message: "Passwords reseted to all users.", emails: emailArray };
  //return { message: "Passwords reset and reset email sent to all users." };
});

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
    newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // add a special character
  const specialChars = "!@#$%^&*()_+[]{}|;:,.<>?";
  newPassword += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

  // add a uppercase letter
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  newPassword += upperChars.charAt(Math.floor(Math.random() * upperChars.length));

  // add a number
  const numberChars = "0123456789";
  newPassword += numberChars.charAt(Math.floor(Math.random() * numberChars.length));

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
    await admin.auth().updateUser(uid, {
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
    await admin.auth().updateUser(uid, {
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
  const auth = request.auth;
  const data = request.data;
  const uid = data.uid; //user uid
  const editionId = data.editionId;

  if (!auth || !(await getAdminUid(auth.uid))) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  console.log("edition id:", editionId);
  if (editionId === undefined) {
    throw new HttpsError("invalid-argument", "Edition id is invalid");
  }

  if (!uid) {
    throw new HttpsError("invalid-argument", "User id is invalid");
  }

  const activeEdition = await getEdition(editionId);
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  if (Object.keys(activeEditionCercle).length === 0) {
    // No editions found
    throw new HttpsError("unavailable", "No cercles found in edition!");
  }

  Object.keys(activeEditionCercle).forEach((cercleId) => {
    if (cercleId === uid) {
      delete activeEditionCercle[cercleId];
    }
  });

  const editionRef = admin.firestore().collection("editions").doc(editionId);

  await editionRef.update({ cercles: activeEditionCercle });

  await deleteUserAuth(uid);

  return { message: "User deleted" };
});

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
  if (!edition || !Number.isSafeInteger(edition.nbFut) || edition.nbFut < 0) {
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
    await editionRef.update({
      [`cercles.${user.uid}`]: {
        description: data.description ?? "",
        nbFut: edition.nbFut,
        name: data.displayName,
        comitards: {},
        admins: [],
      },
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
      const user = await admin.auth().getUser(uid);
      statusDict[uid] = user.disabled;
    }
  } catch (error: any) {
    console.log("Error retrieving user status:", error);
  }

  return { status: statusDict };
});

async function deleteUserAuth(uid: string): Promise<void> {
  const admin_auth = admin.auth();
  // Delete the user
  try {
    await admin_auth.deleteUser(uid);
  } catch (error: any) {
    throw new HttpsError("internal", "Failed to delete user: " + error.message);
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
  const editionCollection = admin
    .firestore()
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

