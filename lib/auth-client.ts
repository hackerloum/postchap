import { getAuthClient } from "@/lib/firebase/client";

/**
 * Get the current Firebase ID token from the client (when running in the browser).
 * Use this when calling server actions so auth works even if the session cookie isn't sent.
 * Pass forceRefresh true to get a new token (e.g. after staying on page a long time).
 */
export async function getClientIdToken(forceRefresh = true): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const auth = getAuthClient();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

/**
 * Refresh the __session cookie with the current user's token so server-side requests
 * (and page refreshes) keep working after the token would otherwise expire.
 */
export async function refreshSessionCookie(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const token = await getClientIdToken(true);
    if (!token) return false;
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "same-origin",
    });
    return res.ok;
  } catch {
    return false;
  }
}
