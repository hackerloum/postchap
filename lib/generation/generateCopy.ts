import OpenAI from "openai";
import type { BrandKit, CopyData, OccasionContext, Recommendation, Product, ProductIntent, ProductOverrides } from "@/types/generation";

interface ProductContext {
  product: Product;
  intent: ProductIntent;
  overrides?: ProductOverrides | null;
}

/** Language code to display name (for multi-language poster generation). */
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sw: "Swahili",
  fr: "French",
  ha: "Hausa",
  yo: "Yoruba",
  ar: "Arabic",
  pt: "Portuguese",
};

export async function generateCopy(
  brandKit: BrandKit,
  occasionContext?: OccasionContext | null,
  recommendation?: Recommendation | null,
  productContext?: ProductContext | null,
  platformFormatId?: string | null,
  posterLanguage?: string | null
): Promise<CopyData> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Copy generation is not available. Please try again later.");
  const openai = new OpenAI({ apiKey });

  const isWhatsApp = platformFormatId === "whatsapp_status";
  const platformNote = isWhatsApp
    ? `
CRITICAL — WhatsApp Status format:
- Headline: MAXIMUM 6 words. Must be readable on a 5-inch phone screen at small size.
- CTA: Use phone number (e.g. Call 0712 345 678) or WhatsApp link (e.g. Chat on WhatsApp). No generic CTAs like "Learn More".
- Subheadline: keep short (max 8 words) for mobile viewing.
- Body: concise. High contrast mentally — viewed in bright sunlight.`
    : "";

  const systemPrompt = `You are a senior copywriter at a top creative agency.
You write social media poster copy that is sharp, specific, and on-brand. Never write generic content.
Every word must be tailored to the exact brand below.
Output ONLY valid JSON. No explanation. No markdown. No code blocks. Just the raw JSON object.
JSON format: { "headline": "${isWhatsApp ? "max 6 words" : "max 6 words"}", "subheadline": "${isWhatsApp ? "max 8 words" : "max 12 words"}", "body": "2-3 lines", "cta": "max 4 words", "hashtags": ["#tag1", "#tag2"] } (8-12 tags)${platformNote}`;

  const brandContext = `BRAND: Name: ${brandKit.brandName} Industry: ${brandKit.industry} Tagline: ${brandKit.tagline || "none"} Tone: ${brandKit.tone} Language: ${brandKit.language ?? "en"} Target: ${brandKit.targetAudience || "general"} Country: ${brandKit.brandLocation?.country || "Global"} Continent: ${brandKit.brandLocation?.continent || "Global"} Currency: ${brandKit.brandLocation?.currency || "USD"} Languages: ${brandKit.brandLocation?.languages?.join(", ") || "English"} Style: ${brandKit.styleNotes || "none"} Sample: ${brandKit.sampleContent || "none"}`;

  const recSection = recommendation
    ? `
CONTENT DIRECTION (follow this closely):
  Theme: ${recommendation.theme}
  Topic: ${recommendation.topic}
  Description: ${recommendation.description}
  Use this headline as inspiration: "${recommendation.suggestedHeadline}"
  Use this CTA as inspiration: "${recommendation.suggestedCta}"
  Include these hashtags: ${recommendation.hashtags?.join(", ") ?? ""}

CRITICAL: The copy MUST be about "${recommendation.topic}".
Stay on this specific theme.
`.trim()
    : "";

  const occasionSection = recommendation
    ? recSection
    : occasionContext
      ? `OCCASION (write specifically for this): Name: ${occasionContext.name} Category: ${occasionContext.category ?? ""} Visual mood: ${occasionContext.visualMood ?? ""} Tone: ${occasionContext.messagingTone ?? ""}. CRITICAL: Copy MUST reference ${occasionContext.name} in ${brandKit.brandLocation?.country ?? "their market"}.`
      : `No specific occasion. Write evergreen content for ${brandKit.brandName}.`;

  const languageOverride =
    posterLanguage && posterLanguage !== "en"
      ? `CRITICAL — LANGUAGE: Write ALL copy in ${LANGUAGE_NAMES[posterLanguage] ?? posterLanguage}. Headline, subheadline, CTA, and hashtags must be in ${LANGUAGE_NAMES[posterLanguage] ?? posterLanguage}. Do NOT translate from English — write natively as a ${LANGUAGE_NAMES[posterLanguage] ?? posterLanguage} speaker would.`
      : "";

  // Product-mode: override the content direction with product context
  let userPrompt: string;
  if (productContext) {
    const { product, intent, overrides } = productContext;
    const urgencyNote = overrides?.urgency && overrides.urgency !== "none"
      ? `Urgency: ${overrides.urgency.replace(/_/g, " ")}`
      : "";
    const priceNote = overrides?.showPrice !== false
      ? `Price: ${product.priceLabel}${overrides?.showDiscount !== false && product.discountPriceLabel ? ` (was ${product.priceLabel}, now ${product.discountPriceLabel})` : ""}`
      : "";
    const intentRules: Record<ProductIntent, string> = {
      showcase: "Lead with product name and 2-3 benefits. Soft, inviting CTA. No hard-sell pressure.",
      promote:  "Price MUST appear in headline or subheadline. Hard sell CTA (e.g. Buy Now, Order Today). Include urgency if provided.",
      educate:  "Problem → Solution format. Explain how the product works in simple language. Soft CTA.",
      testimonial: "Write as a customer quote/testimonial. Include result or outcome. Social proof CTA.",
    };

    const productPrompt = `PRODUCT POSTER BRIEF:
Product: ${product.name}
Description: ${product.description}
${priceNote}
${urgencyNote}
Intent: ${intent}

COPY RULES FOR THIS INTENT:
${intentRules[intent]}

${brandContext}
${languageOverride ? `\n${languageOverride}\n` : ""}

Write product poster copy for ${brandKit.brandName}. Return only the JSON object.`;
    userPrompt = productPrompt;
  } else {
    userPrompt = `${brandContext}\n${occasionSection}${languageOverride ? `\n${languageOverride}\n` : ""}\nWrite copy for ${brandKit.brandName}. Return only the JSON object.`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.8,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 500,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const toParse = jsonMatch ? jsonMatch[0] : cleaned;

  /** Hex color pattern — must not appear as poster text (e.g. #d1700w) */
  const looksLikeHexColor = (s: string) => /^#[0-9a-fA-F]{5,8}$/.test(s.trim());

  try {
    const parsed = JSON.parse(toParse) as Record<string, unknown>;
    const rawHashtags = Array.isArray(parsed.hashtags)
      ? (parsed.hashtags as string[]).map((t) => (t.startsWith("#") ? t : `#${t}`))
      : [];
    const hashtags = rawHashtags.filter((t) => !looksLikeHexColor(t));

    let cta = (parsed.cta as string) ?? "Learn More";
    if (looksLikeHexColor(cta) || /\#[0-9a-fA-F]{5,8}/.test(cta)) {
      cta = "Learn More";
    }

    return {
      headline: ((parsed.headline as string) || brandKit.brandName) ?? "Headline",
      subheadline: (parsed.subheadline as string) ?? "",
      body: (parsed.body as string) ?? "",
      cta,
      hashtags,
    };
  } catch {
    throw new Error("Copy generation failed. Please try again.");
  }
}
