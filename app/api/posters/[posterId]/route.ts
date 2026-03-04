import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

async function getUidFromRequest(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * GET /api/posters/[posterId]
 * Returns a single poster doc owned by the authenticated user.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { posterId: string } }
) {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { posterId } = params;
  if (!posterId) {
    return NextResponse.json({ error: "Poster ID required" }, { status: 400 });
  }

  try {
    const doc = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("posters")
      .doc(posterId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }

    const d = doc.data()!;
    const copy = d.copy ?? {};
    const createdAt = d.createdAt?.toMillis?.() ?? null;

    return NextResponse.json({
      id: doc.id,
      imageUrl: d.imageUrl ?? null,
      backgroundImageUrl: d.backgroundImageUrl ?? null,
      originalImageUrl: d.originalImageUrl ?? null,
      headline: d.headline ?? copy.headline ?? "Poster",
      subheadline: d.subheadline ?? copy.subheadline ?? "",
      body: d.body ?? copy.body ?? "",
      cta: d.cta ?? copy.cta ?? "",
      hashtags: d.hashtags ?? copy.hashtags ?? [],
      theme: d.theme ?? "General",
      topic: d.topic ?? "",
      status: d.status ?? "generated",
      version: d.version ?? 1,
      editHistory: d.editHistory ?? [],
      brandKitId: d.brandKitId ?? null,
      productId: d.productId ?? null,
      productIntent: d.productIntent ?? null,
      platformFormatId: d.platformFormatId ?? null,
      width: d.width ?? 1080,
      height: d.height ?? 1080,
      createdAt,
    });
  } catch (error) {
    console.error("[poster GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch poster", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
