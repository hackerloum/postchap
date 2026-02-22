import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { firebaseApp } from "./client";

/** Firestore instance — only loaded when a component imports this file (e.g. dashboard, onboarding). */
const db: Firestore | null =
  typeof window !== "undefined" && firebaseApp ? getFirestore(firebaseApp) : (null as unknown as Firestore);

export { db };

export function getDb(): Firestore {
  if (!db) throw new Error("Firestore not available");
  return db;
}
