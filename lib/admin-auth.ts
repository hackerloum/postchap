import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

/**
 * Verifies the request has a valid Firebase token with isAdmin: true.
 * Throws if unauthorized or not admin.
 */
export async function requireAdmin(request: NextRequest): Promise<string> {
  const header = request.headers.get("Authorization");
  const token =
    header?.startsWith("Bearer ")
      ? header.replace("Bearer ", "")
      : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  if (!decoded.isAdmin) throw new Error("Forbidden");
  return decoded.uid;
}
