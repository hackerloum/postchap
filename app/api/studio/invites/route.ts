import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { teamRef, agencyRef, invitesRef, getAgencyForUser, setUserAgency, inviteByTokenRef, deleteInviteTokenLookup } from "@/lib/studio/db";

/** GET /api/studio/invites?token=... — validate an invite token (uses lookup, no collection-group index). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  try {
    const lookupSnap = await inviteByTokenRef(token).get();
    if (!lookupSnap.exists) {
      return NextResponse.json({ valid: false, error: "Invite not found or already used" });
    }

    const lookup = lookupSnap.data() as { agencyId?: string; inviteId?: string; expiresAt?: { toDate: () => Date } };
    const { agencyId, inviteId, expiresAt } = lookup;
    if (!agencyId || !inviteId) {
      return NextResponse.json({ valid: false, error: "Invalid invite" });
    }

    const now = new Date();
    if (expiresAt?.toDate && expiresAt.toDate() < now) {
      return NextResponse.json({ valid: false, error: "Invite has expired" });
    }

    const inviteSnap = await invitesRef(agencyId).doc(inviteId).get();
    if (!inviteSnap.exists) {
      return NextResponse.json({ valid: false, error: "Invite not found or already used" });
    }
    const invite = inviteSnap.data() as { email?: string; role?: string; status?: string };
    if (invite?.status !== "pending") {
      return NextResponse.json({ valid: false, error: "Invite not found or already used" });
    }

    let agencyName = "";
    const agencySnap = await agencyRef(agencyId).get();
    agencyName = agencySnap.data()?.agencyName ?? "";

    return NextResponse.json({
      valid: true,
      email: invite.email,
      role: invite.role,
      agencyName,
      agencyId,
    });
  } catch (err) {
    console.error("[studio/invites GET]", err);
    return NextResponse.json({ error: "Failed to validate invite" }, { status: 500 });
  }
}

/** POST /api/studio/invites/accept — accept an invite with a token */
export async function POST(request: NextRequest) {
  let uid: string;
  try {
    const decoded = await verifyRequestAuth(request);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.token) return NextResponse.json({ error: "token is required" }, { status: 400 });

  const token = body.token;

  try {
    const lookupSnap = await inviteByTokenRef(token).get();
    if (!lookupSnap.exists) {
      return NextResponse.json({ error: "Invite not found or already used" }, { status: 404 });
    }

    const lookup = lookupSnap.data() as { agencyId?: string; inviteId?: string; expiresAt?: { toDate: () => Date } };
    const { agencyId, inviteId } = lookup;
    if (!agencyId || !inviteId) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    const inviteDocRef = invitesRef(agencyId).doc(inviteId);
    const inviteSnap = await inviteDocRef.get();
    if (!inviteSnap.exists) {
      return NextResponse.json({ error: "Invite not found or already used" }, { status: 404 });
    }

    const invite = inviteSnap.data() as { email?: string; role?: string; status?: string; expiresAt?: { toDate: () => Date } };
    if (invite?.status !== "pending") {
      return NextResponse.json({ error: "Invite not found or already used" }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = invite.expiresAt?.toDate?.();
    if (expiresAt != null && expiresAt < now) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
    }

    const existingAgency = await getAgencyForUser(uid);
    if (existingAgency) {
      return NextResponse.json({ error: "You already belong to a Studio agency" }, { status: 409 });
    }

    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();

    await teamRef(agencyId).doc(uid).set({
      userId: uid,
      role: invite.role,
      assignedClients: [],
      inviteStatus: "active",
      email: userData?.email ?? invite.email,
      displayName: userData?.displayName ?? "",
      createdAt: FieldValue.serverTimestamp(),
    });
    await setUserAgency(uid, agencyId);

    await inviteDocRef.update({ status: "accepted", acceptedBy: uid, acceptedAt: FieldValue.serverTimestamp() });
    await deleteInviteTokenLookup(token);

    return NextResponse.json({ success: true, agencyId });
  } catch (err) {
    console.error("[studio/invites POST]", err);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
