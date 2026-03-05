import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveStudioContext, hasClientAccess } from "@/lib/studio/auth";
import { brandKitsRef, getBrandKit } from "@/lib/studio/db";

type Params = { params: Promise<{ clientId: string; kitId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { clientId, kitId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const kit = await getBrandKit(agency.id, clientId, kitId);
    if (!kit) return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    return NextResponse.json({ kit });
  } catch (err) {
    console.error("[studio/brand-kits/[kitId] GET]", err);
    return NextResponse.json({ error: "Failed to fetch brand kit" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { clientId, kitId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
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

  const allowed = [
    "kitPurpose", "isDefault", "brandName", "industry", "tagline", "website",
    "phoneNumber", "contactLocation", "primaryColor", "secondaryColor", "accentColor",
    "logoUrl", "brandLocation", "targetAudience", "ageRange", "platforms",
    "language", "tone", "styleNotes", "sampleContent", "restrictedWords", "approvedHashtagSets",
  ];

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    await brandKitsRef(agency.id, clientId).doc(kitId).update(updates);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[studio/brand-kits/[kitId] PATCH]", err);
    return NextResponse.json({ error: "Failed to update brand kit" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { clientId, kitId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (!["owner", "manager"].includes(member.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    await brandKitsRef(agency.id, clientId).doc(kitId).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[studio/brand-kits/[kitId] DELETE]", err);
    return NextResponse.json({ error: "Failed to delete brand kit" }, { status: 500 });
  }
}
