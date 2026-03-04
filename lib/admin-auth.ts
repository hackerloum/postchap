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
