import OpenAI from "openai";
import type { BrandKit, CopyData } from "@/types/generation";

export async function generateImagePrompt(
  brandKit: BrandKit,
  copy: CopyData
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You write image prompts for Freepik Mystic (photorealistic). " +
          "Write a background-only prompt for a marketing poster. " +
          "No text, words, or letters in the image (text is added later). " +
          "Describe scene, lighting, mood, brand colors. Leave space for text overlay. " +
          "End with: no text, no words, no letters, no typography, no watermark. " +
          "Output ONLY the raw prompt, max 300 chars, no quotes.",
      },
      {
        role: "user",
        content: `Brand: ${brandKit.brandName}. Industry: ${brandKit.industry}. ` +
          `Colors: ${brandKit.primaryColor}, ${brandKit.secondaryColor}, ${brandKit.accentColor}. ` +
          `Tone: ${brandKit.tone ?? "professional"}. Style: ${brandKit.styleNotes ?? ""}. ` +
          `Headline: ${copy.headline}. Subheadline: ${copy.subheadline}. ` +
          "Write the Mystic background image prompt.",
      },
    ],
    max_tokens: 400,
  });

  const prompt = response.choices?.[0]?.message?.content?.trim();
  if (!prompt) throw new Error("OpenAI returned empty image prompt");
  return `${prompt}, no text, no words, no letters, no typography, no watermark`;
}
