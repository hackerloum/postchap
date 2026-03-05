import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveStudioContext, hasClientAccess } from "@/lib/studio/auth";
import { brandKitsRef, listBrandKits } from "@/lib/studio/db";
import { getStudioPlanLimits } from "@/lib/studio-plans";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { clientId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied to this client" }, { status: 403 });
  }

  try {
    const kits = await listBrandKits(agency.id, clientId);
    return NextResponse.json({ kits });
  } catch (err) {
    console.error("[studio/brand-kits GET]", err);
    return NextResponse.json({ error: "Failed to fetch brand kits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { clientId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied to this client" }, { status: 403 });
  }

  if (!["owner", "manager", "designer"].includes(member.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.brandName || !body.industry) {
    return NextResponse.json({ error: "brandName and industry are required" }, { status: 400 });
  }

  // Check brand kit limit per client
  const limits = getStudioPlanLimits(agency.plan);
  if (limits.maxBrandKitsPerClient !== -1) {
    const countSnap = await brandKitsRef(agency.id, clientId).count().get();
    if (countSnap.data().count >= limits.maxBrandKitsPerClient) {
      return NextResponse.json(
        { error: "Brand kit limit reached for this client on your plan.", code: "KIT_LIMIT_REACHED" },
        { status: 403 }
      );
    }
  }

  // If this is the first kit, make it the default
  const existingCount = await brandKitsRef(agency.id, clientId).count().get();
  const isFirst = existingCount.data().count === 0;

  try {
    const docRef = await brandKitsRef(agency.id, clientId).add({
      agencyId: agency.id,
      clientId,
      kitPurpose: body.kitPurpose ?? "main",
      isDefault: body.isDefault ?? isFirst,
      brandName: body.brandName ?? "",
      industry: body.industry ?? "other",
      tagline: body.tagline ?? "",
      website: body.website ?? "",
      phoneNumber: body.phoneNumber ?? "",
      contactLocation: body.contactLocation ?? "",
      primaryColor: body.primaryColor ?? "#E8FF47",
      secondaryColor: body.secondaryColor ?? "#111111",
      accentColor: body.accentColor ?? "#FFFFFF",
      logoUrl: body.logoUrl ?? "",
      brandLocation: body.brandLocation ?? {
        country: "Unknown", countryCode: "XX", city: "", continent: "Global",
        timezone: "UTC", currency: "USD", languages: ["English"],
      },
      targetAudience: body.targetAudience ?? "",
      ageRange: body.ageRange ?? "",
      platforms: body.platforms ?? [],
      language: body.language ?? "en",
      tone: body.tone ?? "professional",
      styleNotes: body.styleNotes ?? "",
      sampleContent: body.sampleContent ?? "",
      restrictedWords: body.restrictedWords ?? [],
      approvedHashtagSets: body.approvedHashtagSets ?? [],
      enabled: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, kitId: docRef.id }, { status: 201 });
  } catch (err) {
    console.error("[studio/brand-kits POST]", err);
    return NextResponse.json({ error: "Failed to create brand kit" }, { status: 500 });
  }
}
