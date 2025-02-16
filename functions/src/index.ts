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
import { v4 as uuidv4 } from "uuid";
import { onSchedule } from "firebase-functions/scheduler";
import { setGlobalOptions } from "firebase-functions/options";
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

// disable user sign up
export const beforecreated = beforeUserCreated((_event) => {
  throw new HttpsError("permission-denied", "Unauthorized request!");
});

// check if login in first ?
// define the now const at the start of the function. Will "fix" the issue with late votes.

exports.vote = onCall(async (request) => {
  const now = test.Timestamp.now();
  const context_auth = request.auth;
  if (!context_auth) {
    throw new HttpsError("permission-denied", "Unauthorized request!"); // return error if not connected
  }
  let isAdmin = false;
  const timeDelay = 2500;
  const data = request.data;

  //console.log("edition id:", data.editionId);
  if (data.editionId === undefined || data.editionId == null) {
    return { message: "Erreur interne: Pas d'édition trouvée" };
  }

  const activeEdition = await getEditionBis(data.editionId);
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  if (Object.keys(activeEditionCercle).length === 0) {
    // No editions found
    return { message: "Erreur interne: Pas de cercles trouvés dans l'édition" };
  }

  // Check if the request is made by an isAdmin

  isAdmin = await getAdminUid(context_auth.uid);
  if (!activeEditionCercle[context_auth.uid] && !isAdmin) {
    throw new HttpsError("permission-denied", "Unauthorized request!"); // return error if not isAdmin or not a active cercle
  }

  // check clientTime

  if (data.clientTime === undefined) {
    return { message: "Erreur interne: Ne peut pas vérifier l'enchère" };
  }
  const clientTimestamp = Date.parse(data.clientTime);

  const start = activeEditionData.data()?.start;
  const stop = activeEditionData.data()?.stop;

  if (start && stop) {
    if (now < start || now > stop) {
      return {
        message:
          "Pas dans le temps impartie pour les enchères. Too soon or too late",
      };
    }
  } else {
    return { message: "Erreur interne: Pas de temps d'enchère trouvé" };
  }

  let senderId = context_auth.uid;

  // Check if the request contains the required data

  const enchereMin = activeEditionData.data()?.enchereMin;
  const enchereMax = activeEditionData.data()?.enchereMax;
  if (!enchereMin || !enchereMax) {
    return { message: "Erreur interne: pas de min max enchere" };
  }

  let nbFut = 0;
  if (isAdmin) {
    nbFut = Infinity;
  } else {
    nbFut = activeEditionCercle[senderId].nbFut;
  }
  if (!nbFut) {
    return { message: "Erreur: le nombre de fûts est invalide" };
  }

  // check vote number > 0, > votemin, < votemax, <= nbFut
  //console.log("data.vote: ", data.vote);
  if (
    data.vote === undefined ||
    data.vote < 0 ||
    data.vote == Infinity ||
    data.vote > enchereMax ||
    data.vote < enchereMin ||
    data.vote > nbFut
  ) {
    return { message: "Erreur: le nombre de fûts est invalide" };
  }
  // comitard id exist and not same cercle
  const cercleId = getCercleId(data.comitardId, activeEditionCercle);

  if (!cercleId) {
    return { message: "Erreur: l'id du comitard n'est pas valide" };
  } else {
    if (cercleId === senderId) {
      return { message: "Erreur: Vous ne pouvez pas voter pour vous même" };
    }
  }
  const enchereStart =
    activeEditionCercle[cercleId].comitards[data.comitardId].enchereStart;
  const enchereStop =
    activeEditionCercle[cercleId].comitards[data.comitardId].enchereStop;

  const duration = activeEditionData.data()?.duration;

  if (!duration) {
    return {
      message: "Erreur interne lors de l'ajout de l'enchère! No duration",
    };
  }

  if (!enchereStart || !enchereStop) {
    // start enchere
    // set start and end date for enchere
    // add enchere
    // increment jobs
    // decrement nbFut
    const secondsToAdd = duration * 60 * 60;
    const future = test.Timestamp.fromMillis(
      now.toMillis() + secondsToAdd * 1000
    );
    const s = `cercles.${cercleId}.comitards.${data.comitardId}`;
    const e = `cercles.${senderId}.nbFut`;
    const enchereId = uuidv4();
    const encherePath = `${s}.encheres.${enchereId}`;

    activeEdition
      .update({
        [encherePath]: {
          vote: data.vote,
          sender: senderId,
          date: now,
        },
        [`${s}.enchereStart`]: now,
        [`${s}.enchereStop`]: future,
        [`${s}.enchereProcessed`]: false,
        [e]: test.FieldValue.increment(-data.vote),
        jobs: test.FieldValue.increment(1),
      })
      .catch((error: any) => {
        console.log("Error adding new enchere:", error);
        return {
          message:
            "Erreur interne lors de l'ajout de l'enchère! Error starting enchère",
        };
      })
      .then(() => {
        return { message: "Nouvelle enchère ajoutée" };
      });
  } else {
    // need to check here if the vote is bigger than last bigest vote
    const encheres =
      activeEditionCercle[cercleId].comitards[data.comitardId].encheres;
    if (encheres) {
      const tmp = Object.values(encheres)
        .filter((enchere) => enchere !== null)
        .map((enchere) => (enchere as { vote: number }).vote);
      if (tmp.length > 0) {
        if (Math.max(Math.max(...tmp) + 1, enchereMin) > data.vote) {
          return {
            message: "L'enchère doit etre plus élevée que la dernière enchère",
          };
        }
      }
    } else {
      return {
        message:
          "Erreur interne lors de l'ajout de l'enchère! No enchère found",
      };
    }

    if (
      (now >= enchereStart && now <= enchereStop) ||
      (now.toMillis() <= enchereStop.toMillis() + timeDelay && clientTimestamp <= enchereStop.toMillis() && clientTimestamp >= enchereStop.toMillis() -timeDelay*2)
    ) {
      //console.log(
      //  "added new enchere to a comitard that has a enchere (might be a little laye but it's okay)"
      //);
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
          return {
            message:
              "Erreur interne lors de l'ajout de l'enchère! Error updating db",
          };
        })
        .then(() => {
          return { message: "Nouvelle enchère ajoutée" };
        });
    } else {
      //console.log("Error: not in timeframe");
      return { message: "Erreur: Pas dans le temps impartie" };
    }
  }
  return { message: "Nouvelle enchère ajoutée" };
});

//START DEBUG
exports.votebis = onCall(async (request) => {
  const now = test.Timestamp.now();
  const timeDelay = 2500;
  const context_auth = request.auth;
  const data = request.data;
  let isAdmin = false;
  console.log(
    "Time server: ",
    now.toDate().toISOString(),
    " Time client: ",
    data.clientTime
  );

  const serverTimestamp = now.toMillis();
  const clientTimestamp = Date.parse(data.clientTime);

  console.log(`Server timestamp: ${serverTimestamp}`);
  console.log(`Client timestamp: ${clientTimestamp}`);

  const timeDifference = serverTimestamp - clientTimestamp;

  console.log(`Time difference: ${timeDifference} milliseconds`);

  console.log("edition id:", data.editionId);
  if (data.editionId === undefined || data.editionId == null) {
    throw new HttpsError("invalid-argument", "Edition id is invalid");
  }

  const activeEdition = await getEditionBis(data.editionId);
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
  //console.log("before now:", admin.firestore.Timestamp);
  //console.log("before now:", test);
  //console.log("before now:", test.Timestamp);
  //const now = admin.firestore.Timestamp.fromDate(new Date());

  const start = activeEditionData.data()?.start;
  const stop = activeEditionData.data()?.stop;
  console.log("start: ", start);
  // compare start and clientTime
  console.log("start.toMillis(): ", start.toMillis());
  console.log("clientTimestamp: ", clientTimestamp);
  console.log(
    "start.toMillis() - clientTimestamp: ",
    start.toMillis() - clientTimestamp
  );
  //console.log("stop: ", stop);
  //console.log("now: ", now);
  //console.log("now < start: ", now < start);
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

  //GroscestlaPuissance

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
  console.log("data.vote: ", data.vote);
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
  const enchereStart =
    activeEditionCercle[cercleId].comitards[data.comitardId].enchereStart;
  const enchereStop =
    activeEditionCercle[cercleId].comitards[data.comitardId].enchereStop;

  const duration = activeEditionData.data()?.duration;

  if (!duration) {
    throw new HttpsError("unavailable", "No duration found!");
  }

  if (!enchereStart || !enchereStop) {
    return {
      message: "added new enchere to a comitard that has a no enchere",
    };
  } else {
    // need to check here if the vote is bigger than last bigest vote
    const encheres =
      activeEditionCercle[cercleId].comitards[data.comitardId].encheres;
    if (encheres) {
      const tmp = Object.values(encheres)
        .filter((enchere) => enchere !== null)
        .map((enchere) => (enchere as { vote: number }).vote);
      if (tmp.length > 0) {
        //console.log("data.vote: ", data.vote, "Math.max(...tmp)+1", Math.max(...tmp)+1, "enchereMin", enchereMin);
        //console.log("Math.max(Math.max(...tmp)+1, enchereMin) < data.vote",Math.max(Math.max(...tmp)+1, enchereMin) > data.vote);
        if (Math.max(Math.max(...tmp) + 1, enchereMin) > data.vote) {
          throw new HttpsError(
            "invalid-argument",
            "Vote number has to be bigger than the last bigest vote!"
          );
        }
      }
    } else {
      throw new HttpsError("unavailable", "No encheres found!");
    }
    if (now >= enchereStart && now <= enchereStop) {
      console.log("added new enchere to a comitard that has a enchere");
      return {
        message: "added new enchere to a comitard that has a enchere",
      };
    } else if (
      now <= enchereStop + timeDelay &&
      data.clientTime <= enchereStop
    ) {
      //techncally allow the user to cheat (just a bit), hard to implement a cheat in real life.
      console.log(
        "added new enchere to a comitard that has a enchere, but a little late"
      );
      return {
        message:
          "added new enchere to a comitard that has a enchere, but a little late",
      };
    } else {
      console.log("Error: not in timeframe");
      return { message: "Error: not in timeframe" };
    }
  }
});
//END DEBUG

async function remboursement() {
  // Consistent timestamp

  //const now = admin.firestore.Timestamp.now();
  console.log("running");

  const activeEdition = await getActiveEdition();
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  const job = activeEditionData.data()?.jobs;

  // check if there is a job to process
  if (job && job > 0) {
    const remboursementGagnant = activeEditionData.data()?.remboursementGagnant;
    const remboursementPerdant = activeEditionData.data()?.remboursementPerdant;
    const remboursementVendeur = activeEditionData.data()?.remboursementVendeur;
    if (
      remboursementGagnant === undefined ||
      remboursementPerdant === undefined ||
      remboursementVendeur === undefined
    ) {
      throw new HttpsError("unavailable", "No remboursement found!");
    }
    Object.keys(activeEditionCercle).forEach(function (cercleId) {
      const cercle = activeEditionCercle[cercleId];
      Object.keys(cercle.comitards).forEach(async function (comitardId) {
        const comitard = cercle.comitards[comitardId];
        // check if comitard has an enchere to process
        if (comitard.enchereProcessed === false) {
          console.log("comitard not processed: ", comitard.name);
          const now = test.Timestamp.now();
          const enchereStop = comitard.enchereStop;
          if (enchereStop < now) {
            // process enchere
            console.log(
              "processing comitard: ",
              comitard.name,
              "cercle id:",
              cercleId
            );
            const encheres = comitard.encheres;

            const encheresArray = Object.values(encheres);

            // Sorting the encheres by votes and then by date if votes are equal
            encheresArray.sort((a: any, b: any) => {
              // Compare by votes first
              if (a.vote !== b.vote) {
                return b.vote - a.vote; // Sort by descending vote count
              } else {
                // If votes are equal, compare by date
                return b.date.toMillis() - a.date.toMillis(); // Sort by descending date
              }
            });

            // Iterate over the sorted encheres array
            encheresArray.forEach(async (enchere: any, index) => {
              if (index === 0) {
                await rembourseUser(
                  activeEdition,
                  enchere.sender,
                  remboursementGagnant * enchere.vote
                );
                await rembourseUser(
                  activeEdition,
                  cercleId,
                  remboursementVendeur * enchere.vote
                );
              } else {
                await rembourseUser(
                  activeEdition,
                  enchere.sender,
                  remboursementPerdant * enchere.vote
                );
              }
              console.log("enchere sorted: ", enchere, "index: ", index);
            });

            // Set the comitard's enchereProcessed field to true
            const s = `cercles.${cercleId}.comitards.${comitardId}`;
            await activeEdition
              .update({
                [`${s}.enchereProcessed`]: true,
                jobs: test.FieldValue.increment(-1),
              })
              .catch((error: any) => {
                console.log("Error updating comitard:", error);
                throw new HttpsError("unavailable", "Error updating comitard!");
              })
              .then(() => {
                return { message: "Comitard updated in edition map" };
              });

            // Call the winner function with the winning enchere (first in potentialWinners after sorting)
            //winner(potentialWinners[0]);

            // Call the loser function with each losing enchere
            //loserEncheres.forEach(loser);
          } else {
            console.log("not time yet to process comitard: ", comitard.name);
          }
        } else {
          console.log(
            "comitard allready processed or has no encheres: ",
            comitard.name
          );
        }
      });
    });
  } else {
    console.log("no jobs to process");
  }
}

async function rembourseUser(edition: any, userId: string, amount: number) {
  //const d = `cercles.${cercleId}.comitards.${
  //  data.comitardId
  //}.encheres.${uuidv4()}`;
  const e = `cercles.${userId}.nbFut`;
  //console.log("fieldValue: ", test.FieldValue);
  //console.log("fieldValue: ", test.FieldValue.increment);
  //console.log("fieldValue: ", test.FieldValue.increment(4));

  edition
    .update({
      [e]: test.FieldValue.increment(Math.ceil(amount)),
      //     jobs: test.FieldValue.increment(1),
    })
    .catch((error: any) => {
      console.log("Error adding new enchere:", error);
      throw new HttpsError("unavailable", "Error remboursing user!");
    })
    .then(() => {
      return { message: "Success rembousring user" };
    });
}

exports.rembour = onCall(async (_request) => {
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

exports.editcomitard = onCall(async (request) => {
  //changed
  const context_auth = request.auth;
  const data = request.data;
  let admin = false;
  const txtlenght1 = 30;
  const txtlenght2 = 150;

  console.log("edition id:", data.editionId);
  if (data.editionId === undefined) {
    throw new HttpsError("invalid-argument", "Edition id is invalid");
  }

  const activeEdition = await getEdition(data.editionId);
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
  // check if user only update his comitard
  if (
    !activeEditionCercle[context_auth.uid]?.comitards[data.comitardId] &&
    !admin
  ) {
    console.log(
      "!activeEditionCercle[context_auth.uid]?.comitards[data.comitardId]: ",
      !activeEditionCercle[context_auth.uid]?.comitards[data.comitardId]
    );
    //console.log("activeEditionCercel ", activeEditionCercle);
    //console.log("context_auth.uid ", context_auth.uid);
    //console.log("data.comitardId ", data.comitardId);
    //console.log("activeEditionCercle[context_auth.uid]: ", activeEditionCercle[context_auth.uid]);
    // if comitard does not exist or user try to update not is comitard
    throw new HttpsError("permission-denied", "Unauthorized request!");
  }

  let cercle = context_auth.uid;

  if (admin) {
    cercle = data.cercleId;
    //console.log("waw c'est un admoin: ", data.cercleId)
  }

  // Check if the request contains the required data
  if (
    data.comitardId === undefined ||
    data.comitardId.lenght == 0 ||
    data.name?.length == 0 ||
    data.name?.length > txtlenght1 ||
    data.firstname?.length == 0 ||
    data.firstname?.length > txtlenght1 ||
    data.nickname?.length == 0 ||
    data.nickname?.length > txtlenght1 ||
    data.post?.length == 0 ||
    data.post?.length > txtlenght1 ||
    data.teneurTaule?.length < 0 ||
    data.teneurTaule?.length > 10 ||
    data.etatCivil?.length == 0 ||
    data.etatCivil?.length > txtlenght2 ||
    data.age?.length < 0 ||
    data.age?.length > 99 ||
    data.nbEtoiles?.length < 0 ||
    data.nbEtoiles?.length > 15 ||
    data.pointFort?.length == 0 ||
    data.pointFort?.length > txtlenght2 ||
    data.pointFaible?.length == 0 ||
    data.pointFaible?.length > txtlenght2 ||
    data.estLeSeul?.length == 0 ||
    data.estLeSeul?.length > txtlenght2 ||
    data.picture === undefined ||
    data.picture.length == 0
  ) {
    throw new HttpsError("invalid-argument", "Missing data!");
  }
  // May be usefull later
  //if (admin) {
  //  if (data.cercle === undefined || data.cercle.length == 0) {
  //    throw new HttpsError("invalid-argument", "Missing data!");
  //  } else {
  //    // Check if the cercle exists
  //    if (!activeEditionCercle[data.cercle]) {
  //      throw new HttpsError("invalid-argument", "Cercle does not exist!");
  //    } else {
  //      cercle = data.cercle;
  //    }
  //  }
  //}

  const s = `cercles.${cercle}.comitards.${data.comitardId}`;
  const updateData: any = {};

  if (data.name) {
    updateData[`${s}.name`] = data.name;
  }
  if (data.firstname) {
    updateData[`${s}.firstname`] = data.firstname;
  }
  if (data.nickname) {
    updateData[`${s}.nickname`] = data.nickname;
  }
  if (data.post) {
    updateData[`${s}.post`] = data.post;
  }
  if (data.teneurTaule) {
    updateData[`${s}.teneurTaule`] = data.teneurTaule;
  }
  if (data.etatCivil) {
    updateData[`${s}.etatCivil`] = data.etatCivil;
  }
  if (data.age) {
    updateData[`${s}.age`] = data.age;
  }
  if (data.nbEtoiles) {
    updateData[`${s}.nbEtoiles`] = data.nbEtoiles;
  }
  if (data.pointFort) {
    updateData[`${s}.pointFort`] = data.pointFort;
  }
  if (data.pointFaible) {
    updateData[`${s}.pointFaible`] = data.pointFaible;
  }
  if (data.estLeSeul) {
    updateData[`${s}.estLeSeul`] = data.estLeSeul;
  }
  if (data.picture) {
    updateData[`${s}.picture`] = data.picture;
  }

  activeEdition
    .update(updateData)
    .catch((error: any) => {
      console.log("Error updating comitard:", error);
      throw new HttpsError("unavailable", "Error updating comitard!");
    })
    .then(() => {
      return { message: "Comitard updated in edition map" };
    });
  return { message: "Comitard updated in edition map" };
});

exports.addcomitard = onCall(async (request) => {
  const context_auth = request.auth;
  const data = request.data;
  let admin = false;
  const txtlenght1 = 30;
  const txtlenght2 = 150;

  console.log("edition id:", data.editionId);
  if (data.editionId === undefined) {
    throw new HttpsError("invalid-argument", "Edition id is invalid");
  }

  const activeEdition = await getEdition(data.editionId);
  const activeEditionData = await activeEdition.get();
  const activeEditionCercle = activeEditionData.data()?.cercles || {};

  if (Object.keys(activeEditionCercle).length === 0) {
    // No editions found
    throw new HttpsError("unavailable", "No cercles found in edition!");
  }

  // Check if the request is made by an admin
  if (!context_auth) {
    throw new HttpsError(
      "permission-denied",
      "Unauthorized request, not connected!"
    ); // return error if not connected
  } else {
    admin = await getAdminUid(context_auth.uid);
    //admin = true; //DEBUG
    if (!activeEditionCercle[context_auth.uid] && !admin) {
      throw new HttpsError(
        "permission-denied",
        "Unauthorized request, Old account or not admin!"
      ); // return error if not admin or not a active cercle
    }
  }
  // add check that edition is not finished, admin can do whatever the fuck he wants

  const stop = activeEditionData.data()?.stop;
  const now = test.Timestamp.now();
  //console.log("Now: ", now)
  //console.log("stop: ", stop)
  //console.log("test now stop: ", (stop && now > stop))
  if ((stop && now > stop) && !admin) {
    throw new HttpsError("unavailable", "Edition is finished");
  }
  //admin = false //DEBUG

  let cercle = context_auth.uid;
  console.log("campus: ", data.campus)
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
    data.picture.length == 0 ||
    data.campus === undefined ||
    data.campus.length == 0 ||
    ![1, 2, 3, 4].includes(data.campus)
  ) {
    console.log("missing data");
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
        campus: data.campus,
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

  return newPassword;
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
    admin.auth().updateUser(uid, {
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
    admin.auth().updateUser(uid, {
      disabled: false,
    });
    return { message: "User disabled" };
  } catch (error: any) {
    throw new HttpsError(
      "internal",
      "Failed to disable user: " + error.message
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

  console.log("edition id:", data.editionId);
  if (data.editionId === undefined) {
    throw new HttpsError("invalid-argument", "Edition id is invalid");
  }

  const activeEdition = await getEdition(data.editionId);
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
            comitards: {},
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

async function getEditionBis(
  editionId: string
): Promise<FirebaseFirestore.DocumentReference> {
  const db = test.getFirestore();
  const test3 = db.collection("editions").doc(editionId);
  return test3;
}
