import type { Timestamp } from "@firebase/firestore";

export interface Enchere {
  date: Timestamp;
  sender: string;
  vote: number;
}

export interface Comitard {
  firstname: string;
  name: string;
  nickname: string;
  nbEtoiles: number;
  age: number;
  enchereProcessed: boolean;
  enchereStart: Timestamp | undefined;
  enchereStop: Timestamp | undefined;
  estLeSeul: string;
  etatCivil: string;
  pointFaible: string;
  pointFort: string;
  post: string;
  teneurTaule: number;
  picture: string;
  cercle: string;
  encheres: Enchere[] | Record<string, Enchere>; // in DB it may be an object; we normalize in hook
}

export interface Cercle {
  name: string;
  description: string;
  nbFut: number;
  comitards: Comitard[]; // raw from DB
  admins?: string[];
}

export type NormalizedEnchere = {
  time: Date;
  votes: number;
  sender: string;
};

export type ComitardWithMeta = Omit<Comitard, "encheres" | "cercle"> & {
  cercle: string;
  encheres: Enchere[]; // normalized & sorted
};

export type ResultsSplit = {
  running: ComitardWithMeta[];
  closed: ComitardWithMeta[];
};