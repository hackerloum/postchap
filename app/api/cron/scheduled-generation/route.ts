/**
 * Cron: scheduled poster generation.
 * Vercel invokes GET /api/cron/scheduled-generation once daily (see vercel.json).
 * Required: set CRON_SECRET in Vercel Project → Settings → Environment Variables
 * (Production + Preview). Vercel sends it as Authorization: Bearer <CRON_SECRET>.
 * Use a random string of at least 16 characters. Redeploy after adding the variable.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { runGenerationForUser } from "@/lib/generation/runGeneration";
import { getNextRunAfter } from "@/lib/schedule/nextRunAt";

export const maxDuration = 300;

/** Cap schedules processed per run to avoid timeouts and overload. */
const MAX_SCHEDULES_PER_RUN = 30;

function verifyCronSecret(request: NextRequest): { ok: boolean; reason?: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    return { ok: false, reason: "CRON_SECRET not set or too short (min 16 chars)" };
  }
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${secret.trim()}`;
  if (authHeader?.trim() !== expected) {
    return { ok: false, reason: "Authorization header missing or does not match CRON_SECRET" };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    console.error("[cron scheduled-generation] Auth failed:", auth.reason);
    return NextResponse.json(
      { error: "Unauthorized", message: auth.reason },
      { status: 401 }
    );
  }

  const db = getAdminDb();
  const now = new Date();
  const nowMs = now.getTime();

  const snapshot = await db
    .collection("schedules")
    .where("enabled", "==", true)
    .get();

  const due: { id: string; data: Record<string, unknown>; nextRunAtMs: number }[] = [];
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const nextRunAtRaw = data.nextRunAt as { toMillis?: () => number } | number | undefined;
    const nextRunAt =
      typeof nextRunAtRaw === "object" && nextRunAtRaw?.toMillis
        ? nextRunAtRaw.toMillis()
        : typeof nextRunAtRaw === "number"
          ? nextRunAtRaw
          : null;
    const isDue = nextRunAt == null ? true : nextRunAt <= nowMs;
    if (isDue) {
      due.push({
        id: doc.id,
        data,
        nextRunAtMs: nextRunAt ?? nowMs,
      });
    }
  });

  due.sort((a, b) => a.nextRunAtMs - b.nextRunAtMs);
  const toProcess = due.slice(0, MAX_SCHEDULES_PER_RUN);
  const skipped = due.length - toProcess.length;

  console.log(
    "[cron scheduled-generation]",
    "enabled:",
    snapshot.size,
    "due:",
    due.length,
    "processing:",
    toProcess.length,
    "skipped:",
    skipped,
    "now:",
    now.toISOString()
  );

  const results: { uid: string; success: boolean; error?: string }[] = [];

  for (const { id: uid, data } of toProcess) {
    const brandKitId = data.brandKitId as string | undefined;
    if (!brandKitId) {
      console.warn("[cron scheduled-generation] Skipping", uid, "no brandKitId");
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
      console.log("[cron scheduled-generation] Success", uid, "nextRunAt", nextDate.toISOString());
      results.push({ uid, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[cron scheduled-generation] Failed", uid, message);
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
    processed: toProcess.length,
    skipped,
    results,
  });
}
