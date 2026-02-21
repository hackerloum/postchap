"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  logOut as firebaseLogOut,
  resetPassword as firebaseResetPassword,
} from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => ReturnType<typeof firebaseSignIn>;
  signUp: (email: string, password: string) => ReturnType<typeof firebaseSignUp>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const sessionSynced = useRef(false);

  // Sync Firebase ID token to session cookie so /api/me works (avoids 401 on layout/page fetches)
  useEffect(() => {
    if (!user || sessionSynced.current) return;
    sessionSynced.current = true;
    user
      .getIdToken()
      .then((token) =>
        fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        })
      )
      .catch(() => {})
      .finally(() => {
        sessionSynced.current = false;
      });
  }, [user]);

  const signIn = useCallback(firebaseSignIn, []);
  const signUp = useCallback(firebaseSignUp, []);
  const logOut = useCallback(firebaseLogOut, []);
  const resetPassword = useCallback(firebaseResetPassword, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        logOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
