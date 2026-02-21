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

let _app: App | null = null;
function getApp(): App {
  if (!_app) _app = getAdminApp();
  return _app;
}

// Lazy init so build can complete without env vars; init runs on first API use.
const empty = {};
export const adminDb = new Proxy(empty, {
  get(_, prop) {
    return (getFirestore(getApp()) as unknown as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof getFirestore>;
export const adminAuth = new Proxy(empty, {
  get(_, prop) {
    return (getAuth(getApp()) as unknown as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof getAuth>;
export const adminStorage = new Proxy(empty, {
  get(_, prop) {
    return (getStorage(getApp()) as unknown as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof getStorage>;
export const adminRtdb = new Proxy(empty, {
  get(_, prop) {
    return (getDatabase(getApp()) as unknown as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof getDatabase>;
const adminAppProxy = new Proxy(empty, {
  get(_, prop) {
    return (getApp() as unknown as Record<string, unknown>)[prop as string];
  },
}) as App;
export default adminAppProxy;
