import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    const header = request.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await getAdminAuth().verifyIdToken(
      header.replace("Bearer ", "")
    );
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { brandKitId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { brandKitId } = body;

  if (!brandKitId) {
    return NextResponse.json(
      { error: "brandKitId required" },
      { status: 400 }
    );
  }

  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(brandKitId)
      .get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Brand kit not found" },
        { status: 404 }
      );
    }

    const kit = snap.data() as Record<string, unknown>;

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const kitLocation = kit.brandLocation as { continent?: string } | undefined;
    const continent = kitLocation?.continent ?? "Africa";

    const systemPrompt = `
You are a senior creative director and brand strategist
specializing in social media marketing for businesses
in ${continent}.

You give sharp, specific, actionable poster content
recommendations. Never generic. Always tailored to
the exact brand, location, and current date.

Return ONLY valid JSON. No markdown. No explanation.
No code blocks. Just the raw JSON array.

Return exactly 6 recommendation objects in this format:
[
  {
    "id": "unique_id_string",
    "theme": "Short theme name (2-4 words)",
    "topic": "Specific topic sentence",
    "description": "What the poster should say/show (2 sentences)",
    "suggestedHeadline": "A ready-to-use headline (max 6 words)",
    "suggestedCta": "Call to action (max 4 words)",
    "visualMood": "Description of visual style (1 sentence)",
    "urgency": "high | medium | low",
    "reason": "Why this is relevant TODAY (1 sentence)",
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "category": "promotion | occasion | engagement | brand | product | seasonal"
  }
]
`.trim();

    const location = kit.brandLocation as {
      country?: string;
      city?: string;
      continent?: string;
      currency?: string;
      languages?: string[];
    } | undefined;

    const userPrompt = `
Today is ${dateStr}.
Generate 6 poster content recommendations for this brand:

BRAND:
  Name: ${kit.brandName ?? ""}
  Industry: ${kit.industry ?? ""}
  Tagline: ${kit.tagline ?? "none"}
  Tone: ${kit.tone ?? ""}
  Style notes: ${kit.styleNotes ?? "none"}
  Sample content: ${kit.sampleContent ?? "none"}

AUDIENCE:
  Country: ${location?.country ?? "Unknown"}
  City: ${location?.city ?? "not specified"}
  Continent: ${location?.continent ?? "Africa"}
  Currency: ${location?.currency ?? "USD"}
  Languages: ${Array.isArray(location?.languages) ? location.languages.join(", ") : "English"}
  Target audience: ${kit.targetAudience ?? "general"}
  Platforms: ${Array.isArray(kit.platforms) ? kit.platforms.join(", ") : "Instagram, Facebook"}

RULES:
- Mix categories: include at least 1 promotion, 1 engagement,
  1 occasion/seasonal if relevant to today and their country
- Reference specific cultural moments, local events, or
  days of the week relevant to ${location?.country ?? "their market"}
- Use the brand's exact tone: ${kit.tone ?? "professional"}
- If today is Monday, reference the start of week energy
- If today is Friday, reference weekend/end of week
- Make suggestions feel urgent and timely for TODAY
- Reference local currency ${location?.currency ?? "USD"}
  where relevant for promotions
- Write for ${location?.country ?? "their"} market specifically

Return the JSON array now. 6 items. No other text.
`.trim();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 503 }
      );
    }
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.85,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "[]";
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let recommendations: unknown[];
    try {
      recommendations = JSON.parse(cleaned) as unknown[];
    } catch {
      console.error("[recommendations] Parse error:", cleaned);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("[recommendations]", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
