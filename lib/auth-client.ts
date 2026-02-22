import { getAuthClient } from "@/lib/firebase/client";

/**
 * Get the current Firebase ID token from the client (when running in the browser).
 * Use this when calling server actions so auth works even if the session cookie isn't sent.
 */
export async function getClientIdToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const auth = getAuthClient();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(true);
  } catch {
    return null;
  }
}
