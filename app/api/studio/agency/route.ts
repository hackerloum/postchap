import { NextRequest, NextResponse } from "next/server";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { getAgencyForUser, createAgency, agencyRef } from "@/lib/studio/db";
import { FieldValue } from "firebase-admin/firestore";

async function getUid(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/** GET /api/studio/agency — get the current user's agency */
export async function GET(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agency = await getAgencyForUser(uid);
    if (!agency) {
      return NextResponse.json({ agency: null });
    }
    return NextResponse.json({ agency });
  } catch (err) {
    console.error("[studio/agency GET]", err);
    return NextResponse.json({ error: "Failed to fetch agency" }, { status: 500 });
  }
}

/** POST /api/studio/agency — create a new agency (onboarding) */
export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { agencyName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { agencyName } = body;

  if (!agencyName?.trim()) {
    return NextResponse.json({ error: "agencyName is required" }, { status: 400 });
  }

  // Check if user already has an agency
  const existing = await getAgencyForUser(uid);
  if (existing) {
    return NextResponse.json({ error: "You already have a Studio agency.", agency: existing }, { status: 409 });
  }

  // New agencies start on trial; upgrade via billing.
  const finalPlan: import("@/types/studio").StudioPlanId = "trial";

  try {
    const agency = await createAgency(uid, agencyName.trim(), finalPlan);
    return NextResponse.json({ success: true, agency }, { status: 201 });
  } catch (err) {
    console.error("[studio/agency POST]", err);
    return NextResponse.json({ error: "Failed to create agency" }, { status: 500 });
  }
}

/** PATCH /api/studio/agency — update agency settings */
export async function PATCH(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agency = await getAgencyForUser(uid);
  if (!agency) {
    return NextResponse.json({ error: "No agency found" }, { status: 404 });
  }

  if (agency.ownerId !== uid) {
    return NextResponse.json({ error: "Only the owner can update agency settings" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowed = ["agencyName", "portalBrandName", "portalLogoUrl", "portalAccentColor", "hidePoweredBy", "customSubdomain"];
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    await agencyRef(agency.id).update(updates);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[studio/agency PATCH]", err);
    return NextResponse.json({ error: "Failed to update agency" }, { status: 500 });
  }
}
