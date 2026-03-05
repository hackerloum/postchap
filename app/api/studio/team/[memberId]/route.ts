import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveStudioContext, canManageTeam } from "@/lib/studio/auth";
import { teamRef, deleteUserAgency } from "@/lib/studio/db";
import type { TeamRole } from "@/types/studio";

type Params = { params: Promise<{ memberId: string }> };

const VALID_ROLES: TeamRole[] = ["manager", "designer", "reviewer", "intern"];

export async function PATCH(request: NextRequest, { params }: Params) {
  const { memberId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uid, agency, member } = ctx;

  if (!canManageTeam(member)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Cannot modify the owner
  if (memberId === agency.ownerId) {
    return NextResponse.json({ error: "Cannot modify the agency owner" }, { status: 403 });
  }

  let body: { role?: string; assignedClients?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (body.role) {
    if (!VALID_ROLES.includes(body.role as TeamRole)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 });
    }
    updates.role = body.role;
  }
  if (body.assignedClients !== undefined) updates.assignedClients = body.assignedClients;

  try {
    await teamRef(agency.id).doc(memberId).update(updates);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[studio/team/[memberId] PATCH]", err);
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { memberId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (member.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can remove team members" }, { status: 403 });
  }

  if (memberId === agency.ownerId) {
    return NextResponse.json({ error: "Cannot remove the agency owner" }, { status: 403 });
  }

  try {
    await teamRef(agency.id).doc(memberId).delete();
    await deleteUserAgency(memberId); // so getAgencyForUser no longer returns this agency
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[studio/team/[memberId] DELETE]", err);
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 });
  }
}
