import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-verify";
import { getBrandKit } from "@/lib/firebase/firestore";
import { getBrandLocation } from "@/lib/ai/locationContext";

/**
 * POST /api/occasions/questions
 * Body: { brandKitId: string, occasionName?: string, ... }
 * Uses brand's location for culturally relevant question generation (no hardcoded Tanzania).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyRequest(request);
    const body = await request.json().catch(() => ({}));
    const brandKitId = body.brandKitId as string | undefined;
    if (!brandKitId) {
      return NextResponse.json({ error: "Missing brandKitId" }, { status: 400 });
    }

    const brandKit = await getBrandKit(userId, brandKitId);
    if (!brandKit) {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }

    const loc = getBrandLocation(brandKit);
    const country = loc.country;
    const continent = loc.continent;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI not configured" },
        { status: 503 }
      );
    }

    const systemPrompt = `You are a creative director at a global branding agency with deep expertise in ${country}. You understand local culture, market dynamics, and consumer behavior in ${continent}.`;

    const userMessage = `Brand: ${brandKit.brandName}
Industry: ${brandKit.industry}
Brand location: ${loc.city ? loc.city + ", " : ""}${loc.country}
Continent: ${loc.continent}
Local currency: ${loc.currency}
Local languages: ${loc.languages?.join(", ") || "English"}
${body.occasionName ? `Occasion: ${body.occasionName}` : ""}

Generate creative brief questions for this brand.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "OpenAI request failed", details: err },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json(
      { error: "Request failed", details: String(e) },
      { status: 500 }
    );
  }
}
