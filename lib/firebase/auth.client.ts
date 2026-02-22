import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { firebaseApp } from "./client";

/** Auth instance — only loads firebase/auth when this file is imported (e.g. by AuthProvider, not by landing-only chunks). */
export const auth: Auth | null =
  typeof window !== "undefined" && firebaseApp ? getAuth(firebaseApp) : (null as unknown as Auth);
