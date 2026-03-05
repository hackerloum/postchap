import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyPortalToken } from "@/lib/studio/auth";
import { postersRef, getPoster, addApproval } from "@/lib/studio/db";

type Params = { params: Promise<{ posterId: string }> };

/** PATCH /api/studio/portal/posters/[posterId] — client approves or requests revision */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { posterId } = await params;

  const resolved = await verifyPortalToken(request);
  if (!resolved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agencyId, clientId } = resolved;

  let body: { approvalStatus?: "approved" | "revision_requested"; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.approvalStatus) {
    return NextResponse.json({ error: "approvalStatus is required" }, { status: 400 });
  }

  const validStatuses = ["approved", "revision_requested"];
  if (!validStatuses.includes(body.approvalStatus)) {
    return NextResponse.json({ error: "approvalStatus must be 'approved' or 'revision_requested'" }, { status: 400 });
  }

  try {
    const poster = await getPoster(agencyId, clientId, posterId);
    if (!poster) return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    if (poster.clientId !== clientId) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const updates: Record<string, unknown> = {
      approvalStatus: body.approvalStatus,
      approvalComment: body.comment ?? "",
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.approvalStatus === "approved") {
      updates.approvedBy = `client:${clientId}`;
      updates.approvedAt = FieldValue.serverTimestamp();
    }

    await postersRef(agencyId, clientId).doc(posterId).update(updates);

    const roundSnap = await (await import("@/lib/studio/db")).approvalsRef(agencyId, clientId, posterId).count().get();
    await addApproval(agencyId, clientId, posterId, {
      posterId,
      round: (roundSnap.data().count ?? 0) + 1,
      action: body.approvalStatus,
      comment: body.comment,
      actorType: "client",
      actorId: clientId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[studio/portal/posters/[posterId] PATCH]", err);
    return NextResponse.json({ error: "Failed to update poster" }, { status: 500 });
  }
}
