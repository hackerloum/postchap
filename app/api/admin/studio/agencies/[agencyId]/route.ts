import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { agencyRef, clientsRef } from "@/lib/studio/db";
import { getMonthlyPosterLimit } from "@/lib/studio-plans";
import { isValidStudioPlanId } from "@/lib/studio-plans";
import type { StudioPlanId } from "@/types/studio";

/**
 * GET /api/admin/studio/agencies/[agencyId] — get one agency. Admin only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { agencyId } = await params;
  if (!agencyId) {
    return NextResponse.json({ error: "agencyId required" }, { status: 400 });
  }

  try {
    const snap = await agencyRef(agencyId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }
    const data = snap.data()!;
    const clientsSnap = await clientsRef(agencyId).get();
    const agency = {
      id: snap.id,
      ownerId: data.ownerId,
      agencyName: data.agencyName,
      plan: data.plan ?? "trial",
      monthlyPosterLimit: data.monthlyPosterLimit ?? 0,
      postersUsedThisMonth: data.postersUsedThisMonth ?? 0,
      postersResetAt: data.postersResetAt?.toMillis?.() ?? null,
      portalBrandName: data.portalBrandName,
      portalLogoUrl: data.portalLogoUrl,
      portalAccentColor: data.portalAccentColor,
      hidePoweredBy: data.hidePoweredBy,
      customSubdomain: data.customSubdomain,
      createdAt: data.createdAt?.toMillis?.() ?? null,
      updatedAt: data.updatedAt?.toMillis?.() ?? null,
      clientCount: clientsSnap.size,
    };
    return NextResponse.json({ agency });
  } catch (err) {
    console.error("[admin/studio/agencies/[id] GET]", err);
    return NextResponse.json({ error: "Failed to fetch agency" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/studio/agencies/[agencyId] — update agency (plan, limit, name). Admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { agencyId } = await params;
  if (!agencyId) {
    return NextResponse.json({ error: "agencyId required" }, { status: 400 });
  }

  const snap = await agencyRef(agencyId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  if (body.agencyName !== undefined) {
    if (typeof body.agencyName !== "string" || !body.agencyName.trim()) {
      return NextResponse.json({ error: "agencyName must be a non-empty string" }, { status: 400 });
    }
    updates.agencyName = body.agencyName.trim();
  }

  if (body.plan !== undefined) {
    if (!isValidStudioPlanId(body.plan)) {
      return NextResponse.json({ error: "Invalid plan. Use trial, starter, pro, or agency" }, { status: 400 });
    }
    updates.plan = body.plan as StudioPlanId;
    updates.monthlyPosterLimit = getMonthlyPosterLimit(body.plan as StudioPlanId);
  }

  if (body.monthlyPosterLimit !== undefined) {
    const n = Number(body.monthlyPosterLimit);
    if (!Number.isInteger(n) || n < -1) {
      return NextResponse.json({ error: "monthlyPosterLimit must be -1 (unlimited) or a non-negative integer" }, { status: 400 });
    }
    updates.monthlyPosterLimit = n;
  }

  if (body.postersUsedThisMonth !== undefined) {
    const n = Number(body.postersUsedThisMonth);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: "postersUsedThisMonth must be a non-negative integer" }, { status: 400 });
    }
    updates.postersUsedThisMonth = n;
  }

  try {
    await agencyRef(agencyId).update(updates);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/studio/agencies/[id] PATCH]", err);
    return NextResponse.json({ error: "Failed to update agency" }, { status: 500 });
  }
}
