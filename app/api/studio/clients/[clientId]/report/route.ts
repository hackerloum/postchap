import { NextRequest, NextResponse } from "next/server";
import { resolveStudioContext, hasClientAccess } from "@/lib/studio/auth";
import { getClient, listPostersForClient, getAgency } from "@/lib/studio/db";

type Params = { params: Promise<{ clientId: string }> };

/**
 * GET /api/studio/clients/[clientId]/report?month=YYYY-MM
 * Returns report data (JSON) for the given client and month.
 * Use ?format=pdf to get a PDF (requires a PDF generation lib — returns JSON for now).
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { clientId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  try {
    const [client, agencyData] = await Promise.all([
      getClient(agency.id, clientId),
      getAgency(agency.id),
    ]);

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const allPosters = await listPostersForClient(agency.id, clientId);
    const monthPosters = allPosters.filter((p) => {
      const created = (p.createdAt as any)?.toDate?.();
      if (!created) return false;
      return created.toISOString().startsWith(month);
    });

    const approved = monthPosters.filter((p) => p.approvalStatus === "approved");
    const pending = monthPosters.filter((p) => p.approvalStatus === "pending");

    const platformsSet = new Set(monthPosters.map((p) => p.platformFormatId).filter(Boolean));
    const platforms = Array.from(platformsSet);

    const report = {
      generatedAt: new Date().toISOString(),
      month,
      agency: {
        name: agencyData?.portalBrandName || agencyData?.agencyName || "Your Agency",
        logoUrl: agencyData?.portalLogoUrl ?? null,
        accentColor: agencyData?.portalAccentColor ?? "#E8FF47",
        hidePoweredBy: agencyData?.hidePoweredBy ?? false,
      },
      client: {
        id: client.id,
        name: client.clientName,
        industry: client.industry,
      },
      stats: {
        postersGenerated: monthPosters.length,
        postersApproved: approved.length,
        postersPending: pending.length,
        platformsCovered: platforms,
      },
      posters: monthPosters.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        headline: p.headline,
        approvalStatus: p.approvalStatus,
        platformFormatId: p.platformFormatId,
        createdAt: (p.createdAt as any)?.toMillis?.() ?? null,
      })),
    };

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[studio/clients/report GET]", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
