import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import OpenAI from "openai";

async function getUid(request: NextRequest): Promise<string> {
  const header = request.headers.get("Authorization");
  const token =
    header?.startsWith("Bearer ")
      ? header.replace("Bearer ", "")
      : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

/** Partial brand kit as sent from edit form or wizard (camelCase). */
export interface CoachPayload {
  brandName?: string;
  industry?: string;
  tagline?: string;
  website?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  brandLocation?: {
    country?: string;
    countryCode?: string;
    city?: string;
    continent?: string;
    timezone?: string;
    currency?: string;
    languages?: string[];
  };
  targetAudience?: string;
  ageRange?: string;
  platforms?: string[];
  language?: string;
  tone?: string;
  styleNotes?: string;
  sampleContent?: string;
  /** Wizard step name for context: "brand" | "visual" | "audience" | "content" | "edit" */
  step?: string;
}

export interface CoachResponse {
  recommendations: string[];
  questions: string[];
  /** Optional suggested values for specific fields (e.g. tagline, tone) */
  suggestedFields?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CoachPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Coach is not available right now." },
      { status: 503 }
    );
  }

  const step = body.step ?? "edit";
  const stepContext: Record<string, string> = {
    brand: "User is on the Brand step: name, industry, tagline, website.",
    visual: "User is on the Visual step: colors and logo.",
    audience: "User is on the Audience step: country, city, target audience, platforms.",
    content: "User is on the Content step: tone, style notes, sample content.",
    edit: "User is editing an existing brand kit; get to know their brand deeply.",
  };

  const systemPrompt = `You are a friendly, expert brand strategist helping a business build their brand kit for poster and social content.

Current context: ${stepContext[step] ?? stepContext.edit}

Your job:
1. Give 2–4 short, actionable RECOMMENDATIONS based on what they've entered so far (e.g. "Add a tagline to make posters more memorable", "Your primary color works well for CTAs").
2. Ask 2–4 follow-up QUESTIONS to understand their brand better and in depth. Questions should feel conversational and help uncover: voice, audience, goals, do's and don'ts, and any cultural or local nuances. Be specific to their industry and location when possible.

Rules:
- Be concise. Each recommendation and question should be one sentence.
- If a field is empty or generic, ask a question to fill it in or clarify.
- If they've given rich detail, go deeper (e.g. ask about tone in specific situations, or local holidays).
- Never repeat the same idea. Vary recommendations and questions.
- Return ONLY valid JSON. No markdown, no code fences, no explanation outside JSON.

Return this exact JSON shape:
{
  "recommendations": ["string", "..."],
  "questions": ["string", "..."],
  "suggestedFields": {}
}

suggestedFields is optional. Use it only when you have a concrete suggestion (e.g. "tagline": "Fresh from farm to table" or "tone": "friendly"). Keys must be camelCase field names. Omit suggestedFields entirely if you have no suggestions.`;

  const location = body.brandLocation;
  const locationStr = location
    ? [
        location.country && `Country: ${location.country}`,
        location.city && `City: ${location.city}`,
        location.continent && `Continent: ${location.continent}`,
        location.currency && `Currency: ${location.currency}`,
        location.languages?.length && `Languages: ${location.languages.join(", ")}`,
      ]
        .filter(Boolean)
        .join(", ")
    : "Not set";

  const userPrompt = `Current brand kit (partial):

Brand name: ${body.brandName ?? "(empty)"}
Industry: ${body.industry ?? "(empty)"}
Tagline: ${body.tagline ?? "(empty)"}
Website: ${body.website ?? "(empty)"}
Location: ${locationStr}
Target audience: ${body.targetAudience ?? "(empty)"}
Platforms: ${Array.isArray(body.platforms) ? body.platforms.join(", ") : "(empty)"}
Tone: ${body.tone ?? "(empty)"}
Style notes: ${body.styleNotes ?? "(empty)"}
Sample content: ${body.sampleContent ?? "(empty)"}
Primary color: ${body.primaryColor ?? "(empty)"}
Secondary color: ${body.secondaryColor ?? "(empty)"}
Accent color: ${body.accentColor ?? "(empty)"}
Logo: ${body.logoUrl ? "Uploaded" : "Not uploaded"}

Generate recommendations and questions to know this customer's brand kit well and in depth. Return only the JSON object.`;

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 600,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const toParse = jsonMatch ? jsonMatch[0] : cleaned;

    const parsed = JSON.parse(toParse) as CoachResponse;
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const suggestedFields =
      parsed.suggestedFields && typeof parsed.suggestedFields === "object"
        ? parsed.suggestedFields
        : undefined;

    return NextResponse.json({
      recommendations,
      questions,
      ...(suggestedFields && Object.keys(suggestedFields).length > 0 ? { suggestedFields } : {}),
    });
  } catch (error) {
    console.error("[brand-kits/coach]", error);
    return NextResponse.json(
      {
        error: "Failed to get brand coach response",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
