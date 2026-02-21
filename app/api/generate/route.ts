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
import {
  findOnePhotoId,
  downloadPhotoBuffer,
} from "@/lib/freepik";

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

    await setGenerationStatus(userId, posterId, {
      status: "pending",
      progress: 0,
      message: "Starting...",
      updatedAt: Date.now(),
    });

    try {
      await setGenerationStatus(userId, posterId, {
        status: "generating_copy",
        progress: 20,
        message: "Crafting your copy...",
        updatedAt: Date.now(),
      });
      // TODO: call OpenAI for copy; for now stub
      const headline = "Your headline";
      const subheadline = "Your subheadline";
      const bodyText = "Body text";
      const cta = "Learn more";
      const hashtags = ["#brand"];

      await setGenerationStatus(userId, posterId, {
        status: "generating_image",
        progress: 50,
        message: "Finding artwork...",
        updatedAt: Date.now(),
      });

      const searchTerm =
        brandKit.styleNotes?.trim() ||
        brandKit.sampleContent?.trim() ||
        "minimal social media background";
      let imageBuffer: Buffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      );
      let imageContentType = "image/png";

      if (process.env.FREEPIK_API_KEY) {
        try {
          const photoId = await findOnePhotoId(searchTerm);
          if (photoId) {
            const { buffer, contentType } = await downloadPhotoBuffer(
              photoId,
              "large"
            );
            imageBuffer = buffer;
            imageContentType = contentType;
          }
        } catch {
          // keep placeholder on Freepik errors
        }
      }

      await setGenerationStatus(userId, posterId, {
        status: "compositing",
        progress: 75,
        message: "Compositing your poster...",
        updatedAt: Date.now(),
      });

      await setGenerationStatus(userId, posterId, {
        status: "uploading",
        progress: 90,
        message: "Saving to library...",
        updatedAt: Date.now(),
      });

      const imageUrl = await uploadPosterImage(
        userId,
        posterId,
        imageBuffer,
        imageContentType
      );

      await updatePoster(userId, posterId, {
        headline,
        subheadline,
        body: bodyText,
        cta,
        hashtags,
        imageUrl,
        status: "generated",
      });

      await setGenerationStatus(userId, posterId, {
        status: "complete",
        progress: 100,
        message: "Done!",
        updatedAt: Date.now(),
      });

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
