import { onAuthStateChanged, User } from "@firebase/auth";
import React, { useContext, useEffect, useState } from "react";
import { auth } from "../firebase_config";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthContext = React.createContext<User | null>(null);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  //const [isLoading, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      console.log("Firebase user: ", firebaseUser?.email);
      console.log("Firebase user full: ", firebaseUser?.uid);
    });
    return () => {
      unsubscribe();
    };
  }, [auth]);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
  //return children
};

export const useAuth = () => {
  return useContext(AuthContext);
};
