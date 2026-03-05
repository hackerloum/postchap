import { NextRequest, NextResponse } from "next/server";
import { resolveStudioContext, hasClientAccess } from "@/lib/studio/auth";
import { getBrandKit, getClient } from "@/lib/studio/db";
import { analyzeBrandMultimodal } from "@/lib/brand/analyzeBrandMultimodal";
import { generateStudioRecommendationsFromContext } from "@/lib/generation/generateRecommendations";

export async function POST(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  let body: { clientId?: string; brandKitId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { clientId, brandKitId } = body;
  if (!clientId || !brandKitId) {
    return NextResponse.json({ error: "clientId and brandKitId are required" }, { status: 400 });
  }

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied to this client" }, { status: 403 });
  }

  const [kit, client] = await Promise.all([
    getBrandKit(agency.id, clientId, brandKitId),
    getClient(agency.id, clientId),
  ]);

  if (!kit) {
    return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
  }

  let brandDna = (kit as any).brandDna ?? undefined;
  if (!brandDna && (kit.logoUrl || ((kit as any).storePhotoUrls?.length ?? 0) > 0)) {
    brandDna = await analyzeBrandMultimodal({
      logoUrl: kit.logoUrl,
      storePhotoUrls: (kit as any).storePhotoUrls,
      industry: kit.industry,
      brandLocation: kit.brandLocation,
      brandName: kit.brandName ?? client?.clientName,
    }) ?? undefined;
  }

  const brandKitContext = {
    brandName: kit.brandName ?? client?.clientName ?? "Brand",
    industry: (kit.industry ?? (client as any)?.industry) ?? "general",
    tone: kit.tone ?? "professional",
    language: (kit as any).language ?? "English",
    targetAudience: (kit as any).targetAudience ?? "general",
    brandLocation: (kit as any).brandLocation ?? {},
    brandDna: brandDna ?? undefined,
  };

  try {
    const recommendations = await generateStudioRecommendationsFromContext(brandKitContext);
    return NextResponse.json({ recommendations });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "OPENAI_API_KEY not set") {
      return NextResponse.json(
        { error: "Recommendations are not available right now." },
        { status: 503 }
      );
    }
    console.error("[studio/recommendations]", err);
    return NextResponse.json(
      { error: message || "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
