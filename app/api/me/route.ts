import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getPlanLimits } from "@/lib/plans";
import { isValidPlanId } from "@/lib/plans";

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

export async function GET(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    const data = userSnap.data()!;
    const plan = (data.plan as string) ?? "free";
    const limits = getPlanLimits(plan);

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const [monthCountSnap, totalCountSnap, scheduleSnap] = await Promise.all([
      db
        .collection("users")
        .doc(uid)
        .collection("posters")
        .where("createdAt", ">=", Timestamp.fromDate(startOfMonth))
        .count()
        .get(),
      db.collection("users").doc(uid).collection("posters").count().get(),
      db.collection("schedules").doc(uid).get(),
    ]);

    const postersThisMonth = monthCountSnap?.data()?.count ?? 0;
    const postersLimit = limits.postersPerMonth;
    const totalPosters = totalCountSnap?.data()?.count ?? 0;
    const scheduleDoc = scheduleSnap?.exists ? scheduleSnap.data() : null;
    const hasSchedule = !!(scheduleDoc?.enabled && scheduleDoc?.brandKitId);

    return NextResponse.json({
      uid: data.uid ?? uid,
      email: data.email ?? "",
      displayName: data.displayName ?? "",
      phoneNumber: data.phoneNumber ?? null,
      hasOnboarded: data.hasOnboarded ?? false,
      plan,
      country: data.country ?? null,
      countryCode: data.countryCode ?? null,
      currency: data.currency ?? null,
      usage: {
        postersThisMonth,
        postersLimit: postersLimit === -1 ? null : postersLimit,
        totalPosters,
        hasSchedule,
      },
    });
  } catch (error) {
    console.error("[me GET]", error);
    return NextResponse.json(
      { error: "Failed to load user" },
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
    plan?: string;
    displayName?: string;
    phoneNumber?: string;
    country?: string;
    countryCode?: string;
    currency?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.plan !== undefined && !isValidPlanId(body.plan)) {
    return NextResponse.json(
      { error: "Invalid plan. Must be free, pro, or business." },
      { status: 400 }
    );
  }
  if (body.plan === "pro" || body.plan === "business") {
    return NextResponse.json(
      { error: "Use checkout to upgrade. Select a paid plan from the Plan button." },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (body.plan !== undefined) updates.plan = body.plan;
  if (body.displayName !== undefined) updates.displayName = String(body.displayName).trim() || "";
  if (body.phoneNumber !== undefined) updates.phoneNumber = body.phoneNumber == null ? null : String(body.phoneNumber).trim() || null;
  if (body.country !== undefined) updates.country = body.country == null ? null : String(body.country).trim() || null;
  if (body.countryCode !== undefined) updates.countryCode = body.countryCode == null ? null : String(body.countryCode).trim().toUpperCase().slice(0, 2) || null;
  if (body.currency !== undefined) updates.currency = body.currency == null ? null : String(body.currency).trim() || null;

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const userRef = getAdminDb().collection("users").doc(uid);
    await userRef.set(updates, { merge: true });
    const snap = await userRef.get();
    const data = snap.data()!;
    return NextResponse.json({
      uid: data.uid ?? uid,
      email: data.email ?? "",
      displayName: data.displayName ?? "",
      phoneNumber: data.phoneNumber ?? null,
      hasOnboarded: data.hasOnboarded ?? false,
      plan: (data.plan as string) ?? "free",
      country: data.country ?? null,
      countryCode: data.countryCode ?? null,
      currency: data.currency ?? null,
    });
  } catch (error) {
    console.error("[me PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
