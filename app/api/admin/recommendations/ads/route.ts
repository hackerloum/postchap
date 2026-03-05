import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import OpenAI from "openai";
import { buildAdsRecommendationSystemPrompt } from "@/lib/generation/generateRecommendations";
import type { Recommendation } from "@/types/generation";

const DOC_PATH = "admin_config/ads_recommendations";

/**
 * GET — Return the last saved ads recommendations (if any).
 * Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = await getAdminDb().doc(DOC_PATH).get();
    const data = snap.exists ? snap.data() : null;
    const recommendations = (data?.recommendations as Recommendation[]) ?? [];
    const generatedAt = data?.generatedAt?.toMillis?.() ?? null;
    return NextResponse.json({
      recommendations,
      generatedAt,
    });
  } catch (err) {
    console.error("[admin/recommendations/ads] GET", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

/**
 * POST — Generate 6 conversion-focused (ads) recommendations via GPT,
 * save to Firestore, and return. Admin only.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not available" }, { status: 503 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const systemPrompt = buildAdsRecommendationSystemPrompt();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Generate exactly 6 conversion-focused poster concepts for ArtMaster. Return raw JSON array only.",
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "[]";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let recommendations: Recommendation[];
    try {
      const parsed = JSON.parse(cleaned) as unknown[];
      recommendations = parsed.map((r, i) => {
        const o = r as Record<string, unknown>;
        return {
          id: (o.id as string) ?? `ads_${Date.now()}_${i}`,
          theme: (o.theme as string) ?? "",
          topic: (o.topic as string) ?? "",
          description: (o.description as string) ?? "",
          suggestedHeadline: (o.suggestedHeadline as string) ?? "",
          suggestedCta: (o.suggestedCta as string) ?? "",
          visualMood: (o.visualMood as string) ?? "",
          urgency: (o.urgency as "high" | "medium" | "low") ?? "medium",
          reason: (o.reason as string) ?? "",
          hashtags: Array.isArray(o.hashtags) ? (o.hashtags as string[]) : [],
          category: (o.category as string) ?? "promotion",
        };
      });
    } catch {
      console.error("[admin/recommendations/ads] Parse error:", cleaned.slice(0, 300));
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const db = getAdminDb();
    await db.doc(DOC_PATH).set({
      recommendations,
      generatedAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      recommendations,
      generatedAt: Date.now(),
    });
  } catch (err) {
    console.error("[admin/recommendations/ads] POST", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate ads recommendations" },
      { status: 500 }
    );
  }
}
