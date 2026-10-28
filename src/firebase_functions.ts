import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { app, useEmulators } from "./firebase_config";

export const functions = getFunctions(app, "europe-west1");
if (useEmulators) connectFunctionsEmulator(functions, "127.0.0.1", Number(import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT || 5001));
