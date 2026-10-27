import { connectStorageEmulator, getStorage } from "firebase/storage";
import { app, useEmulators } from "./firebase_config";

export const storage = getStorage(app);
if (useEmulators) connectStorageEmulator(storage, "127.0.0.1", Number(import.meta.env.VITE_STORAGE_EMULATOR_PORT || 9199));
