import { NextRequest, NextResponse } from "next/server";
import { resolveStudioContext, hasClientAccess, canGenerate } from "@/lib/studio/auth";
import { checkAgencyPosterQuota, incrementStudioPosterUsage, getClient } from "@/lib/studio/db";
import { runGenerationForStudio } from "@/lib/studio/runGenerationStudio";
import type { Recommendation } from "@/types/generation";

export const maxDuration = 300;

interface BulkItem {
  clientId: string;
  brandKitId: string;
}

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
    items?: BulkItem[];
    recommendation?: Recommendation | null;
    platformFormatId?: string | null;
    imageProviderId?: string | null;
    posterLanguage?: string | null;
    useEditableLayout?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { items, recommendation, platformFormatId, imageProviderId, posterLanguage, useEditableLayout } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  if (items.length > 20) {
    return NextResponse.json({ error: "Maximum 20 items per bulk request" }, { status: 400 });
  }

  // Check access to all clients
  for (const item of items) {
    if (!hasClientAccess(member, item.clientId)) {
      return NextResponse.json({ error: `Access denied to client ${item.clientId}` }, { status: 403 });
    }
  }

  // Check quota covers all items
  const quota = await checkAgencyPosterQuota(agency.id);
  if (!quota.allowed || (quota.limit !== -1 && quota.used + items.length > quota.limit)) {
    return NextResponse.json(
      {
        error: `Not enough poster quota for bulk generation. Have ${quota.limit - quota.used} remaining.`,
        code: "POSTER_LIMIT_REACHED",
      },
      { status: 403 }
    );
  }

  const results: { clientId: string; posterId?: string; imageUrl?: string; error?: string }[] = [];

  for (const item of items) {
    try {
      const result = await runGenerationForStudio(
        agency.id,
        item.clientId,
        item.brandKitId,
        uid,
        recommendation ?? null,
        null,
        platformFormatId ?? null,
        null,
        imageProviderId ?? "freepik:seedream",
        false,
        posterLanguage ?? null,
        useEditableLayout ?? false
      );

      await incrementStudioPosterUsage(agency.id, item.clientId);

      results.push({
        clientId: item.clientId,
        posterId: result.posterId,
        imageUrl: result.imageUrl,
      });
    } catch (err) {
      results.push({
        clientId: item.clientId,
        error: err instanceof Error ? err.message : "Generation failed",
      });
    }
  }

  const succeeded = results.filter((r) => !r.error).length;
  const failed = results.filter((r) => r.error).length;

  return NextResponse.json({ success: true, results, succeeded, failed });
}
