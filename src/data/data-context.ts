import { createContext, useContext } from "react";
import type { DocumentData } from "firebase/firestore";

interface DataContextValue {
  data: DocumentData | null;
  refetchData: () => void;
  fetchedTime: number;
}

export const DataContext = createContext<DataContextValue | null>(null);

export const useData = () => useContext(DataContext) as DataContextValue;
