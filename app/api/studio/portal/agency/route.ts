import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/studio/auth";
import { getAgency } from "@/lib/studio/db";

/** GET /api/studio/portal/agency — agency branding for client portal (auth: X-Portal-Token) */
export async function GET(request: NextRequest) {
  const resolved = await verifyPortalToken(request);
  if (!resolved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agencyId } = resolved;

  try {
    const agency = await getAgency(agencyId);
    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: agency.portalBrandName || agency.agencyName || "Client Portal",
      logoUrl: agency.portalLogoUrl ?? null,
      accentColor: agency.portalAccentColor ?? "#4D9EFF",
      hidePoweredBy: agency.hidePoweredBy ?? false,
    });
  } catch (err) {
    console.error("[studio/portal/agency GET]", err);
    return NextResponse.json({ error: "Failed to fetch agency" }, { status: 500 });
  }
}
