import { NextRequest } from "next/server";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

/**
 * Verifies the request has a valid Firebase token with isAdmin: true.
 * Throws if unauthorized or not admin.
 */
export async function requireAdmin(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  if (!decoded.isAdmin) throw new Error("Forbidden");
  return decoded.uid;
}

/** Decoded token shape for custom claims (role is set via setCustomUserClaims). */
type DecodedWithRole = { uid: string; isAdmin?: boolean; role?: string };

/**
 * Verifies the request has a valid session and role === "superadmin".
 * Used for terminal and other superadmin-only features.
 * Throws if unauthorized or not superadmin.
 */
export async function verifySuperadminSession(
  request: NextRequest
): Promise<{ uid: string }> {
  const decoded = (await verifyRequestAuth(request)) as DecodedWithRole;
  if (!decoded.isAdmin || decoded.role !== "superadmin") {
    throw new Error("Forbidden");
  }
  return { uid: decoded.uid };
}
