import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveStudioContext, hasClientAccess, canApprove } from "@/lib/studio/auth";
import { postersRef, getPoster, addApproval } from "@/lib/studio/db";
import { getAdminDb } from "@/lib/firebase/admin";

type Params = { params: Promise<{ posterId: string }> };

/**
 * Resolve the client for a given posterId by searching all clients
 * in the agency (uses agencyId stored in the poster doc via collection group).
 */
async function resolveClientForPoster(
  agencyId: string,
  posterId: string
): Promise<{ clientId: string } | null> {
  const snap = await getAdminDb()
    .collectionGroup("posters")
    .where("agencyId", "==", agencyId)
    .limit(50)
    .get();

  const doc = snap.docs.find((d) => d.id === posterId);
  if (!doc) return null;

  const clientId = (doc.data() as any).clientId as string;
  return { clientId };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { posterId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  try {
    const resolved = await resolveClientForPoster(agency.id, posterId);
    if (!resolved) return NextResponse.json({ error: "Poster not found" }, { status: 404 });

    if (!hasClientAccess(member, resolved.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const poster = await getPoster(agency.id, resolved.clientId, posterId);
    if (!poster) return NextResponse.json({ error: "Poster not found" }, { status: 404 });

    return NextResponse.json({ poster });
  } catch (err) {
    console.error("[studio/posters/[posterId] GET]", err);
    return NextResponse.json({ error: "Failed to fetch poster" }, { status: 500 });
  }
}

/** PATCH — update approval status or other mutable fields */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { posterId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uid, agency, member } = ctx;

  let body: {
    approvalStatus?: string;
    approvalComment?: string;
    clientId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    let clientId = body.clientId;
    if (!clientId) {
      const resolved = await resolveClientForPoster(agency.id, posterId);
      if (!resolved) return NextResponse.json({ error: "Poster not found" }, { status: 404 });
      clientId = resolved.clientId;
    }

    if (!hasClientAccess(member, clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Approval status changes require at least reviewer role
    if (body.approvalStatus && !canApprove(member)) {
      return NextResponse.json({ error: "Your role cannot change approval status" }, { status: 403 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.approvalStatus) updates.approvalStatus = body.approvalStatus;
    if (body.approvalComment !== undefined) updates.approvalComment = body.approvalComment;

    if (body.approvalStatus === "approved") {
      updates.approvedBy = uid;
      updates.approvedAt = FieldValue.serverTimestamp();
    }

    await postersRef(agency.id, clientId).doc(posterId).update(updates);

    // Record in approval history
    if (body.approvalStatus) {
      const roundSnap = await (await import("@/lib/studio/db")).approvalsRef(agency.id, clientId, posterId).count().get();
      await addApproval(agency.id, clientId, posterId, {
        posterId,
        round: (roundSnap.data().count ?? 0) + 1,
        action: body.approvalStatus as "submitted" | "approved" | "revision_requested",
        comment: body.approvalComment,
        actorType: "designer",
        actorId: uid,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[studio/posters/[posterId] PATCH]", err);
    return NextResponse.json({ error: "Failed to update poster" }, { status: 500 });
  }
}
