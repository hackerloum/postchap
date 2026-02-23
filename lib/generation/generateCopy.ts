import OpenAI from "openai";
import type { BrandKit, CopyData } from "@/types/generation";

export async function generateCopy(
  brandKit: BrandKit,
  theme: string,
  occasion: string,
  customPrompt: string
): Promise<CopyData> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a copywriter for social media marketing posters.
Output valid JSON only, with these exact keys: headline, subheadline, body, cta, hashtags.
- headline: short, punchy, max 8 words
- subheadline: supporting line, max 12 words
- body: 1-2 sentences for the poster body, optional
- cta: single call-to-action phrase (e.g. "Shop now", "Learn more")
- hashtags: array of 3-5 relevant hashtags without # symbol
Match the brand tone and industry. No other text, only the JSON object.`,
      },
      {
        role: "user",
        content: `Brand: ${brandKit.brandName}
Industry: ${brandKit.industry}
Tone: ${brandKit.tone ?? "professional"}
Theme/topic: ${theme}
Occasion: ${occasion}
Additional instructions: ${customPrompt || "None"}

Generate poster copy as JSON.`,
      },
    ],
    max_tokens: 500,
  });

  let raw = response.choices?.[0]?.message?.content?.trim() ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) raw = jsonMatch[0];
  if (!raw) throw new Error("OpenAI returned empty copy");

  const parsed = JSON.parse(raw) as CopyData;
  if (!parsed.headline || !parsed.cta) {
    throw new Error("OpenAI copy missing required fields");
  }
  if (!Array.isArray(parsed.hashtags)) parsed.hashtags = [];
  parsed.subheadline = parsed.subheadline ?? "";
  parsed.body = parsed.body ?? "";
  return parsed;
}
