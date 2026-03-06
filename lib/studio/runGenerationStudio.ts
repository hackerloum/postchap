/**
 * Studio poster generation — server-only.
 * Same pipeline as runGenerationForUser but reads brand kit from studio_agencies/...
 * and writes to studio_agencies/.../clients/{clientId}/posters.
 */

import { FieldValue } from "firebase-admin/firestore";
import { getBrandKit, postersRef, brandKitsRef } from "@/lib/studio/db";
import { generateCopy } from "@/lib/generation/generateCopy";
import { generateImage } from "@/lib/generation/imageProvider";
import { generateImagePrompt } from "@/lib/generation/generateImagePrompt";
import { imageToPrompt } from "@/lib/freepik/imageToPrompt";
import { improvePrompt } from "@/lib/freepik/improvePrompt";
import { getPlatformFormat } from "@/lib/generation/platformFormats";
import { compositePoster } from "@/lib/sharp/compositePoster";
import { uploadBufferToCloudinary } from "@/lib/uploadToCloudinary";
import { generateLayout, buildPosterLayout, BACKGROUND_ONLY_INSTRUCTION } from "@/lib/generation/generateLayout";
import type { BrandKit, CopyData, Recommendation } from "@/types/generation";
import type { ApprovalStatus } from "@/types/studio";

export interface StudioGenerationResult {
  posterId: string;
  imageUrl: string;
  copy: CopyData;
  hasEditableLayout?: boolean;
}

/**
 * Run poster generation for a Studio client.
 * Reads the brand kit from studio_agencies/{agencyId}/clients/{clientId}/brand_kits/{kitId},
 * generates copy + image, composites, uploads to Cloudinary, and writes to the posters subcollection.
 */
export async function runGenerationForStudio(
  agencyId: string,
  clientId: string,
  brandKitId: string,
  designerUid: string,
  recommendation?: Recommendation | null,
  templateId?: string | number | null,
  platformFormatId?: string | null,
  inspirationImageUrl?: string | null,
  imageProviderId?: string | null,
  useImprovePrompt?: boolean,
  posterLanguage?: string | null,
  useEditableLayout?: boolean
): Promise<StudioGenerationResult> {
  const format = getPlatformFormat(platformFormatId);

  // Load brand kit
  const kitData = await getBrandKit(agencyId, clientId, brandKitId);
  if (!kitData) throw new Error("Brand kit not found");

  const brandKit: BrandKit = {
    id: kitData.id,
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
    targetAudience: (kitData as any).targetAudience,
    ageRange: (kitData as any).ageRange,
    platforms: kitData.platforms,
    language: kitData.language,
    sampleContent: (kitData as any).sampleContent,
    phoneNumber: kitData.phoneNumber,
    contactLocation: kitData.contactLocation,
    website: kitData.website,
  };

  const copy = await generateCopy(brandKit, null, recommendation ?? null, null, platformFormatId ?? null, posterLanguage ?? kitData.language ?? null);

  const cloudinaryFolder = `artmaster/studio/${agencyId}/${clientId}`;

  // ── Editable layout path ────────────────────────────────────────────────
  if (useEditableLayout && !templateId && !inspirationImageUrl) {
    const brief = {
      headline:    copy.headline,
      subheadline: copy.subheadline,
      cta:         copy.cta,
      hashtags:    copy.hashtags ?? [],
      body:        copy.body,
      visualMood:  recommendation?.visualMood,
      designStyle: recommendation?.topic,
    };

    const gptLayout = await generateLayout(brief, brandKit, format);
    const bgPrompt = `${gptLayout.backgroundPrompt}\n\n${BACKGROUND_ONLY_INSTRUCTION}`;

    // Multi-modal reference: pass logo so Gemini/Seedream can integrate it (identity anchoring + intelligent composition)
    const { buffer: backgroundBuffer } = await generateImage(
      bgPrompt,
      format.freepikAspectRatio,
      imageProviderId,
      {
        brandName:    brandKit.brandName,
        logoUrl:      brandKit.logoUrl,
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor:   brandKit.accentColor,
      }
    );

    const ref = await postersRef(agencyId, clientId).add({
      agencyId,
      clientId,
      brandKitId,
      generatedBy: designerUid,
      approvalStatus: "draft" as ApprovalStatus,
      status: "generating",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const posterId = ref.id;

    const backgroundImageUrl = await uploadBufferToCloudinary(backgroundBuffer, cloudinaryFolder, `${posterId}_bg`);
    const logoAlreadyInImage = !!(brandKit.logoUrl && imageProviderId?.toString().startsWith("gemini:"));
    const posterLayout = buildPosterLayout(gptLayout, backgroundImageUrl, brandKit, format, {
      logoAlreadyInImage,
    });
    posterLayout.posterId = posterId;

    await ref.update({
      imageUrl: backgroundImageUrl,
      backgroundImageUrl,
      originalImageUrl: backgroundImageUrl,
      headline: copy.headline,
      subheadline: copy.subheadline,
      body: copy.body,
      cta: copy.cta,
      hashtags: copy.hashtags ?? [],
      theme: recommendation?.theme ?? "General",
      topic: recommendation?.topic ?? "",
      status: "generated",
      version: 1,
      editHistory: [],
      platformFormatId: platformFormatId ?? null,
      width: format.width,
      height: format.height,
      layout: posterLayout,
      hasEditableLayout: true,
      lastEditedAt: null,
      editCount: 0,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { posterId, imageUrl: backgroundImageUrl, copy, hasEditableLayout: true };
  }

  // ── Standard path ────────────────────────────────────────────────────────

  let imagePrompt: string;

  if (inspirationImageUrl != null && String(inspirationImageUrl).trim() !== "") {
    const extractedPrompt = await imageToPrompt(inspirationImageUrl.trim());
    imagePrompt = useImprovePrompt
      ? await improvePrompt(extractedPrompt)
      : extractedPrompt;
  } else if (templateId != null) {
    const templateUrl = String(templateId).startsWith("http")
      ? String(templateId)
      : `https://res.cloudinary.com/artmaster/image/upload/freepik_templates/${String(templateId)}`;
    const extractedPrompt = await imageToPrompt(templateUrl);
    imagePrompt = useImprovePrompt
      ? await improvePrompt(extractedPrompt)
      : extractedPrompt;
  } else {
    imagePrompt = await generateImagePrompt(brandKit, copy, null, recommendation ?? null, platformFormatId ?? null);
    if (useImprovePrompt) {
      imagePrompt = await improvePrompt(imagePrompt);
    }
  }

  const { buffer: backgroundBuffer, imageHasText, logoHandledByAI, addCTAFromSharp } = await generateImage(
    imagePrompt,
    format.freepikAspectRatio,
    imageProviderId,
    {
      brandName: brandKit.brandName,
      logoUrl: brandKit.logoUrl,
      primaryColor: brandKit.primaryColor,
      secondaryColor: brandKit.secondaryColor,
      accentColor: brandKit.accentColor,
    }
  );

  const compositeBrandKit = {
    brandName: brandKit.brandName ?? "",
    primaryColor: brandKit.primaryColor ?? "#E8FF47",
    secondaryColor: brandKit.secondaryColor ?? "#111111",
    accentColor: brandKit.accentColor ?? "#FFFFFF",
    logoUrl: brandKit.logoUrl,
    tone: brandKit.tone,
    phoneNumber: brandKit.phoneNumber,
    contactLocation: brandKit.contactLocation,
    website: brandKit.website,
  };

  const finalBuffer = await compositePoster({
    backgroundBuffer,
    brandKit: compositeBrandKit,
    copy,
    imageHasText,
    logoHandledByAI,
    addCTAFromSharp,
    width: format.width,
    height: format.height,
  });

  const ref = await postersRef(agencyId, clientId).add({
    agencyId,
    clientId,
    brandKitId,
    generatedBy: designerUid,
    approvalStatus: "draft" as ApprovalStatus,
    status: "generating",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const posterId = ref.id;

  const [backgroundImageUrl, imageUrl] = await Promise.all([
    uploadBufferToCloudinary(backgroundBuffer, cloudinaryFolder, `${posterId}_bg`),
    uploadBufferToCloudinary(finalBuffer, cloudinaryFolder, posterId),
  ]);

  await ref.update({
    imageUrl,
    backgroundImageUrl,
    originalImageUrl: imageUrl,
    headline: copy.headline,
    subheadline: copy.subheadline,
    body: copy.body,
    cta: copy.cta,
    hashtags: copy.hashtags ?? [],
    theme: recommendation?.theme ?? "General",
    topic: recommendation?.topic ?? "",
    status: "generated",
    version: 1,
    editHistory: [],
    platformFormatId: platformFormatId ?? null,
    width: format.width,
    height: format.height,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { posterId, imageUrl, copy };
}
