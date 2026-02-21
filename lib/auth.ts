/**
 * Auth helpers for ArtMaster. Replace with Firebase when configured.
 * These stubs allow the auth UI to work and redirect to /dashboard.
 */

export async function signInWithGoogle(): Promise<void> {
  // TODO: Firebase signInWithPopup(auth, new GoogleAuthProvider())
  // For now redirect to dashboard (demo flow)
  if (typeof window !== "undefined") {
    window.location.href = "/dashboard";
  }
}

export async function signInWithEmail(
  _email: string,
  _password: string
): Promise<void> {
  // TODO: Firebase signInWithEmailAndPassword(auth, email, password)
  if (typeof window !== "undefined") {
    window.location.href = "/dashboard";
  }
}

export async function signUpWithEmail(
  _email: string,
  _password: string,
  _displayName: string
): Promise<void> {
  // TODO: createUserWithEmailAndPassword, updateProfile, create Firestore user doc
  if (typeof window !== "undefined") {
    window.location.href = "/dashboard";
  }
}

export async function sendPasswordResetEmail(_email: string): Promise<void> {
  // TODO: Firebase sendPasswordResetEmail(auth, email)
  return Promise.resolve();
}

export async function updatePassword(_newPassword: string): Promise<void> {
  // TODO: Firebase user.updatePassword(newPassword)
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function mapAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("user-not-found") || message.includes("USER_NOT_FOUND"))
    return "No account found with this email.";
  if (message.includes("wrong-password") || message.includes("INVALID_PASSWORD"))
    return "Incorrect password.";
  if (message.includes("email-already-in-use") || message.includes("EMAIL_EXISTS"))
    return "An account already exists with this email.";
  if (message.includes("weak-password") || message.includes("WEAK_PASSWORD"))
    return "Please choose a stronger password.";
  if (message.includes("invalid-email") || message.includes("INVALID_EMAIL"))
    return "Please enter a valid email address.";
  if (message.includes("too-many-requests"))
    return "Too many attempts. Please try again later.";
  return "Something went wrong. Please try again.";
}
