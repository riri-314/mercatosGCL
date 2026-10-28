import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

export const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";
const emulatorProject = import.meta.env.VITE_EMULATOR_PROJECT_ID || "demo-mercatos-local";
if (useEmulators && !emulatorProject.startsWith("demo-")) {
  throw new Error("The emulator frontend requires a demo- project ID");
}
const productionConfig = {
  apiKey: "AIzaSyCa5d5LxdDmTkmKzdrIgLDbBRDSmOti1a4",
  authDomain: "mercatosgcl.firebaseapp.com",
  projectId: "mercatosgcl",
  storageBucket: "mercatosgcl.appspot.com",
  messagingSenderId: "130093762104",
  appId: "1:130093762104:web:c63811ba64c2ed2ac448cd",
  measurementId: "G-9FXC2SMDQY",
};
export const app = initializeApp(useEmulators ? {
  ...productionConfig, apiKey: "demo-key", projectId: emulatorProject,
  authDomain: `${emulatorProject}.firebaseapp.com`, storageBucket: `${emulatorProject}.appspot.com`,
} : productionConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
if (useEmulators) {
  connectAuthEmulator(auth, `http://127.0.0.1:${import.meta.env.VITE_AUTH_EMULATOR_PORT || 9099}`);
  connectFirestoreEmulator(db, "127.0.0.1", Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080));
}

// Analytics is opt-in and starts during idle time. Storage and Functions are
// initialized by their own modules when a route actually needs them.
if (!useEmulators && import.meta.env.VITE_ENABLE_ANALYTICS === "true") {
  const initializeAnalytics = () => {
    void import("firebase/analytics").then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) getAnalytics(app);
    }).catch(() => { /* Analytics must not affect application startup. */ });
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(initializeAnalytics, { timeout: 10000 });
  else setTimeout(initializeAnalytics, 5000);
}
