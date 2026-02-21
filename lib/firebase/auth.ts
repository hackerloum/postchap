import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./client";

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

export const changePassword = (user: User, newPassword: string) =>
  updatePassword(user, newPassword);

export { onAuthStateChanged, auth };
