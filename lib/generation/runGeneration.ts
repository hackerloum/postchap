import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { generateCopy } from "@/lib/generation/generateCopy";
import { generateImagePrompt } from "@/lib/generation/generateImagePrompt";
import { generateImage } from "@/lib/freepik/generateImage";
import { imageToPrompt } from "@/lib/freepik/imageToPrompt";
import { improvePrompt } from "@/lib/freepik/improvePrompt";
import { downloadResource } from "@/lib/freepik/resources";
import { compositePoster } from "@/lib/sharp/compositePoster";
import { uploadBufferToCloudinary } from "@/lib/uploadToCloudinary";
import type { BrandKit, CopyData, Recommendation } from "@/types/generation";

export interface RunGenerationResult {
  posterId: string;
  imageUrl: string;
  copy: CopyData;
}

/**
 * Run full poster generation for a user (brand kit → copy → image → composite → upload → save).
 * When templateId is provided: download template → image-to-prompt → improve prompt → generate → composite.
 * Used by both POST /api/generate (authenticated) and the cron job (scheduled generation).
 */
export async function runGenerationForUser(
  uid: string,
  brandKitId: string,
  recommendation?: Recommendation | null,
  templateId?: string | number | null
): Promise<RunGenerationResult> {
  const db = getAdminDb();

  const kitSnap = await db
    .collection("users")
    .doc(uid)
    .collection("brand_kits")
    .doc(brandKitId)
    .get();

  if (!kitSnap.exists) {
    throw new Error("Brand kit not found");
  }

  const kitData = kitSnap.data()!;
  const brandKit: BrandKit = {
    id: kitSnap.id,
    brandName: kitData.brandName,
    industry: kitData.industry,
    tagline: kitData.tagline,
    primaryColor: kitData.primaryColor,
    secondaryColor: kitData.secondaryColor,
    accentColor: kitData.accentColor,
    logoUrl: kitData.logoUrl,
    tone: kitData.tone,
    styleNotes: kitData.styleNotes,
    brandLocation: kitData.brandLocation,
    targetAudience: kitData.targetAudience,
    ageRange: kitData.ageRange,
    platforms: kitData.platforms,
    language: kitData.language,
    sampleContent: kitData.sampleContent,
  };

  const copy: CopyData = await generateCopy(brandKit, null, recommendation ?? null);

  let imagePrompt: string;

  if (templateId != null && String(templateId).trim() !== "") {
    // Template flow: download → image-to-prompt → merge with user copy → improve → generate
    const { url: templateImageUrl } = await downloadResource(templateId, "jpg");
    const extractedPrompt = await imageToPrompt(templateImageUrl);
    const customizations = [
      `Change main text/headline to: "${copy.headline}"`,
      `CTA/button text: "${copy.cta}"`,
      `Brand name: "${brandKit.brandName ?? ""}"`,
      `Use brand colors: ${[brandKit.primaryColor, brandKit.secondaryColor, brandKit.accentColor].filter(Boolean).join(", ")}`,
      "Keep the same layout, style, and composition. No logos or emblems in the image; the brand logo will be added separately.",
    ].join(". ");
    const mergedPrompt = `${extractedPrompt}. Customize for poster: ${customizations}`;
    imagePrompt = await improvePrompt(mergedPrompt, { type: "image", language: "en" });
  } else {
    imagePrompt = await generateImagePrompt(brandKit, copy, null, recommendation ?? null);
    if (process.env.USE_FREEPIK_IMPROVE_PROMPT === "true") {
      try {
        imagePrompt = await improvePrompt(imagePrompt, {
          type: "image",
          language: "en",
        });
      } catch (err) {
        console.warn("[runGeneration] Improve Prompt failed, using original:", err);
      }
    }
  }

  const { buffer: backgroundBuffer, imageHasText } = await generateImage(imagePrompt);

  const finalBuffer = await compositePoster({
    backgroundBuffer,
    brandKit: {
      brandName: brandKit.brandName ?? "",
      primaryColor: brandKit.primaryColor ?? "#E8FF47",
      secondaryColor: brandKit.secondaryColor ?? "#111111",
      accentColor: brandKit.accentColor ?? "#FFFFFF",
      logoUrl: brandKit.logoUrl,
      tone: brandKit.tone,
    },
    copy: {
      headline: copy.headline,
      subheadline: copy.subheadline,
      body: copy.body,
      cta: copy.cta,
      hashtags: copy.hashtags ?? [],
    },
    imageHasText,
  });

  const posterId = `poster_${uid}_${Date.now()}`;
  const imageUrl = await uploadBufferToCloudinary(
    finalBuffer,
    `artmaster/posters/${uid}`,
    posterId
  );

  const posterRef = await db
    .collection("users")
    .doc(uid)
    .collection("posters")
    .add({
      userId: uid,
      brandKitId,
      imageUrl,
      headline: copy.headline,
      subheadline: copy.subheadline,
      body: copy.body,
      cta: copy.cta,
      hashtags: copy.hashtags ?? [],
      theme: recommendation?.theme ?? "General",
      topic: recommendation?.topic ?? "",
      status: "generated",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  return {
    posterId: posterRef.id,
    imageUrl,
    copy,
  };
}
