/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  beforeUserCreated,
  beforeUserSignedIn,
} from "firebase-functions/v2/identity";
import { getAuth, sendPasswordResetEmail } from "@firebase/auth";

// import { getAuth, sendPasswordResetEmail } from "@firebase/auth";

admin.initializeApp();

/**
 * Get the UID of the admin user.
 * @returns {string} - The UID of the admin user.
 * TODO: get the admin(s) uid from a doc in a collection
 */

async function getAdminUid(uid: string): Promise<boolean> {
  const adminsDocRef = admin.firestore().collection("admin").doc('admin'); // Assuming `admin.admin` is the document reference to the admin document
  const adminsDoc = await adminsDocRef.get()
  const adminsMap = adminsDoc.data()?.admins || {};

  //const adminUids = Object.values(adminsMap);
  const containsValue = Object.values(adminsMap).includes("bb");
  return containsValue;
}

exports.sayHello = onRequest({ cors: true }, (req, res) => {
  const data = req.body; // Access the request body

  const responseObj = {
    message: "Hello World",
    data: data,
  };

  res.status(200).json(responseObj); // Send the response object as JSON
});

// disable user sign up
export const beforecreated = beforeUserCreated((event) => {
  throw new HttpsError("permission-denied", "Unauthorized request!");
});

// TODO: instead of using the latest edition, use the edition that as the id (indexed field) set to true
export const beforesignedin = beforeUserSignedIn(async (event) => {
  const user = event.data;
  const auth = event.auth;

  // admin can sign in
  if (!auth || await getAdminUid(auth.uid)) {
    return;
  }

  const activeEdition = await getActiveEdition();
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercle || {};

  if (activeEditionCercle.empty) {
    // No editions found
    throw new Error("Sign-in blocked. website not ready.");
  }

  // Check if the user's UID exists in the cercle map
  if (activeEditionCercle[user.uid]) {
    return;
  }

  // If the user's UID doesn't exist in the cercle map, block sign-in
  throw new Error("Sign-in blocked. User UID not found in the latest edition.");
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

exports.resetPasswords = onCall(async (request) => {
  const context_auth = request.auth;
  const data = request.data;
  const auth = getAuth();

  // Check if the request is made by an admin
  if (!context_auth || await getAdminUid(context_auth.uid)) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  const admin_auth = admin.auth();

  const activeEdition = await getActiveEdition();
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercle || {};

  if (activeEditionCercle.empty) {
    // No editions found
    throw new Error("No editions found!");
  }

  const userUIDs = Object.keys(activeEditionCercle);

  // Loop through user UIDs in the cercle
  for (const uid of userUIDs) {
    // Generate a random password
    const newPassword = data.password || generateRandomPassword();

    // Reset password for each user
    await admin_auth.updateUser(uid, { password: newPassword });

    const user = await admin_auth.getUser(uid);
    const email = user.email;

    // Send reset password email
    // admin sdk give us email, send password reset email with firebase auth sdk
    // necessary to do that. Only way to track user eamil is with firebase admin sdk. Firebase auth sdk only give us uid.
    if (email) {
      // await admin_auth.generatePasswordResetLink(email);
      await sendPasswordResetEmail(auth, email);
    } else {
      throw new Error("No email found for user!");
    }
  }

  return { message: "Passwords reset and reset email sent to all users." };
});

/**
 * Generate a random password.
 *
 * @returns {string} - A randomly generated password.
 */
function generateRandomPassword(): string {
  // Generate a random string as a password
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let newPassword = "";

  for (let i = 0; i < 10; i++) {
    newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return newPassword;
}

exports.signUpUser = onCall(async (request) => {
  const auth = request.auth;
  //const data = request.data;

  if (!auth || await getAdminUid(auth.uid)) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  // create user account, catch uid
  // add user to cercle
  // send pawword reset email to user

  return 1;
});

/**
 * Retrieves the active edition from Firestore.
 * @returns {Firestore.DocumentReference} The Firestore document reference for the active edition.
 */
async function getActiveEdition(): Promise<FirebaseFirestore.DocumentReference> {
  const editionCollection = admin.firestore().collection("edition");
  const querySnapshot = await editionCollection
    .where("active", "==", true)
    .orderBy("edition", "desc")
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    throw new Error("No active edition found");
  }

  return querySnapshot.docs[0].ref;
}

// TODO: active edition provider, return the active edition doc. DONE
// TODO: add acitve edition provider to front end
// TODO: admin provider, return admin(s) uid. DONE
// TODO: add admin provider to front end. DONE
// TODO: Finish signUpUser function
// TODO: Refresh the db with correct data and correct users, using signUpUser function
// TODO: Test resetPasswords function
// TODO: create add comitard function
// TODO: firestore security rules
// TODO: cercle add vote
// TODO: firestore security rules
