import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

async function getUidFromRequest(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * GET /api/posters/calendar?month=YYYY-MM
 * Returns posters with dates in the given month (created, scheduled, or posted).
 * Grouped by date string (YYYY-MM-DD).
 */
export async function GET(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const now = new Date();
  const year = monthParam ? parseInt(monthParam.slice(0, 4), 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam.slice(5, 7), 10) - 1 : now.getMonth();
  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: "Invalid month (use YYYY-MM)" }, { status: 400 });
  }

  const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  const startTs = Timestamp.fromDate(startOfMonth);
  const endTs = Timestamp.fromDate(endOfMonth);

  try {
    const db = getAdminDb();
    const postersRef = db.collection("users").doc(uid).collection("posters");

    const snap = await postersRef
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const byDate: Record<string, { created: unknown[]; scheduled: unknown[]; posted: unknown[] }> = {};

    for (const doc of snap.docs) {
      const d = doc.data();
      const copy = d.copy ?? {};
      const data = {
        id: doc.id,
        imageUrl: d.imageUrl ?? null,
        headline: d.headline ?? copy.headline ?? "Poster",
        status: d.status ?? "generated",
        postStatus: d.postStatus ?? null,
      };

      const createdAt = d.createdAt?.toMillis?.() ?? 0;
      const scheduledFor = d.scheduledFor?.toMillis?.() ?? null;
      const postedAt = d.postedAt?.toMillis?.() ?? null;

      const addToDate = (dateStr: string, key: "created" | "scheduled" | "posted") => {
        if (!byDate[dateStr]) byDate[dateStr] = { created: [], scheduled: [], posted: [] };
        byDate[dateStr][key].push(data);
      };

      const createdDate = new Date(createdAt);
      if (createdDate >= startOfMonth && createdDate <= endOfMonth) {
        addToDate(createdDate.toISOString().slice(0, 10), "created");
      }

      if (scheduledFor) {
        const sd = new Date(scheduledFor);
        if (sd >= startOfMonth && sd <= endOfMonth) {
          addToDate(sd.toISOString().slice(0, 10), "scheduled");
        }
      }

      if (postedAt) {
        const pd = new Date(postedAt);
        if (pd >= startOfMonth && pd <= endOfMonth) {
          addToDate(pd.toISOString().slice(0, 10), "posted");
        }
      }
    }

    return NextResponse.json({
      month: `${year}-${String(month + 1).padStart(2, "0")}`,
      byDate,
    });
  } catch (error) {
    console.error("[posters calendar]", error);
    return NextResponse.json(
      { error: "Failed to load calendar", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
