/**
 * Auth helpers for ArtMaster. Uses Firebase Auth and sets __session cookie for SSR.
 */

import {
  signInWithGoogle as firebaseSignInWithGoogle,
  signIn,
  signUp,
  setDisplayName,
  resetPassword,
  changePassword,
  applyPasswordReset,
  auth,
} from "@/lib/firebase/auth";
import { ensureUserDoc } from "@/lib/firebase/userProfile";

async function setSessionCookie(idToken: string): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: idToken }),
    credentials: "include",
  });
  if (!res.ok) {
    const msg = (await res.json().catch(() => ({})))?.error ?? "Session could not be set";
    const err = new Error(msg) as Error & { code?: string };
    err.code = "session-set-failed";
    throw err;
  }
}

export async function signInWithGoogle(): Promise<void> {
  const { user } = await firebaseSignInWithGoogle();
  try {
    await ensureUserDoc(user.uid, {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
    });
  } catch {
    // Don't block sign-in if Firestore write fails (e.g. rules/network); user is still authenticated
  }
  const token = await user.getIdToken();
  await setSessionCookie(token);
  if (typeof window !== "undefined") {
    await new Promise((r) => setTimeout(r, 100));
    window.location.assign("/dashboard");
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<void> {
  const { user } = await signIn(email, password);
  const token = await user.getIdToken();
  await setSessionCookie(token);
  if (typeof window !== "undefined") {
    await new Promise((r) => setTimeout(r, 100));
    window.location.assign("/dashboard");
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  const { user } = await signUp(email, password);
  await setDisplayName(user, displayName);
  try {
    await ensureUserDoc(user.uid, {
      email: user.email ?? email,
      displayName,
    });
  } catch {
    // Don't block sign-up if Firestore write fails
  }
  const token = await user.getIdToken();
  await setSessionCookie(token);
  if (typeof window !== "undefined") {
    await new Promise((r) => setTimeout(r, 100));
    window.location.assign("/dashboard");
  }
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  await resetPassword(email);
}

/**
 * Update password. Use fromResetLink=true when the user opened the page from the email reset link (oobCode in URL).
 */
export async function updatePassword(
  newPassword: string,
  fromResetLink?: boolean,
  oobCode?: string
): Promise<void> {
  if (fromResetLink && oobCode) {
    await applyPasswordReset(oobCode, newPassword);
    if (typeof window !== "undefined") window.location.href = "/login";
    return;
  }
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  await changePassword(user, newPassword);
  if (typeof window !== "undefined") {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/login";
  }
}

export function mapAuthError(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: string }).code)
      : "";
  const message = err instanceof Error ? err.message : String(err);
  if (code.includes("user-not-found") || message.includes("USER_NOT_FOUND"))
    return "No account found with this email.";
  if (code.includes("wrong-password") || message.includes("INVALID_PASSWORD"))
    return "Incorrect password.";
  if (
    code.includes("email-already-in-use") ||
    message.includes("EMAIL_EXISTS")
  )
    return "An account already exists with this email.";
  if (code.includes("weak-password") || message.includes("WEAK_PASSWORD"))
    return "Please choose a stronger password.";
  if (code.includes("invalid-email") || message.includes("INVALID_EMAIL"))
    return "Please enter a valid email address.";
  if (code.includes("too-many-requests"))
    return "Too many attempts. Please try again later.";
  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request"))
    return "Sign-in was cancelled.";
  if (code.includes("popup-blocked"))
    return "Pop-up was blocked. Allow pop-ups for this site and try again.";
  if (code.includes("unauthorized-domain"))
    return "This domain is not allowed for sign-in. Add it in Firebase Console → Authentication → Authorized domains.";
  if (code.includes("network-request-failed") || message.includes("network"))
    return "Network error. Check your connection and try again.";
  if (code.includes("session-set-failed") || message.includes("Session could not be set") || message.includes("Invalid token"))
    return "Could not start your session. Please try again or use a different browser.";
  return "Something went wrong. Please try again.";
}
