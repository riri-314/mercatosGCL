import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteField,
  writeBatch,
  query,
  where,
  DocumentData,
  increment,
  runTransaction,
} from "@firebase/firestore";
import { auth, db, functions } from "../firebase_config";
import { Dayjs } from "dayjs";
import { httpsCallable } from "@firebase/functions";
import { sendPasswordResetEmail } from "@firebase/auth";

type Dict = {
  [key: string]: any;
};

const editionsRef = collection(db, "editions");


export async function updateMDP(uid: string, newMDP: string): Promise<number> {
  const addMessage = httpsCallable(functions, "resetpassworduser");

  try {
    const result = await addMessage({ uid: uid, password: newMDP });
    console.log("Password updated successfully:", result);
    return 1;
  } catch (error) {
    console.log("Error while changing password:", error);
    return 0;
  } finally {
    console.log("updateMDP function finished");
  }
}

// This function is used to add a new edition to the database.
// It takes a string (description), two dates (start and end) and a number (votes) as parameters.
// The string represents the description of the edition, the first date is the start date and the second date is the end date.
// The number represents the number of votes per cercle.
// The function first gets the number of the last edition in the database.
// Then it creates a new document in the 'editions' collection with the provided data.
// The function does not return anything.
export async function newEdition(
  rules: String,
  start: Dayjs | null,
  end: Dayjs | null,
  votes: Number,
  enchere_duration: Number,
  comitard_per_cercle: Number,
  min_encheres: Number,
  max_encheres: Number,
  remboursementVendeur: Number,
  remboursementPerdant: Number,
  remboursementGagnant: Number
): Promise<number> {
  let newEdition = 0;
  let oldCercles: any = {};
  let errorCode = 0;
  let oldEditionId = "";

  // Retrieve all documents in the "editions" collection
  await getDocs(editionsRef)
    .then((snapshot) => {
      const batch = writeBatch(db);
      // Loop through each document in the collection and update the "active" field to false
      snapshot.forEach((Doc) => {
        const edition = Doc.data().edition;
        if (edition > newEdition) {
          oldEditionId = Doc.id;
          newEdition = edition;
          oldCercles = Doc.data().cercles;
          Object.keys(oldCercles).forEach(function (cercleId) {
            const cercle = oldCercles[cercleId];
            if (cercle.hasOwnProperty("comitards")) {
              oldCercles[cercleId].comitards = {};
              oldCercles[cercleId].nbFut = votes;
            }
          });
        }
        const docRef = doc(editionsRef, Doc.id);
        batch.update(docRef, { active: false });
      });

      const newEditionData = {
        rules: rules,
        edition: newEdition + 1,
        stop: end?.toDate(),
        start: start?.toDate(),
        nbFut: votes,
        cercles: oldCercles,
        duration: enchere_duration,
        nbComitard: comitard_per_cercle,
        enchereMin: min_encheres,
        enchereMax: max_encheres,
        active: true,
        remboursementVendeur: remboursementVendeur,
        remboursementPerdant: remboursementPerdant,
        remboursementGagnant: remboursementGagnant,
      };

      // Create a new document in the same collection
      const newDocRef = doc(editionsRef); // Auto-generated document ID
      batch.set(newDocRef, newEditionData); // Add new document data

      console.log("created new doc, calling reset password function");
      // reset all oldCercles passwords
      const addMessage = httpsCallable(functions, "resetpasswords");
      addMessage({ editionId: oldEditionId })
        .then((result) => {
          const data: any = result.data;
          //console.log("data:", data);
          const emailArray = data.emails;
          //console.log("emailArray:", emailArray);
          emailArray.forEach(async (email: string) => {
            console.log("sending reset password email:", email);
            await sendPasswordResetEmail(auth, email);
          });
        })
        .catch((error) => {
          console.log("error while reseting passwords:", error);
        });

      // Commit the batched write operation
      return batch.commit();
    })
    .then(() => {
      console.log(
        "All active fields set to false, and a new document added successfully."
      );
      errorCode = 1;
    })
    .catch((error) => {
      console.error(
        "Error updating active fields and adding a new document:",
        error
      );
    });

  return errorCode;
}

export async function editEdition(data: Dict) {
  //console.log("edit edition:",data)
  const editionsQuery = query(
    editionsRef,
    where("edition", "==", data.edition)
  );
  const editionsSnapshot = await getDocs(editionsQuery);

  if (!editionsSnapshot.empty) {
    const editionDoc = editionsSnapshot.docs[0];
    const editionRef = doc(db, "editions", editionDoc.id);
    await updateDoc(editionRef, data);
    return 1;
  } else {
    console.log(`No edition found with édition number ${data.edition}`);
    return 0;
  }
}

//deleting edition is forbiden, can only be done from the web firebase console.

export async function setActiveEdition(edition: number) {
  const editionsQuery = query(editionsRef);
  const editionsSnapshot = await getDocs(editionsQuery);

  let foundEdition = false;

  const batch = writeBatch(db);

  editionsSnapshot.forEach((doc) => {
    if (doc.data().edition === edition) {
      batch.update(doc.ref, { active: true });
      foundEdition = true;
    } else {
      batch.update(doc.ref, { active: false });
    }
  });

  if (!foundEdition) {
    console.log(`No edition found with edition number ${edition}`);
    return 0;
  }

  await batch.commit();
  return 1;
}

// This function is used to remove a comitard from the database.
// It takes a number (num) and a string (comitardID) as parameters.
// The number represents the edition number and the string is the ID of the comitard to be removed.
// The function removes the comitard from the comitards map into the num doc.
// The function does not return anything.
export async function removeComitard(id: string, comitardID: string) {
  // get the edition document reference
  const editionRef = doc(db, "editions", id);

  // remove comitard from the comitards map into the num doc
  await updateDoc(editionRef, {
    [`comitards.${comitardID}`]: deleteField(),
  });

  // done
  console.log(`Comitard ${comitardID} removed from edition ${id}`);
}

// This function is used to edit a comitard in the database.
// It takes a number (num), a string (comitardID) and a dictionary (data) as parameters.
// The number represents the edition number, the string is the ID of the comitard to be edited and the dictionary contains the new data.
// The function updates the comitard in the comitards map into the num doc.
// The function does not return anything.
export async function editComitard(id: string, comitardID: string, data: Dict) {
  //easy
  //edit comitard info in the map
  const editionRef = doc(db, "editions", id);
  await updateDoc(editionRef, { [`comitards.${comitardID}`]: data });
}

function getEnchre(data: DocumentData, enchereID: string) {
  const activeEditionCercle = data.data().cercles;

  let enchereFound: any = null;
  let comitardIdFound: string | null = null;
  let cercleIdFound: string | null = null;
  let senderId: string | null = null;

  for (const cercleId of Object.keys(activeEditionCercle)) {
    const cercle = activeEditionCercle[cercleId];
    const comitards = cercle.comitards || {};
    for (const comitardId of Object.keys(comitards)) {
      const comitard = comitards[comitardId];
      const encheres = comitard.encheres || {};
      for (const eId of Object.keys(encheres)) {
        if (eId === enchereID) {
          enchereFound = encheres[eId];
          comitardIdFound = comitardId;
          cercleIdFound = cercleId;
          senderId = encheres[eId]?.sender ?? null;
          return { enchereFound, comitardIdFound, cercleIdFound, senderId };
        }
      }
    }
  }

  return { enchereFound, comitardIdFound, cercleIdFound, senderId };
}

export async function editEnchereAmount(
  amountReemboursement: number,
  data: DocumentData,
  enchereID: string,
  amount: number
) {
  const editionId = data.id;
  const { enchereFound, comitardIdFound, cercleIdFound, senderId } = getEnchre(
    data,
    enchereID
  );

  if (enchereFound === null) {
    console.log("Error enchere not found");
    return -1;
  } else {
    console.log("enchereFound: ", enchereFound);
    // only update enchere amount
    const s = `cercles.${cercleIdFound}.comitards.${comitardIdFound}.encheres.${enchereID}.vote`;
    // update the document
    const docRef = doc(db, "editions", editionId);
    await updateDoc(docRef, {
      [s]: amount,
    });

    // increment fut amount of the enchere sender by amountReemboursement
    console.log("Reimbursing cercle ", senderId, " by ", amountReemboursement);
    const t = `cercles.${senderId}.nbFut`;
    await updateDoc(docRef, {
      [t]: increment(amountReemboursement),
    });
    return 0;
  }
}

export type DeleteEnchereStatus =
  | "ok"
  | "stale_client" // old vs current data mismatch
  | "concurrent_write" // document changed during transaction / commit
  | "error"; // any other error

export interface DeleteEnchereResult {
  status: DeleteEnchereStatus;
  message?: string;
}

export async function deleteEnchereWithStates(
  originalSnap: DocumentData, // snapshot from your UI
  enchereID: string,
  rembourse: boolean
): Promise<DeleteEnchereResult> {
  const editionId = originalSnap.id;
  const editionRef = doc(db, "editions", editionId);
  const originalData = originalSnap.data();

  if (!originalData) {
    return {
      status: "error",
      message: "Original document data is missing.",
    };
  }

  try {
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(editionRef);
      if (!snap.exists()) {
        return {
          status: "error",
          message: "L'édition n'existe plus.",
        } as DeleteEnchereResult;
      }

      const currentData = snap.data() as DocumentData;

      // 1) ERROR: old and new data are not the same
      if (JSON.stringify(currentData) !== JSON.stringify(originalData)) {
        return {
          status: "stale_client",
          message:
            "Les données ont été modifiées depuis l’ouverture de la page. Recharge la page pour voir la version à jour.",
        } as DeleteEnchereResult;
      }

      // Recompute everything based on the transaction snapshot
      const { enchereFound, comitardIdFound, cercleIdFound, senderId } =
        getEnchre(snap, enchereID);

      if (
        enchereFound === null ||
        comitardIdFound === null ||
        cercleIdFound === null ||
        senderId === null
      ) {
        return {
          status: "error",
          message:
            "Impossible de trouver cette enchère. Elle a peut-être déjà été supprimée.",
        } as DeleteEnchereResult;
      }

      const updates: Record<string, any> = {};

      const comitardEncheres =
        currentData.cercles[cercleIdFound].comitards[comitardIdFound].encheres;

      const basePath = `cercles.${cercleIdFound}.comitards.${comitardIdFound}`;

      // If this is the only enchère for this comitard, delete other fields
      if (Object.keys(comitardEncheres).length === 1) {
        updates[`${basePath}.enchereProcessed`] = deleteField();
        updates[`${basePath}.enchereStart`] = deleteField();
        updates[`${basePath}.enchereStop`] = deleteField();
        updates[`${basePath}.encheres`] = deleteField();
      } else {
        updates[`${basePath}.encheres.${enchereID}`] = deleteField();
      }

      // Remboursement
      if (rembourse) {
        const futPath = `cercles.${senderId}.nbFut`;
        updates[futPath] = increment(enchereFound.vote);
      }

      // All writes atomically in the transaction
      tx.update(editionRef, updates);

      return {
        status: "ok",
        message: "Enchère supprimée avec succès.",
      } as DeleteEnchereResult;
    });

    // If the transaction callback returned a DeleteEnchereResult, we just pass it through
    return result;
  } catch (e: any) {
    // 2) ERROR: document changed in between (transaction conflicted)
    // Firestore uses "aborted" / "failed-precondition" for concurrent updates
    if (e?.code === "aborted" || e?.code === "failed-precondition") {
      return {
        status: "concurrent_write",
        message:
          "Les données ont été modifiées en même temps par quelqu'un d'autre. Réessaie l'action.",
      };
    }

    // 3) Any other error
    console.error("deleteEnchereWithStates error:", e);
    return {
      status: "error",
      message: "Erreur inattendue lors de la suppression de l'enchère.",
    };
  }
}
