import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  confirmPasswordReset,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./client";

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () =>
  signInWithPopup(auth, new GoogleAuthProvider());

export const logOut = () => signOut(auth);

export const resetPassword = (email: string) => {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return sendPasswordResetEmail(auth, email, {
    url: `${baseUrl}/update-password`,
    handleCodeInApp: true,
  });
};

export const changePassword = (user: User, newPassword: string) =>
  updatePassword(user, newPassword);

/** Use when user lands on update-password page from the email reset link (oobCode in URL). */
export const applyPasswordReset = (oobCode: string, newPassword: string) =>
  confirmPasswordReset(auth, oobCode, newPassword);

export const setDisplayName = (user: User, displayName: string) =>
  updateProfile(user, { displayName });

export { onAuthStateChanged, auth };
