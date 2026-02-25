import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { getPlanLimits } from "@/lib/plans";
import { getNextRunAt } from "@/lib/schedule/nextRunAt";
import { isAllowedScheduleTime, snapToAllowedTime } from "@/lib/schedule/timeSlots";
import { getUserPlan } from "@/lib/user-plan";

async function getUid(request: NextRequest): Promise<string> {
  const header = request.headers.get("Authorization");
  const token =
    header?.startsWith("Bearer ")
      ? header.replace("Bearer ", "")
      : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

const DEFAULT_TIME = "08:00";
const DEFAULT_TIMEZONE = "Africa/Lagos";

export async function GET(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doc = await getAdminDb().collection("schedules").doc(uid).get();
    if (!doc.exists) {
      return NextResponse.json({
        enabled: false,
        time: DEFAULT_TIME,
        timezone: DEFAULT_TIMEZONE,
        brandKitId: "",
        notifyEmail: true,
        notifySms: false,
        nextRunAt: null,
        lastRunAt: null,
      });
    }
    const d = doc.data()!;
    const nextRunAt = d.nextRunAt?.toMillis?.() ?? d.nextRunAt ?? null;
    const lastRunAt = d.lastRunAt?.toMillis?.() ?? d.lastRunAt ?? null;
    return NextResponse.json({
      enabled: d.enabled ?? false,
      time: d.time ?? DEFAULT_TIME,
      timezone: d.timezone ?? DEFAULT_TIMEZONE,
      brandKitId: d.brandKitId ?? "",
      notifyEmail: d.notifyEmail ?? true,
      notifySms: d.notifySms ?? false,
      nextRunAt: nextRunAt != null ? nextRunAt : null,
      lastRunAt: lastRunAt != null ? lastRunAt : null,
    });
  } catch (error) {
    console.error("[schedule GET]", error);
    return NextResponse.json(
      { error: "Failed to load schedule" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    enabled?: boolean;
    time?: string;
    timezone?: string;
    brandKitId?: string;
    notifyEmail?: boolean;
    notifySms?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection("schedules").doc(uid);

  const doc = await ref.get();
  const current = doc.exists ? doc.data()! : {};

  const enabled = body.enabled ?? current.enabled ?? false;

  if (enabled) {
    const plan = await getUserPlan(uid);
    const limits = getPlanLimits(plan);
    if (!limits.scheduledGeneration) {
      return NextResponse.json(
        {
          error: "Scheduled generation is not included in your plan. Upgrade to enable it.",
          code: "SCHEDULE_NOT_AVAILABLE",
        },
        { status: 403 }
      );
    }
  }

  let time = body.time ?? current.time ?? DEFAULT_TIME;
  if (time && !isAllowedScheduleTime(time)) {
    time = snapToAllowedTime(time);
  }
  if (!time || !isAllowedScheduleTime(time)) {
    time = DEFAULT_TIME;
  }
  const timezone = body.timezone ?? current.timezone ?? DEFAULT_TIMEZONE;
  const brandKitId = body.brandKitId ?? current.brandKitId ?? "";
  const notifyEmail = body.notifyEmail ?? current.notifyEmail ?? true;
  const notifySms = body.notifySms ?? current.notifySms ?? false;

  if (enabled && brandKitId) {
    const kitSnap = await db
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(brandKitId)
      .get();
    if (!kitSnap.exists) {
      return NextResponse.json(
        { error: "Brand kit not found" },
        { status: 400 }
      );
    }
  }

  let nextRunAt: Timestamp | null = null;
  if (enabled && time && timezone) {
    const next = getNextRunAt(time, timezone);
    nextRunAt = Timestamp.fromDate(next);
  }

  const data = {
    enabled,
    time,
    timezone,
    brandKitId,
    notifyEmail,
    notifySms,
    ...(nextRunAt && { nextRunAt }),
    updatedAt: Timestamp.now(),
  };

  await ref.set(data, { merge: true });

  const saved = await ref.get();
  const savedData = saved.data()!;
  const nextRunAtMs = savedData.nextRunAt?.toMillis?.() ?? savedData.nextRunAt ?? null;
  const lastRunAtMs = savedData.lastRunAt?.toMillis?.() ?? savedData.lastRunAt ?? null;

  return NextResponse.json({
    enabled: savedData.enabled ?? false,
    time: savedData.time ?? DEFAULT_TIME,
    timezone: savedData.timezone ?? DEFAULT_TIMEZONE,
    brandKitId: savedData.brandKitId ?? "",
    notifyEmail: savedData.notifyEmail ?? true,
    notifySms: savedData.notifySms ?? false,
    nextRunAt: nextRunAtMs,
    lastRunAt: lastRunAtMs ?? null,
  });
}
