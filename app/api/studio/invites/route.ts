import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { teamRef, invitesRef, agencyRef, getAgencyForUser } from "@/lib/studio/db";

/** GET /api/studio/invites?token=... — validate an invite token */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  try {
    const db = getAdminDb();
    const snap = await db
      .collectionGroup("invites")
      .where("token", "==", token)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ valid: false, error: "Invite not found or already used" });
    }

    const invite = snap.docs[0].data();
    const now = new Date();
    if (invite.expiresAt && invite.expiresAt.toDate && invite.expiresAt.toDate() < now) {
      return NextResponse.json({ valid: false, error: "Invite has expired" });
    }

    const agencyId = snap.docs[0].ref.parent.parent?.id;
    let agencyName = "";
    if (agencyId) {
      const agencySnap = await agencyRef(agencyId).get();
      agencyName = agencySnap.data()?.agencyName ?? "";
    }

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

  try {
    const db = getAdminDb();
    const snap = await db
      .collectionGroup("invites")
      .where("token", "==", body.token)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Invite not found or already used" }, { status: 404 });
    }

    const inviteDoc = snap.docs[0];
    const invite = inviteDoc.data();
    const agencyId = inviteDoc.ref.parent.parent?.id;

    if (!agencyId) return NextResponse.json({ error: "Invalid invite" }, { status: 400 });

    const now = new Date();
    if (invite.expiresAt?.toDate?.() < now) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
    }

    // Check if user already belongs to an agency
    const existingAgency = await getAgencyForUser(uid);
    if (existingAgency) {
      return NextResponse.json({ error: "You already belong to a Studio agency" }, { status: 409 });
    }

    // Get user info
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();

    // Add to team
    await teamRef(agencyId).doc(uid).set({
      userId: uid,
      role: invite.role,
      assignedClients: [],
      inviteStatus: "active",
      email: userData?.email ?? invite.email,
      displayName: userData?.displayName ?? "",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Mark invite as accepted
    await inviteDoc.ref.update({ status: "accepted", acceptedBy: uid, acceptedAt: FieldValue.serverTimestamp() });

    return NextResponse.json({ success: true, agencyId });
  } catch (err) {
    console.error("[studio/invites POST]", err);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
