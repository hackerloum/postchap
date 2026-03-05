import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveStudioContext } from "@/lib/studio/auth";
import { referralsRef } from "@/lib/studio/db";

export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (member.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can view referrals" }, { status: 403 });
  }

  try {
    const snap = await referralsRef(agency.id).orderBy("createdAt", "desc").get();
    const referrals = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        referredEmail: data.referredEmail,
        plan: data.plan,
        status: data.status,
        commissionRate: data.commissionRate,
        monthlyAmount: data.monthlyAmount,
        createdAt: data.createdAt?.toMillis?.() ?? null,
      };
    });

    const totalMonthly = referrals
      .filter((r) => r.status === "active")
      .reduce((sum, r) => sum + (r.monthlyAmount ?? 0), 0);

    return NextResponse.json({ referrals, totalMonthlyCommission: totalMonthly });
  } catch (err) {
    console.error("[studio/referrals GET]", err);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

/** POST — track a new referral */
export async function POST(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (member.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can add referrals" }, { status: 403 });
  }

  let body: { referredEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.referredEmail) {
    return NextResponse.json({ error: "referredEmail is required" }, { status: 400 });
  }

  try {
    const docRef = await referralsRef(agency.id).add({
      referrerId: agency.ownerId,
      referredEmail: body.referredEmail.toLowerCase().trim(),
      commissionRate: 0.20,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      referralId: docRef.id,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/signup?ref=${agency.id}`,
    }, { status: 201 });
  } catch (err) {
    console.error("[studio/referrals POST]", err);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
