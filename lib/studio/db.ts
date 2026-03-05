/**
 * Studio Firestore helpers — server-only.
 * All reads/writes go to studio_agencies/{agencyId}/... paths.
 */

import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getStudioPlanLimits, getMonthlyPosterLimit } from "@/lib/studio-plans";
import type {
  StudioAgency,
  StudioTeamMember,
  StudioClient,
  StudioBrandKit,
  StudioPoster,
  StudioApproval,
  StudioPlanId,
} from "@/types/studio";

// ─── Agency ─────────────────────────────────────────────────────────────────

export function agencyRef(agencyId: string) {
  return getAdminDb().collection("studio_agencies").doc(agencyId);
}

export function teamRef(agencyId: string) {
  return getAdminDb().collection("studio_agencies").doc(agencyId).collection("team");
}

export function clientsRef(agencyId: string) {
  return getAdminDb().collection("studio_agencies").doc(agencyId).collection("clients");
}

export function brandKitsRef(agencyId: string, clientId: string) {
  return clientsRef(agencyId).doc(clientId).collection("brand_kits");
}

export function postersRef(agencyId: string, clientId: string) {
  return clientsRef(agencyId).doc(clientId).collection("posters");
}

export function approvalsRef(agencyId: string, clientId: string, posterId: string) {
  return postersRef(agencyId, clientId).doc(posterId).collection("approvals");
}

export function invitesRef(agencyId: string) {
  return getAdminDb().collection("studio_agencies").doc(agencyId).collection("invites");
}

export function referralsRef(agencyId: string) {
  return getAdminDb().collection("studio_agencies").doc(agencyId).collection("referrals");
}

/** One doc per user: { agencyId }. Used to resolve agency without collection-group queries (no index required). */
export function userAgencyRef(uid: string) {
  return getAdminDb().collection("studio_user_agency").doc(uid);
}

export async function setUserAgency(uid: string, agencyId: string): Promise<void> {
  await userAgencyRef(uid).set({ agencyId, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteUserAgency(uid: string): Promise<void> {
  await userAgencyRef(uid).delete();
}

/** Invite lookup by token so we can resolve invite without collection-group query. */
export function inviteByTokenRef(token: string) {
  return getAdminDb().collection("studio_invite_by_token").doc(token);
}

export async function setInviteTokenLookup(
  token: string,
  data: { agencyId: string; inviteId: string; expiresAt: Date }
): Promise<void> {
  await inviteByTokenRef(token).set({ ...data, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteInviteTokenLookup(token: string): Promise<void> {
  await inviteByTokenRef(token).delete();
}

// ─── Get agency by id ────────────────────────────────────────────────────────

export async function getAgency(agencyId: string): Promise<StudioAgency | null> {
  const snap = await agencyRef(agencyId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as StudioAgency;
}

/**
 * Find the agency where uid is the owner, or a team member.
 * Uses owner query + studio_user_agency lookup only (no collection-group queries, so no index required).
 */
export async function getAgencyForUser(uid: string): Promise<StudioAgency | null> {
  const db = getAdminDb();

  // 1. Owner: single-field query on collection (auto-indexed)
  const ownerSnap = await db
    .collection("studio_agencies")
    .where("ownerId", "==", uid)
    .limit(1)
    .get();

  if (!ownerSnap.empty) {
    const doc = ownerSnap.docs[0];
    return { id: doc.id, ...doc.data() } as StudioAgency;
  }

  // 2. Team member: direct doc read (no index)
  const userAgencySnap = await userAgencyRef(uid).get();
  if (!userAgencySnap.exists) return null;

  const agencyId = userAgencySnap.data()?.agencyId as string | undefined;
  if (!agencyId) return null;

  const member = await getTeamMember(agencyId, uid);
  if (!member || member.inviteStatus !== "active") {
    await userAgencyRef(uid).delete(); // cleanup stale lookup
    return null;
  }

  return getAgency(agencyId);
}

export async function createAgency(
  uid: string,
  agencyName: string,
  plan: StudioPlanId = "trial"
): Promise<StudioAgency> {
  const db = getAdminDb();
  const monthlyPosterLimit = getMonthlyPosterLimit(plan);

  const docRef = await db.collection("studio_agencies").add({
    ownerId: uid,
    agencyName,
    plan,
    monthlyPosterLimit,
    postersUsedThisMonth: 0,
    postersResetAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Also add owner as team member and user→agency lookup (no collection-group index needed)
  await teamRef(docRef.id).doc(uid).set({
    userId: uid,
    role: "owner",
    assignedClients: [],
    inviteStatus: "active",
    createdAt: FieldValue.serverTimestamp(),
  });
  await setUserAgency(uid, docRef.id);

  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() } as StudioAgency;
}

// ─── Team members ────────────────────────────────────────────────────────────

export async function getTeamMember(agencyId: string, uid: string): Promise<StudioTeamMember | null> {
  const snap = await teamRef(agencyId).doc(uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as StudioTeamMember;
}

export async function listTeamMembers(agencyId: string): Promise<StudioTeamMember[]> {
  const snap = await teamRef(agencyId).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudioTeamMember);
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function getClient(agencyId: string, clientId: string): Promise<StudioClient | null> {
  const snap = await clientsRef(agencyId).doc(clientId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as StudioClient;
}

export async function listClients(
  agencyId: string,
  options?: { status?: string; limit?: number }
): Promise<StudioClient[]> {
  // Avoid composite index requirement: when a status filter is applied, fetch without
  // orderBy and sort in-memory. orderBy alone (no where) uses the auto single-field index.
  let query: FirebaseFirestore.Query = clientsRef(agencyId);
  if (options?.status) {
    query = query.where("status", "==", options.status);
  } else {
    query = query.orderBy("createdAt", "desc");
  }
  const snap = await query.get();
  let clients = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudioClient);
  if (options?.status) {
    // Sort in-memory since we couldn't use orderBy with the where filter
    clients.sort((a, b) => {
      const aMs = (a as any).createdAt?.toMillis?.() ?? 0;
      const bMs = (b as any).createdAt?.toMillis?.() ?? 0;
      return bMs - aMs;
    });
  }
  if (options?.limit) clients = clients.slice(0, options.limit);
  return clients;
}

// ─── Brand kits ──────────────────────────────────────────────────────────────

export async function getBrandKit(
  agencyId: string,
  clientId: string,
  kitId: string
): Promise<StudioBrandKit | null> {
  const snap = await brandKitsRef(agencyId, clientId).doc(kitId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as StudioBrandKit;
}

export async function listBrandKits(agencyId: string, clientId: string): Promise<StudioBrandKit[]> {
  // Avoid multi-field orderBy composite index — fetch all, sort in-memory
  const snap = await brandKitsRef(agencyId, clientId).get();
  const kits = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudioBrandKit);
  kits.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    const aMs = (a as any).createdAt?.toMillis?.() ?? 0;
    const bMs = (b as any).createdAt?.toMillis?.() ?? 0;
    return aMs - bMs;
  });
  return kits;
}

export async function getDefaultBrandKit(
  agencyId: string,
  clientId: string
): Promise<StudioBrandKit | null> {
  const snap = await brandKitsRef(agencyId, clientId)
    .where("isDefault", "==", true)
    .limit(1)
    .get();
  if (snap.empty) {
    // fallback: first kit
    const first = await brandKitsRef(agencyId, clientId).orderBy("createdAt", "asc").limit(1).get();
    if (first.empty) return null;
    return { id: first.docs[0].id, ...first.docs[0].data() } as StudioBrandKit;
  }
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as StudioBrandKit;
}

// ─── Posters ─────────────────────────────────────────────────────────────────

export async function getPoster(
  agencyId: string,
  clientId: string,
  posterId: string
): Promise<StudioPoster | null> {
  const snap = await postersRef(agencyId, clientId).doc(posterId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as StudioPoster;
}

export async function listPostersForClient(
  agencyId: string,
  clientId: string,
  options?: { approvalStatus?: string; limit?: number }
): Promise<StudioPoster[]> {
  // Avoid composite index: when filtering by approvalStatus, skip orderBy and sort in-memory
  let query: FirebaseFirestore.Query = postersRef(agencyId, clientId);
  if (options?.approvalStatus) {
    query = query.where("approvalStatus", "==", options.approvalStatus);
  } else {
    query = query.orderBy("createdAt", "desc");
  }
  const snap = await query.get();
  let posters = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudioPoster);
  if (options?.approvalStatus) {
    posters.sort((a, b) => {
      const aMs = (a as any).createdAt?.toMillis?.() ?? 0;
      const bMs = (b as any).createdAt?.toMillis?.() ?? 0;
      return bMs - aMs;
    });
  }
  if (options?.limit) posters = posters.slice(0, options.limit);
  return posters;
}

export async function listPostersForAgency(
  agencyId: string,
  options?: { clientId?: string; approvalStatus?: string; limit?: number }
): Promise<StudioPoster[]> {
  if (options?.clientId) {
    return listPostersForClient(agencyId, options.clientId, {
      approvalStatus: options.approvalStatus,
      limit: options.limit,
    });
  }

  // Collection group query — single where only to avoid composite index requirement
  let query = getAdminDb()
    .collectionGroup("posters")
    .where("agencyId", "==", agencyId) as FirebaseFirestore.Query;

  if (options?.approvalStatus) {
    query = query.where("approvalStatus", "==", options.approvalStatus);
  }

  const snap = await query.get();
  let posters = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudioPoster);
  posters.sort((a, b) => {
    const aMs = (a as any).createdAt?.toMillis?.() ?? 0;
    const bMs = (b as any).createdAt?.toMillis?.() ?? 0;
    return bMs - aMs;
  });
  if (options?.limit) posters = posters.slice(0, options.limit);
  return posters;
}

// ─── Approval history ────────────────────────────────────────────────────────

export async function addApproval(
  agencyId: string,
  clientId: string,
  posterId: string,
  data: Omit<StudioApproval, "id" | "timestamp">
): Promise<void> {
  await approvalsRef(agencyId, clientId, posterId).add({
    ...data,
    timestamp: FieldValue.serverTimestamp(),
  });
}

// ─── Usage / quota ───────────────────────────────────────────────────────────

/**
 * Increment agency poster usage and reset monthly count if needed.
 * Also increments per-client monthly count.
 */
export async function incrementStudioPosterUsage(
  agencyId: string,
  clientId: string
): Promise<void> {
  const db = getAdminDb();
  const agencySnap = await agencyRef(agencyId).get();
  const agencyData = agencySnap.data();

  const now = new Date();
  const resetAt: Date | null = agencyData?.postersResetAt?.toDate?.() ?? null;

  if (resetAt) {
    const nextReset = new Date(resetAt);
    nextReset.setMonth(nextReset.getMonth() + 1);
    if (now >= nextReset) {
      await agencyRef(agencyId).update({
        postersUsedThisMonth: 1,
        postersResetAt: FieldValue.serverTimestamp(),
      });
      await clientsRef(agencyId).doc(clientId).update({
        postersThisMonth: 1,
      });
      return;
    }
  }

  await agencyRef(agencyId).update({
    postersUsedThisMonth: FieldValue.increment(1),
  });
  await clientsRef(agencyId).doc(clientId).update({
    postersThisMonth: FieldValue.increment(1),
  });
}

export async function checkAgencyPosterQuota(agencyId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const agency = await getAgency(agencyId);
  if (!agency) return { allowed: false, used: 0, limit: 0 };

  const limits = getStudioPlanLimits(agency.plan);
  const limit = limits.maxPostersPerMonth;

  if (limit === -1) return { allowed: true, used: agency.postersUsedThisMonth, limit: -1 };

  return {
    allowed: agency.postersUsedThisMonth < limit,
    used: agency.postersUsedThisMonth,
    limit,
  };
}
