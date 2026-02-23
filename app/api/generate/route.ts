import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { generateCopy } from "@/lib/generation/generateCopy";
import { generateImagePrompt } from "@/lib/generation/generateImagePrompt";
import { generateImage } from "@/lib/generation/generateImage";
import { compositePoster } from "@/lib/generation/compositePoster";
import { uploadPosterImage } from "@/lib/generation/uploadPosterImage";
import type { BrandKit, CopyData, PosterSize } from "@/types/generation";

async function getUidFromRequest(request: NextRequest): Promise<string> {
  const header = request.headers.get("Authorization");
  const token =
    header?.startsWith("Bearer ")
      ? header.replace("Bearer ", "")
      : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

const VALID_SIZES: PosterSize[] = ["1080x1080", "1080x1350", "1080x1920"];

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    brandKitId?: string;
    theme?: string;
    occasion?: string;
    customPrompt?: string;
    posterSize?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const posterSize: PosterSize = VALID_SIZES.includes((body.posterSize as PosterSize) ?? "")
    ? (body.posterSize as PosterSize)
    : "1080x1080";

  const db = getAdminDb();
  const posterRef = db.collection("users").doc(uid).collection("posters").doc();

  try {
    await posterRef.set({
      userId: uid,
      brandKitId: body.brandKitId ?? "",
      theme: body.theme ?? "",
      occasion: body.occasion ?? "",
      customPrompt: body.customPrompt ?? "",
      status: "generating_copy",
      progress: 10,
      message: "Writing your copy...",
      platform: "instagram",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create poster record", details: String(e) },
      { status: 500 }
    );
  }

  const posterId = posterRef.id;

  const updateStatus = async (status: string, progress: number, message: string) => {
    await posterRef.update({
      status,
      progress,
      message,
      updatedAt: FieldValue.serverTimestamp(),
    });
  };

  try {
    const kitSnap = await db
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(body.brandKitId ?? "")
      .get();
    if (!kitSnap.exists) {
      await posterRef.update({
        status: "failed",
        message: "Brand kit not found",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
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
    };

    await updateStatus("generating_copy", 15, "Writing your copy...");
    const copy: CopyData = await generateCopy(
      brandKit,
      body.theme ?? "",
      body.occasion ?? "",
      body.customPrompt ?? ""
    );

    await updateStatus("generating_image", 25, "Building visual prompt...");
    const imagePrompt = await generateImagePrompt(brandKit, copy);

    await updateStatus("generating_image", 35, "Freepik Mystic is rendering...");
    const backgroundBuffer = await generateImage(imagePrompt, posterSize);

    await updateStatus("compositing", 78, "Compositing your poster...");
    const finalBuffer = await compositePoster(backgroundBuffer, copy, brandKit, posterSize);

    await updateStatus("uploading", 90, "Saving to your library...");
    const imageUrl = await uploadPosterImage(uid, posterId, finalBuffer);

    await posterRef.update({
      status: "complete",
      progress: 100,
      message: "Complete",
      imageUrl,
      copy: {
        headline: copy.headline,
        subheadline: copy.subheadline,
        body: copy.body,
        cta: copy.cta,
        hashtags: copy.hashtags,
      },
      posterSize,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, posterId, imageUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[generate]", msg);
    await posterRef.update({
      status: "failed",
      message: msg,
      updatedAt: FieldValue.serverTimestamp(),
    }).catch(() => {});
    return NextResponse.json({ error: "Generation failed", details: msg }, { status: 500 });
  }
}
