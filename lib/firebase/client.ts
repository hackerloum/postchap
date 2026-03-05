import { initializeApp, getApps } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, type Analytics } from "firebase/analytics";

let _auth: Auth | null = null;
let _analytics: Analytics | null = null;

function getConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
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

/** Optional Firebase Analytics for blog and marketing events. No-op if not in browser or Analytics unavailable. */
export function getAnalyticsClient(): Analytics | null {
  if (typeof window === "undefined") return null;
  if (_analytics) return _analytics;
  try {
    const app = getAppInstance();
    if (app) {
      _analytics = getAnalytics(app);
      return _analytics;
    }
  } catch {
    // Analytics may be disabled or measurementId missing
  }
  return null;
}

