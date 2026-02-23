import OpenAI from "openai";
import type { BrandKit } from "@/types/generation";

export interface ContentIdea {
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  occasion: string | null;
}

export interface BrandAnalysis {
  score: number;
  strengths: string[];
  suggestions: string[];
  contentIdeas: ContentIdea[];
  bestTimeToPost: string;
  audienceInsight: string;
}

export async function analyzeBrandKit(brandKit: BrandKit): Promise<BrandAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const openai = new OpenAI({ apiKey });

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const systemPrompt =
    "You are a senior brand strategist. Analyze the brand kit. Return ONLY valid JSON: " +
    '{ "score": 0-100, "strengths": [], "suggestions": [], "contentIdeas": [{"title":"","description":"","urgency":"high|medium|low","occasion":null}], "bestTimeToPost": "", "audienceInsight": "" }';

  const userPrompt =
    `Brand: ${brandKit.brandName} Industry: ${brandKit.industry} Tagline: ${brandKit.tagline ?? "not set"} Tone: ${brandKit.tone} ` +
    `Target: ${brandKit.targetAudience ?? "not set"} Country: ${brandKit.brandLocation?.country ?? "Unknown"} ` +
    `Today: ${today}. Give score, strengths, suggestions, 3 poster ideas, best time to post, audience insight.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 800,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const toParse = jsonMatch ? jsonMatch[0] : cleaned;

  try {
    return JSON.parse(toParse) as BrandAnalysis;
  } catch {
    return {
      score: 60,
      strengths: ["Brand kit created"],
      suggestions: ["Add tagline", "Upload logo"],
      contentIdeas: [
        { title: "Brand intro", description: `Introduce ${brandKit.brandName ?? "your brand"}`, urgency: "high", occasion: null },
      ],
      bestTimeToPost: "7-9 AM and 6-8 PM local",
      audienceInsight: `Focus on ${brandKit.targetAudience ?? "your audience"}`,
    };
  }
}
