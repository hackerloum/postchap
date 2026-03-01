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

  const hasBrandName = !!(brandKit.brandName && brandKit.brandName.trim());
  const styleNotes = brandKit.styleNotes ?? "";

  const systemPrompt = `
You are an expert at writing prompts for Seedream 4.5, an AI image model that excels at professional social media posters with text, typography, and branded visuals.

Seedream 4.5 has superior typography rendering. Your prompt must describe the COMPLETE POSTER in English and follow these rules:

${hasBrandName
  ? `1. INCLUDE TEXT EXPLICITLY — Write out the exact text to display: brand name, headline, tagline, CTA. Seedream can render them on the poster.`
  : `1. LOGO-ONLY BRANDING — Do NOT include any brand name, wordmark, or company name as text in the image. The poster's only text is the headline, subheadline if present, and CTA. The brand identity is provided via a logo overlay added after generation — leave the top-left corner (approx 220x100px) completely empty background only.`
}

2. SPECIFY TEXT PLACEMENT — Describe where each text appears: e.g. "headline in large bold type at center", "tagline at the bottom", "CTA button at bottom".

3. DEFINE COLOR PALETTE — Match brand colors: e.g. "rich dark brown and gold color palette", "dominant colors: [exact hex or names]".

4. DESCRIBE COMPOSITION & LAYOUT — "Clean modern layout", "subject centered", "minimalist design", "balanced negative space".

5. SET MOOD & LIGHTING — "Studio lighting", "warm ambient glow", "dramatic shadows", "soft diffused light".

6. ADD QUALITY KEYWORDS — "Professional", "high-end advertising quality", "premium feel", "production-ready", "commercial quality", "no watermarks".

6b. NO LOGOS OR EMBLEMS IN THE IMAGE — The image must NOT contain any logo, logo mark, emblem, crest, or brand symbol. Do not describe or request a logo in the scene. Do not put brand marks on objects (notebooks, devices, products, etc.). The real logo will be composited on top separately. Only the background, main visual, and text (headline/CTA) should appear.

7. DESCRIBE THE SUBJECT CLEARLY — What is the main visual element (product, person, scene, abstract) and style (photography, illustration, flat design).

8. CRITICAL — TEXT ON POSTER: Only the exact headline, tagline, and CTA phrase must appear as visible text. NEVER include hex color codes, technical IDs, or variable names. Use color NAMES only (e.g. orange, gold, dark brown), never hex codes. Do not include any platform/product/service name unless it IS the brand name explicitly provided.

9. FULL-BLEED BACKGROUND: The main image must fill the entire poster from edge to edge. No separate colored bars, panels, or strips at the bottom. The background is one continuous visual extending to all edges.

10. CLEAN BOTTOM EDGE: No footer artifacts, no small symbols or patterns at the bottom edge, no watermark symbols.
${styleNotes ? `\n11. ADDITIONAL BRAND DIRECTION: ${styleNotes}` : ""}

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

Create a professional social media poster${brandKit.brandName ? ` for ${brandKit.brandName}` : " (no brand name text — logo-only branding)"}.
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
${brandKit.brandName ? `- Brand name to show on poster: "${brandKit.brandName}".` : "- NO brand name text on poster — the logo image handles all branding. Do NOT render any brand name, wordmark, or title text."}
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
    return `Professional social media poster${brandKit.brandName ? ` for ${brandKit.brandName}` : ""}, a ${industry} brand in ${country}. Color scheme: ${colors}. Bold typography displaying "${copy.headline}" at center.${brandKit.brandName ? ` Brand name "${brandKit.brandName}" at top.` : " No brand name text — logo handles all branding."} CTA "${copy.cta}" at bottom. Clean modern layout. Professional, high-end advertising quality, production-ready, no watermarks.`;
  }

  console.log("[ImagePrompt] Generated:", prompt.slice(0, 150));
  return prompt;
}
