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

  try {
    const db = getAdminDb();
    const snap = await db
      .collectionGroup("brand_kits")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const kits = snap.docs.map((doc) => {
      const d = doc.data();
      // parent path: users/{uid}/brand_kits/{kitId}
      const uid = doc.ref.parent.parent?.id ?? "";
      return {
        id: doc.id,
        uid,
        brandName: d.brandName ?? "",
        industry: d.industry ?? "",
        primaryColor: d.primaryColor ?? "",
        tone: d.tone ?? "",
        createdAt: d.createdAt?.toMillis?.() ?? null,
      };
    });

    return NextResponse.json({ kits });
  } catch (err) {
    console.error("[admin/brand-kits GET]", err);
    return NextResponse.json({ error: "Failed to load brand kits" }, { status: 500 });
  }
}
