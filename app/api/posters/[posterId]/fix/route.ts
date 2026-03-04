import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { compositePoster } from "@/lib/sharp/compositePoster";
import { uploadBufferToCloudinary } from "@/lib/uploadToCloudinary";
import { runGenerationForUser } from "@/lib/generation/runGeneration";
import type { Recommendation } from "@/types/generation";

export const maxDuration = 300;

type FixScope = "copy" | "style" | "full";

async function getUidFromRequest(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

async function classifyInstruction(
  instruction: string,
  currentCopy: { headline: string; subheadline: string; body: string; cta: string }
): Promise<{ scope: FixScope; updatedCopy?: Record<string, string> }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { scope: "copy" };

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    max_tokens: 400,
    messages: [
      {
        role: "system",
        content: `You are a poster-editing assistant. Given a user instruction and current poster copy, determine:
1. The fix scope: "copy" (only text changes), "style" (regenerate visual image), or "full" (full regeneration)
2. If scope is "copy", produce the updated copy fields.

Rules:
- Use "copy" for: headline changes, CTA changes, price corrections, typos, text tweaks
- Use "style" for: color changes, mood changes, visual style requests
- Use "full" for: complete redesign, different concept, completely different visual

Output ONLY valid JSON:
{
  "scope": "copy" | "style" | "full",
  "updatedCopy": {  // only when scope === "copy"
    "headline": "...",
    "subheadline": "...",
    "body": "...",
    "cta": "..."
  }
}`,
      },
      {
        role: "user",
        content: `Instruction: "${instruction}"

Current copy:
Headline: "${currentCopy.headline}"
Subheadline: "${currentCopy.subheadline}"
Body: "${currentCopy.body}"
CTA: "${currentCopy.cta}"

Classify and respond with JSON only.`,
      },
    ],
  });

  try {
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as {
      scope?: FixScope;
      updatedCopy?: Record<string, string>;
    };
    return {
      scope:       parsed.scope ?? "copy",
      updatedCopy: parsed.updatedCopy,
    };
  } catch {
    return { scope: "copy" };
  }
}

/**
 * POST /api/posters/[posterId]/fix
 * Apply a targeted fix using a natural-language instruction.
 *
 * Body: { instruction: string, scope?: "copy" | "style" | "full" }
 *
 * - scope "copy": GPT updates copy fields, then recomposites on existing background
 * - scope "style": runs full image generation with same copy, creates new poster
 * - scope "full": runs full generation pipeline, creates new poster
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { posterId: string } }
) {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { posterId } = params;
  if (!posterId) {
    return NextResponse.json({ error: "Poster ID required" }, { status: 400 });
  }

  let body: { instruction?: string; scope?: FixScope };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const instruction = body.instruction?.trim();
  if (!instruction) {
    return NextResponse.json({ error: "instruction is required" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const posterRef = db.collection("users").doc(uid).collection("posters").doc(posterId);
    const posterSnap = await posterRef.get();

    if (!posterSnap.exists) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }

    const d = posterSnap.data()!;
    const brandKitId = d.brandKitId as string | undefined;
    if (!brandKitId) {
      return NextResponse.json({ error: "Poster is missing brandKitId" }, { status: 400 });
    }

    const currentCopy = {
      headline:    (d.headline    as string) ?? "",
      subheadline: (d.subheadline as string) ?? "",
      body:        (d.body        as string) ?? "",
      cta:         (d.cta         as string) ?? "",
      hashtags:    (d.hashtags    as string[]) ?? [],
    };

    // Auto-classify scope if not provided
    const { scope, updatedCopy } = body.scope
      ? { scope: body.scope, updatedCopy: undefined }
      : await classifyInstruction(instruction, currentCopy);

    if (scope === "copy") {
      if (!d.backgroundImageUrl) {
        return NextResponse.json(
          { error: "This poster has no stored background image. Use 'style' or 'full' scope instead." },
          { status: 400 }
        );
      }

      // Merge GPT's updated copy with existing copy
      const mergedCopy = {
        headline:    updatedCopy?.headline    ?? currentCopy.headline,
        subheadline: updatedCopy?.subheadline ?? currentCopy.subheadline,
        body:        updatedCopy?.body        ?? currentCopy.body,
        cta:         updatedCopy?.cta         ?? currentCopy.cta,
        hashtags:    currentCopy.hashtags,
      };

      // Load brand kit for compositing
      const kitSnap = await db.collection("users").doc(uid).collection("brand_kits").doc(brandKitId).get();
      if (!kitSnap.exists) return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
      const kit = kitSnap.data()!;

      // Download background
      const bgRes = await fetch(d.backgroundImageUrl as string);
      if (!bgRes.ok) return NextResponse.json({ error: "Failed to download background" }, { status: 502 });
      const backgroundBuffer = Buffer.from(await bgRes.arrayBuffer());

      const width  = (d.width  as number) ?? 1080;
      const height = (d.height as number) ?? 1080;

      const finalBuffer = await compositePoster({
        backgroundBuffer,
        brandKit: {
          brandName:       (kit.brandName       as string) ?? "",
          primaryColor:    (kit.primaryColor     as string) ?? "#E8FF47",
          secondaryColor:  (kit.secondaryColor   as string) ?? "#111111",
          accentColor:     (kit.accentColor      as string) ?? "#FFFFFF",
          logoUrl:         kit.logoUrl           as string | undefined,
          tone:            kit.tone              as string | undefined,
          phoneNumber:     kit.phoneNumber       as string | undefined,
          contactLocation: kit.contactLocation   as string | undefined,
          website:         kit.website           as string | undefined,
        },
        copy: mergedCopy,
        width,
        height,
      });

      const currentVersion = (d.version as number) ?? 1;
      const newVersion = currentVersion + 1;

      const newImageUrl = await uploadBufferToCloudinary(
        finalBuffer,
        `artmaster/posters/${uid}`,
        `${posterId}_fix_v${newVersion}`
      );

      await posterRef.update({
        imageUrl:    newImageUrl,
        ...mergedCopy,
        version:     newVersion,
        editHistory: FieldValue.arrayUnion({
          version:     currentVersion,
          editedAt:    Date.now(),
          editType:    "fix",
          instruction,
          previousUrl: d.imageUrl as string,
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, scope: "copy", imageUrl: newImageUrl, copy: mergedCopy, version: newVersion });

    } else {
      // scope "style" or "full" — both run full generation and return a new poster
      const recommendation = d.theme && d.topic
        ? ({
            theme:             d.theme,
            topic:             d.topic,
            description:       d.topic,
            suggestedHeadline: scope === "style" ? currentCopy.headline : "",
            suggestedCta:      scope === "style" ? currentCopy.cta : "",
            visualMood:        instruction,
          } as Recommendation)
        : null;

      const result = await runGenerationForUser(
        uid,
        brandKitId,
        recommendation,
        null,
        (d.platformFormatId as string | null) ?? null,
        null,
        null,
        false,
        (d.productId as string | null) ?? null,
        null,
        null
      );

      await db.collection("users").doc(uid).collection("posters").doc(result.posterId).update({
        fixedFrom:   posterId,
        instruction,
        fixScope:    scope,
      });

      return NextResponse.json({ success: true, scope, posterId: result.posterId, imageUrl: result.imageUrl });
    }
  } catch (error) {
    console.error("[fix]", error);
    return NextResponse.json(
      { error: "Fix failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
