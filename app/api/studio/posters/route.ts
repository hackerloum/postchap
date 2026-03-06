import { NextRequest, NextResponse } from "next/server";
import { resolveStudioContext, hasClientAccess } from "@/lib/studio/auth";
import { listPostersForAgency } from "@/lib/studio/db";

export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") ?? undefined;
  const approvalStatus = searchParams.get("approvalStatus") ?? undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

  // Role check: restricted members can only see their assigned clients
  if (clientId && !hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied to this client" }, { status: 403 });
  }

  try {
    const posters = await listPostersForAgency(agency.id, { clientId, approvalStatus, limit });

    const formatted = posters.map((p) => ({
      id: p.id,
      clientId: p.clientId,
      brandKitId: p.brandKitId,
      imageUrl: p.imageUrl,
      headline: p.headline,
      approvalStatus: p.approvalStatus,
      generatedBy: p.generatedBy,
      platformFormatId: p.platformFormatId,
      hasEditableLayout: p.hasEditableLayout ?? false,
      createdAt: (p.createdAt as any)?.toMillis?.() ?? null,
    }));

    return NextResponse.json(
      { posters: formatted },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("[studio/posters GET]", err);
    return NextResponse.json({ error: "Failed to fetch posters" }, { status: 500 });
  }
}
