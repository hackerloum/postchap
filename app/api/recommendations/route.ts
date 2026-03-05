import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { analyzeBrandKit } from "@/lib/brand/analyzeBrandMultimodal";
import { getRecommendationsForBrandKit } from "@/lib/generation/generateRecommendations";
import type { BrandKit } from "@/types/generation";

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    const decoded = await verifyRequestAuth(request);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { brandKitId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { brandKitId } = body;

  if (!brandKitId) {
    return NextResponse.json({ error: "brandKitId required" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const kitSnap = await db.collection("users").doc(uid).collection("brand_kits").doc(brandKitId).get();
    let brandDna = kitSnap.exists ? (kitSnap.data() as Record<string, unknown>)?.brandDna : undefined;
    if (!brandDna && kitSnap.exists) {
      const kit = kitSnap.data() as Record<string, unknown>;
      const brandKit: BrandKit = {
        id: kitSnap.id,
        brandName: kit.brandName as string,
        industry: kit.industry as string,
        logoUrl: kit.logoUrl as string,
        storePhotoUrls: kit.storePhotoUrls as string[] | undefined,
        brandLocation: kit.brandLocation as BrandKit["brandLocation"],
      };
      if (brandKit.logoUrl || (brandKit.storePhotoUrls?.length ?? 0) > 0) {
        brandDna = await analyzeBrandKit(brandKit) ?? undefined;
      }
    }
    const recommendations = await getRecommendationsForBrandKit(db, uid, brandKitId, { brandDna: brandDna ?? null });
    return NextResponse.json({ recommendations });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "Brand kit not found") {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }
    if (message === "OPENAI_API_KEY not set") {
      return NextResponse.json(
        { error: "Recommendations are not available right now." },
        { status: 503 }
      );
    }
    console.error("[recommendations]", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
