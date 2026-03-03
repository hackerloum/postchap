/**
 * Nano Banana — Gemini native image generation for poster creation.
 *
 * Models:
 * - gemini-3.1-flash-image-preview (Nano Banana 2): Best balance, 2K
 * - gemini-3-pro-image-preview (Nano Banana Pro): 4K, Thinking mode
 * - gemini-2.5-flash-image (Nano Banana): Fastest, high-volume
 */

import { GoogleGenAI } from "@google/genai";

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
}

function getGeminiAspectRatio(freepikAspectRatio: string): string {
  return FREEPIK_TO_GEMINI_ASPECT[freepikAspectRatio] ?? "1:1";
}

/**
 * Generate an image using a Gemini Nano Banana model.
 * @param model  Full Gemini model id (e.g. "gemini-3.1-flash-image-preview")
 */
export async function generateImageNanoBanana(
  prompt: string,
  freepikAspectRatio = "square_1_1",
  model = "gemini-3.1-flash-image-preview"
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

  console.log("[NanaBanana] Model:", model);
  console.log("[NanaBanana] Prompt:", prompt.slice(0, 200));
  console.log("[NanaBanana] Aspect:", aspectRatio);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: config as any,
  });

  const candidates = (
    response as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            thought?: boolean;
            text?: string;
            inlineData?: { data?: string };
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
      return { buffer, imageHasText: true };
    }
  }

  throw new Error("Nano Banana: no image data in response parts");
}

export function isNanoBananaConfigured(): boolean {
  return Boolean(GEMINI_API_KEY);
}
