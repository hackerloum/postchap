import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getCronState,
  updateCronState,
  getCronRuns,
  getUpcomingCronTimes,
  getUpcomingUserSchedules,
  type CronEndpoint,
  type CronSkipNextRun,
} from "@/lib/admin/cronControl";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [state, runs, upcoming, upcomingUserSchedules] = await Promise.all([
      getCronState(),
      getCronRuns(80),
      Promise.resolve(getUpcomingCronTimes(5)),
      getUpcomingUserSchedules(50),
    ]);

    return NextResponse.json({
      paused: state.paused,
      skipNextRun: state.skipNextRun,
      updatedAt: state.updatedAt,
      runs,
      upcoming: upcoming.map((u) => ({
        endpoint: u.endpoint,
        schedule: u.schedule,
        nextRunTimes: u.nextRunTimes.map((d) => d.toISOString()),
      })),
      upcomingUserSchedules,
    });
  } catch (err) {
    console.error("[admin/cron-control GET]", err);
    return NextResponse.json({ error: "Failed to load cron state" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { paused?: boolean; skipNextRun?: CronSkipNextRun };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const updates: { paused?: boolean; skipNextRun?: CronSkipNextRun } = {};
    if (typeof body.paused === "boolean") updates.paused = body.paused;
    if (body.skipNextRun && typeof body.skipNextRun === "object") {
      updates.skipNextRun = {
        scheduledGeneration: Boolean(body.skipNextRun.scheduledGeneration),
        occasionAlerts: Boolean(body.skipNextRun.occasionAlerts),
        scheduledPosts: Boolean(body.skipNextRun.scheduledPosts),
      };
    }
    if (Object.keys(updates).length === 0) {
      const state = await getCronState();
      return NextResponse.json(state);
    }
    const state = await updateCronState(updates);
    return NextResponse.json(state);
  } catch (err) {
    console.error("[admin/cron-control PATCH]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
