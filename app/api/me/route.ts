import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getHasOnboarded } from "@/lib/firebase/firestore";

/**
 * GET /api/me — returns current user uid, email, and hasOnboarded.
 * Accepts token via Authorization: Bearer <token> or __session cookie.
 */
export async function GET(request: NextRequest) {
  try {
    let token: string | null = null;

    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("__session")?.value ?? null;
    }
    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const decoded = (await getAdminAuth().verifyIdToken(token)) as {
      uid: string;
      email?: string;
      hasOnboarded?: boolean;
    };
    const hasOnboarded = await getHasOnboarded(decoded.uid);

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email ?? null,
      hasOnboarded,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
