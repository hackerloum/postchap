import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { generateCopy } from "@/lib/generation/generateCopy";
import { generateImage } from "@/lib/generation/imageProvider";
import { generateImagePrompt } from "@/lib/generation/generateImagePrompt";
import { imageToPrompt } from "@/lib/freepik/imageToPrompt";
import { improvePrompt } from "@/lib/freepik/improvePrompt";
import { downloadResource } from "@/lib/freepik/resources";
import { getPlatformFormat } from "@/lib/generation/platformFormats";
import { compositePoster } from "@/lib/sharp/compositePoster";
import { uploadBufferToCloudinary } from "@/lib/uploadToCloudinary";
import type { BrandKit, CopyData, Recommendation, Product, ProductIntent, ProductOverrides } from "@/types/generation";

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

/** If the prompt describes people/humans, append a rule so they are rendered realistically, not cartoon/anime. */
function ensureRealisticHumanStyle(prompt: string): string {
  if (!prompt || typeof prompt !== "string") return prompt;
  const lower = prompt.toLowerCase();
  const hasPerson =
    /\b(woman|man|women|men|person|people|portrait|girl|boy|human|figure|child|student|holding|smiling)\b/.test(lower) ||
    /\b(18|20|30)\s*[-]?\s*year\s*old\b/.test(lower);
  if (!hasPerson) return prompt;
  const suffix =
    " Photorealistic or high-quality refined style for all human figures. No cartoon, no anime, no simplistic illustration. Professional advertising quality.";
  return prompt.trim().endsWith(suffix.trim()) ? prompt : prompt.trim() + suffix;
}

/** When the prompt mentions people and we have brand location, append representation so people match the brand's market. */
function ensureRepresentationMatch(
  prompt: string,
  country?: string | null,
  continent?: string | null
): string {
  if (!prompt || typeof prompt !== "string") return prompt;
  const lower = prompt.toLowerCase();
  const hasPerson =
    /\b(woman|man|women|men|person|people|portrait|girl|boy|human|figure|child|face|holding|smiling)\b/.test(lower);
  if (!hasPerson || (!country && !continent)) return prompt;
  const place = [country, continent].filter(Boolean).join(", ") || "the brand's region";
  const suffix = ` All people and faces must reflect the brand's market: ${place}. Local, authentic representation. Do not default to generic Western representation.`;
  return prompt.trim().endsWith(suffix.trim()) ? prompt : prompt.trim() + suffix;
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
  inspirationImageUrl?: string | null,
  imageProviderId?: string | null,
  useImprovePrompt?: boolean,
  productId?: string | null,
  productIntent?: ProductIntent | null,
  productOverrides?: ProductOverrides | null
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
    phoneNumber: kitData.phoneNumber,
    contactLocation: kitData.contactLocation,
    website: kitData.website,
  };

  // Optionally load the product document for product-mode generation
  let product: Product | null = null;
  if (productId) {
    const productSnap = await db
      .collection("users").doc(uid).collection("brand_kits").doc(brandKitId)
      .collection("products").doc(productId).get();
    if (productSnap.exists) {
      const pd = productSnap.data()!;
      product = {
        id: productSnap.id,
        name:               pd.name          as string,
        description:        pd.description   as string,
        price:              pd.price         as number,
        currency:           pd.currency      as string,
        priceLabel:         pd.priceLabel    as string,
        discountPrice:      pd.discountPrice as number | undefined,
        discountPriceLabel: pd.discountPriceLabel as string | undefined,
        category:           pd.category      as string,
        images:             (pd.images       as string[]) ?? [],
        inStock:            pd.inStock       as boolean,
        tags:               (pd.tags         as string[]) ?? [],
      };
    }
  }

  const productContext = product
    ? { product, intent: productIntent ?? "showcase" as ProductIntent, overrides: productOverrides ?? null }
    : null;

  const copy: CopyData = await generateCopy(brandKit, null, product ? null : (recommendation ?? null), productContext);

  let imagePrompt: string;

  const colorDescription = describeBrandColorsForPrompt(
    brandKit.primaryColor,
    brandKit.secondaryColor,
    brandKit.accentColor
  );
  const HUMAN_STYLE_RULE =
    "CRITICAL style for any people or human figures: render in realistic, photographic, or high-quality refined digital art style. Do NOT use cartoon, anime, manga, or simplistic illustration for humans. Professional advertising quality.";

  const baseCustomizations = [
    "Preserve the exact layout and design: position of headline, action button, main visual, and any sections. Match the composition and structure of the reference.",
    `Replace all text with: headline text "${copy.headline}", action button label "${copy.cta}", brand name "${brandKit.brandName ?? ""}". NEVER write the words 'CTA', 'Subheadline', 'Headline:', 'Body text' or any field label as visible text on the poster.`,
    `Use brand colors: ${colorDescription}. Describe colors by name only (e.g. orange, dark blue), never write hex codes or color codes on the poster.`,
    "Keep the same layout, style, and composition. No logos or emblems in the image; the brand logo will be added separately.",
    "Do not include any platform name, product name, or service name (e.g. Chuo AI, Artmaster) — only the user's brand name may appear.",
    "CRITICAL: Only the user's brand name, headline, and action button text may appear as text on the poster. Do not reproduce any other text or logos from a reference.",
    HUMAN_STYLE_RULE,
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
    imagePrompt = ensureRealisticHumanStyle(imagePrompt);
  } else if (templateId != null && String(templateId).trim() !== "") {
    // Template flow: get prompt from selected (AI-generated) template, then modify with brand + copy
    // 1) Download template image → 2) extract style prompt (image-to-prompt) → 3) merge with brand colors, headline, CTA, brand name → 4) improve → 5) generate
    const { url: templateImageUrl } = await downloadResource(templateId, "jpg");
    const extractedPrompt = await imageToPrompt(templateImageUrl);
    // Merge template style with our brand: colors (colorDescription), copy (headline, CTA, brand name), layout rules, no template watermarks
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
    imagePrompt = ensureRealisticHumanStyle(imagePrompt);
  } else if (product) {
    // Product mode: build an image prompt that makes the product the visual hero
    const colorDescription = describeBrandColorsForPrompt(
      brandKit.primaryColor,
      brandKit.secondaryColor,
      brandKit.accentColor
    );
    const intentVisual: Record<string, string> = {
      showcase:    "Clean studio composition, product centered, soft light, premium feel.",
      promote:     "Bold, high-contrast layout with product prominent. Sense of urgency and excitement.",
      educate:     "Informational, clean layout with product visible and clear visual hierarchy.",
      testimonial: "Warm, trust-building aesthetic. Product with subtle lifestyle context.",
    };
    imagePrompt = [
      `Professional social media poster for ${brandKit.brandName}.`,
      `Product to feature: ${product.name}. ${product.description}`,
      `The product must be the VISUAL HERO of this poster.`,
      product.images?.length ? "Product reference image attached — use the actual product appearance faithfully. Do NOT invent or modify the product." : "",
      `Brand colors: ${colorDescription}. Describe colors by name only, never write hex codes on the poster.`,
      `Copy on poster: Headline "${copy.headline}". CTA "${copy.cta}". Brand name "${brandKit.brandName ?? ""}".`,
      `Do NOT include any other visible text. No template watermarks. No service names.`,
      intentVisual[productIntent ?? "showcase"] ?? intentVisual.showcase,
      "Photographic or high-quality digital art style. Clean, production-ready poster quality.",
    ].filter(Boolean).join(" ");
  } else {
    imagePrompt = await generateImagePrompt(brandKit, copy, null, recommendation ?? null);
    const shouldImprove =
      useImprovePrompt === true || (useImprovePrompt !== false && process.env.USE_FREEPIK_IMPROVE_PROMPT === "true");
    if (shouldImprove) {
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

  imagePrompt = ensureRepresentationMatch(
    imagePrompt,
    brandKit.brandLocation?.country,
    brandKit.brandLocation?.continent
  );

  // For product mode, pass the primary product photo as a visual reference to Gemini
  const productReferenceImageUrl = (product?.images?.length ?? 0) > 0
    ? (product!.images[0] ?? undefined)
    : undefined;

  const { buffer: backgroundBuffer, imageHasText, logoHandledByAI, addCTAFromSharp } = await generateImage(
    imagePrompt,
    format.freepikAspectRatio,
    imageProviderId,
    {
      brandName:          brandKit.brandName,
      logoUrl:            brandKit.logoUrl,
      primaryColor:       brandKit.primaryColor,
      secondaryColor:     brandKit.secondaryColor,
      accentColor:        brandKit.accentColor,
      // Pass inspiration image so Gemini can copy the layout directly from the visual reference
      inspirationImageUrl: (inspirationImageUrl != null && String(inspirationImageUrl).trim() !== "")
        ? String(inspirationImageUrl).trim()
        : productReferenceImageUrl,
      // Product reference (sent as visual hero instruction when in product mode)
      productImageUrl: productReferenceImageUrl,
      productName:     product?.name,
    }
  );

  const finalBuffer = await compositePoster({
    backgroundBuffer,
    brandKit: {
      brandName:       brandKit.brandName ?? "",
      primaryColor:    brandKit.primaryColor ?? "#E8FF47",
      secondaryColor:  brandKit.secondaryColor ?? "#111111",
      accentColor:     brandKit.accentColor ?? "#FFFFFF",
      logoUrl:         brandKit.logoUrl,
      tone:            brandKit.tone,
      phoneNumber:     brandKit.phoneNumber,
      contactLocation: brandKit.contactLocation,
      website:         brandKit.website,
    },
    copy: {
      headline:    copy.headline,
      subheadline: copy.subheadline,
      body:        copy.body,
      cta:         copy.cta,
      hashtags:    copy.hashtags ?? [],
    },
    imageHasText,
    logoHandledByAI,
    addCTAFromSharp,
    width:  format.width,
    height: format.height,
  });

  // Create Firestore doc first so we get a stable ID for both Cloudinary public_ids.
  const col = db.collection("users").doc(uid).collection("posters");
  const posterRef = await col.add({
    userId: uid,
    brandKitId,
    status: "generating",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const posterId = posterRef.id;

  // Upload both the background (for future recomposite) and the final composite.
  const [backgroundImageUrl, imageUrl] = await Promise.all([
    uploadBufferToCloudinary(
      backgroundBuffer,
      `artmaster/posters/${uid}`,
      `${posterId}_bg`
    ),
    uploadBufferToCloudinary(
      finalBuffer,
      `artmaster/posters/${uid}`,
      posterId
    ),
  ]);

  await posterRef.update({
    imageUrl,
    backgroundImageUrl,
    originalImageUrl: imageUrl,
    headline:    copy.headline,
    subheadline: copy.subheadline,
    body:        copy.body,
    cta:         copy.cta,
    hashtags:    copy.hashtags ?? [],
    theme:       product ? `Product: ${product.name}` : (recommendation?.theme ?? "General"),
    topic:       product ? (productIntent ?? "showcase") : (recommendation?.topic ?? ""),
    status:      "generated",
    version:     1,
    editHistory: [],
    platformFormatId: platformFormatId ?? null,
    productId:   productId ?? null,
    productIntent: productIntent ?? null,
    width:  format.width,
    height: format.height,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    posterId,
    imageUrl,
    copy,
  };
}
