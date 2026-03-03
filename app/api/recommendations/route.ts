import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import OpenAI from "openai";
import {
  buildRecommendationSystemPrompt,
  getPreviousThemes,
  saveThemes,
  injectDeduplication,
} from "@/lib/generation/generateRecommendations";

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
    return NextResponse.json({ error: "brandKitId required" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(brandKitId)
      .get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }

    const kit = snap.data() as Record<string, unknown>;

    const brandKit = {
      brandName:      (kit.brandName as string) ?? "",
      industry:       (kit.industry as string) ?? "",
      tone:           (kit.tone as string) ?? "professional",
      language:       (kit.language as string) ?? "English",
      targetAudience: (kit.targetAudience as string) ?? "general",
      brandLocation:  (kit.brandLocation as {
        country?: string;
        city?: string;
        continent?: string;
        currency?: string;
        languages?: string[];
      }) ?? {},
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Recommendations are not available right now." },
        { status: 503 }
      );
    }
    const openai = new OpenAI({ apiKey });

    // Build prompt with deduplication
    const previousThemes = await getPreviousThemes(db, uid, brandKitId);
    let systemPrompt = buildRecommendationSystemPrompt(brandKit, false);
    systemPrompt = injectDeduplication(systemPrompt, previousThemes);

    const response = await openai.chat.completions.create({
      model:       "gpt-4o",
      temperature: 1.0,
      top_p:       0.95,
      max_tokens:  2000,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate exactly 6 poster concepts for ${brandKit.brandName}. Return raw JSON array only.`,
        },
      ],
    });

    const raw     = response.choices[0]?.message?.content ?? "[]";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let recommendations: unknown[];
    try {
      recommendations = JSON.parse(cleaned) as unknown[];
    } catch {
      console.error("[recommendations] Parse error:", cleaned.slice(0, 300));
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Persist themes for cross-session deduplication
    const themes = (recommendations as Array<{ theme?: string }>)
      .map((r) => r.theme ?? "")
      .filter(Boolean);
    await saveThemes(db, uid, brandKitId, themes);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("[recommendations]", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
