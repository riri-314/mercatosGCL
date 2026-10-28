import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebase_config";
import { collection, getDocs, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useAuth } from "../auth/auth-context";

import { DataContext } from "./data-context";
import type { DocumentData } from "firebase/firestore";

function activeEditionQuery() {
  return query(collection(db, "editions"), where("active", "==", true), orderBy("edition", "desc"), limit(1));
}

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<DocumentData | null>(null);
  const [fetchedTime, setFetchedTime] = useState(0);
  const { user } = useAuth();
  const request = useRef(0);
  const cancelPending = useCallback(() => { request.current++; }, []);

  const fetchVisitorData = useCallback(async () => {
    const version = ++request.current;
    try {
      const snapshot = await getDocs(activeEditionQuery());
      if (version !== request.current) return;
      setData(snapshot.docs[0] ?? null);
      if (!snapshot.empty) setFetchedTime(Date.now());
    } catch (error) {
      if (version === request.current) console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(activeEditionQuery(), snapshot => {
        setData(snapshot.docs[0] ?? null);
        if (!snapshot.empty) setFetchedTime(Date.now());
      });
      return () => { unsubscribe(); cancelPending(); };
    }
    void fetchVisitorData();
    return cancelPending;
  }, [user, fetchVisitorData, cancelPending]);

  const refetchData = useCallback(() => {
    if (!user) void fetchVisitorData();
  }, [user, fetchVisitorData]);
  const value = useMemo(() => ({ data, refetchData, fetchedTime }), [data, refetchData, fetchedTime]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
