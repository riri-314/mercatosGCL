import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: () => boolean;
  cercleSession?: { name: string } | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => useContext(AuthContext) as AuthContextValue;
