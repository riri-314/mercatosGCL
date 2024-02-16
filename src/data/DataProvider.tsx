import React, { useContext, useEffect, useState } from "react";
import { db } from "../firebase_config";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "@firebase/firestore";

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

  const fetchData = async () => {
    const debug = false; //debug feature to always fetch the same doc. To remove when on production
    try {
      if (!debug) {
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
          console.log("Loaded edition number: ", latestDoc.data().edition);
        }
      } else {
        const docRef = doc(db, "editions", "rHiqrhsVIKrvsWCv0onw");
        const docs = await getDoc(docRef);
        if (docs.exists()) {
          setFetchedTime(Date.now());
          setData(docs);
          console.log("Loaded edition number : ", docs.data().edition);
          console.log("Loaded edition: ", docs.data());
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Initial data fetch
  }, []);

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
