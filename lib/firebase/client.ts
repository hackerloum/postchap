import { initializeApp, getApps } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage } from "firebase/storage";

let _auth: Auth | null = null;

function getConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function getAppInstance() {
  if (typeof window === "undefined") return null;
  const apps = getApps();
  return apps.length === 0 ? initializeApp(getConfig()) : apps[0];
}

export function getAuthClient(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth can only be used in the browser");
  }
  if (!_auth) {
    const app = getAppInstance() as ReturnType<typeof initializeApp>;
    _auth = getAuth(app);
  }
  return _auth;
}

export function getStorageClient() {
  if (typeof window === "undefined") return null;
  const app = getAppInstance();
  return app ? getStorage(app) : null;
}
