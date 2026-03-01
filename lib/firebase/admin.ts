import { getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0] as App;
  }
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );
  if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    throw new Error("Missing Firebase Admin env vars");
  }
  const admin = require("firebase-admin");
  return admin.initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export async function setAdminClaim(uid: string): Promise<void> {
  await getAuth(getAdminApp()).setCustomUserClaims(uid, { isAdmin: true });
}
