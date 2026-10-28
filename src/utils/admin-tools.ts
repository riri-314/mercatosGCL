import { getEditionData } from "../data/edition-data";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteField,
  query,
  where,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase_config";
import { functions } from "../firebase_functions";
import { Dayjs } from "dayjs";
import { httpsCallable } from "firebase/functions";
import { requireMutationSuccess } from "./callable-result";

type Dict = DocumentData;

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

const pendingEditionOperations = new Map<string, { id: string; signature: string }>();

async function editionOperation(name: string, payload: Record<string, unknown>) {
  const key = `mercatos:${name}`;
  const signature = JSON.stringify(payload);
  let saved = pendingEditionOperations.get(name);
  try { saved = saved ?? JSON.parse(localStorage.getItem(key) || "null") ?? undefined; } catch { /* Storage may be unavailable. */ }
  const operationId = saved?.signature === signature ? saved.id : crypto.randomUUID();
  pendingEditionOperations.set(name, { id: operationId, signature });
  try { localStorage.setItem(key, JSON.stringify({ id: operationId, signature })); } catch { /* Server state remains durable. */ }
  const result = await httpsCallable(functions, name)({ ...payload, operationId });
  const response = result.data as { success?: boolean; state?: string };
  if (response.state === "pending") {
    throw new Error("L'opération est en attente de reprise automatique. Consultez son état dans le compte administrateur.");
  }
  requireMutationSuccess(response);
  if (pendingEditionOperations.get(name)?.id === operationId) pendingEditionOperations.delete(name);
  try {
    if (JSON.parse(localStorage.getItem(key) || "null")?.id === operationId) localStorage.removeItem(key);
  } catch { /* No persisted client state. */ }
  return 1;
}

export async function newEdition(
  rules: string,
  start: Dayjs | null,
  end: Dayjs | null,
  votes: number,
  enchere_duration: number,
  comitard_per_cercle: number,
  min_encheres: number,
  max_encheres: number,
  remboursementVendeur: number,
  remboursementPerdant: number,
  remboursementGagnant: number
): Promise<number> {
  return editionOperation("createedition", {
    rules, startMs: start?.valueOf(), stopMs: end?.valueOf(), nbFut: votes,
    duration: enchere_duration, nbComitard: comitard_per_cercle,
    enchereMin: min_encheres, enchereMax: max_encheres,
    remboursementVendeur, remboursementPerdant, remboursementGagnant,
  });
}

export async function resetEditionPasswords(editionId: string) {
  return editionOperation("resetpasswords", { editionId });
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

// One-time migration: revoke the public picture URLs of every past (inactive)
// edition. Safe to run multiple times (locking is idempotent server-side).
export async function lockAllPastEditions(): Promise<number> {
  try {
    const fn = httpsCallable(functions, "lockallpasteditions");
    const res = await fn({});
    console.log("Locked past editions:", res.data);
    return 1;
  } catch (e) {
    console.log("Error locking past editions:", e);
    return 0;
  }
}

//deleting edition is forbiden, can only be done from the web firebase console.

export async function setActiveEdition(edition: number) {
  return editionOperation("activateedition", { edition });
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
  const activeEditionCercle = getEditionData(data)?.cercles ?? {};

  let enchereFound: DocumentData | null = null;
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
  refund: boolean,
  data: DocumentData,
  enchereID: string,
  amount: number
) {
  const { enchereFound } = getEnchre(data, enchereID);
  if (!enchereFound) return -1;
  const result = await httpsCallable(functions, "editbid")({
    editionId: data.id, bidId: enchereID, expectedAmount: enchereFound.vote, amount, refund,
  });
  requireMutationSuccess(result.data);
  return 0;
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
  if (!getEditionData(originalSnap)) return { status: "error", message: "Original document data is missing." };
  const { enchereFound } = getEnchre(originalSnap, enchereID);
  if (!enchereFound) return { status: "error", message: "Impossible de trouver cette enchère." };
  try {
    const result = await httpsCallable(functions, "deletebid")({
      editionId: originalSnap.id, bidId: enchereID, expectedAmount: enchereFound.vote, refund: rembourse,
    });
    requireMutationSuccess(result.data);
    return { status: "ok", message: "Enchère supprimée avec succès." };
  } catch (error: unknown) {
    const code = (error as { code?: string }).code?.replace("functions/", "");
    return {
      status: code === "aborted" ? "stale_client" : "error",
      message: error instanceof Error ? error.message : "Erreur lors de la suppression de l'enchère.",
    };
  }
}
