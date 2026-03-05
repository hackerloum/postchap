import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { agencyRef } from "@/lib/studio/db";
import type { StudioAgency } from "@/types/studio";

/**
 * GET /api/admin/studio/agencies — list all Studio agencies. Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = await getAdminDb().collection("studio_agencies").orderBy("createdAt", "desc").get();
    const agencies = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ownerId: data.ownerId,
        agencyName: data.agencyName,
        plan: data.plan ?? "trial",
        monthlyPosterLimit: data.monthlyPosterLimit ?? 0,
        postersUsedThisMonth: data.postersUsedThisMonth ?? 0,
        postersResetAt: data.postersResetAt?.toMillis?.() ?? null,
        createdAt: data.createdAt?.toMillis?.() ?? null,
        updatedAt: data.updatedAt?.toMillis?.() ?? null,
      };
    });
    return NextResponse.json({ agencies });
  } catch (err) {
    console.error("[admin/studio/agencies GET]", err);
    return NextResponse.json({ error: "Failed to list agencies" }, { status: 500 });
  }
}
