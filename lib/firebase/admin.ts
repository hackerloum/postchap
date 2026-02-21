import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { getDatabase } from "firebase-admin/database";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0] as App;
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID and related env vars."
    );
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

function lazy<T>(fn: () => T): T {
  let value: T | undefined;
  return new Proxy({} as Record<string, unknown>, {
    get(_, prop) {
      if (value === undefined) value = fn();
      return (value as Record<string | symbol, unknown>)[prop];
    },
    apply(_, thisArg, args) {
      if (value === undefined) value = fn();
      return (value as unknown as (...a: unknown[]) => unknown).apply(
        thisArg,
        args
      );
    },
  }) as T;
}

export const adminDb = lazy(() => getFirestore(getAdminApp()));
export const adminAuth = lazy(() => getAuth(getAdminApp()));
export const adminStorage = lazy(() => getStorage(getAdminApp()));
export const adminRtdb = lazy(() => getDatabase(getAdminApp()));

let _defaultApp: App | null = null;
const defaultAppProxy = new Proxy({} as object, {
  get(_, prop) {
    if (_defaultApp === null) _defaultApp = getAdminApp();
    return (_defaultApp as Record<string | symbol, unknown>)[prop];
  },
});
export default defaultAppProxy as App;
