import React, { useContext, useEffect, useState } from "react";
import { db } from "../firebase_config";
import {
  collection,
  DocumentData,
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
}
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<DocumentData | null>(null);

  const fetchData = async () => {
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
        setData(latestDoc);
        console.log("Loaded edition: ", latestDoc.data().edition);
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
    <DataContext.Provider value={{ data, refetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  return useContext(DataContext);
};
