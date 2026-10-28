import type { DocumentData } from "firebase/firestore";

const decoded = new WeakMap<object, DocumentData | undefined>();

/** Snapshots are immutable; share their decoded data without retaining old snapshots. */
export function getEditionData(snapshot: DocumentData | null | undefined): DocumentData | undefined {
  if (!snapshot) return undefined;
  if (!decoded.has(snapshot)) decoded.set(snapshot, snapshot.data());
  return decoded.get(snapshot);
}
