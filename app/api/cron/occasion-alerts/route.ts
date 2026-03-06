/**
 * Cron: occasion alerts.
 * Runs daily to notify users of upcoming occasions.
 * In-app banner is driven by GET /api/occasions/upcoming.
 * This cron can be extended to send email notifications when email infra is added.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUpcomingOccasions } from "@/lib/occasions/upcoming";
import { getCronState, clearSkipNextRun, logCronRun } from "@/lib/admin/cronControl";

const ENDPOINT = "occasion-alerts" as const;

function verifyCronSecret(request: NextRequest): { ok: boolean; reason?: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    return { ok: false, reason: "CRON_SECRET not set or too short" };
  }
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${secret.trim()}`;
  if (authHeader?.trim() !== expected) {
    return { ok: false, reason: "Authorization header missing or invalid" };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "Unauthorized", message: auth.reason },
      { status: 401 }
    );
  }

  const startedAt = Date.now();
  const state = await getCronState();
  if (state.paused) {
    await logCronRun({
      endpoint: ENDPOINT,
      startedAt,
      finishedAt: Date.now(),
      status: "skipped",
      reason: "Cron paused by admin",
    });
    return NextResponse.json({ ok: true, skipped: true, reason: "Cron paused" });
  }
  if (state.skipNextRun.occasionAlerts) {
    await clearSkipNextRun(ENDPOINT);
    await logCronRun({
      endpoint: ENDPOINT,
      startedAt,
      finishedAt: Date.now(),
      status: "skipped",
      reason: "Skip next run (admin)",
    });
    return NextResponse.json({ ok: true, skipped: true, reason: "Skip next run" });
  }

  const occasions = getUpcomingOccasions(null, 3);
  console.log("[cron occasion-alerts] Upcoming occasions:", occasions.map((o) => o.name));

  await logCronRun({
    endpoint: ENDPOINT,
    startedAt,
    finishedAt: Date.now(),
    status: "ok",
    processed: occasions.length,
  });
  return NextResponse.json({
    ok: true,
    message: "Occasion alerts ready. In-app banner via /api/occasions/upcoming.",
  });
}
