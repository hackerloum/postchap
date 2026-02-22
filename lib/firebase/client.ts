import { initializeApp, getApps } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

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

export function getAuthClient(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth can only be used in the browser");
  }
  if (!_auth) {
    const app =
      getApps().length === 0
        ? initializeApp(getConfig())
        : (getApps()[0] as ReturnType<typeof initializeApp>);
    _auth = getAuth(app);
  }
  return _auth;
}
