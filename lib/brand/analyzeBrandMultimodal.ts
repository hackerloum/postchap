/**
 * Multimodal Brand Analysis ("Eyes") — Gemini vision analyzes logo + store photos
 * to produce BrandDNA: dominantColors, aestheticProfile, layoutPreferences.
 */

import { GoogleGenAI } from "@google/genai";
import { fetchImageAsBase64 } from "@/lib/freepik/generateImage";
import type { BrandDNA, BrandKit } from "@/types/generation";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VISION_MODEL = "gemini-2.0-flash";
const MAX_STORE_PHOTOS = 3;

/** Input shape for analysis (subset of BrandKit + optional store photos). */
export interface AnalyzeBrandInput {
  logoUrl?: string | null;
  storePhotoUrls?: string[] | null;
  industry?: string | null;
  brandLocation?: { country?: string; city?: string; continent?: string } | null;
  brandName?: string | null;
}

/**
 * Run multimodal brand analysis: send logo and up to N store photos to Gemini,
 * get back BrandDNA (dominantColors, aestheticProfile, layoutPreferences).
 * Returns null on missing key, API error, or parse failure (caller continues without BrandDNA).
 */
export async function analyzeBrandMultimodal(
  input: AnalyzeBrandInput
): Promise<BrandDNA | null> {
  if (!GEMINI_API_KEY) {
    console.warn("[analyzeBrandMultimodal] GEMINI_API_KEY not set");
    return null;
  }

  const hasLogo = !!input.logoUrl?.trim();
  const storeUrls = (input.storePhotoUrls ?? []).filter((u) => typeof u === "string" && u.trim()).slice(0, MAX_STORE_PHOTOS);
  if (!hasLogo && storeUrls.length === 0) {
    return null;
  }

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (hasLogo) {
    const logoData = await fetchImageAsBase64(input.logoUrl!);
    if (logoData) {
      parts.push({
        inlineData: { mimeType: logoData.mimeType, data: logoData.base64 },
      });
      parts.push({
        text: "IMAGE 1 (above): Brand logo. Analyze its visual weight, dominant colors (extract as hex codes), and where it would naturally fit on a poster (e.g. top-left, center).",
      });
    }
  }

  for (let i = 0; i < storeUrls.length; i++) {
    const data = await fetchImageAsBase64(storeUrls[i]);
    if (data) {
      parts.push({
        inlineData: { mimeType: data.mimeType, data: data.base64 },
      });
      parts.push({
        text: `IMAGE ${i + 2} (above): Store or business photo. Analyze atmospheric lighting, mood, and any recurring colors or textures.`,
      });
    }
  }

  const location = [
    input.brandLocation?.city,
    input.brandLocation?.country,
    input.brandLocation?.continent,
  ]
    .filter(Boolean)
    .join(", ") || "unknown";
  const industry = input.industry ?? "general";

  parts.push({
    text: `
Based on the image(s) above (logo and/or store photos), return a single JSON object with no markdown or explanation:

{
  "dominantColors": ["#hex1", "#hex2", "#hex3"],
  "aestheticProfile": "Short label e.g. Nairobi Cyberpunk, Lagos Minimalist, Cape Town Coastal — 2-4 words capturing visual weight and atmosphere",
  "layoutPreferences": {
    "logoPosition": "top-left | center | top-right",
    "safeZone": "Brief description of where headline text should go e.g. top-center, lower-third"
  }
}

Rules:
- dominantColors: 2-5 hex codes actually visible in the logo/images. Use #RRGGBB format.
- aestheticProfile: Reflect the mood, lighting, and style (e.g. warm golden hour, neon urban, minimalist).
- layoutPreferences: Where the logo naturally fits; safeZone = best area for headline text to avoid overlapping key visual.
- Industry context: ${industry}. Location: ${location}.
- Return ONLY valid JSON, no code fence.`,
  });

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    let text = "";
    if (typeof (response as { text?: string }).text === "string") {
      text = (response as { text: string }).text.trim();
    } else {
      const cand = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
      const part = cand?.[0]?.content?.parts?.[0];
      if (part?.text) text = part.text.trim();
    }
    if (!text) {
      console.warn("[analyzeBrandMultimodal] Empty response");
      return null;
    }

    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const brandDna: BrandDNA = {
      dominantColors: Array.isArray(parsed.dominantColors)
        ? (parsed.dominantColors as string[]).filter((c) => typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c))
        : undefined,
      aestheticProfile:
        typeof parsed.aestheticProfile === "string" ? parsed.aestheticProfile.trim() : undefined,
      layoutPreferences: undefined,
    };

    if (parsed.layoutPreferences && typeof parsed.layoutPreferences === "object") {
      const lp = parsed.layoutPreferences as Record<string, unknown>;
      brandDna.layoutPreferences = {
        logoPosition: typeof lp.logoPosition === "string" ? lp.logoPosition : undefined,
        safeZone: typeof lp.safeZone === "string" ? lp.safeZone : undefined,
      };
    }

    console.log("[analyzeBrandMultimodal] OK", brandDna.aestheticProfile ?? "(no profile)");
    return brandDna;
  } catch (err) {
    console.warn("[analyzeBrandMultimodal] Failed:", err);
    return null;
  }
}

/**
 * Run multimodal analysis from a full BrandKit.
 * Uses logoUrl, storePhotoUrls, industry, brandLocation.
 */
export async function analyzeBrandKit(brandKit: BrandKit): Promise<BrandDNA | null> {
  return analyzeBrandMultimodal({
    logoUrl: brandKit.logoUrl,
    storePhotoUrls: brandKit.storePhotoUrls,
    industry: brandKit.industry,
    brandLocation: brandKit.brandLocation,
    brandName: brandKit.brandName,
  });
}
