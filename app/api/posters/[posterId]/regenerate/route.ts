import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { runGenerationForUser } from "@/lib/generation/runGeneration";
import type { Recommendation, ProductIntent, ProductOverrides } from "@/types/generation";

export const maxDuration = 300;

async function getUidFromRequest(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * POST /api/posters/[posterId]/regenerate
 * Run the full generation pipeline again with the same inputs but a new session seed.
 * Returns a NEW poster document — the original is kept unchanged.
 */
export async function POST(
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
    const db = getAdminDb();
    const posterSnap = await db
      .collection("users").doc(uid).collection("posters").doc(posterId).get();

    if (!posterSnap.exists) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }

    const d = posterSnap.data()!;
    const brandKitId = d.brandKitId as string | undefined;
    if (!brandKitId) {
      return NextResponse.json({ error: "Poster is missing brandKitId" }, { status: 400 });
    }

    // Reconstruct the original generation inputs
    const recommendation = (d.theme && d.topic && d.theme !== `Product: ${d.productId ?? ""}`)
      ? ({
          theme:            d.theme,
          topic:            d.topic,
          description:      d.topic,
          suggestedHeadline: d.headline ?? "",
          suggestedCta:     d.cta ?? "",
          visualMood:       "",
        } as Recommendation)
      : null;

    const productId     = (d.productId     as string | undefined) ?? null;
    const productIntent = (d.productIntent as ProductIntent | undefined) ?? null;
    const platformFormatId = (d.platformFormatId as string | undefined) ?? null;

    // Run full generation — this creates a brand-new poster doc
    const result = await runGenerationForUser(
      uid,
      brandKitId,
      recommendation,
      null,
      platformFormatId,
      null,
      null,
      false,
      productId,
      productIntent,
      null as ProductOverrides | null
    );

    // Tag the new poster as regenerated from the original
    await db.collection("users").doc(uid).collection("posters").doc(result.posterId).update({
      regeneratedFrom: posterId,
    });

    return NextResponse.json({
      success:  true,
      posterId: result.posterId,
      imageUrl: result.imageUrl,
    });
  } catch (error) {
    console.error("[regenerate]", error);
    return NextResponse.json(
      { error: "Regeneration failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
