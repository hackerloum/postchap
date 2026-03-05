import { NextRequest, NextResponse } from "next/server";
import { resolveStudioContext, hasClientAccess, canGenerate } from "@/lib/studio/auth";
import { checkAgencyPosterQuota, incrementStudioPosterUsage } from "@/lib/studio/db";
import { runGenerationForStudio } from "@/lib/studio/runGenerationStudio";
import { isProviderLockedForPlan } from "@/lib/image-models";
import type { Recommendation } from "@/types/generation";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uid, agency, member } = ctx;

  if (!canGenerate(member)) {
    return NextResponse.json({ error: "Your role does not permit poster generation" }, { status: 403 });
  }

  let body: {
    clientId?: string;
    brandKitId?: string;
    recommendation?: Recommendation | null;
    templateId?: string | number | null;
    platformFormatId?: string | null;
    inspirationImageUrl?: string | null;
    imageProviderId?: string | null;
    useImprovePrompt?: boolean;
    posterLanguage?: string | null;
    useEditableLayout?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { clientId, brandKitId, recommendation, templateId, platformFormatId, inspirationImageUrl, imageProviderId, useImprovePrompt, posterLanguage, useEditableLayout } = body;

  if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  if (!brandKitId) return NextResponse.json({ error: "brandKitId is required" }, { status: 400 });

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied to this client" }, { status: 403 });
  }

  // Check agency poster quota (trial = 0 posters)
  const quota = await checkAgencyPosterQuota(agency.id);
  if (!quota.allowed) {
    const message =
      agency.plan === "trial"
        ? "Trial plan is view-only. Upgrade to a paid Studio plan to generate posters."
        : `Monthly poster limit reached (${quota.used}/${quota.limit}). Upgrade your Studio plan to generate more.`;
    return NextResponse.json(
      { error: message, code: "POSTER_LIMIT_REACHED", used: quota.used, limit: quota.limit },
      { status: 403 }
    );
  }

  // Check image provider lock — map Studio plans to equivalent plan tiers
  const resolvedProvider = imageProviderId ?? "freepik:seedream";
  const studioPlanToRegular: Record<string, string> = { starter: "free", pro: "pro", agency: "business" };
  const mappedPlan = studioPlanToRegular[agency.plan] ?? "free";
  if (isProviderLockedForPlan(resolvedProvider, mappedPlan as "free" | "pro" | "business")) {
    return NextResponse.json(
      { error: "This image provider is not available on your current plan.", code: "PROVIDER_LOCKED" },
      { status: 403 }
    );
  }

  try {
    const result = await runGenerationForStudio(
      agency.id,
      clientId,
      brandKitId,
      uid,
      recommendation ?? null,
      templateId ?? null,
      platformFormatId ?? null,
      inspirationImageUrl ?? null,
      resolvedProvider,
      useImprovePrompt,
      posterLanguage ?? null,
      useEditableLayout ?? false
    );

    await incrementStudioPosterUsage(agency.id, clientId);

    return NextResponse.json({
      success: true,
      posterId: result.posterId,
      imageUrl: result.imageUrl,
      copy: result.copy,
      hasEditableLayout: result.hasEditableLayout ?? false,
    });
  } catch (err) {
    console.error("[studio/generate]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Generation failed" }, { status: 500 });
  }
}
