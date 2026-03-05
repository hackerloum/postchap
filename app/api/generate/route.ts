import { NextRequest, NextResponse } from "next/server";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { runGenerationForUser } from "@/lib/generation/runGeneration";
import { getPlanLimits, type PlanId } from "@/lib/plans";
import { getUserPlan } from "@/lib/user-plan";
import { isProviderLockedForPlan } from "@/lib/image-models";
import { getTrialState, incrementTrialPostCount } from "@/lib/trial";
import type { Recommendation, ProductIntent, ProductOverrides } from "@/types/generation";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

export const maxDuration = 300;

async function verifyAuth(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
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
    productId?: string | null;
    productIntent?: ProductIntent | null;
    productOverrides?: ProductOverrides | null;
    posterLanguage?: string | null;
    useEditableLayout?: boolean;
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
    productId,
    productIntent,
    productOverrides,
    posterLanguage,
    useEditableLayout,
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
        useImprovePrompt,
        productId ?? null,
        productIntent ?? null,
        productOverrides ?? null,
        posterLanguage ?? null,
        useEditableLayout ?? false
      );
      await incrementTrialPostCount(uid);
      return NextResponse.json({
        success: true,
        posterId: result.posterId,
        imageUrl: result.imageUrl,
        copy: result.copy,
        hasEditableLayout: result.hasEditableLayout ?? false,
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

  // Check purchased poster credits first — they bypass all plan limits.
  // Read credits once here so we never double-consume between the two old gates.
  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(uid).get();
  const storedCredits = (userDoc.data()?.posterCredits as number) ?? 0;

  if (storedCredits >= 1) {
    // Consume one credit and fall through to generation — no further limit checks needed.
    await db.collection("users").doc(uid).update({
      posterCredits: FieldValue.increment(-1),
    });
  } else {
    // No purchased credits — apply trial-completed gate and monthly plan limit.
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

  // Nano Banana 2 and Pro are business-only; reject if user is on free or pro.
  const requestedProvider = imageProviderId ?? null;
  if (requestedProvider && isProviderLockedForPlan(requestedProvider, plan as PlanId)) {
    return NextResponse.json(
      {
        error: "Nano Banana 2 and Pro are available on the Business plan. Upgrade to unlock.",
        code: "PROVIDER_LOCKED",
      },
      { status: 403 }
    );
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
      useImprovePrompt,
      productId ?? null,
      productIntent ?? null,
      productOverrides ?? null,
      posterLanguage ?? null,
      useEditableLayout ?? false
    );
    return NextResponse.json({
      success: true,
      posterId: result.posterId,
      imageUrl: result.imageUrl,
      copy: result.copy,
      hasEditableLayout: result.hasEditableLayout ?? false,
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
