import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { runGenerationForUser } from "@/lib/generation/runGeneration";
import { getPlanLimits } from "@/lib/plans";
import { getUserPlan } from "@/lib/user-plan";
import type { Recommendation } from "@/types/generation";

export const maxDuration = 300;

async function verifyAuth(request: NextRequest): Promise<string> {
  const header = request.headers.get("Authorization");
  const token =
    header?.startsWith("Bearer ")
      ? header.replace("Bearer ", "")
      : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { brandKitId?: string; recommendation?: Recommendation | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { brandKitId, recommendation } = body;

  if (!brandKitId) {
    return NextResponse.json(
      { error: "brandKitId is required" },
      { status: 400 }
    );
  }

  const plan = await getUserPlan(uid);
  const limits = getPlanLimits(plan);
  if (limits.postersPerMonth !== -1) {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("posters")
      .where("createdAt", ">=", Timestamp.fromDate(startOfMonth))
      .count()
      .get();
    const count = snap.data().count;
    if (count >= limits.postersPerMonth) {
      return NextResponse.json(
        {
          error: "Poster limit reached for your plan. Upgrade to create more.",
          code: "POSTER_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }
  }

  try {
    const result = await runGenerationForUser(uid, brandKitId, recommendation ?? null);
    return NextResponse.json({
      success: true,
      posterId: result.posterId,
      imageUrl: result.imageUrl,
      copy: result.copy,
    });
  } catch (error) {
    console.error("[generate]", error);
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Brand kit not found" ? 404 : 500;
    return NextResponse.json(
      { error: status === 404 ? "Brand kit not found" : "Generation failed. Please try again." },
      { status }
    );
  }
}
