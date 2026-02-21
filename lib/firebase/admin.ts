import { cert, getApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getDatabase } from "firebase-admin/database";

// ─── App initialization ───────────────────────────────────────
// Use lazy singleton with named app to avoid Vercel cold-start race conditions.
// NEVER call getFirestore/getAuth at module level.
// Always call them inside functions via getAdminApp().

const APP_NAME = "artmaster-admin";

function getAdminApp() {
  try {
    return getApp(APP_NAME);
  } catch {
    // App doesn't exist yet — create it
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && "FIREBASE_ADMIN_PROJECT_ID",
      !clientEmail && "FIREBASE_ADMIN_CLIENT_EMAIL",
      !privateKey && "FIREBASE_ADMIN_PRIVATE_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Firebase Admin: Missing environment variables: ${missing}`);
  }

  const formattedKey = privateKey.replace(/\\n/g, "\n");

  return initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      ...(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
        ? { databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL }
        : {}),
    },
    APP_NAME
  );
}

// ─── Lazy service getters ─────────────────────────────────────
// Services are resolved lazily so the app exists before getFirestore() is called.

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

/** Firestore instance (classic API). Typed so .collection().doc().collection().add() etc. type-check. */
export type AdminFirestore = {
  collection(id: string): {
    doc(id: string): {
      collection(id: string): { add(data: object): Promise<{ id: string }> };
      set(data: object, opts?: { merge?: boolean }): Promise<void>;
    };
  };
};

export function getAdminDb(): AdminFirestore {
  return getFirestore(getAdminApp()) as AdminFirestore;
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

export function getAdminRtdb() {
  return getDatabase(getAdminApp());
}

// ─── Legacy named exports ─────────────────────────────────────
// For files that import { adminAuth, adminDb }; they delegate lazily.

const empty = {};
export const adminAuth = new Proxy(empty, {
  get(_, prop) {
    return (getAdminAuth() as unknown as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof getAuth>;
export const adminDb = new Proxy(empty, {
  get(_, prop) {
    return (getAdminDb() as unknown as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof getFirestore>;
export const adminStorage = new Proxy(empty, {
  get(_, prop) {
    return (getAdminStorage() as unknown as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof getStorage>;
export const adminRtdb = new Proxy(empty, {
  get(_, prop) {
    return (getAdminRtdb() as unknown as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof getDatabase>;

export default getAdminApp;
