import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

async function safeCount(promise: Promise<FirebaseFirestore.AggregateQuerySnapshot<{ count: FirebaseFirestore.AggregateField<number> }>>): Promise<number> {
  try {
    const snap = await promise;
    return snap.data().count ?? 0;
  } catch {
    return 0;
  }
}

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

    // Run all queries in parallel; each is individually fault-tolerant
    const [
      totalUsers,
      freeUsers,
      proUsers,
      businessUsers,
      postersThisMonth,
      postersToday,
      revenueSnap,
    ] = await Promise.all([
      safeCount(db.collection("users").count().get()),
      safeCount(db.collection("users").where("plan", "==", "free").count().get()),
      safeCount(db.collection("users").where("plan", "==", "pro").count().get()),
      safeCount(db.collection("users").where("plan", "==", "business").count().get()),
      // collectionGroup requires a Firestore index — falls back to 0 if not yet created
      safeCount(
        db.collectionGroup("posters")
          .where("createdAt", ">=", Timestamp.fromDate(startOfMonth))
          .count()
          .get()
      ),
      safeCount(
        db.collectionGroup("posters")
          .where("createdAt", ">=", Timestamp.fromDate(startOfToday))
          .count()
          .get()
      ),
      db.collection("payments").where("status", "==", "completed").get().catch(() => null),
    ]);

    const totalRevenue = revenueSnap
      ? revenueSnap.docs.reduce((sum, doc) => {
          const amount = doc.data().amount ?? 0;
          const currency = (doc.data().currency ?? "USD").toUpperCase();
          if (currency === "USD") return sum + amount / 100;
          return sum;
        }, 0)
      : 0;

    return NextResponse.json({
      totalUsers,
      planBreakdown: { free: freeUsers, pro: proUsers, business: businessUsers },
      postersThisMonth,
      postersToday,
      totalRevenueUSD: Math.round(totalRevenue * 100) / 100,
    });
  } catch (err) {
    console.error("[admin/stats GET]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
