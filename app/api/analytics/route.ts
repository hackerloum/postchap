import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

async function getUid(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * GET /api/analytics
 * Returns Level 1 analytics: posters generated per month, platform formats, categories,
 * success rate, download counts, top performers.
 */
export async function GET(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const postersRef = db.collection("users").doc(uid).collection("posters");

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
    const startOfLastMonthTs = Timestamp.fromDate(startOfLastMonth);
    const startOfMonthTs = Timestamp.fromDate(startOfMonth);

    const [thisMonthSnap, lastMonthSnap, allSnap] = await Promise.all([
      postersRef
        .where("createdAt", ">=", startOfMonthTs)
        .get(),
      postersRef
        .where("createdAt", ">=", startOfLastMonthTs)
        .where("createdAt", "<", startOfMonthTs)
        .get(),
      postersRef
        .orderBy("createdAt", "desc")
        .limit(200)
        .get(),
    ]);

    const thisMonth = thisMonthSnap.docs;
    const lastMonth = lastMonthSnap.docs;
    const all = allSnap.docs;

    const postersThisMonth = thisMonth.length;
    const postersLastMonth = lastMonth.length;
    const postersPostedThisMonth = thisMonth.filter((d) => {
      const d2 = d.data();
      return d2.postStatus === "posted" || d2.postedToInstagram === true;
    }).length;
    const postersScheduled = all.filter((d) => d.data().postStatus === "scheduled").length;

    const platformCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let generatedCount = 0;
    let failedCount = 0;
    const topByDownload: { id: string; headline: string; imageUrl: string | null; downloadCount: number }[] = [];

    for (const doc of all) {
      const d = doc.data();
      const platform = d.platformFormatId ?? "instagram_square";
      platformCounts[platform] = (platformCounts[platform] ?? 0) + 1;

      const theme = (d.theme as string) ?? "General";
      const category = theme.replace(/^Product: .*/, "Product").trim() || "General";
      categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;

      if (d.status === "generated") generatedCount++;
      else if (d.status === "failed" || d.status === "error") failedCount++;

      const dc = (d.downloadCount as number) ?? 0;
      topByDownload.push({
        id: doc.id,
        headline: d.headline ?? d.copy?.headline ?? "Poster",
        imageUrl: d.imageUrl ?? null,
        downloadCount: dc,
      });
    }

    topByDownload.sort((a, b) => b.downloadCount - a.downloadCount);
    const topPosters = topByDownload.slice(0, 6);

    const totalAttempts = generatedCount + failedCount;
    const successRate = totalAttempts > 0 ? Math.round((generatedCount / totalAttempts) * 100) : 100;

    const platformBreakdown = Object.entries(platformCounts).map(([id, count]) => ({
      id,
      count,
      percent: all.length > 0 ? Math.round((count / all.length) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    const categoryBreakdown = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      percent: all.length > 0 ? Math.round((count / all.length) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      thisMonth: {
        postersGenerated: postersThisMonth,
        postersPosted: postersPostedThisMonth,
        postersScheduled,
      },
      lastMonth: {
        postersGenerated: postersLastMonth,
      },
      successRate,
      platformBreakdown,
      categoryBreakdown,
      topPosters,
    });
  } catch (error) {
    console.error("[analytics]", error);
    return NextResponse.json(
      { error: "Failed to load analytics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
