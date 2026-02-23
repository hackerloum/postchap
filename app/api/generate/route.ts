import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { generateCopy } from "@/lib/generation/generateCopy";
import { generateImagePrompt } from "@/lib/generation/generateImagePrompt";
import { generateImage } from "@/lib/freepik/generateImage";
import { improvePrompt } from "@/lib/freepik/improvePrompt";
import { compositePoster } from "@/lib/sharp/compositePoster";
import { uploadBufferToCloudinary } from "@/lib/uploadToCloudinary";
import type { BrandKit, CopyData, Recommendation } from "@/types/generation";

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

  try {
    console.log("[generate] Fetching brand kit...");
    const kitSnap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(brandKitId)
      .get();

    if (!kitSnap.exists) {
      return NextResponse.json(
        { error: "Brand kit not found" },
        { status: 404 }
      );
    }

    const kitData = kitSnap.data()!;
    const brandKit: BrandKit = {
      id: kitSnap.id,
      brandName: kitData.brandName,
      industry: kitData.industry,
      tagline: kitData.tagline,
      primaryColor: kitData.primaryColor,
      secondaryColor: kitData.secondaryColor,
      accentColor: kitData.accentColor,
      logoUrl: kitData.logoUrl,
      tone: kitData.tone,
      styleNotes: kitData.styleNotes,
      brandLocation: kitData.brandLocation,
      targetAudience: kitData.targetAudience,
      ageRange: kitData.ageRange,
      platforms: kitData.platforms,
      language: kitData.language,
      sampleContent: kitData.sampleContent,
    };
    console.log("[generate] Brand kit loaded:", brandKit.brandName);

    console.log("[generate] Generating copy...");
    const copy: CopyData = await generateCopy(
      brandKit,
      null,
      recommendation ?? null
    );
    console.log("[generate] Copy:", copy);

    console.log("[generate] Generating image prompt...");
    const imagePrompt = await generateImagePrompt(
      brandKit,
      copy,
      null,
      recommendation ?? null
    );
    console.log("[generate] Image prompt:", imagePrompt?.slice(0, 80) + "...");

    // Optional: enhance prompt with Freepik Improve Prompt API (lighting, composition, style)
    let promptForSeedream = imagePrompt;
    if (process.env.USE_FREEPIK_IMPROVE_PROMPT === "true") {
      try {
        promptForSeedream = await improvePrompt(imagePrompt, {
          type: "image",
          language: "en",
        });
        console.log("[generate] Improved prompt:", promptForSeedream?.slice(0, 80) + "...");
      } catch (err) {
        console.warn("[generate] Improve Prompt failed, using original:", err);
      }
    }

    console.log("[generate] Generating image (Seedream 4.5 primary)...");
    const { buffer: backgroundBuffer, imageHasText } = await generateImage(promptForSeedream);
    console.log("[generate] Background buffer size:", backgroundBuffer.length, "imageHasText:", imageHasText);

    console.log("[generate] Compositing poster...");
    const finalBuffer = await compositePoster({
      backgroundBuffer,
      brandKit: {
        brandName: brandKit.brandName ?? "",
        primaryColor: brandKit.primaryColor ?? "#E8FF47",
        secondaryColor: brandKit.secondaryColor ?? "#111111",
        accentColor: brandKit.accentColor ?? "#FFFFFF",
        logoUrl: brandKit.logoUrl,
        tone: brandKit.tone,
      },
      copy: {
        headline: copy.headline,
        subheadline: copy.subheadline,
        body: copy.body,
        cta: copy.cta,
        hashtags: copy.hashtags ?? [],
      },
      imageHasText,
    });
    console.log("[generate] Final buffer size:", finalBuffer.length);

    console.log("[generate] Uploading to Cloudinary...");
    const posterId = `poster_${uid}_${Date.now()}`;
    const imageUrl = await uploadBufferToCloudinary(
      finalBuffer,
      `artmaster/posters/${uid}`,
      posterId
    );
    console.log("[generate] Uploaded:", imageUrl);

    console.log("[generate] Saving to Firestore...");
    const posterRef = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("posters")
      .add({
        userId: uid,
        brandKitId,
        imageUrl,
        headline: copy.headline,
        subheadline: copy.subheadline,
        body: copy.body,
        cta: copy.cta,
        hashtags: copy.hashtags ?? [],
        theme: recommendation?.theme ?? "General",
        topic: recommendation?.topic ?? "",
        status: "generated",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    console.log("[generate] Done. Poster ID:", posterRef.id);

    return NextResponse.json({
      success: true,
      posterId: posterRef.id,
      imageUrl,
      copy,
    });
  } catch (error) {
    console.error("[generate]", error);
    return NextResponse.json(
      {
        error: "Generation failed",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
