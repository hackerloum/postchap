import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  confirmPasswordReset,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./auth.client";

function getAuth() {
  if (!auth) throw new Error("Auth not available");
  return auth;
}

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(getAuth(), email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(getAuth(), email, password);

/** Prefer redirect flow so "Continue with Google" works when popups are blocked. */
export const signInWithGoogle = () =>
  signInWithPopup(getAuth(), new GoogleAuthProvider());

/** Redirect to Google sign-in; handle result with getRedirectResult() when the page loads after redirect. */
export const signInWithGoogleRedirect = () =>
  signInWithRedirect(getAuth(), new GoogleAuthProvider());

/** Call on login (or app) load after redirect from Google. Returns the signed-in user if present. */
export const getGoogleRedirectResult = () => getRedirectResult(getAuth());

export type { User };
export const logOut = () => signOut(getAuth());

export const resetPassword = (email: string) => {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return sendPasswordResetEmail(getAuth(), email, {
    url: `${baseUrl}/update-password`,
    handleCodeInApp: true,
  });
};

export const changePassword = (user: User, newPassword: string) =>
  updatePassword(user, newPassword);

/** Use when user lands on update-password page from the email reset link (oobCode in URL). */
export const applyPasswordReset = (oobCode: string, newPassword: string) =>
  confirmPasswordReset(getAuth(), oobCode, newPassword);

export const setDisplayName = (user: User, displayName: string) =>
  updateProfile(user, { displayName });

export { onAuthStateChanged, auth };
