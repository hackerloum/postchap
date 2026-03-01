import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { generateCopy } from "@/lib/generation/generateCopy";
import { generateImagePrompt } from "@/lib/generation/generateImagePrompt";
import { generateImage } from "@/lib/freepik/generateImage";
import { improvePrompt } from "@/lib/freepik/improvePrompt";
import { compositePoster } from "@/lib/sharp/compositePoster";
import { uploadBufferToCloudinary } from "@/lib/uploadToCloudinary";
import { getPlatformFormat } from "@/lib/generation/platformFormats";
import { FieldValue } from "firebase-admin/firestore";
import type { BrandKit, Recommendation } from "@/types/generation";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let adminUid: string;
  try {
    adminUid = await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    recommendation?: Recommendation | null;
    platformFormatId?: string | null;
    topic?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    // Load ArtMaster brand kit from admin_config
    const kitSnap = await db.doc("admin_config/artmaster_brand_kit").get();
    if (!kitSnap.exists) {
      return NextResponse.json(
        { error: "ArtMaster brand kit not configured. Go to Admin → ArtMaster Kit to set it up." },
        { status: 400 }
      );
    }

    const kitData = kitSnap.data()!;
    const brandKit: BrandKit = {
      id: "artmaster",
      brandName: kitData.brandName ?? "ArtMaster",
      industry: kitData.industry ?? "SaaS / AI Tools",
      tagline: kitData.tagline ?? "",
      primaryColor: kitData.primaryColor ?? "#000000",
      secondaryColor: kitData.secondaryColor ?? "#ffffff",
      accentColor: kitData.accentColor ?? "#a3e635",
      tone: kitData.tone ?? "professional",
      styleNotes: kitData.styleNotes ?? "",
      targetAudience: kitData.targetAudience ?? "",
      language: kitData.language ?? "English",
      website: kitData.website ?? "https://artmasterpro.com",
    };

    const recommendation = body.recommendation ?? null;
    const format = getPlatformFormat(body.platformFormatId ?? null);

    const copy = await generateCopy(brandKit, null, recommendation);
    let imagePrompt = await generateImagePrompt(brandKit, copy, null, recommendation);

    // Always run prompt improvement for admin — maximum quality output
    try {
      imagePrompt = await improvePrompt(imagePrompt, { type: "image", language: "en" });
    } catch (err) {
      console.warn("[admin/generate] improvePrompt failed, using original:", err);
    }

    const { buffer: backgroundBuffer, imageHasText } = await generateImage(imagePrompt, format.freepikAspectRatio);

    const finalBuffer = await compositePoster({
      backgroundBuffer,
      brandKit: {
        brandName: brandKit.brandName ?? "ArtMaster",
        primaryColor: brandKit.primaryColor ?? "#000000",
        secondaryColor: brandKit.secondaryColor ?? "#ffffff",
        accentColor: brandKit.accentColor ?? "#a3e635",
        logoUrl: brandKit.logoUrl,
        website: brandKit.website,
      },
      copy: {
        headline: copy.headline,
        subheadline: copy.subheadline,
        body: copy.body,
        cta: copy.cta,
        hashtags: copy.hashtags ?? [],
      },
      imageHasText,
      width: format.width,
      height: format.height,
    });

    const posterId = `admin_poster_${Date.now()}`;
    const imageUrl = await uploadBufferToCloudinary(
      finalBuffer,
      "artmaster/admin_posts",
      posterId
    );

    const docRef = await db.collection("admin_posts").add({
      posterId,
      imageUrl,
      headline: copy.headline,
      subheadline: copy.subheadline,
      body: copy.body,
      cta: copy.cta,
      hashtags: copy.hashtags ?? [],
      theme: recommendation?.theme ?? "General",
      topic: recommendation?.topic ?? body.topic ?? "",
      platformFormatId: body.platformFormatId ?? "instagram_square",
      createdBy: adminUid,
      status: "generated",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ posterId: docRef.id, imageUrl, copy });
  } catch (err) {
    console.error("[admin/generate]", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
