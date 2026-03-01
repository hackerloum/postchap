import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { isValidPlanId } from "@/lib/plans";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid } = params;
  try {
    const db = getAdminDb();
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [userSnap, kitsSnap, postersMonthSnap, totalPostersSnap] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("users").doc(uid).collection("brand_kits").get(),
      db.collection("users").doc(uid).collection("posters")
        .where("createdAt", ">=", Timestamp.fromDate(startOfMonth)).count().get(),
      db.collection("users").doc(uid).collection("posters").count().get(),
    ]);

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const d = userSnap.data()!;
    const kits = kitsSnap.docs.map((k) => ({
      id: k.id,
      brandName: k.data().brandName ?? "",
      industry: k.data().industry ?? "",
      createdAt: k.data().createdAt?.toMillis?.() ?? null,
    }));

    return NextResponse.json({
      uid,
      email: d.email ?? "",
      displayName: d.displayName ?? "",
      plan: d.plan ?? "free",
      hasOnboarded: d.hasOnboarded ?? false,
      createdAt: d.createdAt?.toMillis?.() ?? null,
      country: d.country ?? null,
      countryCode: d.countryCode ?? null,
      instagram: d.instagram ?? null,
      brandKits: kits,
      usage: {
        postersThisMonth: postersMonthSnap.data().count,
        totalPosters: totalPostersSnap.data().count,
      },
    });
  } catch (err) {
    console.error("[admin/users/[uid] GET]", err);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid } = params;
  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.plan || !isValidPlanId(body.plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    await getAdminDb().collection("users").doc(uid).update({
      plan: body.plan,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true, plan: body.plan });
  } catch (err) {
    console.error("[admin/users/[uid] PATCH]", err);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}
