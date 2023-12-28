import React, { useContext, useEffect, useState } from "react";
import { db } from "../firebase_config";
import { collection, DocumentData, getDocs, limit, orderBy, query, where } from "@firebase/firestore";

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataContext = React.createContext<DocumentData | null>(null);

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<DocumentData | null>(null);

  useEffect(() => {
    const fetch = async () =>{
        const editionRef = collection(db, "editions")
        const queryDocs = query(editionRef, where("active", "==", true), orderBy("edition", "desc"), limit(1));
        const docs = await getDocs(queryDocs);
        console.log("docs: ", docs.docs);
        docs.forEach( (doc) => {
            setData(doc);
            console.log("Loaded edition: ", doc.data().edition);
        });
    }
    fetch();
    //const querySnapshot = await getDocs(collection(db, "edition"));
  }, []);

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
  //return children
};

export const useData = () => {
  return useContext(DataContext);
};
