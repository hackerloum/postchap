import { getAdminAuth } from "./admin";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { NextRequest } from "next/server";

/**
 * Verify a token string from the __session cookie.
 * Tries verifySessionCookie first (new 14-day session cookies), then falls
 * back to verifyIdToken for users who still have an old 1-hour ID token in
 * their cookie from before the session-cookie migration.
 */
export async function verifyCookieToken(token: string): Promise<DecodedIdToken> {
  try {
    return await getAdminAuth().verifySessionCookie(token, true);
  } catch {
    // Backward compat: cookie may still hold a raw ID token from before migration
    return await getAdminAuth().verifyIdToken(token);
  }
}

/**
 * For API Route Handlers (NextRequest):
 * Reads token from Authorization: Bearer header first, then __session cookie.
 * Bearer tokens are raw ID tokens; cookie tokens are session cookies (or legacy ID tokens).
 */
export async function verifyRequestAuth(request: NextRequest): Promise<DecodedIdToken> {
  const header = request.headers.get("Authorization");
  const fromHeader = !!header?.startsWith("Bearer ");
  const token = fromHeader
    ? header!.replace("Bearer ", "")
    : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  return fromHeader
    ? getAdminAuth().verifyIdToken(token)
    : verifyCookieToken(token);
}

/**
 * For Server Components / Server Actions (next/headers cookies):
 * Pass the raw cookie value from (await cookies()).get("__session")?.value
 */
export async function verifyCookieAuth(token: string | undefined): Promise<DecodedIdToken> {
  if (!token) throw new Error("Unauthorized");
  return verifyCookieToken(token);
}
