import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const planFilter = searchParams.get("plan");

  try {
    const db = getAdminDb();
    let query = db.collection("users").orderBy("createdAt", "desc").limit(limitParam);
    if (planFilter && ["free", "pro", "business"].includes(planFilter)) {
      query = db.collection("users").where("plan", "==", planFilter).orderBy("createdAt", "desc").limit(limitParam);
    }

    const snap = await query.get();
    const users = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        email: d.email ?? "",
        displayName: d.displayName ?? "",
        plan: d.plan ?? "free",
        hasOnboarded: d.hasOnboarded ?? false,
        createdAt: d.createdAt?.toMillis?.() ?? null,
        country: d.country ?? null,
      };
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("[admin/users GET]", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
