import { onIdTokenChanged, signOut, type User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { collection, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase_config";

import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminMap, setAdminMap] = useState<string[]>([]);
  const [cercleSession, setCercleSession] = useState<{ name: string } | null>(null);

  useEffect(() => {
    let active = true;
    let version = 0;
    let currentUid: string | null | undefined;

    void getDoc(doc(collection(db, "admin"), "admin")).then((snapshot) => {
      if (active) setAdminMap(Object.values(snapshot.data()?.admins ?? {}));
    }).catch(() => {
      if (active) setAdminMap([]);
    });

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      const request = ++version;
      const uid = firebaseUser?.uid ?? null;
      if (uid !== currentUid) setLoading(true);
      currentUid = uid;
      try {
        const token = firebaseUser ? await firebaseUser.getIdTokenResult() : null;
        if (!active || request !== version) return;
        const name = token?.claims.cercleSessionName;
        setCercleSession(token?.claims.cercleSession === true ? {
          name: typeof name === "string" && name ? name : firebaseUser?.displayName || firebaseUser?.email || "Cercle",
        } : null);
        setUser(firebaseUser);
      } catch {
        if (!active || request !== version) return;
        // Do not render an authenticated session whose warning state could not
        // be verified. A later sign-in will load a fresh token.
        setUser(null);
        setCercleSession(null);
        await signOut(auth).catch(() => undefined);
      } finally {
        if (active && request === version) setLoading(false);
      }
    });
    return () => {
      active = false;
      version++;
      unsubscribe();
    };
  }, []);

  const isAdmin = () => !cercleSession && !!user && adminMap.includes(user.uid);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, cercleSession }}>
      {children}
    </AuthContext.Provider>
  );
}
