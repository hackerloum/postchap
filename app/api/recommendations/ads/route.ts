import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import type { Recommendation } from "@/types/generation";

const DOC_PATH = "admin_config/ads_recommendations";

/**
 * GET — Return saved ads (conversion-focused) recommendations for the create page.
 * Requires any authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    await verifyRequestAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await getAdminDb().doc(DOC_PATH).get();
    const data = snap.exists ? snap.data() : null;
    const recommendations = (data?.recommendations as Recommendation[]) ?? [];
    const generatedAt = data?.generatedAt?.toMillis?.() ?? null;
    return NextResponse.json({
      recommendations,
      generatedAt,
    });
  } catch (err) {
    console.error("[recommendations/ads] GET", err);
    return NextResponse.json({ error: "Failed to load ads recommendations" }, { status: 500 });
  }
}
