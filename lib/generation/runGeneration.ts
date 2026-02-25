import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { generateCopy } from "@/lib/generation/generateCopy";
import { generateImagePrompt } from "@/lib/generation/generateImagePrompt";
import { generateImage } from "@/lib/freepik/generateImage";
import { imageToPrompt } from "@/lib/freepik/imageToPrompt";
import { improvePrompt } from "@/lib/freepik/improvePrompt";
import { downloadResource } from "@/lib/freepik/resources";
import { getPlatformFormat } from "@/lib/generation/platformFormats";
import { compositePoster } from "@/lib/sharp/compositePoster";
import { uploadBufferToCloudinary } from "@/lib/uploadToCloudinary";
import type { BrandKit, CopyData, Recommendation } from "@/types/generation";

/** Describe brand colors for the image prompt using color names only — never hex codes. */
function describeBrandColorsForPrompt(
  primary?: string,
  secondary?: string,
  accent?: string
): string {
  const parts: string[] = [];
  if (primary) parts.push(`primary ${hexToColorName(primary)}`);
  if (secondary) parts.push(`secondary ${hexToColorName(secondary)}`);
  if (accent) parts.push(`accent ${hexToColorName(accent)}`);
  return parts.length > 0 ? parts.join(", ") : "professional palette";
}

function hexToColorName(hex: string): string {
  const h = String(hex).replace(/^#/, "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return "neutral";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.2) return "dark";
  if (luminance > 0.85) return "light";
  const hue = getHue(r, g, b);
  if (hue <= 30 || hue >= 330) return "red or orange";
  if (hue <= 60) return "yellow or gold";
  if (hue <= 150) return "green";
  if (hue <= 210) return "cyan or teal";
  if (hue <= 270) return "blue";
  if (hue <= 330) return "purple or magenta";
  return "neutral";
}

function getHue(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return (h / 6) * 360;
}

/** Remove template/format labels so they are never rendered on the poster (e.g. A4-learning, POSTER A4 TEMPLATE). */
function stripTemplateLabelsFromPrompt(prompt: string): string {
  if (!prompt || typeof prompt !== "string") return prompt;
  let s = prompt;
  const removePhrases = [
    /\bA4-learning\b/gi,
    /\bA4\s*layout\b/gi,
    /\bPOSTER\s*A4\s*TEMPLATE\b/gi,
    /\bA4\s*template\b/gi,
    /\bA4\s*template\s*e-learning\b/gi,
    /\bE-learning\s*template\b/gi,
  ];
  for (const re of removePhrases) {
    s = s.replace(re, " ");
  }
  return s.replace(/\s+/g, " ").trim();
}

export interface RunGenerationResult {
  posterId: string;
  imageUrl: string;
  copy: CopyData;
}

/**
 * Run full poster generation for a user (brand kit → copy → image → composite → upload → save).
 * When templateId is provided: download template → image-to-prompt → improve prompt → generate → composite.
 * When inspirationImageUrl is provided: image-to-prompt on that URL → merge with brand/copy → improve → generate → composite.
 * Used by both POST /api/generate (authenticated) and the cron job (scheduled generation).
 */
export async function runGenerationForUser(
  uid: string,
  brandKitId: string,
  recommendation?: Recommendation | null,
  templateId?: string | number | null,
  platformFormatId?: string | null,
  inspirationImageUrl?: string | null
): Promise<RunGenerationResult> {
  const format = getPlatformFormat(platformFormatId);
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

  const colorDescription = describeBrandColorsForPrompt(
    brandKit.primaryColor,
    brandKit.secondaryColor,
    brandKit.accentColor
  );
  const baseCustomizations = [
    `Replace all text with: headline "${copy.headline}", CTA "${copy.cta}", brand name "${brandKit.brandName ?? ""}".`,
    `Use brand colors: ${colorDescription}. Describe colors by name only (e.g. orange, dark blue), never write hex codes or color codes on the poster.`,
    "Keep the same layout, style, and composition. No logos or emblems in the image; the brand logo will be added separately.",
    "Do not include any platform name, product name, or service name (e.g. Chuo AI, Artmaster) — only the user's brand name may appear.",
    "CRITICAL: Only the user's brand name, headline, and CTA may appear as text on the poster. Do not reproduce any other text or logos from a reference.",
  ];

  if (inspirationImageUrl != null && String(inspirationImageUrl).trim() !== "") {
    // Inspiration flow: image-to-prompt on user's image → merge with brand/copy → improve → generate
    const extractedPrompt = await imageToPrompt(inspirationImageUrl.trim());
    const customizations = [
      "This is a reference image. Use only its layout, composition, and visual style. Do not reproduce its text, logos, or exact colors.",
      ...baseCustomizations,
    ].join(". ");
    const cleanedExtracted = stripTemplateLabelsFromPrompt(extractedPrompt);
    const mergedPrompt = `${cleanedExtracted}. Create a new poster with the same layout and style: ${customizations}`;
    imagePrompt = await improvePrompt(mergedPrompt, { type: "image", language: "en" });
    imagePrompt = stripTemplateLabelsFromPrompt(imagePrompt);
  } else if (templateId != null && String(templateId).trim() !== "") {
    // Template flow: download → image-to-prompt → merge with user copy → improve → generate
    const { url: templateImageUrl } = await downloadResource(templateId, "jpg");
    const extractedPrompt = await imageToPrompt(templateImageUrl);
    const customizations = [
      `Change main text/headline to: "${copy.headline}"`,
      `CTA/button text: "${copy.cta}"`,
      `Brand name: "${brandKit.brandName ?? ""}"`,
      ...baseCustomizations.slice(1),
      "CRITICAL: Do not render any template title, format name, or watermark text (e.g. A4, A4-learning, POSTER A4 TEMPLATE). Only the user's brand name, headline, and CTA may appear as text on the poster.",
    ].join(". ");
    const cleanedExtracted = stripTemplateLabelsFromPrompt(extractedPrompt);
    const mergedPrompt = `${cleanedExtracted}. Customize for poster: ${customizations}`;
    imagePrompt = await improvePrompt(mergedPrompt, { type: "image", language: "en" });
    imagePrompt = stripTemplateLabelsFromPrompt(imagePrompt);
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

  const { buffer: backgroundBuffer, imageHasText } = await generateImage(imagePrompt, format.freepikAspectRatio);

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
    width: format.width,
    height: format.height,
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
