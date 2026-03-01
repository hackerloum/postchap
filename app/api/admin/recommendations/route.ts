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

    const sessionSeed = Date.now().toString().slice(-4);

    const systemPrompt = `
You are a legendary creative director who has led campaigns for Apple, Nike, Notion, and Linear.
You think like a combination of David Droga (storytelling), Paula Scher (bold typography), and Dieter Rams (function-first design).

Your job: generate 6 poster concepts so different from each other they could each be from a different agency.
Each concept must have a completely unique visual language, emotional angle, and composition style.

FORBIDDEN — these overused tropes that AI keeps repeating:
- Globe or world map imagery
- Generic "spotlight on a dark background"
- Hands typing on keyboards
- Floating smartphone mockups with the app on screen
- Blue/purple gradient tech-bro backgrounds
- Rocket or "launch" metaphors
- Identical centred-text-over-image layouts for every card

Instead, think in diverse visual categories:
- Editorial / magazine spread
- Cinematic film poster
- Bold typographic poster (the TYPE is the design)
- Abstract conceptual art
- Human-emotion-first (a face, a reaction, a moment)
- Split composition (before/after, left/right contrast)
- Flat geometric / Bauhaus inspired
- Dark luxury / premium minimal
- Energetic street poster / urban
- Data becomes beautiful (infographic as art)

Return ONLY a valid JSON array. No markdown. No explanation. Raw JSON only.
`.trim();

    const userPrompt = `
Today is ${dateStr}. Session seed: ${sessionSeed}.

Generate 6 RADICALLY DIFFERENT marketing poster recommendations for ArtMaster.

PRODUCT: ArtMaster — AI that generates brand-consistent posters in seconds. No design skills needed.
Tagline: ${kit.tagline ?? "AI-powered poster generation for your brand"}
Target: ${kit.targetAudience ?? "Small business owners, marketers, creators, African & global businesses"}
Tone: ${kit.tone ?? "modern, bold, professional, approachable"}
Accent color: ${kit.accentColor ?? "electric lime green (#a3e635)"}

THE 6 CONCEPTS MUST EACH USE A COMPLETELY DIFFERENT VISUAL APPROACH:

Concept 1 — TYPOGRAPHIC POWER: The design IS the typography. Massive, oversized text dominates the entire frame. Almost no imagery — just type, color, and white space. Think Sagmeister & Walsh or Die Gestalten editorial design.

Concept 2 — HUMAN EMOTION: A real person's face or hands — the emotion tells the story. A business owner looking proud at their creation. A creator smiling at a phone screen. Raw authentic feeling. No stock-photo clichés.

Concept 3 — SPLIT DUALITY: Two-panel composition. Left side: chaotic, messy, old-school design process (sticky notes, stress, Canva clutter). Right side: ArtMaster — clean, instant, perfect. The contrast IS the message.

Concept 4 — DARK LUXURY MINIMAL: Pure dark background, one centered object or element bathed in dramatic directional light. Ultra-premium feel like a luxury product launch. Minimal text, maximum presence.

Concept 5 — ABSTRACT DATA / CONCEPT: AI and creativity visualized as something unexpected — circuits blooming into flowers, binary code forming a paintbrush, data streams morphing into a perfect poster. Conceptual and thought-provoking.

Concept 6 — URGENCY / LIMITED SOCIAL PROOF: Testimonial-style. A quote from a fictional satisfied user overlaid on a rich background. Social proof format — feels like a real person recommending it. Trust-building, FOMO-inducing.

For each concept return this object:
{
  "id": "rec_${sessionSeed}_N",
  "theme": "2-4 word theme name",
  "topic": "The specific focused message for this poster",
  "description": "Detailed brief: what exactly should this poster show, what emotion should the viewer feel, what action should they take. Be so specific a designer can execute it immediately. 3 sentences.",
  "suggestedHeadline": "Scroll-stopping headline — make it provocative, unexpected, or bold. Max 8 words. NOT generic like 'Create Stunning Posters'. Make it feel like a hit ad.",
  "suggestedCta": "Sharp CTA, max 5 words",
  "visualMood": "Highly specific art direction: exact lighting style, composition type, color palette (use names not hex), texture/material feel, photographic or illustrated, aspect ratio feeling. 2 sentences. Be a senior art director.",
  "urgency": "high | medium | low",
  "reason": "The strategic reason this concept will drive results for ArtMaster on ${dayOfWeek}. 1 sentence.",
  "hashtags": ["#ArtMaster", "#AIDesign", 2 more highly relevant hashtags],
  "category": "typography | emotion | comparison | luxury | abstract | social_proof"
}

QUALITY STANDARDS:
- suggestedHeadline must feel like it belongs on a billboard in NYC or Lagos — not a tech landing page
- visualMood must reference a specific visual style or director, e.g. "Kubrick symmetry", "Wes Anderson palette", "Bauhaus geometry", "Caravaggio lighting"
- Each of the 6 must be so visually different a viewer would never guess they're from the same brand kit
- description must be 3 full sentences with specific, actionable design direction

Return the JSON array now. Exactly 6 objects. Raw JSON only.
`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 1.1,
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
