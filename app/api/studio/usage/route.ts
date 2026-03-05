import { NextRequest, NextResponse } from "next/server";
import { resolveStudioContext } from "@/lib/studio/auth";
import { getAgency, listClients, postersRef } from "@/lib/studio/db";
import { getStudioPlanLimits } from "@/lib/studio-plans";

/** GET /api/studio/usage — agency-level usage stats + per-client breakdown */
export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency } = ctx;

  try {
    const limits = getStudioPlanLimits(agency.plan);
    const posterLimit = limits.maxPostersPerMonth;

    const clients = await listClients(agency.id, { status: "active" });

    // Per-client usage
    const clientUsage = clients.map((c) => {
      const cost = (c.postersThisMonth ?? 0) * 0.055;
      return {
        clientId: c.id,
        clientName: c.clientName,
        postersThisMonth: c.postersThisMonth ?? 0,
        monthlyQuota: c.monthlyQuota,
        estimatedCostUsd: parseFloat(cost.toFixed(2)),
      };
    });

    const totalCost = clientUsage.reduce((s, c) => s + c.estimatedCostUsd, 0);

    return NextResponse.json({
      plan: agency.plan,
      postersUsedThisMonth: agency.postersUsedThisMonth,
      posterLimit: posterLimit === -1 ? null : posterLimit,
      postersRemaining: posterLimit === -1 ? null : Math.max(0, posterLimit - agency.postersUsedThisMonth),
      percentUsed: posterLimit === -1 ? 0 : Math.round((agency.postersUsedThisMonth / posterLimit) * 100),
      activeClients: clients.length,
      clientUsage,
      totalEstimatedCostUsd: parseFloat(totalCost.toFixed(2)),
    });
  } catch (err) {
    console.error("[studio/usage GET]", err);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
