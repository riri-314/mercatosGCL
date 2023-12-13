import React, { useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "@firebase/auth";
import { auth } from "src/firebase_config";
export const AuthContext = React.createContext(null);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  //const [isLoading, setIsInitializing] = useState(true);

  useEffect(() => {
    //console.log("useeffect in use")
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      //setIsInitializing(false);
      console.log("Firebase user: ", firebaseUser?.email);
      console.log("Firebase user full: ", firebaseUser?.uid);
      //if (firebaseUser != null){
      //  console.log("Not loading")
      //}
    });

    return () => {
      unsubscribe();
    };
  }, [auth]);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
