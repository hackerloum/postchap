import OpenAI from "openai";
import type { BrandKit, CopyData, OccasionContext } from "@/types/generation";

export async function generateImagePrompt(
  brandKit: BrandKit,
  copy: CopyData,
  occasionContext?: OccasionContext | null
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const openai = new OpenAI({ apiKey });

  const systemPrompt = `
You are an expert at writing prompts for AI image generation.
You write photorealistic background image prompts for
Freepik Mystic — a commercial image AI.

RULES:
- Describe ONLY the background scene or environment
- NO text, NO words, NO letters, NO logos in the prompt
- NO people unless essential to the concept
- Be specific about lighting, colors, mood, and composition
- Write 2-3 sentences maximum
- Use vivid, descriptive language
- The image must work as a poster background

Return ONLY the prompt text. Nothing else.
`.trim();

  const brandColors = [brandKit.primaryColor, brandKit.secondaryColor, brandKit.accentColor]
    .filter(Boolean)
    .join(", ");

  const userPrompt = `
Brand: ${brandKit.brandName}
Industry: ${brandKit.industry}
Primary colors: ${brandColors}
Country: ${brandKit.brandLocation?.country ?? "Africa"}
Continent: ${brandKit.brandLocation?.continent ?? "Africa"}
Poster headline: ${copy.headline}
Poster mood: ${brandKit.tone}

${occasionContext
  ? `
Occasion: ${occasionContext.name}
Visual mood: ${occasionContext.visualMood ?? ""}
Color suggestion: ${occasionContext.colorSuggestion?.join(", ") ?? ""}
The background MUST visually evoke ${occasionContext.name}.
Mood words to incorporate: ${occasionContext.visualMood ?? ""}
`
  : `
No specific occasion.
Create a professional background that represents
the ${brandKit.industry} industry in ${brandKit.brandLocation?.country ?? "Africa"}.
`}

Write the Freepik Mystic background image prompt now.
No text. No logos. No words. Just describe the visual scene.
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.9,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 400,
  });

  const prompt = response.choices[0]?.message?.content?.trim() ?? "";

  if (!prompt) {
    return `Professional ${brandKit.industry} business background, ${brandKit.brandLocation?.country ?? "African"} aesthetic, colors ${brandColors}, cinematic lighting, no text, no words, photorealistic`;
  }

  console.log("[Image Prompt]", prompt);
  return `${prompt}, no text, no words, no letters, no typography, no watermark`;
}
