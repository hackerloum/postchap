import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { getUpcomingOccasions } from "@/lib/occasions/upcoming";

async function getUid(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * GET /api/occasions/upcoming
 * Returns occasions within leadDays for the user's country (from profile or brand kit).
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

    const userSnap = await db.collection("users").doc(uid).get();
    let countryCode: string | null = (userSnap.data()?.countryCode as string) ?? null;
    if (!countryCode) {
      const kitSnap = await db
        .collection("users")
        .doc(uid)
        .collection("brand_kits")
        .limit(1)
        .get();
      const kit = kitSnap.docs[0]?.data();
      countryCode = kit?.brandLocation?.countryCode ?? null;
    }

    const occasions = getUpcomingOccasions(countryCode, 5);

    return NextResponse.json({ occasions });
  } catch (error) {
    console.error("[occasions/upcoming]", error);
    return NextResponse.json(
      { error: "Failed to load occasions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
