import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "art-master-platform-c6e29.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

/** Only initialize in browser to avoid mobile/SSR issues. */
function getAppSafe(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client must only be used in the browser.");
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/** Single app instance. Do NOT export auth/db/storage here — use thin getter files so SDK is code-split per route. */
export const firebaseApp: FirebaseApp | null =
  typeof window !== "undefined" ? getAppSafe() : null;

export default firebaseApp;
