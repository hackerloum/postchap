import { NextRequest, NextResponse } from "next/server";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { runGenerationForUser } from "@/lib/generation/runGeneration";
import { getPlanLimits } from "@/lib/plans";
import { getUserPlan } from "@/lib/user-plan";
import { getTrialState, incrementTrialPostCount } from "@/lib/trial";
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

  let body: {
    brandKitId?: string;
    recommendation?: Recommendation | null;
    templateId?: string | number | null;
    platformFormatId?: string | null;
    inspirationImageUrl?: string | null;
    imageProviderId?: string | null;
    useImprovePrompt?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const {
    brandKitId,
    recommendation,
    templateId,
    platformFormatId,
    inspirationImageUrl,
    imageProviderId,
    useImprovePrompt,
  } = body;

  if (!brandKitId) {
    return NextResponse.json(
      { error: "brandKitId is required" },
      { status: 400 }
    );
  }

  const plan = await getUserPlan(uid);
  const trial = await getTrialState(uid);

  // Trial active with 1 post remaining: allow once, force Seedream, then increment
  if (trial.active && trial.postsRemaining > 0) {
    try {
      const result = await runGenerationForUser(
        uid,
        brandKitId,
        recommendation ?? null,
        templateId ?? null,
        platformFormatId ?? null,
        inspirationImageUrl ?? null,
        "freepik:seedream",
        useImprovePrompt
      );
      await incrementTrialPostCount(uid);
      return NextResponse.json({
        success: true,
        posterId: result.posterId,
        imageUrl: result.imageUrl,
        copy: result.copy,
      });
    } catch (error) {
      console.error("[generate] trial", error);
      const message = error instanceof Error ? error.message : String(error);
      const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : undefined;
      let status = 500;
      let errorMessage = "Generation failed. Please try again.";
      if (message === "Brand kit not found") {
        status = 404;
        errorMessage = "Brand kit not found";
      } else if (code === "FREEPIK_PREMIUM" || /premium|restricted/i.test(message)) {
        status = 400;
        errorMessage = message;
      }
      return NextResponse.json({ error: errorMessage }, { status });
    }
  }

  // Trial active but already used the one post
  if (trial.active && trial.postsRemaining === 0) {
    return NextResponse.json(
      {
        error: "Your free trial post is used. Upgrade to create more.",
        code: "TRIAL_LIMIT_REACHED",
      },
      { status: 403 }
    );
  }

  // Trial completed (expired or used) and still on free: 0 poster limit
  if (trial.trialCompleted && plan === "free") {
    return NextResponse.json(
      {
        error: "Your free trial has ended. Upgrade to create more posters.",
        code: "TRIAL_LIMIT_REACHED",
      },
      { status: 403 }
    );
  }

  const limits = getPlanLimits(plan);
  if (limits.postersPerMonth !== -1) {
    const db = getAdminDb();
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("posters")
      .where("createdAt", ">=", Timestamp.fromDate(startOfMonth))
      .count()
      .get();
    const count = snap.data().count;
    if (count >= limits.postersPerMonth) {
      // Check for purchased poster credits (one-time purchases)
      const userSnap = await db.collection("users").doc(uid).get();
      const posterCredits = (userSnap.data()?.posterCredits as number) ?? 0;
      if (posterCredits >= 1) {
        // Decrement credit and allow generation
        await db.collection("users").doc(uid).update({
          posterCredits: FieldValue.increment(-1),
        });
        // Fall through to generation below (do not return 403)
      } else {
        return NextResponse.json(
          {
            error: "Poster limit reached for your plan. Upgrade to create more.",
            code: "POSTER_LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }
  }

  try {
    const result = await runGenerationForUser(
      uid,
      brandKitId,
      recommendation ?? null,
      templateId ?? null,
      platformFormatId ?? null,
      inspirationImageUrl ?? null,
      imageProviderId ?? null,
      useImprovePrompt
    );
    return NextResponse.json({
      success: true,
      posterId: result.posterId,
      imageUrl: result.imageUrl,
      copy: result.copy,
    });
  } catch (error) {
    console.error("[generate]", error);
    const message = error instanceof Error ? error.message : String(error);
    const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : undefined;
    let status = 500;
    let errorMessage = "Generation failed. Please try again.";
    if (message === "Brand kit not found") {
      status = 404;
      errorMessage = "Brand kit not found";
    } else if (code === "FREEPIK_PREMIUM" || /premium|restricted/i.test(message)) {
      status = 400;
      errorMessage = message;
    }
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
