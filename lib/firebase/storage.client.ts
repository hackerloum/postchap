import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";
import { firebaseApp } from "./client";

/** Storage instance — only loaded when a component imports this file (e.g. onboarding upload). */
const storage: FirebaseStorage | null =
  typeof window !== "undefined" && firebaseApp ? getStorage(firebaseApp) : (null as unknown as FirebaseStorage);

export { storage };

export function getClientStorage(): FirebaseStorage {
  if (!storage) throw new Error("Storage not available");
  return storage;
}
