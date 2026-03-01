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
    const snap = await getAdminDb()
      .collection("admin_posts")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const posts = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        imageUrl: d.imageUrl ?? "",
        headline: d.headline ?? "",
        cta: d.cta ?? "",
        theme: d.theme ?? "",
        topic: d.topic ?? "",
        hashtags: d.hashtags ?? [],
        platformFormatId: d.platformFormatId ?? "instagram_square",
        createdAt: d.createdAt?.toMillis?.() ?? null,
      };
    });

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[admin/posts GET]", err);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
