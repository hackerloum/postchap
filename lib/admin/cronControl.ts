import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

const CRON_STATE_DOC = "admin_config/cron";
const CRON_RUNS_COLLECTION = "cron_runs";
const MAX_RUNS_RETURNED = 80;

export type CronEndpoint = "scheduled-generation" | "occasion-alerts" | "scheduled-posts";

export interface CronSkipNextRun {
  scheduledGeneration?: boolean;
  occasionAlerts?: boolean;
  scheduledPosts?: boolean;
}

export interface CronState {
  paused: boolean;
  skipNextRun: CronSkipNextRun;
  updatedAt: number | null;
}

const DEFAULT_STATE: CronState = {
  paused: false,
  skipNextRun: {},
  updatedAt: null,
};

export async function getCronState(): Promise<CronState> {
  const snap = await getAdminDb().doc(CRON_STATE_DOC).get();
  if (!snap.exists) return DEFAULT_STATE;
  const d = snap.data()!;
  return {
    paused: d.paused ?? false,
    skipNextRun: d.skipNextRun ?? {},
    updatedAt: d.updatedAt?.toMillis?.() ?? d.updatedAt ?? null,
  };
}

export async function updateCronState(partial: {
  paused?: boolean;
  skipNextRun?: CronSkipNextRun;
}): Promise<CronState> {
  const ref = getAdminDb().doc(CRON_STATE_DOC);
  const now = Timestamp.now();
  const updates: Record<string, unknown> = { updatedAt: now };
  if (partial.paused !== undefined) updates.paused = partial.paused;
  if (partial.skipNextRun !== undefined) updates.skipNextRun = partial.skipNextRun;
  await ref.set(updates, { merge: true });
  const snap = await ref.get();
  const d = snap.data()!;
  return {
    paused: d.paused ?? false,
    skipNextRun: d.skipNextRun ?? {},
    updatedAt: d.updatedAt?.toMillis?.() ?? null,
  };
}

/** Clear "skip next run" for one endpoint (called by cron after skipping). */
export async function clearSkipNextRun(endpoint: CronEndpoint): Promise<void> {
  const ref = getAdminDb().doc(CRON_STATE_DOC);
  const key =
    endpoint === "scheduled-generation"
      ? "scheduledGeneration"
      : endpoint === "occasion-alerts"
        ? "occasionAlerts"
        : "scheduledPosts";
  const snap = await ref.get();
  const current = (snap.data()?.skipNextRun as CronSkipNextRun) ?? {};
  const next = { ...current, [key]: false };
  await ref.set({ skipNextRun: next, updatedAt: Timestamp.now() }, { merge: true });
}

export interface CronRunLog {
  endpoint: string;
  startedAt: number;
  finishedAt: number;
  status: "ok" | "skipped" | "error";
  reason?: string;
  due?: number;
  processed?: number;
  skipped?: number;
  results?: unknown[];
  error?: string;
}

export async function logCronRun(log: CronRunLog): Promise<void> {
  await getAdminDb()
    .collection(CRON_RUNS_COLLECTION)
    .add({
      ...log,
      startedAt: Timestamp.fromMillis(log.startedAt),
      finishedAt: Timestamp.fromMillis(log.finishedAt),
    });
}

export async function getCronRuns(limit: number = MAX_RUNS_RETURNED): Promise<CronRunLog[]> {
  const snap = await getAdminDb()
    .collection(CRON_RUNS_COLLECTION)
    .orderBy("startedAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      endpoint: d.endpoint,
      startedAt: d.startedAt?.toMillis?.() ?? d.startedAt,
      finishedAt: d.finishedAt?.toMillis?.() ?? d.finishedAt,
      status: d.status ?? "ok",
      reason: d.reason,
      due: d.due,
      processed: d.processed,
      skipped: d.skipped,
      results: d.results,
      error: d.error,
    };
  });
}

/** Compute next N run times (UTC) for each cron. Used for "upcoming" display. */
export function getUpcomingCronTimes(count: number): {
  endpoint: CronEndpoint;
  schedule: string;
  nextRunTimes: Date[];
}[] {
  const now = new Date();
  const result: { endpoint: CronEndpoint; schedule: string; nextRunTimes: Date[] }[] = [];

  // scheduled-generation: 0,30 * * * * (every 30 min UTC)
  const genTimes: Date[] = [];
  let t = new Date(now);
  const min = t.getUTCMinutes();
  if (min < 30) t.setUTCMinutes(30, 0, 0);
  else {
    t.setUTCHours(t.getUTCHours() + 1);
    t.setUTCMinutes(0, 0, 0);
  }
  for (let i = 0; i < count; i++) {
    genTimes.push(new Date(t));
    t.setTime(t.getTime() + 30 * 60 * 1000);
  }
  result.push({
    endpoint: "scheduled-generation",
    schedule: "Every 30 min (0,30 * * * *)",
    nextRunTimes: genTimes,
  });

  // occasion-alerts: 0 6 * * * (06:00 UTC daily)
  const occTimes: Date[] = [];
  let o = new Date(now);
  o.setUTCHours(6, 0, 0, 0);
  if (o.getTime() <= now.getTime()) o.setUTCDate(o.getUTCDate() + 1);
  for (let i = 0; i < count; i++) {
    occTimes.push(new Date(o));
    o.setUTCDate(o.getUTCDate() + 1);
  }
  result.push({
    endpoint: "occasion-alerts",
    schedule: "06:00 UTC daily",
    nextRunTimes: occTimes,
  });

  // scheduled-posts: 0,30 * * * * (every 30 min UTC, like generation)
  const postTimes: Date[] = [];
  let p = new Date(now);
  const pMin = p.getUTCMinutes();
  if (pMin < 30) p.setUTCMinutes(30, 0, 0);
  else {
    p.setUTCHours(p.getUTCHours() + 1);
    p.setUTCMinutes(0, 0, 0);
  }
  for (let i = 0; i < count; i++) {
    postTimes.push(new Date(p));
    p.setTime(p.getTime() + 30 * 60 * 1000);
  }
  result.push({
    endpoint: "scheduled-posts",
    schedule: "Every 30 min (0,30 * * * *)",
    nextRunTimes: postTimes,
  });

  return result;
}

/** Upcoming poster-generation runs from user schedules (enabled, nextRunAt in the future). */
export interface UpcomingUserSchedule {
  uid: string;
  email: string | null;
  displayName: string | null;
  nextRunAt: number;
  time: string;
  timezone: string;
}

export async function getUpcomingUserSchedules(limit: number = 50): Promise<UpcomingUserSchedule[]> {
  const db = getAdminDb();
  const nowMs = Date.now();
  const snap = await db.collection("schedules").where("enabled", "==", true).get();
  const list: { uid: string; nextRunAt: number; time: string; timezone: string }[] = [];
  snap.docs.forEach((doc) => {
    const d = doc.data();
    const nextRunAt =
      typeof d.nextRunAt?.toMillis === "function"
        ? d.nextRunAt.toMillis()
        : typeof d.nextRunAt === "number"
          ? d.nextRunAt
          : null;
    if (nextRunAt != null && nextRunAt > nowMs) {
      list.push({
        uid: doc.id,
        nextRunAt,
        time: (d.time as string) ?? "08:00",
        timezone: (d.timezone as string) ?? "Africa/Lagos",
      });
    }
  });
  list.sort((a, b) => a.nextRunAt - b.nextRunAt);
  const slice = list.slice(0, limit);
  if (slice.length === 0) return [];

  const userIds = Array.from(new Set(slice.map((s) => s.uid)));
  const userSnaps = await Promise.all(userIds.map((id) => db.collection("users").doc(id).get()));
  const userMap: Record<string, { email: string | null; displayName: string | null }> = {};
  userSnaps.forEach((s, i) => {
    const uid = userIds[i];
    const data = s.data();
    userMap[uid] = {
      email: (data?.email as string) ?? null,
      displayName: (data?.displayName as string) ?? null,
    };
  });

  return slice.map((s) => ({
    uid: s.uid,
    email: userMap[s.uid]?.email ?? null,
    displayName: userMap[s.uid]?.displayName ?? null,
    nextRunAt: s.nextRunAt,
    time: s.time,
    timezone: s.timezone,
  }));
}
