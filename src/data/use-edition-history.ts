import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, orderBy, query, startAfter, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../firebase_config";

export const EDITION_PAGE_SIZE = 10;

export function useEditionHistory() {
  const [rows, setRows] = useState<QueryDocumentSnapshot[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cursors = useRef<(QueryDocumentSnapshot | undefined)[]>([]);
  const request = useRef(0);
  const cancelPending = useCallback(() => { request.current++; }, []);

  const refresh = useCallback(async () => {
    const version = ++request.current;
    setLoading(true);
    setError("");
    try {
      const cursor = cursors.current[page];
      const snapshot = await getDocs(query(collection(db, "editions"), orderBy("edition", "desc"),
        ...(cursor ? [startAfter(cursor)] : []), limit(EDITION_PAGE_SIZE + 1)));
      if (version !== request.current) return;
      const visible = snapshot.docs.slice(0, EDITION_PAGE_SIZE);
      cursors.current = cursors.current.slice(0, page + 1);
      cursors.current[page + 1] = visible.at(-1);
      setRows(visible);
      setHasNext(snapshot.docs.length > EDITION_PAGE_SIZE);
    } catch (cause) {
      if (version === request.current) setError(cause instanceof Error ? cause.message : "Impossible de charger les éditions.");
    } finally {
      if (version === request.current) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void refresh();
    return cancelPending;
  }, [refresh, cancelPending]);

  return { rows, page, hasNext, loading, error, refresh,
    next: () => { if (!loading && hasNext) setPage(value => value + 1); },
    previous: () => { if (!loading) setPage(value => Math.max(0, value - 1)); },
  };
}
