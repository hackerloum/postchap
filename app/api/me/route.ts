import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
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
    const userSnap = await getAdminDb().collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    const data = userSnap.data()!;
    const plan = (data.plan as string) ?? "free";
    return NextResponse.json({
      uid: data.uid ?? uid,
      email: data.email ?? "",
      displayName: data.displayName ?? "",
      hasOnboarded: data.hasOnboarded ?? false,
      plan,
      country: data.country ?? null,
      countryCode: data.countryCode ?? null,
      currency: data.currency ?? null,
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

  let body: { plan?: string };
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
  if (body.plan !== undefined) {
    updates.plan = body.plan;
  }

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
