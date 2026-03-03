import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import OpenAI from "openai";
import {
  buildRecommendationSystemPrompt,
  injectDeduplication,
} from "@/lib/generation/generateRecommendations";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db      = getAdminDb();
    const kitSnap = await db.doc("admin_config/artmaster_brand_kit").get();
    const kit     = kitSnap.exists ? kitSnap.data()! : {};

    const brandKit = {
      brandName:      (kit.brandName as string) ?? "ArtMaster",
      industry:       (kit.industry as string) ?? "technology",
      tone:           (kit.tone as string) ?? "modern, bold, professional",
      language:       (kit.language as string) ?? "English",
      targetAudience: (kit.targetAudience as string) ?? "Small business owners, marketers, creators, African & global businesses",
      brandLocation:  (kit.brandLocation as {
        country?: string;
        city?: string;
        continent?: string;
        currency?: string;
        languages?: string[];
      }) ?? { continent: "Africa" },
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not available" }, { status: 503 });
    }
    const openai = new OpenAI({ apiKey });

    // Admin has no per-brand history — pull global admin history to deduplicate
    let previousThemes: string[] = [];
    try {
      const historySnap = await db.doc("admin_config/recommendation_history").get();
      previousThemes = (historySnap.data()?.recentThemes as string[]) ?? [];
    } catch {
      // Non-critical
    }

    let systemPrompt = buildRecommendationSystemPrompt(brandKit, true);
    systemPrompt = injectDeduplication(systemPrompt, previousThemes);

    const response = await openai.chat.completions.create({
      model:       "gpt-4o",
      temperature: 1.15,
      top_p:       0.95,
      max_tokens:  2000,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate exactly 6 RADICALLY DIFFERENT poster concepts for ArtMaster. Return raw JSON array only.`,
        },
      ],
    });

    const raw     = response.choices[0]?.message?.content ?? "[]";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let recommendations: unknown[];
    try {
      recommendations = JSON.parse(cleaned) as unknown[];
    } catch {
      console.error("[admin/recommendations] Parse error:", cleaned.slice(0, 300));
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Persist themes for cross-session deduplication
    try {
      const themes = (recommendations as Array<{ theme?: string }>)
        .map((r) => r.theme ?? "")
        .filter(Boolean);
      const updated = [...themes, ...previousThemes].slice(0, 12);
      await db.doc("admin_config/recommendation_history").set({
        recentThemes: updated,
        updatedAt: new Date(),
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("[admin/recommendations]", err);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
