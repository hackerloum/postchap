import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getAdminDb();
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [
      totalUsersSnap,
      freeUsersSnap,
      proUsersSnap,
      businessUsersSnap,
      postersMonthSnap,
      postersTodaySnap,
      revenueSnap,
    ] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("users").where("plan", "==", "free").count().get(),
      db.collection("users").where("plan", "==", "pro").count().get(),
      db.collection("users").where("plan", "==", "business").count().get(),
      db.collectionGroup("posters").where("createdAt", ">=", Timestamp.fromDate(startOfMonth)).count().get(),
      db.collectionGroup("posters").where("createdAt", ">=", Timestamp.fromDate(startOfToday)).count().get(),
      db.collection("payments").where("status", "==", "completed").get(),
    ]);

    const totalRevenue = revenueSnap.docs.reduce((sum, doc) => {
      const amount = doc.data().amount ?? 0;
      const currency = (doc.data().currency ?? "USD").toUpperCase();
      // Normalise to USD: amounts stored in minor units (cents)
      if (currency === "USD") return sum + amount / 100;
      return sum; // skip non-USD for now
    }, 0);

    return NextResponse.json({
      totalUsers: totalUsersSnap.data().count,
      planBreakdown: {
        free: freeUsersSnap.data().count,
        pro: proUsersSnap.data().count,
        business: businessUsersSnap.data().count,
      },
      postersThisMonth: postersMonthSnap.data().count,
      postersToday: postersTodaySnap.data().count,
      totalRevenueUSD: Math.round(totalRevenue * 100) / 100,
    });
  } catch (err) {
    console.error("[admin/stats GET]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
