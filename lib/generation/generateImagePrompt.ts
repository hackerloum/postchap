import OpenAI from "openai";
import type {
  BrandKit,
  CopyData,
  OccasionContext,
  Recommendation,
} from "@/types/generation";

/** ISO 639-1 codes we treat as "non-English" for poster text display instructions */
const NON_ENGLISH_CODES = new Set([
  "sw", "ar", "fr", "es", "pt", "de", "ha", "am", "zh", "ja", "hi", "ko",
]);

function isNonEnglishDisplay(lang: string | undefined): boolean {
  if (!lang) return false;
  const code = lang.split("-")[0].toLowerCase();
  return code !== "en" && (NON_ENGLISH_CODES.has(code) || code.length === 2);
}

export async function generateImagePrompt(
  brandKit: BrandKit,
  copy: CopyData,
  _occasionContext?: OccasionContext | null,
  recommendation?: Recommendation | null
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Image prompt generation is not available. Please try again later.");
  const openai = new OpenAI({ apiKey });

  const systemPrompt = `
You are an expert at writing prompts for Seedream 4.5, an AI image model that excels at professional social media posters with text, typography, and branded visuals.

Seedream 4.5 has superior typography rendering. Your prompt must describe the COMPLETE POSTER in English and follow these rules:

1. INCLUDE BRAND NAME & TEXT EXPLICITLY — Write out the exact text to display: brand name, headline, tagline, CTA. Seedream can render them on the poster.

2. SPECIFY TEXT PLACEMENT — Describe where each text appears: e.g. "brand name centered at the top", "headline in large bold type at center", "tagline at the bottom", "CTA button at bottom right".

3. DEFINE COLOR PALETTE — Match brand colors: e.g. "rich dark brown and gold color palette", "dominant colors: [exact hex or names]".

4. DESCRIBE COMPOSITION & LAYOUT — "Clean modern layout", "subject centered", "minimalist design", "balanced negative space".

5. SET MOOD & LIGHTING — "Studio lighting", "warm ambient glow", "dramatic shadows", "soft diffused light".

6. ADD QUALITY KEYWORDS — "Professional", "high-end advertising quality", "premium feel", "production-ready", "commercial quality", "no watermarks".

6b. NO LOGOS OR EMBLEMS IN THE IMAGE — The image must NOT contain any logo, logo mark, emblem, crest, or brand symbol. Do not describe or request a logo in the scene. Do not put brand marks on objects (notebooks, devices, products, etc.). The user's real logo will be added separately on top of the image. Only the background, main visual, and text (headline/CTA) should appear.

7. DESCRIBE THE SUBJECT CLEARLY — What is the main visual element (product, person, scene, abstract) and style (photography, illustration, flat design).

8. CRITICAL — TEXT ON POSTER: Only the exact headline, tagline, and CTA phrase (e.g. "Start Learning") must appear as visible text. NEVER include hex color codes (e.g. #d1700w), technical IDs, or variable names on the poster. When describing colors for the image, use color NAMES only (e.g. orange, gold, dark brown), never hex codes in quotes or as button text.

9. FULL-BLEED BACKGROUND: The main image (photo, illustration, or gradient) must fill the entire poster from edge to edge. Do not describe separate colored bars, panels, or strips at the bottom. No orange/white/brown rectangular blocks below the main image. The background is one continuous visual that extends to all edges.

10. CLEAN BOTTOM EDGE: No footer artifacts, no small symbols or patterns at the bottom edge, no watermark symbols, no letter-like shapes at the very bottom.

Write the prompt in English only. Maximum 400 words. Return ONLY the prompt, no explanation or quotes around the whole thing.
`.trim();

  const colors = [
    brandKit.primaryColor,
    brandKit.secondaryColor,
    brandKit.accentColor,
  ]
    .filter(Boolean)
    .join(", ");
  const country = brandKit.brandLocation?.country ?? "Africa";
  const industry = brandKit.industry ?? "business";
  const tagline = brandKit.tagline ?? "";
  const displayLang =
    brandKit.language ??
    brandKit.brandLocation?.languages?.[0] ??
    "en";
  const copyInOtherLanguage = isNonEnglishDisplay(displayLang);

  const languageInstruction = copyInOtherLanguage
    ? `
IMPORTANT — The headline and CTA may be in another language (e.g. Swahili). In your English prompt, specify the EXACT text to display in quotes so Seedream can render it correctly. Example: "The headline 'Karibu Dukani' displayed prominently at the top in bold sans-serif", "CTA button text 'Soma Zaidi' at the bottom". Do not translate the copy; use the exact headline and CTA text as given below.
`.trim()
    : "";

  const recContext = recommendation
    ? `
Poster theme: ${recommendation.theme}
Poster topic: ${recommendation.topic}
Visual mood: ${recommendation.visualMood ?? "professional"}
Content: ${recommendation.description}

Text to display on poster (use exactly):
- Headline: "${copy.headline}"
- CTA: "${copy.cta}"
${tagline ? `- Tagline: "${tagline}"` : ""}
`
    : `
Text to display on poster (use exactly):
- Headline: "${copy.headline}"
- CTA: "${copy.cta}"
${tagline ? `- Tagline: "${tagline}"` : ""}
`;

  const userPrompt = `
Create a Seedream 4.5 prompt using this template structure:

Create a professional social media poster for ${brandKit.brandName ?? "the brand"}.
Brand colors (describe using color NAMES only in the prompt, e.g. orange/gold/dark — do not put hex codes like #xxxxx as text on the poster): ${colors}.
Main headline: "${copy.headline}" — specify where it appears (e.g. centered at top, large bold).
${tagline ? `Tagline: "${tagline}" — specify placement (e.g. below headline or at bottom).` : ""}
CTA: "${copy.cta}" — specify placement (e.g. button at bottom, bottom right).
Visual subject: Describe the main visual (scene, product, or abstract) relevant to ${industry} in ${country}.
Style: ${brandKit.tone ?? "professional"}, ${recommendation?.visualMood ?? "clean"}.
Background: Describe the background (e.g. gradient, photo, minimal).
Lighting: e.g. studio lighting, warm ambient glow, soft shadows.
Quality: professional, high-end advertising, clean layout, production-ready, no watermarks. Do NOT include any logo, emblem, or brand mark in the image — the user's logo is added separately. No logos on objects (notebooks, tablets, etc.). Full-bleed: the main background must extend to all four edges with no separate bottom panels or colored bars.

Additional context:
- Industry: ${industry}. Country/market: ${country}.
- Brand name to show on poster: "${brandKit.brandName ?? ""}".
${languageInstruction ? `\n${languageInstruction}\n` : ""}

${recContext}

Write the complete poster prompt now. Be specific about text placement, colors, and composition. Max 400 words. Output only the prompt.
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 800,
  });

  const prompt = response.choices[0]?.message?.content?.trim() ?? "";

  if (!prompt) {
    return `Professional social media poster for ${brandKit.brandName ?? "brand"}, a ${industry} brand in ${country}. Color scheme: ${colors}. Bold typography displaying "${copy.headline}" at center. Brand name "${brandKit.brandName ?? ""}" at top. CTA "${copy.cta}" at bottom. Clean modern layout. Professional, high-end advertising quality, production-ready, no watermarks.`;
  }

  console.log("[ImagePrompt] Generated:", prompt.slice(0, 150));
  return prompt;
}
