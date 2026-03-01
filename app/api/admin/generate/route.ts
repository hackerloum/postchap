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
      // Intentionally blank — prevents Seedream from baking "ArtMaster" as typographic text.
      // The real brand name is only used in generateCopy (via brandKitForCopy).
      brandName: "",
      industry: kitData.industry ?? "SaaS / AI Tools",
      tagline: kitData.tagline ?? "",
      primaryColor: kitData.primaryColor ?? "#000000",
      secondaryColor: kitData.secondaryColor ?? "#ffffff",
      accentColor: kitData.accentColor ?? "#a3e635",
      // logoUrl NOT passed to image generation — added by compositor below
      tone: kitData.tone ?? "professional",
      styleNotes: (kitData.styleNotes ? kitData.styleNotes + ". " : "") +
        "CRITICAL: Do NOT render any brand name, wordmark, or logo text anywhere on the poster. Do NOT render 'ArtMaster' or any brand identifier as text or graphic. The top-left area must be completely empty — pure background only. No icons, no logos, no brand symbols anywhere. Only the headline, subheadline, and CTA text may appear as poster text.",
      targetAudience: kitData.targetAudience ?? "",
      language: kitData.language ?? "English",
    };
    // Keep brand name available for copy generation context (used in generateCopy)
    const brandKitForCopy: BrandKit = {
      ...brandKit,
      brandName: kitData.brandName ?? "ArtMaster",
    };

    const recommendation = body.recommendation ?? null;
    const format = getPlatformFormat(body.platformFormatId ?? null);

    // Use brandKitForCopy (has real brand name) for copy generation
    // Use brandKit (empty brandName) for image prompt to stop Seedream rendering "ArtMaster" text
    const copy = await generateCopy(brandKitForCopy, null, recommendation);
    let imagePrompt = await generateImagePrompt(brandKit, copy, null, recommendation);

    // Always run prompt improvement for admin — maximum quality output
    try {
      imagePrompt = await improvePrompt(imagePrompt, { type: "image", language: "en" });
    } catch (err) {
      console.warn("[admin/generate] improvePrompt failed, using original:", err);
    }

    // Hard-append negative constraints AFTER improvePrompt so they cannot be overridden.
    // Seedream treats trailing instructions as high-priority negative guidance.
    const NO_LOGO_SUFFIX = [
      "STRICT NEGATIVE CONSTRAINTS:",
      "Do NOT show any logo, wordmark, brand mark, emblem, icon, or symbol anywhere in the image.",
      "Do NOT show any text on signs, papers, boards, screens, clothing, or held objects.",
      "If a person is holding anything (paper, sign, board, phone), it must be blank — no text, no logos, no brand marks on it.",
      "Do NOT render 'ArtMaster', 'Art Master', or any brand name as text or graphic anywhere.",
      "The top-left corner must remain completely empty background — no elements within 220x100 pixels of the top-left.",
      "No watermarks. No copyright symbols. No generated logos.",
    ].join(" ");
    imagePrompt = `${imagePrompt}\n\n${NO_LOGO_SUFFIX}`;

    const { buffer: backgroundBuffer, imageHasText } = await generateImage(imagePrompt, format.freepikAspectRatio);

    const finalBuffer = await compositePoster({
      backgroundBuffer,
      brandKit: {
        brandName: kitData.brandName ?? "ArtMaster",
        primaryColor: kitData.primaryColor ?? "#000000",
        secondaryColor: kitData.secondaryColor ?? "#ffffff",
        accentColor: kitData.accentColor ?? "#a3e635",
        logoUrl: kitData.logoUrl ?? undefined,
        // website omitted to prevent broken contact bar boxes on Vercel
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
