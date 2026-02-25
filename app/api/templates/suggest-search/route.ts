import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import OpenAI from "openai";

/**
 * POST /api/templates/suggest-search
 * Body: { brandKitId: string }
 * Returns: { suggestions: string[] } — 6–8 short, specific search phrases for Freepik template search.
 */
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
      { error: "brandKitId is required" },
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
    const location = kit.brandLocation as {
      country?: string;
      continent?: string;
      languages?: string[];
    } | undefined;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Suggestions are not available right now." },
        { status: 503 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are an expert at writing search queries for a template/poster stock library (like Freepik).
Your job is to suggest SHORT, SPECIFIC search phrases (2–5 words each) that will return relevant poster/social media templates.

RULES:
- Each suggestion must be a search phrase a user would type into a template search box.
- Be specific: include style (e.g. minimal, modern, flat), use case (e.g. promo, event, education), or format (e.g. poster, banner, social) so the stock site returns good results.
- Match the brand's industry, tone, and audience. Use their country/region if it affects design (e.g. "Africa youth day poster").
- Output ONLY a JSON array of 6–8 strings. No markdown, no explanation, no code block. Example: ["e-learning poster minimal", "education promo blue", "event banner modern"]`;

    const userPrompt = `Generate 6–8 template search suggestions for this brand:

BRAND: ${kit.brandName ?? ""}
Industry: ${kit.industry ?? ""}
Tone: ${kit.tone ?? "professional"}
Tagline: ${kit.tagline ?? "none"}
Target audience: ${kit.targetAudience ?? "general"}
Country/region: ${location?.country ?? ""} ${location?.continent ?? ""}
Platforms: ${Array.isArray(kit.platforms) ? kit.platforms.join(", ") : "social media"}

Return only a JSON array of search phrases (strings). Each phrase 2–5 words, specific enough for a template search to return relevant poster designs.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
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

    let suggestions: unknown;
    try {
      suggestions = JSON.parse(cleaned);
    } catch {
      console.error("[templates/suggest-search] Parse error:", cleaned);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const list = Array.isArray(suggestions)
      ? suggestions
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => String(s).trim().slice(0, 80))
          .slice(0, 8)
      : [];

    return NextResponse.json({ suggestions: list });
  } catch (error) {
    console.error("[templates/suggest-search]", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
