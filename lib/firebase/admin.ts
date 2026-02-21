import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { getDatabase } from "firebase-admin/database";

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error(
      "FIREBASE_ADMIN_PRIVATE_KEY is not set in environment variables"
    );
  }

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error(
      "FIREBASE_ADMIN_PROJECT_ID is not set in environment variables"
    );
  }

  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    throw new Error(
      "FIREBASE_ADMIN_CLIENT_EMAIL is not set in environment variables"
    );
  }

  // Replace escaped newlines with real newlines (fixes common private key bug)
  const formattedKey = privateKey.includes("\\n")
    ? privateKey.replace(/\\n/g, "\n")
    : privateKey;

  if (process.env.NODE_ENV === "development") {
    console.log("[Firebase Admin] Initializing with project:", process.env.FIREBASE_ADMIN_PROJECT_ID);
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: formattedKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    ...(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL && {
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    }),
  });
}

const adminApp = getAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminRtdb = getDatabase(adminApp);
export default adminApp;
