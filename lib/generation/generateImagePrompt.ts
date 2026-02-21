/**
 * OpenAI-generated image prompt optimized for Freepik Mystic.
 * Mystic responds best to descriptive, photorealistic prompts.
 */

import type { BrandKit } from "@/types";
import { getBrandLocation } from "@/lib/ai/locationContext";

interface CopyData {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
}

export async function generateImagePrompt(
  brandKit: BrandKit,
  copy: CopyData
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const loc = getBrandLocation(brandKit);
  const locationContext =
    `Brand location: ${loc.country}${loc.city ? ` (${loc.city})` : ""}
Continent: ${loc.continent}
Visual context: The imagery should feel authentic and relevant to ${loc.country} audiences. Do not use generic stock photo aesthetics. Reflect the visual culture of ${loc.continent}.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at writing image generation prompts
for Freepik Mystic, a photorealistic AI image model.

Your job is to write a background-only image prompt for a social media
marketing poster. The image will have text and a logo composited on top
later, so the image must contain ZERO text, ZERO words, ZERO letters.

Rules for writing the prompt:
1. Describe a photorealistic background scene or composition
2. Include the brand's color palette naturally in the scene
3. Match the industry and tone of the brand
4. Leave visual space for text overlay (usually bottom 40% or center)
5. Specify lighting, mood, and composition clearly
6. End with: "no text, no words, no letters, no typography, no watermark"
7. Output ONLY the raw prompt string. No explanation. No quotes.

Prompt style: descriptive, visual, photorealistic.
Target model: Freepik Mystic.
Max length: 300 characters.`,
        },
        {
          role: "user",
          content: `Brand: ${brandKit.brandName}
Industry: ${brandKit.industry}
Primary color: ${brandKit.primaryColor}
Secondary color: ${brandKit.secondaryColor}
Accent color: ${brandKit.accentColor}
Tone: ${brandKit.tone}
Style notes: ${brandKit.styleNotes}
Poster headline: ${copy.headline}
Poster subheadline: ${copy.subheadline}

${locationContext}

Write the Freepik Mystic image prompt for the background of this poster.`,
        },
      ],
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI image prompt failed: ${response.status} ${err}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const prompt = data?.choices?.[0]?.message?.content?.trim();
  if (!prompt) throw new Error("OpenAI returned empty image prompt");

  return `${prompt}, no text, no words, no letters, no typography, no watermark`;
}
