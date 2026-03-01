import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getAdminDb();
    const kitSnap = await db.doc("admin_config/artmaster_brand_kit").get();
    const kit = kitSnap.exists ? kitSnap.data()! : {};

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const dayOfWeek = today.toLocaleDateString("en-GB", { weekday: "long" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not available" }, { status: 503 });
    }
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `
You are a world-class SaaS marketing creative director and brand strategist.
You specialize in creating viral, high-converting social media campaigns for AI-powered software tools.
Your recommendations result in enterprise-grade posters that drive sign-ups, conversions, and brand awareness.

You understand:
- SaaS growth marketing (free trial conversion, feature spotlights, social proof)
- Visual storytelling for AI product marketing
- What makes a poster stop someone mid-scroll on Instagram
- Current digital design trends: bold typography, contrast, minimalism, motion feel

Return ONLY valid JSON array. No markdown. No explanation. Raw JSON only.
`.trim();

    const userPrompt = `
Today is ${dateStr} (${dayOfWeek}).

Generate 6 high-impact marketing poster recommendations for ArtMaster — an AI-powered poster generation platform for businesses and creators.

ARTMASTER BRAND:
  Product: AI poster generation SaaS
  Tagline: ${kit.tagline ?? "AI-powered poster generation for your brand"}
  Target audience: ${kit.targetAudience ?? "Small business owners, marketers, creators, African businesses"}
  Tone: ${kit.tone ?? "modern, bold, professional, approachable"}
  Colors: Primary ${kit.primaryColor ?? "#000"}, Accent ${kit.accentColor ?? "#a3e635"}
  Website: ${kit.website ?? "artmasterpro.com"}
  Style notes: ${kit.styleNotes ?? "Clean, high contrast, enterprise SaaS aesthetic"}

KEY SELLING POINTS TO LEVERAGE:
- AI generates ready-to-post posters in seconds
- No design skills needed
- Brand-consistent posters every time
- Supports Instagram, Facebook, LinkedIn, and more
- Affordable pricing with a free plan
- Built for African and global businesses

COMPETITOR CONTEXT (differentiate from):
- Canva (manual, time-consuming)
- Adobe Express (complex, expensive)
- Generic AI image tools (not brand-aware)

ARTMASTER'S ADVANTAGE TO HIGHLIGHT:
- Brand kit awareness (uses your colors, fonts, tone automatically)
- Poster-specific AI (not generic image gen)
- Schedule and auto-post built in
- Faster than any manual tool

Return exactly 6 recommendation objects:
[
  {
    "id": "unique_id",
    "theme": "Short theme (2-4 words)",
    "topic": "Specific focused topic for this poster",
    "description": "Exactly what this poster should communicate — be specific about the message, visual concept, and emotion it should trigger. 2-3 sentences.",
    "suggestedHeadline": "Punchy ready-to-use headline (max 7 words, must stop the scroll)",
    "suggestedCta": "Strong CTA (max 5 words)",
    "visualMood": "Detailed visual direction: lighting, composition, colors, style, mood. 1-2 sentences.",
    "urgency": "high | medium | low",
    "reason": "Why this exact poster angle works for ArtMaster's growth TODAY (${dayOfWeek}). 1 sentence.",
    "hashtags": ["#ArtMaster", "#AIDesign", "#relevant3", "#relevant4"],
    "category": "promotion | feature | social_proof | engagement | brand | comparison"
  }
]

RULES:
- At least 1 must show a direct comparison to manual design tools (Canva, etc.)
- At least 1 must highlight a specific ArtMaster feature (brand kit, scheduling, speed)
- At least 1 must focus on free trial / zero barrier to start
- At least 1 must be visually dramatic — bold, scroll-stopping
- Make the suggestedHeadline something genuinely compelling, not generic
- visualMood must be enterprise-grade: think Apple, Notion, Linear aesthetic
- Today is ${dayOfWeek} — reference timing if relevant (e.g. "Start your week", "Weekend content sorted")

Return the JSON array now. 6 items only. No other text.
`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.9,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "[]";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let recommendations: unknown[];
    try {
      recommendations = JSON.parse(cleaned) as unknown[];
    } catch {
      console.error("[admin/recommendations] Parse error:", cleaned);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("[admin/recommendations]", err);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
