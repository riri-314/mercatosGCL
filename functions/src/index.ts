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
import {
  beforeUserCreated,
  beforeUserSignedIn,
} from "firebase-functions/v2/identity";
import { v4 as uuidv4 } from "uuid";
//import { Timestamp, increment } from "@firebase/firestore";

admin.initializeApp();

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

// disable user sign up
export const beforecreated = beforeUserCreated((event) => {
  throw new HttpsError("permission-denied", "Unauthorized request!");
});

export const beforesignedin = beforeUserSignedIn(async (event) => {
  const user = event.data;

  // admin can sign in
  if (user.uid && (await getAdminUid(user.uid))) {
    return;
  }

  const activeEdition = await getActiveEdition();
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  if (Object.keys(activeEditionCercle).length === 0) {
    // No editions found
    throw new HttpsError("unavailable", "No editions found!");
  }

  // Check if the user's UID exists in the cercle map
  if (activeEditionCercle[user.uid]) {
    return;
  }
  throw new HttpsError("permission-denied", "Unauthorized access!");
});

exports.vote = onCall(async (request) => {
  const context_auth = request.auth;
  const data = request.data;
  let isAdmin = false;

  const activeEdition = await getActiveEditionBis();
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  if (Object.keys(activeEditionCercle).length === 0) {
    // No editions found
    throw new HttpsError("unavailable", "No cercles found in edition!");
  }

  // Check if the request is made by an isAdmin
  if (!context_auth) {
    throw new HttpsError("permission-denied", "Unauthorized request!"); // return error if not connected
  } else {
    isAdmin = await getAdminUid(context_auth.uid);
    if (!activeEditionCercle[context_auth.uid] && !isAdmin) {
      throw new HttpsError("permission-denied", "Unauthorized request!"); // return error if not isAdmin or not a active cercle
    }
  }

  // check date
  console.log("before now:", admin.firestore.Timestamp);
  console.log("before now:", test);
  console.log("before now:", test.Timestamp);
  const now = test.Timestamp.now();
  //const now = admin.firestore.Timestamp.fromDate(new Date());

  console.log("now: ", now.toMillis());
  const start = activeEditionData.data()?.start;
  const stop = activeEditionData.data()?.stop;
  if (start && stop) {
    if (now < start || now > stop) {
      throw new HttpsError(
        "permission-denied",
        "Vote time frame for the event is over!"
      );
    }
  } else {
    throw new HttpsError("unavailable", "No vote time frame found!");
  }

  let senderId = context_auth.uid;

  // Check if the request contains the required data

  const enchereMin = activeEditionData.data()?.enchereMin;
  const enchereMax = activeEditionData.data()?.enchereMax;
  if (!enchereMin || !enchereMax) {
    throw new HttpsError("unavailable", "No min max enchere found!");
  }

  let nbFut = 0;
  if (isAdmin) {
    nbFut = Infinity;
  } else {
    nbFut = activeEditionCercle[senderId].nbFut;
  }
  if (!nbFut) {
    throw new HttpsError("unavailable", "No nbFut found!");
  }

  // check vote number > 0, > votemin, < votemax, <= nbFut
  if (
    data.vote === undefined ||
    data.vote < 0 ||
    data.vote == Infinity ||
    data.vote > enchereMax ||
    data.vote < enchereMin ||
    data.vote > nbFut
  ) {
    throw new HttpsError("invalid-argument", "Vote number is invalide");
  }
  // comitard id exist and not same cercle
  const cercleId = getCercleId(data.comitardId, activeEditionCercle);

  if (!cercleId) {
    throw new HttpsError("invalid-argument", "Comitard id is invalid");
  } else {
    if (cercleId === senderId) {
      throw new HttpsError(
        "invalid-argument",
        "Cannot vote for yourself, comitard id is invalid"
      );
    }
  }
  const enchereStart = activeEditionCercle[cercleId].comitards[data.comitardId].enchereStart;
  const enchereStop = activeEditionCercle[cercleId].comitards[data.comitardId].enchereStop;

  const duration = activeEditionData.data()?.duration;

  if (!duration) {
    throw new HttpsError("unavailable", "No duration found!");
  }

  if (!enchereStart || !enchereStop) {
    // start enchere
    // set start and end date for enchere
    // add enchere
    // increment jobs
    // decrement nbFut
    const secondsToAdd = duration * 60 * 60;
    //const test = Timestamp.fromDate(new Date());

    //const hoursToAdd = 5; // replace with the number of hours you want to add
    //const futureDate = new Date(Date.now() + duration * 60 * 60 * 1000);
    //const future = Timestamp.fromDate(futureDate);

    const future = test.Timestamp.fromMillis(
      now.toMillis() + secondsToAdd * 1000
    );
    console.log("future: ", future.toMillis());

    const s = `cercles.${cercleId}.comitards.${data.comitardId}`;
    //const d = `cercles.${cercleId}.comitards.${
    //  data.comitardId
    //}.encheres.${uuidv4()}`;
    const e = `cercles.${senderId}.nbFut`;
    console.log("fieldValue: ", test.FieldValue);
    console.log("fieldValue: ", test.FieldValue.increment);
    console.log("fieldValue: ", test.FieldValue.increment(4));
    const enchereId = uuidv4();
    const encherePath = `${s}.encheres.${enchereId}`;
    
    activeEdition.update({
      [encherePath]: {
        vote: data.vote,
        sender: senderId,
        date: now,
      },
      [`${s}.enchereStart`]: now,
      [`${s}.enchereStop`]: future,
      [e]: test.FieldValue.increment(-data.vote),
      jobs: test.FieldValue.increment(1),
    })
      .catch((error: any) => {
        console.log("Error adding new enchere:", error);
        throw new HttpsError("unavailable", "Error adding new enchere!");
      })
      .then(() => {
        return { message: "Added new enchere" };
      });
  } else {
    if (now < enchereStart || now > enchereStop) {
      throw new HttpsError(
        "permission-denied",
        "Not in the vote time frame for the comitard!"
      );
    } else {
      // add enchere
      // decrement nbFut
      const s = `cercles.${cercleId}.comitards.${data.comitardId}`;

      const enchereId = uuidv4();
      const encherePath = `${s}.encheres.${enchereId}`;
      const e = `cercles.${senderId}.nbFut`;
      activeEdition
        .update({
          [encherePath]: {
            vote: data.vote,
            sender: senderId,
            date: now,
          },
          [e]: test.FieldValue.increment(-data.vote),
        })
        .catch((error: any) => {
          console.log("Error adding new enchere:", error);
          throw new HttpsError("unavailable", "Error adding new enchere!");
        })
        .then(() => {
          return { message: "Added new enchere" };
        });
    }
  }
  return { message: "Added new enchere" };
});

function getCercleId(
  comitardId: string,
  activeEditionCercle: any
): string | null {
  let cercleIdFound = null;
  Object.keys(activeEditionCercle).forEach(function (cercleId) {
    const cercle = activeEditionCercle[cercleId];
    if (cercle.comitards.hasOwnProperty(comitardId)) {
      cercleIdFound = cercleId;
    }
  });
  return cercleIdFound;
}

exports.addComitard = onCall(async (request) => {
  const context_auth = request.auth;
  const data = request.data;
  let admin = false;
  const txtlenght1 = 30;
  const txtlenght2 = 150;

  const activeEdition = await getActiveEdition();
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  if (Object.keys(activeEditionCercle).length === 0) {
    // No editions found
    throw new HttpsError("unavailable", "No cercles found in edition!");
  }

  // Check if the request is made by an admin
  if (!context_auth) {
    throw new HttpsError("permission-denied", "Unauthorized request!"); // return error if not connected
  } else {
    admin = await getAdminUid(context_auth.uid);
    if (!activeEditionCercle[context_auth.uid] && !admin) {
      throw new HttpsError("permission-denied", "Unauthorized request!"); // return error if not admin or not a active cercle
    }
  }

  let cercle = context_auth.uid;

  // Check if the request contains the required data
  if (
    data.name === undefined ||
    data.name.length == 0 ||
    data.name.length > txtlenght1 ||
    data.firstname === undefined ||
    data.firstname.length == 0 ||
    data.firstname.length > txtlenght1 ||
    data.nickname === undefined ||
    data.nickname.length == 0 ||
    data.nickname.length > txtlenght1 ||
    data.post === undefined ||
    data.post.length == 0 ||
    data.post.length > txtlenght1 ||
    data.teneurTaule === undefined ||
    data.teneurTaule.length < 0 ||
    data.teneurTaule.length > 10 ||
    data.etatCivil === undefined ||
    data.etatCivil.length == 0 ||
    data.etatCivil.length > txtlenght2 ||
    data.age === undefined ||
    data.age.length < 0 ||
    data.age.length > 99 ||
    data.nbEtoiles === undefined ||
    data.nbEtoiles.length < 0 ||
    data.nbEtoiles.length > 15 ||
    data.pointFort === undefined ||
    data.pointFort.length == 0 ||
    data.pointFort.length > txtlenght2 ||
    data.pointFaible === undefined ||
    data.pointFaible.length == 0 ||
    data.pointFaible.length > txtlenght2 ||
    data.estLeSeul === undefined ||
    data.estLeSeul.length == 0 ||
    data.estLeSeul.length > txtlenght2 ||
    data.picture === undefined ||
    data.picture.length == 0
  ) {
    throw new HttpsError("invalid-argument", "Missing data!");
  }
  if (admin) {
    if (data.cercle === undefined || data.cercle.length == 0) {
      throw new HttpsError("invalid-argument", "Missing data!");
    } else {
      // Check if the cercle exists
      if (!activeEditionCercle[data.cercle]) {
        throw new HttpsError("invalid-argument", "Cercle does not exist!");
      } else {
        cercle = data.cercle;
      }
    }
  }

  const s = `cercles.${cercle}.comitards.${uuidv4()}`;
  activeEdition
    .update({
      [s]: {
        name: data.name,
        firstname: data.firstname,
        nickname: data.nickname,
        post: data.post,
        teneurTaule: data.teneurTaule,
        etatCivil: data.etatCivil,
        age: data.age,
        nbEtoiles: data.nbEtoiles,
        pointFort: data.pointFort,
        pointFaible: data.pointFaible,
        estLeSeul: data.estLeSeul,
        picture: data.picture,
      },
    })
    .catch((error: any) => {
      console.log("Error creating new user:", error);
      throw new HttpsError("unavailable", "Error creating new user!");
    })
    .then(() => {
      return { message: "Comitard added to edition map" };
    });
  return { message: "Comitard added to edition map" };

  // add comitard in the map
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
  //const auth = getAuth();

  // Check if the request is made by an admin
  if (!context_auth || !(await getAdminUid(context_auth.uid))) {
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  const admin_auth = admin.auth();

  const activeEdition = await getActiveEdition();
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  console.log("activeEditionCercle: ", activeEditionCercle);

  if (Object.keys(activeEditionCercle).length === 0) {
    // No editions found
    throw new HttpsError("unavailable", "No editions found!");
  }

  const userUIDs = Object.keys(activeEditionCercle);

  // Loop through user UIDs in the cercle
  for (const uid of userUIDs) {
    // Generate a random password
    console.log("uid: ", uid);
    const newPassword = data.password || generateRandomPassword();

    // Reset password for each user
    await admin_auth.updateUser(uid, { password: newPassword });

    const user = await admin_auth.getUser(uid);
    const email = user.email;

    // Send reset password email
    // admin sdk give us email, send password reset email with firebase auth sdk
    // necessary to do that. Only way to track user eamil is with firebase admin sdk.
    // Firebase auth sdk only give us uid.
    if (email) {
      // await admin_auth.generatePasswordResetLink(email);
      //await sendPasswordResetEmail(auth, email);
      console.log("email: ", email);
    } else {
      throw new Error("No email found for user!");
    }
  }

  return { message: "Passwords reset and reset email sent to all users." };
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

  //return newPassword;
  return "123456";
}

exports.signUpUser = onCall(async (request) => {
  const auth = request.auth;
  const data = request.data;
  const description = data.description || "";

  if (!auth || !(await getAdminUid(auth.uid))) {
    console.log("Error not admin");
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }
  console.log("OK is admin");

  if (data.email === undefined || data.displayName === undefined) {
    console.log("Error missing data");
    throw new HttpsError("invalid-argument", "Missing data!");
  }

  const activeEdition = await getActiveEdition();
  const activeEditionData = await activeEdition.get();
  const activeEditionVotes = activeEditionData.data()?.nbFut;

  console.log("activeEditionVotes: ", activeEditionVotes);

  if (activeEditionVotes === undefined) {
    // No editions found
    throw new HttpsError("unavailable", "No editions found!");
  }

  // create user account, catch uid
  getAuth()
    .createUser({
      email: data.email,
      password: generateRandomPassword(),
      displayName: data.displayName,
    })
    .then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log("Successfully created new user:", userRecord.uid);
      // add user to cercle
      const s = `cercles.${userRecord.uid}`;
      activeEdition
        .update({
          [s]: {
            description: description,
            nbFut: activeEditionVotes,
            name: data.displayName,
          },
        })
        .catch((error: any) => {
          console.log("Error creating new user:", error);
          throw new HttpsError("unavailable", "Error creating new user!");
        });

      // send pawword reset email to user. NOPE

      return 1;
    })
    .catch((error) => {
      console.log("Error creating new user:", error);
      throw new HttpsError("unavailable", "Error creating new user!");
    });

  return { message: "User created and added to edition map" };
});

/**
 * Retrieves the active edition from Firestore.
 * @returns {Firestore.DocumentReference} The Firestore document reference for the active edition.
 */

async function getActiveEdition(): Promise<FirebaseFirestore.DocumentReference> {
  const editionCollection = admin.firestore().collection("editions");
  const querySnapshot = await editionCollection
    .where("active", "==", true)
    .orderBy("edition", "desc")
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    throw new HttpsError("unavailable", "No editions found!");
  }

  return querySnapshot.docs[0].ref;
}

async function getActiveEditionBis(): Promise<FirebaseFirestore.DocumentReference> {
  const db = test.getFirestore();
  const editionCollection = db.collection("editions");
  const querySnapshot = await editionCollection
    .where("active", "==", true)
    .orderBy("edition", "desc")
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    throw new HttpsError("unavailable", "No editions found!");
  }

  return querySnapshot.docs[0].ref;
}

// TODO: active edition provider, return the active edition doc. DONE
// TODO: add acitve edition provider to front end. DONE
// TODO: admin provider, return admin(s) uid. DONE
// TODO: add admin provider to front end. DONE
// TODO: Finish signUpUser function. DONE
// TODO: Refresh the db with correct data and correct users, using signUpUser function. DONE
// TODO: Test resetPasswords function. DONE
// TODO: Update new edition form. DONE
// TODO  Update new cercle form. DONE
// TODO: create add comitard form. DONE
// TODO: add comitard picture. DONE
// TODO: add comitard picture compression. DONE
// TODO: create add comitard function
// TODO: firestore security rules. DONE
// TODO: cercle add vote
// TODO: firestore security rules

// admin tools: newEdition is DONE
// edit edition: to be tested,  Done in front end

// new comitard: TODO, cloud function
// remove comitard: TODO, can be done by cercle ?
// edit comitard: TODO, cloud function

// addcercle: TRASH, cloud function. DONE
// remove cercle: TODO, at the end
// edit cercle: TODO, Done in front end

// https://www.youtube.com/watch?v=h79xrJZAQ6I
