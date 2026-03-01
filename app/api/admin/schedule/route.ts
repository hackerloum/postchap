import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { getNextRunAt } from "@/lib/schedule/nextRunAt";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const DOC = "admin_config/schedule";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = await getAdminDb().doc(DOC).get();
    if (!snap.exists) {
      return NextResponse.json({
        enabled: false,
        time: "08:00",
        timezone: "Africa/Lagos",
        nextRunAt: null,
        lastRunAt: null,
      });
    }
    const d = snap.data()!;
    return NextResponse.json({
      enabled: d.enabled ?? false,
      time: d.time ?? "08:00",
      timezone: d.timezone ?? "Africa/Lagos",
      nextRunAt: d.nextRunAt?.toMillis?.() ?? null,
      lastRunAt: d.lastRunAt?.toMillis?.() ?? null,
    });
  } catch (err) {
    console.error("[admin/schedule GET]", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { enabled: boolean; time: string; timezone: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const nextRunAt = body.enabled
      ? Timestamp.fromDate(getNextRunAt(body.time, body.timezone))
      : null;

    await getAdminDb().doc(DOC).set(
      {
        enabled: body.enabled,
        time: body.time,
        timezone: body.timezone,
        nextRunAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, nextRunAt: nextRunAt?.toMillis() ?? null });
  } catch (err) {
    console.error("[admin/schedule POST]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
