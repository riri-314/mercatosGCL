import { getStorage } from "firebase-admin/storage";

/**
 * Revoke the public download tokens of every file under an edition prefix.
 * The current token is stashed in `lockedToken` custom metadata so the exact
 * same public URL can be restored later (see unlockEditionFiles). Idempotent:
 * files already locked (no live token) are skipped so the stash is never lost.
 * @param {string} editionId - Firestore doc id used as the storage prefix.
 * @returns {Promise<number>} - Number of files locked.
 */
export async function lockEditionFiles(editionId: string): Promise<number> {
  const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_EMULATOR_HOST
    ? `${process.env.GCLOUD_PROJECT}.appspot.com` : undefined);
  const [files] = await bucket.getFiles({ prefix: `${editionId}/` });
  let locked = 0;
  for (const file of files) {
    const [meta] = await file.getMetadata();
    const custom = (meta.metadata || {}) as Record<string, any>;
    const current = custom.firebaseStorageDownloadTokens;
    if (current) {
      await file.setMetadata({
        metadata: { firebaseStorageDownloadTokens: null, lockedToken: current },
      });
      const [verified] = await file.getMetadata();
      const remaining = String(verified.metadata?.firebaseStorageDownloadTokens || "").split(",");
      if (String(current).split(",").some(token => remaining.includes(token))) {
        throw new Error("Public picture token revocation was not confirmed");
      }
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
export async function unlockEditionFiles(editionId: string): Promise<number> {
  const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_EMULATOR_HOST
    ? `${process.env.GCLOUD_PROJECT}.appspot.com` : undefined);
  const [files] = await bucket.getFiles({ prefix: `${editionId}/` });
  let unlocked = 0;
  for (const file of files) {
    const [meta] = await file.getMetadata();
    const custom = (meta.metadata || {}) as Record<string, any>;
    const saved = custom.lockedToken;
    if (saved) {
      await file.setMetadata({
        metadata: { firebaseStorageDownloadTokens: saved },
      });
      const [verified] = await file.getMetadata();
      const restored = String(verified.metadata?.firebaseStorageDownloadTokens || "").split(",");
      if (String(saved).split(",").some(token => !restored.includes(token))) {
        throw new Error("Public picture token restoration was not confirmed");
      }
      await file.setMetadata({ metadata: { lockedToken: null } });
      unlocked++;
    }
  }
  return unlocked;
}

