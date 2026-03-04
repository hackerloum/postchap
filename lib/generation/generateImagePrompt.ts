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
  ? `1. INCLUDE TEXT EXPLICITLY — Write out the exact text to display: brand name, headline, and action-button text. Only include the tagline when it fits the concept (e.g. brand-identity or hero posters); for promos, events, or urgency-focused posters, omit the tagline to keep the layout clean. Seedream can render them on the poster.`
  : `1. LOGO-ONLY BRANDING — Do NOT include any brand name, wordmark, or company name as text in the image. The poster's only visible text is the headline and action-button text. The brand identity is provided via a logo overlay composited after generation. TOP-LEFT DEAD ZONE: the top-left area (approximately 250px wide × 120px tall) must be completely empty — pure background only, no icons, no arrows, no triangles, no shapes, no decorative elements of any kind.`
}

2. SPECIFY TEXT PLACEMENT — Describe where each text appears: e.g. "headline in large bold type at the top", "action button at bottom-left". Use natural prose, never field labels.

3. DEFINE COLOR PALETTE — Match brand colors: e.g. "rich dark brown and gold color palette". Use color names only, never hex codes.

4. DESCRIBE COMPOSITION & LAYOUT — "Clean modern layout", "subject centered", "minimalist design", "balanced negative space".

5. SET MOOD & LIGHTING — "Studio lighting", "warm ambient glow", "dramatic shadows", "soft diffused light".

6. ADD QUALITY KEYWORDS — "Professional", "high-end advertising quality", "premium feel", "production-ready", "commercial quality", "no watermarks".

6b. ABSOLUTELY NO LOGOS OR BRAND MARKS — The image must NOT contain any logo, wordmark, emblem, crest, icon, or brand symbol anywhere. This includes: on notebooks, devices, clothing, screens, papers, signs, boards, or any object a person is holding. If a person holds a sign or paper, it must be completely blank — no text, no logos, no marks on it. The real logo is composited on top after generation. Only the background scene, main visual subject, and the headline/action-button text may appear.

7. DESCRIBE THE SUBJECT CLEARLY — What is the main visual element (product, person, scene, abstract) and style (photography, illustration, flat design). When the poster includes people, faces, or human figures, describe them so they reflect the brand's market and country (e.g. East African person, person from Tanzania, West African woman). Use respectful, inclusive language. Do not default to generic Western representation — the audience should see themselves reflected.

8. CRITICAL — FORBIDDEN LABEL WORDS: NEVER write the literal words "Subheadline", "CTA", "Headline:", "Body text", "Body copy", "Tagline:" or any JSON field name as visible text in the prompt. Seedream renders everything literally — if you write the word "Subheadline" in the prompt, Seedream will print "Subheadline" on the poster. Instead describe the content naturally: instead of "Subheadline: maximize your learning", write "below the headline in smaller italic text: 'maximize your learning'". The action button must be described as "a button with the text '...'" or "an oval button labeled '...'", NEVER as "CTA: ..." or "CTA button text: ...".

9. ONLY EXACT TEXT ON POSTER: Only the exact headline, action-button phrase, and optionally the tagline may appear as visible text. NEVER include hex color codes, technical IDs, or variable names. Use color NAMES only. Do not include any platform/product/service name unless it IS the brand name explicitly provided.

10. FULL-BLEED BACKGROUND: The main image must fill the entire poster from edge to edge. No separate colored bars, panels, or strips at the bottom. The background is one continuous visual extending to all edges.

11. CLEAN BOTTOM EDGE: No footer artifacts, no small symbols or patterns at the bottom edge, no watermark symbols.
${styleNotes ? `\n12. ADDITIONAL BRAND DIRECTION: ${styleNotes}` : ""}

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
  const continent = brandKit.brandLocation?.continent ?? "";
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
${tagline ? `- Tagline (optional — include only for brand/identity-style posters; omit for promos, events, urgency): "${tagline}"` : ""}
`
    : `
Text to display on poster (use exactly):
- Headline: "${copy.headline}"
- CTA: "${copy.cta}"
${tagline ? `- Tagline (optional — include only when it fits the concept; omit if it would clutter the poster): "${tagline}"` : ""}
`;

  const userPrompt = `
Generate a Seedream 4.5 image generation prompt for this poster:

Brand: ${brandKit.brandName ? `"${brandKit.brandName}"` : "(no brand name — logo-only)"}.
Brand colors (use names only, no hex): ${colors}.
Industry: ${industry}. Country/market: ${country}${continent ? ` (${continent})` : ""}.
Style/tone: ${brandKit.tone ?? "professional"}, ${recommendation?.visualMood ?? "clean"}.
${tagline ? `Tagline (optional — use only for brand/identity-style posters): "${tagline}"` : ""}

EXACT TEXT TO DISPLAY ON POSTER:
- Large headline text: "${copy.headline}"
- Action button text: "${copy.cta}"
${tagline ? `- Tagline (only include if appropriate for this poster type): "${tagline}"` : ""}

IMPORTANT: In your prompt, refer to these as natural descriptions — e.g. "large bold headline '${copy.headline}' at the top", "a rounded action button with the label '${copy.cta}' at the bottom-left". NEVER write the word 'Subheadline', 'CTA', 'Headline:', or any field label as literal text — Seedream will print them on the poster.

Visual subject: Describe the main visual relevant to ${industry} in ${country}.
If people are shown: they must represent the brand's local market — ${country}${continent ? `, ${continent}` : ""}. No generic Western appearance.
${brandKit.brandName ? `Brand name "${brandKit.brandName}" must appear as text on the poster.` : "NO brand name text — logo handles all branding."}

${languageInstruction ? `\n${languageInstruction}\n` : ""}
${recContext}

Write the complete Seedream prompt now. Natural prose, max 400 words, output only the prompt.
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

  let prompt = response.choices[0]?.message?.content?.trim() ?? "";

  if (!prompt) {
    return `Professional social media poster${brandKit.brandName ? ` for ${brandKit.brandName}` : ""}, a ${industry} brand in ${country}. Color scheme: ${colors}. Bold typography displaying "${copy.headline}" at center.${brandKit.brandName ? ` Brand name "${brandKit.brandName}" at top.` : " No brand name text — logo handles all branding."} Action button labeled "${copy.cta}" at the bottom-left. Clean modern layout. Professional, high-end advertising quality, production-ready, no watermarks.`;
  }

  // Safety net: strip any leaked field-label words that Seedream would render literally.
  // These patterns catch "CTA:", "Subheadline:", "Headline:", "Body text:" etc.
  prompt = prompt
    .replace(/\bCTA\s*:/gi, "action button:")
    .replace(/\bCall[- ]to[- ]Action\s*:/gi, "action button:")
    .replace(/\bSubheadline\s*:/gi, "supporting text:")
    .replace(/\bSub[- ]headline\s*:/gi, "supporting text:")
    .replace(/\bHeadline\s*:/gi, "main text:")
    .replace(/\bBody\s*(text|copy)\s*:/gi, "description text:")
    .replace(/\bTagline\s*:/gi, "tagline text:");

  console.log("[ImagePrompt] Generated:", prompt.slice(0, 150));
  return prompt;
}
