import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/studio/auth";
import { listPostersForClient } from "@/lib/studio/db";

/** GET /api/studio/portal/posters — list client's own posters (client portal) */
export async function GET(request: NextRequest) {
  const resolved = await verifyPortalToken(request);
  if (!resolved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agencyId, clientId } = resolved;
  const { searchParams } = new URL(request.url);
  const approvalStatus = searchParams.get("approvalStatus") ?? undefined;

  try {
    const posters = await listPostersForClient(agencyId, clientId, { approvalStatus });
    const formatted = posters.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      headline: p.headline,
      approvalStatus: p.approvalStatus,
      approvalComment: p.approvalComment,
      platformFormatId: p.platformFormatId,
      createdAt: (p.createdAt as any)?.toMillis?.() ?? null,
    }));

    return NextResponse.json({ posters: formatted });
  } catch (err) {
    console.error("[studio/portal/posters GET]", err);
    return NextResponse.json({ error: "Failed to fetch posters" }, { status: 500 });
  }
}
