import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { uploadBase64ToCloudinary } from "@/lib/uploadToCloudinary";
import type { PosterLayout } from "@/lib/generation/layoutTypes";

export const maxDuration = 60;

async function getUidFromRequest(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * POST /api/posters/[posterId]/save-edit
 *
 * Saves an edited poster from the Fabric.js editor:
 *  1. Accepts a base64 PNG data-URL of the flattened canvas.
 *  2. Uploads it to Cloudinary as the new imageUrl.
 *  3. Persists the updated layout JSON so future edits start from the latest state.
 *
 * Body: { dataURL: string, layout?: PosterLayout }
 * Response: { url: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { posterId: string } }
) {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { posterId } = params;
  if (!posterId) {
    return NextResponse.json({ error: "Poster ID required" }, { status: 400 });
  }

  let body: { dataURL?: string; layout?: PosterLayout };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { dataURL, layout } = body;

  if (!dataURL || !dataURL.startsWith("data:image/")) {
    return NextResponse.json({ error: "dataURL is required (base64 image)" }, { status: 400 });
  }

  const db = getAdminDb();
  const posterRef = db
    .collection("users")
    .doc(uid)
    .collection("posters")
    .doc(posterId);

  const posterSnap = await posterRef.get();
  if (!posterSnap.exists) {
    return NextResponse.json({ error: "Poster not found" }, { status: 404 });
  }

  const data = posterSnap.data()!;
  if (data.userId !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Upload flattened PNG to Cloudinary — use a versioned public_id to bust CDN cache
    const editVersion = (typeof data.editCount === "number" ? data.editCount : 0) + 1;
    const publicId = `${posterId}_edit_${editVersion}`;

    const newImageUrl = await uploadBase64ToCloudinary(
      dataURL,
      `artmaster/posters/${uid}`,
      publicId
    );

    const updatePayload: Record<string, unknown> = {
      imageUrl:     newImageUrl,
      lastEditedAt: FieldValue.serverTimestamp(),
      editCount:    FieldValue.increment(1),
      updatedAt:    FieldValue.serverTimestamp(),
    };

    // Persist updated layout JSON if provided
    if (layout && typeof layout === "object") {
      updatePayload.layout = layout;
      updatePayload.hasEditableLayout = true;
    }

    await posterRef.update(updatePayload);

    console.log("[save-edit] Poster", posterId, "saved. URL:", newImageUrl);

    return NextResponse.json({ url: newImageUrl });
  } catch (err) {
    console.error("[save-edit] Failed:", err);
    return NextResponse.json(
      { error: "Failed to save poster edit" },
      { status: 500 }
    );
  }
}
