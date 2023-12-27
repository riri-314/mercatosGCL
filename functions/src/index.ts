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
// import { getAuth, sendPasswordResetEmail } from "@firebase/auth";

admin.initializeApp();

/**
 * Get the UID of the admin user.
 * @returns {string} - The UID of the admin user.
 * TODO: get the admin(s) uid from a doc in a collection
 */

function getAdminUid() {
  return "your_admin_uid_here";
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
  const editionsRef = admin.firestore().collection("editions");
  const auth = event.auth;

  // admin can sign in
  if (!auth || auth.uid == getAdminUid()) {
    return;
  }

  // Fetch the latest document based on the highest id number
  const latestEditionSnapshot = await editionsRef
    .orderBy("id", "desc")
    .limit(1)
    .get();

  if (latestEditionSnapshot.empty) {
    // No editions found
    throw new Error("Sign-in blocked. website not ready.");
  }

  const latestEdition = latestEditionSnapshot.docs[0].data();
  const cercle = latestEdition.cercle || {};

  // Check if the user's UID exists in the cercle map
  if (cercle[user.uid]) {
    return;
  } else {
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
  // const auth = getAuth();

  // Check if the request is made by an admin
  if (!context_auth || context_auth.uid !== getAdminUid()) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  const admin_auth = admin.auth();
  const editionsRef = admin.firestore().collection("editions");

  try {
    // Fetch the latest document based on the highest id number
    const latestEditionSnapshot = await editionsRef
      .orderBy("id", "desc")
      .limit(1)
      .get();

    if (latestEditionSnapshot.empty) {
      throw new Error("No editions found!");
    }

    const latestEdition = latestEditionSnapshot.docs[0].data();
    const cercle = latestEdition.cercles || {};

    const userUIDs = Object.keys(cercle);

    // Loop through user UIDs in the cercle
    for (const uid of userUIDs) {
      // Generate a random password
      const newPassword = data.password || generateRandomPassword();

      // Reset password for each user
      await admin_auth.updateUser(uid, { password: newPassword });

      // Send reset password email
      // TODO
      // list all users with firebase admin sdk. Match uid with uid in current edition (wont send email, or reset passord to old unused accounts)
      // admin sdk give us email, send password reset email with firebase auth sdk
      // necessary to do that. Only way to track user eamil is with firebase admin sdk. Firebase auth sdk only give us uid.
    }

    return { message: "Passwords reset and reset email sent to all users." };
  } catch (error) {
    throw new HttpsError("internal", "Error resetting passwords.", error);
  }
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

  if (!auth || auth.uid !== getAdminUid()) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  // create user account, catch uid
  // add user to cercle
  // send pawword reset email to user

  return 1;
});

// TODO: active edition provider, return the active edition doc
// TODO: add acitve edition provider to front end
// TODO: admin provider, return admin(s) uid
// TODO: Finish signUpUser function
// TODO: Refresh the db with correct data and correct users, using signUpUser function
// TODO: Test resetPasswords function
// TODO: create add comitard function
// TODO: firestore security rules
// TODO: cercle add vote
// TODO: firestore security rules