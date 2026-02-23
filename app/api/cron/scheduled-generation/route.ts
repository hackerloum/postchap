import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { runGenerationForUser } from "@/lib/generation/runGeneration";
import { getNextRunAfter } from "@/lib/schedule/nextRunAt";

export const maxDuration = 300;

function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header =
    request.headers.get("Authorization")?.replace("Bearer ", "") ??
    request.headers.get("x-cron-secret") ??
    "";
  return header === secret;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const now = new Date();

  const snapshot = await db
    .collection("schedules")
    .where("enabled", "==", true)
    .get();

  const due: { id: string; data: Record<string, unknown> }[] = [];
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const nextRunAtRaw = data.nextRunAt as { toMillis?: () => number } | number | undefined;
    const nextRunAt = typeof nextRunAtRaw === "object" && nextRunAtRaw?.toMillis
      ? nextRunAtRaw.toMillis()
      : typeof nextRunAtRaw === "number"
      ? nextRunAtRaw
      : null;
    if (nextRunAt != null && nextRunAt <= now.getTime()) {
      due.push({ id: doc.id, data });
    }
  });

  const results: { uid: string; success: boolean; error?: string }[] = [];

  for (const { id: uid, data } of due) {
    const brandKitId = data.brandKitId as string | undefined;
    if (!brandKitId) {
      results.push({ uid, success: false, error: "No brandKitId" });
      continue;
    }
    try {
      await runGenerationForUser(uid, brandKitId, null);
      const time = (data.time as string) ?? "08:00";
      const timezone = (data.timezone as string) ?? "Africa/Lagos";
      const nextDate = getNextRunAfter(new Date(), time, timezone);
      await db.collection("schedules").doc(uid).update({
        lastRunAt: Timestamp.now(),
        nextRunAt: Timestamp.fromDate(nextDate),
        updatedAt: Timestamp.now(),
      });
      results.push({ uid, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[cron scheduled-generation]", uid, message);
      results.push({ uid, success: false, error: message });
      const time = (data.time as string) ?? "08:00";
      const timezone = (data.timezone as string) ?? "Africa/Lagos";
      const nextDate = getNextRunAfter(new Date(), time, timezone);
      await db.collection("schedules").doc(uid).update({
        nextRunAt: Timestamp.fromDate(nextDate),
        updatedAt: Timestamp.now(),
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    ok: true,
    due: due.length,
    results,
  });
}
