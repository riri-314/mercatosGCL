import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteField,
  writeBatch,
  query,
  where,
} from "@firebase/firestore";
import { db } from "../firebase_config";
import { Dayjs } from "dayjs";

type Dict = {
  [key: string]: any;
};

const editionsRef = collection(db, "editions");

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
  remboursementGagnant: Number,
): Promise<number> {
  let newEdition = 0;
  let oldCercles: any = {};
  let errorCode = 0
  
  // Retrieve all documents in the "editions" collection
  await getDocs(editionsRef)
    .then(snapshot => {
      const batch = writeBatch(db);
      // Loop through each document in the collection and update the "active" field to false
      snapshot.forEach(Doc => {
        const edition = Doc.data().edition;
        if (edition > newEdition) {
          newEdition = edition;
          oldCercles = Doc.data().cercles;
          Object.keys(oldCercles).forEach(function (cercleId) {
            const cercle = oldCercles[cercleId];
            if (cercle.hasOwnProperty("comitards")) {
              oldCercles[cercleId].comitards = {};
            }
          });
        }
        const docRef = doc(editionsRef, Doc.id);
        batch.update(docRef, { active: false });
      });

      const newEditionData = {
        rules : rules,
        edition : newEdition + 1,
        stop : end?.toDate(),
        start : start?.toDate(),
        nbFut : votes,
        cercles : oldCercles,
        duration : enchere_duration,
        nbComitard : comitard_per_cercle,
        enchereMin : min_encheres,
        enchereMax : max_encheres,
        active : true,
        remboursementVendeur: remboursementVendeur,
        remboursementPerdant: remboursementPerdant,
        remboursementGagnant: remboursementGagnant,
      };
    
      // Create a new document in the same collection
      const newDocRef = doc(editionsRef) // Auto-generated document ID
      batch.set(newDocRef, newEditionData); // Add new document data
  
      // Commit the batched write operation
      return batch.commit();
    })
    .then(() => {
      console.log('All active fields set to false, and a new document added successfully.');
      errorCode = 1;
    })
    .catch(error => {
      console.error('Error updating active fields and adding a new document:', error);
    });

    return errorCode;
}


export async function editEdition(data: Dict) {
  //console.log("edit edition:",data)
  const editionsQuery = query(editionsRef, where("edition", "==", data.edition));
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
  await updateDoc(editionRef, {[`comitards.${comitardID}`]: data});
}



