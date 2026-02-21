import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./client";

const USERS = "users";

export type Plan = "free" | "pro" | "enterprise";

/**
 * Creates or updates the Firestore user profile at users/{uid}.
 * Call after signup (email) or after first Google sign-in so dashboard/APIs have a user doc.
 */
export async function ensureUserDoc(
  uid: string,
  data: { email: string; displayName: string }
): Promise<void> {
  const ref = doc(db, USERS, uid);
  await setDoc(
    ref,
    {
      ...data,
      plan: "free" as Plan,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}
