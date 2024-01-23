import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteField,
  writeBatch,
} from "@firebase/firestore";
import { db } from "../firebase_config";
import { Dayjs } from "dayjs";

type Dict = {
  [key: string]: any;
};

// for debug only
export function InitDB() {
  //add new doc into "editions"
  //doc content:
  //  edition num: int
  //  date_start: datetime
  //  date_stop: datetime
  //  description: str
  //  map with cercles
  //  map with comitards
  //
  //cercle map content:
  //  description: str
  //  name: str
  //  votes: int
  //
  //comitard map content:
  //  name: str
  //  surname: str
  //  descriptions: str
  //  cercle: str
  //  enchere: map
  //
  //enchere map content:
  //  amount: int
  //  date: datetime
  //  from: str
}

//EDITION

const editionsRef = collection(db, "editions");
const comitardCollection = collection(db, "comitards");

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
): Promise<Number> {
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


export async function editEdition(id: string, data: Dict) {
  const editionRef = doc(db, "editions", id);
  await updateDoc(editionRef, data);
}

//deleting edition is forbiden, can only be done from the web firebase console.

//COMITARD

// This function is used to add a new comitard to the database.
// It takes a string (id) and a dictionary (data) as parameters.
// The string represents the edition id and the dictionary contains the data of the comitard.
// The function first adds a new document to the 'comitards' collection with the provided data.
// Then it gets the ID of the newly created document.
// After that, it adds the comitard's ID to the 'comitards' map of the specified 'edition' document.
// The function does not return anything.
// TODO: photo upload
export async function newComitard(id: string, data: Dict) {
  // add new comitard doc into comitard collection
  const comitardRef = await addDoc(comitardCollection, data);

  // get back the id of the comitard doc
  const comitardId = comitardRef.id;

  // add the comitard into the comitard map into the id doc inside the editions collection
  const editionRef = doc(db, "editions", id);
  await updateDoc(editionRef, {
    [`comitards.${comitardId}`]: data,
  });

  // done
  console.log(`Comitard ${comitardId} added to edition ${id}`);
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

//CERCLE

// This function is used to add a new cercle to the database.
// It takes a string (id) and a dictionary (data) as parameters.
// The string represents the edition id and the dictionary contains the data of the cercle.
// The function first adds a new document to the 'cercles' collection with the provided data.
// Then it gets the ID of the newly created document.
// After that, it adds the cercle's ID to the 'cercles' map of the specified 'edition' document.
export async function addCercle(id: string, email: string, votes: number, description?: string ) {
  const cercleCollection = collection(db, 'cercles');

  // add new cercle doc into cercle collection
  let data = {votes: votes, description: description};
  const cercleRef = await addDoc(cercleCollection, data);

  // get back the id of the cercle doc
  const cercleId = cercleRef.id;

  // add the cercle into the cercle map into the num doc inside the editions collection
  const editionRef = doc(db, 'editions', id);
  await updateDoc(editionRef, {
    [`cercles.${cercleId}`]: data
  });

  // done
  console.log(`Cercle ${cercleId} added to edition ${id}, email: ${email}`);
}

// This function is used to remove a cercle from the database.
// It takes a number (num) and a string (cercleID) as parameters.
// The number represents the edition number and the string is the ID of the cercle to be removed.
// The function removes the cercle from the cercles map into the num doc.
// The function does not return anything.
// Dont want to implement this function for now
export function removeCercle(id: string, cercleID: string) {
  // remove the cercle from the map
  // remove all comitards from this cercle in the comitard map, not easy
  // remove all encheres from this cerlces in the comitard map, not easy  
  console.log(id, cercleID)
  
}

export function editCercle(id: string, data: Dict) {
  //easy
  //edit cercle info in the map
  console.log(id, data)
}
