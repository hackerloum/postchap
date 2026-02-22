import { getDatabase } from "firebase/database";
import type { Database } from "firebase/database";
import { firebaseApp } from "./client";

/** Realtime Database — only loaded when a component imports this file (e.g. generating screen). */
export const rtdb: Database | null =
  typeof window !== "undefined" && firebaseApp ? getDatabase(firebaseApp) : (null as unknown as Database);
