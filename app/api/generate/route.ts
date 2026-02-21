import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-verify";
import {
  getBrandKit,
  getPosterByDate,
  createPoster,
  updatePoster,
  logActivity,
} from "@/lib/firebase/firestore";
import { setGenerationStatus, clearGenerationStatus } from "@/lib/firebase/realtime";
import { uploadPosterImage } from "@/lib/firebase/storage";
import { generateCopy } from "@/lib/generation/generateCopy";
import { generateImagePrompt } from "@/lib/generation/generateImagePrompt";
import { generateImage } from "@/lib/generation/generateImage";
import { compositePoster } from "@/lib/generation/compositePoster";
import type { PosterSize } from "@/types";

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyRequest(request);
    const body = await request.json();
    const { brandKitId } = body;
    if (!brandKitId)
      return NextResponse.json(
        { error: "Missing brandKitId" },
        { status: 400 }
      );

    const brandKit = await getBrandKit(userId, brandKitId);
    if (!brandKit)
      return NextResponse.json(
        { error: "Brand kit not found" },
        { status: 404 }
      );

    const today = getTodayISO();
    const existing = await getPosterByDate(userId, brandKitId, today, 1);
    if (existing)
      return NextResponse.json({ posterId: existing.id, existing: true });

    const posterData = {
      userId,
      brandKitId,
      createdForDate: today,
      headline: "",
      subheadline: "",
      body: "",
      cta: "",
      hashtags: [] as string[],
      imageUrl: "",
      status: "generated" as const,
      error: null as string | null,
      version: 1,
    };
    const poster = await createPoster(userId, posterData);
    const posterId = poster.id;

    const posterSize: PosterSize = "1080x1080";

    const updateStatus = async (
      status: string,
      progress: number,
      message: string
    ) => {
      await setGenerationStatus(userId, posterId, {
        status: status as "pending" | "generating_copy" | "generating_image" | "compositing" | "uploading" | "complete" | "failed",
        progress,
        message,
        updatedAt: Date.now(),
      });
    };

    await updateStatus("pending", 0, "Starting...");

    try {
      await updateStatus("generating_copy", 10, "Writing your copy...");
      const copy = await generateCopy(brandKit);

      await updateStatus("generating_copy", 25, "Building visual prompt...");
      const imagePrompt = await generateImagePrompt(brandKit, copy);

      await updateStatus("generating_image", 35, "Submitting to Freepik Mystic...");
      const backgroundBuffer = await generateImage(imagePrompt, posterSize);

      await updateStatus("compositing", 78, "Compositing your poster...");
      const finalBuffer = await compositePoster(backgroundBuffer, copy, brandKit);

      await updateStatus("uploading", 90, "Saving to your library...");
      const imageUrl = await uploadPosterImage(
        userId,
        posterId,
        finalBuffer,
        "image/png"
      );

      await updatePoster(userId, posterId, {
        headline: copy.headline,
        subheadline: copy.subheadline,
        body: copy.body,
        cta: copy.cta,
        hashtags: copy.hashtags,
        imageUrl,
        status: "generated",
      });

      await updateStatus("complete", 100, "Your poster is ready!");

      await logActivity(userId, posterId, "generated");

      setTimeout(() => {
        clearGenerationStatus(userId, posterId).catch(() => {});
      }, 10000);

      return NextResponse.json({ posterId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      await updatePoster(userId, posterId, {
        status: "failed",
        error: message,
      });
      await setGenerationStatus(userId, posterId, {
        status: "failed",
        progress: 0,
        message,
        updatedAt: Date.now(),
      });
      await logActivity(userId, posterId, "failed", { error: message });
      throw err;
    }
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}
