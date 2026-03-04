/**
 * Nano Banana — Gemini native image generation for poster creation.
 *
 * Models:
 * - gemini-3.1-flash-image-preview (Nano Banana 2): Best balance, 2K
 * - gemini-3-pro-image-preview (Nano Banana Pro): 4K, Thinking mode
 * - gemini-2.5-flash-image (Nano Banana): Fastest, high-volume
 *
 * When a brand logo is provided, it is sent as inline image data so
 * Gemini can integrate it naturally into the composition. Sharp then
 * skips the logo overlay step (logoHandledByAI = true).
 */

import { GoogleGenAI } from "@google/genai";
import { fetchImageAsBase64 } from "@/lib/freepik/generateImage";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/** Freepik aspect ratio → Gemini aspect ratio */
const FREEPIK_TO_GEMINI_ASPECT: Record<string, string> = {
  square_1_1: "1:1",
  social_post_4_5: "4:5",
  social_story_9_16: "9:16",
  standard_3_2: "3:2",
  widescreen_16_9: "16:9",
  portrait_2_3: "2:3",
};

export interface ImageGenResult {
  buffer: Buffer;
  imageHasText: boolean;
  /** True when Gemini received and integrated the logo — Sharp should skip re-compositing it */
  logoHandledByAI: boolean;
  /**
   * True when Sharp must add the CTA button overlay after generation.
   * Gemini is told NOT to draw a CTA box/rectangle — Sharp places it precisely instead.
   */
  addCTAFromSharp: boolean;
}

export interface GeminiBrandKit {
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  samplePosterUrl?: string;
  /** When provided, Gemini receives the inspiration image as inline data and copies its exact layout */
  inspirationImageUrl?: string;
}

function getGeminiAspectRatio(freepikAspectRatio: string): string {
  return FREEPIK_TO_GEMINI_ASPECT[freepikAspectRatio] ?? "1:1";
}

/** Wrap fetchImageAsBase64 output into Gemini's inlineData shape. */
async function imageUrlToInlineData(
  url: string
): Promise<{ data: string; mimeType: string } | null> {
  const result = await fetchImageAsBase64(url);
  if (!result) return null;
  return { data: result.base64, mimeType: result.mimeType };
}

/**
 * Append logo integration instructions to a base prompt when
 * the logo is being sent to Gemini as inline data.
 */
export function buildGeminiPromptWithLogo(
  basePrompt: string,
  brandKit: GeminiBrandKit
): string {
  const hasLogo = !!brandKit?.logoUrl;

  const logoInstruction = hasLogo
    ? `
LOGO INTEGRATION:
The brand logo has been provided as a visual reference above.
- Integrate it naturally into the top-left of the composition
- Use its color palette as the foundation for the entire design
- Match its visual weight and style energy
- Do NOT leave a blank dead zone — the logo is being composed by the AI
- Do NOT recreate, redraw, or modify the logo — render it exactly as shown
- Do NOT add effects, glows, or shadows to the logo itself
- Minimum logo size: roughly 15% of poster width
- Ensure the background behind the logo provides enough contrast
`.trim()
    : `
LOGO ZONE:
No logo provided.
- Top-left area (250px × 120px) must remain clean background only
- This zone will be used for brand name text overlay in post-processing
`.trim();

  const inspirationNote = brandKit?.inspirationImageUrl
    ? `\nINSPIRATION LAYOUT: The inspiration image was provided above — mirror its exact spatial layout, visual hierarchy, element positions, and compositional grid. Do NOT copy the inspiration's text, brand identity, or colors; only its layout structure.\n`
    : "";

  return `${basePrompt}
${inspirationNote}
${logoInstruction}

BOTTOM AREA — IMPORTANT: Render the CTA text naturally integrated into the composition as styled typography (e.g. bold text, or text with a small colored pill/underline). Do NOT draw a large standalone rectangle, box, or colored panel. The background must bleed fully to every edge. The CTA should look like part of the design, not a separate UI element.

BRAND COLORS (extracted from logo if provided):
Primary:   ${brandKit.primaryColor ?? "derive from logo"}
Secondary: ${brandKit.secondaryColor ?? "derive from logo"}
Accent:    ${brandKit.accentColor ?? "derive from logo"}

If logo colors contradict the brand colors above, PRIORITIZE the logo colors.
The logo is the source of truth for brand identity.`;
}

/**
 * Generate an image using a Gemini Nano Banana model.
 *
 * @param prompt               Final generation prompt
 * @param freepikAspectRatio   Aspect ratio in Freepik format
 * @param model                Full Gemini model id
 * @param brandKit             Optional brand kit for multimodal logo input
 */
export async function generateImageNanaBanana(
  prompt: string,
  freepikAspectRatio = "square_1_1",
  model = "gemini-2.5-flash-image",
  brandKit?: GeminiBrandKit
): Promise<ImageGenResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Image generation is not available. GEMINI_API_KEY is not configured."
    );
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const aspectRatio = getGeminiAspectRatio(freepikAspectRatio);

  // 3.x models support imageSize; 2.x do not
  const isGemini3 = model.startsWith("gemini-3");
  const config: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: isGemini3
      ? { aspectRatio, imageSize: "2K" }
      : { aspectRatio },
  };

  // Build multimodal content parts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];
  let logoSentToAI = false;

  // Part 0 — Inspiration image (if provided) — send BEFORE logo so Gemini understands layout first
  if (brandKit?.inspirationImageUrl) {
    const inspiration = await imageUrlToInlineData(brandKit.inspirationImageUrl);
    if (inspiration) {
      parts.push({ inlineData: { mimeType: inspiration.mimeType, data: inspiration.data } });
      parts.push({
        text: `LAYOUT REFERENCE (the image above): Study this poster's exact spatial layout — the position of visual elements, headline zone, body text zone, and brand mark placement. Mirror this exact compositional grid and visual hierarchy in the new poster. Do NOT copy its text, colors, logo, or brand identity — only the layout structure and spatial arrangement.`,
      });
      console.log("[NanaBanana] Inspiration image sent as inline layout reference");
    }
  }

  // Part 1 — Logo reference (if exists)
  if (brandKit?.logoUrl) {
    const logo = await imageUrlToInlineData(brandKit.logoUrl);
    if (logo) {
      parts.push({ inlineData: { mimeType: logo.mimeType, data: logo.data } });
      parts.push({
        text: `BRAND LOGO REFERENCE (the image above):
This is the exact logo for ${brandKit.brandName ?? "this brand"}.
- Study the logo's colors — use them as the PRIMARY color anchor for the entire design
- Study the logo's shapes and visual style — let it inform the design aesthetic
- Place the logo in the TOP-LEFT corner, clearly visible, respecting the design style
- The logo must look like it BELONGS in the composition, not stamped on top
- Minimum size: roughly 15% of poster width
- Ensure the background behind the logo provides enough contrast
- DO NOT recreate, redraw, or modify the logo — render it exactly as shown
- DO NOT add effects, glows, or shadows to the logo itself`,
      });
      logoSentToAI = true;
      console.log("[NanaBanana] Logo sent as inline data");
    }
  }

  // Part 2 — Sample poster reference (if exists)
  if (brandKit?.samplePosterUrl) {
    const sample = await imageUrlToInlineData(brandKit.samplePosterUrl);
    if (sample) {
      parts.push({
        inlineData: { mimeType: sample.mimeType, data: sample.data },
      });
      parts.push({
        text: `SAMPLE POSTER REFERENCE (the image above):
Study this poster's layout hierarchy and compositional energy.
Mimic: grid structure, text placement zones, visual balance.
Do NOT copy: the colors, copy, or brand elements.
Apply the same structural approach with ${brandKit.brandName ?? "this brand"}'s brand identity.`,
      });
    }
  }

  // Part 3 — Main generation prompt
  parts.push({ text: prompt });

  console.log("[NanaBanana] Model:", model);
  console.log("[NanaBanana] Prompt:", prompt.slice(0, 200));
  console.log("[NanaBanana] Aspect:", aspectRatio);
  console.log("[NanaBanana] Parts:", parts.length, "| Logo sent:", logoSentToAI);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any;
  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: config as any,
      });
      break;
    } catch (err) {
      const retryDelaySec = extractRetryDelay(err);
      const isQuota = isRateLimitError(err);
      if (isQuota && attempt < MAX_RETRIES && retryDelaySec > 0 && retryDelaySec <= 90) {
        console.warn(
          `[NanaBanana] Rate limited (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${retryDelaySec}s…`
        );
        await new Promise((r) => setTimeout(r, retryDelaySec * 1000));
        continue;
      }
      throw err;
    }
  }

  const candidates = (
    response as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            thought?: boolean;
            text?: string;
            inlineData?: { data?: string; mimeType?: string };
          }>;
        };
      }>;
    }
  ).candidates;

  if (!candidates?.[0]?.content?.parts) {
    throw new Error("Nano Banana: no image in response");
  }

  for (const part of candidates[0].content.parts) {
    if (part.thought) continue;
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      console.log("[NanaBanana] Success:", buffer.length, "bytes");
      return { buffer, imageHasText: true, logoHandledByAI: logoSentToAI, addCTAFromSharp: true };
    }
  }

  throw new Error("Nano Banana: no image data in response parts");
}

/** Keep old export name as alias for backward compat */
export const generateImageNanoBanana = generateImageNanaBanana;

export function isNanoBananaConfigured(): boolean {
  return Boolean(GEMINI_API_KEY);
}

/** Returns true for HTTP 429 / RESOURCE_EXHAUSTED Gemini errors. */
function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  if (/RESOURCE_EXHAUSTED/i.test(msg)) return true;
  if (/429/i.test(msg)) return true;
  const e = err as Record<string, unknown>;
  if (e?.status === 429 || e?.status === "RESOURCE_EXHAUSTED") return true;
  return false;
}

/**
 * Parses the `retryDelay` value (in seconds) from a Gemini ApiError.
 * The SDK embeds it in the error JSON as `details[].retryDelay: "50s"`.
 */
function extractRetryDelay(err: unknown): number {
  try {
    const msg = err instanceof Error ? err.message : String(err);
    const parsed = JSON.parse(
      msg.startsWith("{") ? msg : (msg.match(/(\{[\s\S]*\})/)?.[1] ?? "{}")
    );
    const details: Array<Record<string, unknown>> =
      parsed?.error?.details ?? parsed?.details ?? [];
    for (const detail of details) {
      if (typeof detail?.retryDelay === "string") {
        return parseInt(detail.retryDelay, 10) || 0;
      }
    }
  } catch {
    // ignore parse errors
  }
  return 0;
}
