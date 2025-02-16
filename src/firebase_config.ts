// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

//import { getAnalytics } from "firebase/analytics";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
//import { getFunctions } from "@firebase/functions";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyCa5d5LxdDmTkmKzdrIgLDbBRDSmOti1a4",
  authDomain: "mercatosgcl.firebaseapp.com",
  projectId: "mercatosgcl",
  storageBucket: "mercatosgcl.appspot.com",
  messagingSenderId: "130093762104",
  appId: "1:130093762104:web:c63811ba64c2ed2ac448cd",
  measurementId: "G-9FXC2SMDQY",
};


//firebaseConfig.storageBucket = firebaseConfig.storageBucket.replace(/"/g, '');

// Initialize Firebase

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app); //ok

export const auth = getAuth(app) //ok

export const storage = getStorage(app); //ok

export const functions = getFunctions(app, "europe-west1"); //ok

export const analytics = getAnalytics(app);

const debug = true;

if (debug) {
  // Point to the Storage emulator running on localhost.
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
} 

