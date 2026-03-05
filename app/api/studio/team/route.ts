import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveStudioContext, canManageTeam, checkTeamMemberLimit } from "@/lib/studio/auth";
import { teamRef, listTeamMembers, invitesRef, setInviteTokenLookup } from "@/lib/studio/db";
import { getAdminDb } from "@/lib/firebase/admin";
import crypto from "crypto";
import type { TeamRole } from "@/types/studio";

const VALID_ROLES: TeamRole[] = ["manager", "designer", "reviewer", "intern"];

export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!canManageTeam(member)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const members = await listTeamMembers(agency.id);
    return NextResponse.json({ members });
  } catch (err) {
    console.error("[studio/team GET]", err);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

/** POST /api/studio/team — invite a new team member */
export async function POST(request: NextRequest) {
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

  let body: { email?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  if (!body.role || !VALID_ROLES.includes(body.role as TeamRole)) {
    return NextResponse.json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 });
  }

  // Check team member limit
  const currentMembers = await listTeamMembers(agency.id);
  const activeCount = currentMembers.filter((m) => m.inviteStatus === "active").length;
  if (!checkTeamMemberLimit(agency, activeCount)) {
    return NextResponse.json(
      { error: "Team member limit reached for your plan. Upgrade to add more team members.", code: "TEAM_LIMIT_REACHED" },
      { status: 403 }
    );
  }

  try {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const inviteRef = await invitesRef(agency.id).add({
      agencyId: agency.id,
      email: body.email.toLowerCase().trim(),
      role: body.role,
      invitedBy: uid,
      token,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
    });

    await setInviteTokenLookup(token, { agencyId: agency.id, inviteId: inviteRef.id, expiresAt });

    return NextResponse.json({
      success: true,
      inviteToken: token,
      inviteUrl: `/studio/join?token=${token}`,
    }, { status: 201 });
  } catch (err) {
    console.error("[studio/team POST]", err);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
