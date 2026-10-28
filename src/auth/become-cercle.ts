import { signInWithCustomToken } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth } from "../firebase_config";
import { functions } from "../firebase_functions";
import { requireMutationSuccess } from "../utils/callable-result";

export async function becomeCercle(uid: string, editionId: string): Promise<void> {
  const adminUid = auth.currentUser?.uid;
  if (!adminUid) throw new Error("Connectez-vous avec votre compte administrateur.");
  const result = await httpsCallable<
    { uid: string; editionId: string },
    { success?: boolean; token?: string }
  >(functions, "becomecercle")({ uid, editionId });
  if (auth.currentUser?.uid !== adminUid) {
    throw new Error("Votre session a changé. Reconnectez-vous avant de réessayer.");
  }
  requireMutationSuccess(result.data);
  if (typeof result.data.token !== "string" || !result.data.token.trim()) {
    throw new Error("La connexion au cercle n’a pas pu être préparée. Réessayez.");
  }
  // Use the same Auth instance: this replaces the admin login and its persisted
  // browser session. No admin credentials are retained for switching back.
  await signInWithCustomToken(auth, result.data.token);
}
