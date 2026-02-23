import OpenAI from "openai";
import type { BrandKit, CopyData, OccasionContext, Recommendation } from "@/types/generation";

export async function generateCopy(
  brandKit: BrandKit,
  occasionContext?: OccasionContext | null,
  recommendation?: Recommendation | null
): Promise<CopyData> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are a senior copywriter at a top creative agency.
You write social media poster copy that is sharp, specific, and on-brand. Never write generic content.
Every word must be tailored to the exact brand below.
Output ONLY valid JSON. No explanation. No markdown. No code blocks. Just the raw JSON object.
JSON format: { "headline": "max 6 words", "subheadline": "max 12 words", "body": "2-3 lines", "cta": "max 4 words", "hashtags": ["#tag1", "#tag2"] } (8-12 tags)`;

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

  const userPrompt = `${brandContext}\n${occasionSection}\nWrite copy for ${brandKit.brandName}. Return only the JSON object.`;

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

  try {
    const parsed = JSON.parse(toParse) as Record<string, unknown>;
    const hashtags = Array.isArray(parsed.hashtags)
      ? (parsed.hashtags as string[]).map((t) => (t.startsWith("#") ? t : `#${t}`))
      : [];
    return {
      headline: ((parsed.headline as string) || brandKit.brandName) ?? "Headline",
      subheadline: (parsed.subheadline as string) ?? "",
      body: (parsed.body as string) ?? "",
      cta: (parsed.cta as string) ?? "Learn More",
      hashtags,
    };
  } catch {
    throw new Error("Failed to parse OpenAI copy response: " + toParse.slice(0, 200));
  }
}
