/**
 * Studio authorization helpers — server-only.
 * Resolves agency + role from a uid, and checks access to clients/features.
 */

import type { NextRequest } from "next/server";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { getAgencyForUser, getTeamMember, getAgency } from "@/lib/studio/db";
import type { StudioAgency, StudioTeamMember, TeamRole } from "@/types/studio";
import { getStudioPlanLimits } from "@/lib/studio-plans";

export interface StudioContext {
  uid: string;
  agency: StudioAgency;
  member: StudioTeamMember;
}

/**
 * Verify request auth and resolve studio agency + role.
 * Throws with a descriptive message if the user is not authenticated
 * or does not belong to any studio agency.
 */
export async function resolveStudioContext(request: NextRequest): Promise<StudioContext> {
  const decoded = await verifyRequestAuth(request);
  const uid = decoded.uid;

  const agency = await getAgencyForUser(uid);
  if (!agency) {
    throw new StudioAuthError("no_agency", "You do not have a Studio account. Create one at /studio/onboarding.");
  }

  const member = await getTeamMember(agency.id, uid);
  if (!member || member.inviteStatus !== "active") {
    throw new StudioAuthError("not_member", "You are not an active member of this Studio account.");
  }

  return { uid, agency, member };
}

export class StudioAuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "StudioAuthError";
  }
}

// ─── Role checks ─────────────────────────────────────────────────────────────

const ROLE_RANK: Record<TeamRole, number> = {
  owner: 5,
  manager: 4,
  designer: 3,
  reviewer: 2,
  intern: 1,
};

export function hasRole(member: StudioTeamMember, minimumRole: TeamRole): boolean {
  return ROLE_RANK[member.role] >= ROLE_RANK[minimumRole];
}

export function canGenerate(member: StudioTeamMember): boolean {
  return hasRole(member, "designer");
}

export function canManageClients(member: StudioTeamMember): boolean {
  return hasRole(member, "manager");
}

export function canManageBilling(member: StudioTeamMember): boolean {
  return hasRole(member, "owner");
}

export function canManageTeam(member: StudioTeamMember): boolean {
  return hasRole(member, "manager");
}

export function canApprove(member: StudioTeamMember): boolean {
  return hasRole(member, "reviewer");
}

/**
 * Check if a team member has access to a specific client.
 * Owners and managers see all clients; designers/reviewers/interns only their assigned ones.
 */
export function hasClientAccess(member: StudioTeamMember, clientId: string): boolean {
  if (hasRole(member, "manager")) return true;
  return member.assignedClients.includes(clientId);
}

// ─── Plan feature gates ───────────────────────────────────────────────────────

export function checkFeature(agency: StudioAgency, feature: keyof ReturnType<typeof getStudioPlanLimits>): boolean {
  const limits = getStudioPlanLimits(agency.plan);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return false;
}

export function checkClientLimit(agency: StudioAgency, currentClientCount: number): boolean {
  const limits = getStudioPlanLimits(agency.plan);
  if (limits.maxClients === -1) return true;
  return currentClientCount < limits.maxClients;
}

export function checkTeamMemberLimit(agency: StudioAgency, currentMemberCount: number): boolean {
  const limits = getStudioPlanLimits(agency.plan);
  if (limits.teamMembers === -1) return true;
  return currentMemberCount < limits.teamMembers;
}

// ─── Portal token auth ───────────────────────────────────────────────────────

/**
 * Verify a client portal token from the Authorization header (Bearer <token>)
 * or X-Portal-Token header. Returns { agencyId, clientId } if valid.
 */
export async function verifyPortalToken(
  request: NextRequest
): Promise<{ agencyId: string; clientId: string } | null> {
  const token =
    request.headers.get("X-Portal-Token") ??
    request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) return null;

  const db = (await import("@/lib/firebase/admin")).getAdminDb();
  const snap = await db
    .collectionGroup("clients")
    .where("portalToken", "==", token)
    .limit(1)
    .get();

  if (snap.empty) return null;
  if (!snap.docs[0].data().portalAccessEnabled) return null;

  const doc = snap.docs[0];
  const clientId = doc.id;
  const agencyId = doc.ref.parent.parent?.id;
  if (!agencyId) return null;

  return { agencyId, clientId };
}

// ─── Resolve agency by agencyId (for routes that have it in params) ──────────

export async function resolveStudioContextByAgencyId(
  request: NextRequest,
  agencyId: string
): Promise<StudioContext> {
  const decoded = await verifyRequestAuth(request);
  const uid = decoded.uid;

  const agency = await getAgency(agencyId);
  if (!agency) {
    throw new StudioAuthError("not_found", "Studio agency not found.");
  }

  const member = await getTeamMember(agencyId, uid);
  if (!member || member.inviteStatus !== "active") {
    throw new StudioAuthError("not_member", "You are not an active member of this Studio account.");
  }

  return { uid, agency, member };
}
