import React, { useContext, useEffect, useState } from "react";
import { db } from "../firebase_config";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "@firebase/firestore";
import { useAuth } from "../auth/AuthProvider";

interface DataProviderProps {
  children: React.ReactNode;
}

//export const DataContext = React.createContext<DocumentData | null>(null);
export const DataContext = React.createContext<DataContextValue | null>(null);

interface DataContextValue {
  data: DocumentData | null;
  refetchData: () => void;
  fetchedTime: number;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<DocumentData | null>(null);
  const [fetchedTime, setFetchedTime] = useState<number>(0);
  const { user } = useAuth();

  const fetchData = async () => {
    if (user) {
      // listnener on the doc to update the data
      const editionRef = collection(db, "editions");
      const queryDocs = query(
        editionRef,
        where("active", "==", true),
        orderBy("edition", "desc"),
        limit(1)
      );
      //ex
      const unsubscribe = onSnapshot(queryDocs, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const latestDoc = querySnapshot.docs[0];
          setFetchedTime(Date.now());
          setData(latestDoc);
          //console.log("Loaded edition number : ", latestDoc.data().edition);
        }
      });
      return () => unsubscribe();
      //ex
    } else {
      try {
        const editionRef = collection(db, "editions");
        const queryDocs = query(
          editionRef,
          where("active", "==", true),
          orderBy("edition", "desc"),
          limit(1)
        );

        const docs = await getDocs(queryDocs);

        if (!docs.empty) {
          const latestDoc = docs.docs[0];
          setFetchedTime(Date.now());
          setData(latestDoc);
          //console.log("Loaded edition number : ", latestDoc.data().edition);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  useEffect(() => {
    let unsubscribe: any;

    const initFetch = async () => {
      // Start fetching data and keep track of the unsubscribe function if it exists
      unsubscribe = await fetchData();
    };

    initFetch();

    // Cleanup function: will unsubscribe from the snapshot listener on unmount or when `user` changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]); // Re-run the effect if `user` changes

  const refetchData = () => {
    fetchData(); // Function to refetch data
  };

  return (
    <DataContext.Provider value={{ data, refetchData, fetchedTime }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  return useContext(DataContext) as DataContextValue;
};
