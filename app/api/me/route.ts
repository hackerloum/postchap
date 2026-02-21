import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { getHasOnboarded } from "@/lib/firebase/firestore";

const SESSION_COOKIE = "__session";

/**
 * GET /api/me — returns current user uid, email, and hasOnboarded.
 * Used by dashboard and onboarding pages to decide redirects.
 */
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    const decoded = await adminAuth.verifyIdToken(session) as { uid: string; email?: string };
    const uid = decoded.uid;
    const email = decoded.email ?? "";
    const hasOnboarded = await getHasOnboarded(uid);

    return NextResponse.json({
      uid,
      email,
      hasOnboarded,
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
