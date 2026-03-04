import { getAuthClient } from "@/lib/firebase/client";

/**
 * Module-level token cache.
 * Firebase ID tokens are valid for 1 hour. We keep our own copy so every
 * button click doesn't make a round-trip to Google's token endpoint.
 * The token is re-fetched only when it has < 5 minutes left.
 */
interface TokenCache { token: string; expiresAt: number }
let _cache: TokenCache | null = null;

function parseExpiry(token: string): number {
  try {
    const b64 = token.split(".")[1];
    if (!b64) return 0;
    // JWT payload is base64url-encoded
    const json = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: number };
    return (payload.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

/**
 * Get the current Firebase ID token from the client.
 *
 * Returns the in-memory cached token when it has > 5 min of life remaining
 * (typical case: 0 ms latency). Only falls back to Firebase's IDB / network
 * when the token is expired or nearly expired.
 *
 * Pass forceRefresh=true only when you know the token must be fresh
 * (e.g. immediately after a credential change).
 */
export async function getClientIdToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const auth = getAuthClient();
    const user = auth.currentUser;
    if (!user) { _cache = null; return null; }

    const now = Date.now();
    if (!forceRefresh && _cache && _cache.expiresAt - now > 5 * 60 * 1000) {
      return _cache.token;
    }

    // Firebase's getIdToken(false) reads from its own IDB cache and only hits
    // the network when the stored token is actually expired — usually < 5 ms.
    const token = await user.getIdToken(false);
    if (token) {
      _cache = { token, expiresAt: parseExpiry(token) };
    }
    return token ?? null;
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
