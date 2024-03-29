// Import the functions you need from the SDKs you need

import { initializeApp } from "@firebase/app";

import { getAnalytics } from "@firebase/analytics";

//import { getAnalytics } from "firebase/analytics";
import { connectFirestoreEmulator, getFirestore } from "@firebase/firestore";
import { connectAuthEmulator, getAuth } from "@firebase/auth";
import { connectStorageEmulator, getStorage } from "@firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "@firebase/functions";
//import { getFunctions } from "@firebase/functions";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: import.meta.env.VITE_apiKey,
  authDomain: import.meta.env.VITE_authDomain,
  projectId: import.meta.env.VITE_projectId,
  storageBucket: "mercatosgcl.appspot.com",
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
  measurementId: import.meta.env.VITE_measurementId,
};


firebaseConfig.storageBucket = firebaseConfig.storageBucket.replace(/"/g, '');

// Initialize Firebase

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app)

export const storage = getStorage(app);

export const functions = getFunctions(app);

export const analytics = getAnalytics(app);

const debug = false;

if (location.hostname === "localhost" && debug) {
  // Point to the Storage emulator running on localhost.
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
} 

