import {onAuthStateChanged, User} from "@firebase/auth";
import React, {useContext, useEffect, useState} from "react";
import {auth, db} from "../firebase_config";
import {collection, doc, getDoc} from '@firebase/firestore';

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthContext = React.createContext<AuthContextValue | null>(null);

interface AuthContextValue {
    user: User | null;
    isAdmin: () => boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
    const [user, setUser] = useState<User | null>(null);
    const [adminMap, setAdminMap] = useState<string[]>([]);

    useEffect(() => {

        const fetchAdminMap = async () => {
            // console.log("FETCH ADMIN FROM DB")
            const adminDocRef = doc(collection(db, 'admin'), 'admin');
            const adminDocSnap = await getDoc(adminDocRef);
            if (adminDocSnap.exists()) {
                const admins = adminDocSnap.data()?.admins;
                if (admins) {
                    const adminMap: string[] = Object.values(admins);
                    setAdminMap(adminMap);
                }
            }
        };

        fetchAdminMap();

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            //console.log("Firebase user: ", firebaseUser?.email);
            //console.log("Firebase user full: ", firebaseUser?.uid);
        });
        return () => {
            unsubscribe();
        };
    }, [auth]);

    const isAdmin = (): boolean => {
        // console.log("IS ADMIN?")
        return adminMap.includes(user?.uid as string);
    }

    return <AuthContext.Provider value={{user, isAdmin}}>{children}</AuthContext.Provider>;
    //return children
};

export const useAuth = () => {
    return useContext(AuthContext) as AuthContextValue;
};
