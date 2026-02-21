import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-verify";
import { adminAuth } from "@/lib/firebase/admin";
import { setUserHasOnboarded } from "@/lib/firebase/firestore";
import {
  createBrandKit,
  createPosterJob,
} from "@/lib/firebase/firestore";
import type { Industry, Platform, Language, Tone } from "@/types";

type Body = {
  brandName: string;
  industry: Industry;
  tagline?: string;
  website?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  targetAudience: string;
  ageRange: string;
  location: string;
  platforms: Platform[];
  language: Language;
  tone: Tone;
  styleNotes?: string;
  sampleContent?: string;
  competitors?: string;
};

export async function POST(request: NextRequest) {
  try {
    const uid = await verifyRequest(request);
    const body = (await request.json()) as Body;

    if (!body.brandName || !body.industry || !body.tone) {
      return NextResponse.json(
        { error: "Missing required fields: brandName, industry, tone" },
        { status: 400 }
      );
    }

    const brandKitData: Record<string, unknown> = {
      userId: uid,
      brandName: String(body.brandName).trim(),
      industry: body.industry,
      tagline: (body.tagline ?? "").trim(),
      primaryColor: body.primaryColor ?? "#000000",
      secondaryColor: body.secondaryColor ?? "#ffffff",
      accentColor: body.accentColor ?? "#E8FF47",
      targetAudience: (body.targetAudience ?? "").trim(),
      ageRange: (body.ageRange ?? "").trim(),
      location: (body.location ?? "Tanzania").trim(),
      platforms: Array.isArray(body.platforms) ? body.platforms : [],
      language: body.language ?? "en",
      tone: body.tone,
      styleNotes: (body.styleNotes ?? "").trim(),
      sampleContent: (body.sampleContent ?? "").trim(),
      competitors: (body.competitors ?? "").trim(),
      enabled: true,
    };
    if (body.website != null && String(body.website).trim() !== "") {
      brandKitData.website = String(body.website).trim();
    }
    if (body.logoUrl != null && String(body.logoUrl) !== "") {
      brandKitData.logoUrl = String(body.logoUrl);
    }

    const created = await createBrandKit(uid, brandKitData as Parameters<typeof createBrandKit>[1]);
    const brandKitId = created.id;

    await createPosterJob(uid, {
      userId: uid,
      brandKitId,
      enabled: true,
      posterSize: "1080x1080",
      timezone: "Africa/Dar_es_Salaam",
      preferredTime: "08:00",
    });

    try {
      await (adminAuth as unknown as { setCustomUserClaims: (u: string, c: object) => Promise<void> }).setCustomUserClaims(uid, { hasOnboarded: true });
    } catch {
      // Custom claims require IAM role; Firestore hasOnboarded is the source of truth
    }
    await setUserHasOnboarded(uid);

    return NextResponse.json({ success: true, brandKitId });
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : "Failed to complete onboarding";
    console.error("[onboarding/complete]", e);
    const safeDetail =
      process.env.NODE_ENV === "development"
        ? message
        : message.includes("Firebase Admin")
          ? "Server: Firebase Admin is not configured. Set FIREBASE_ADMIN_* env vars."
          : message.includes("PERMISSION_DENIED") || message.includes("permission")
            ? "Server: Database permission denied. Check Firestore rules."
            : undefined;
    return NextResponse.json(
      {
        error: "Failed to complete onboarding",
        detail: safeDetail,
      },
      { status: 500 }
    );
  }
}
