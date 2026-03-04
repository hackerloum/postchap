import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";
import { compositePoster } from "@/lib/sharp/compositePoster";
import { uploadBufferToCloudinary } from "@/lib/uploadToCloudinary";

export const maxDuration = 60;

async function getUidFromRequest(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * POST /api/posters/[posterId]/recomposite
 * Re-runs Sharp compositing on the existing background with updated copy fields.
 * No new image generation — fast (2–4 seconds), zero AI cost.
 *
 * Body (all optional, missing fields keep existing copy):
 *   { headline?, subheadline?, body?, cta?, hashtags? }
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

  let body: {
    headline?: string;
    subheadline?: string;
    body?: string;
    cta?: string;
    hashtags?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getAdminDb();

  try {
    const posterRef = db.collection("users").doc(uid).collection("posters").doc(posterId);
    const posterSnap = await posterRef.get();

    if (!posterSnap.exists) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }

    const d = posterSnap.data()!;

    if (!d.backgroundImageUrl) {
      return NextResponse.json(
        { error: "This poster does not have a stored background image and cannot be recomposited. Only posters generated after the editing feature was released support this." },
        { status: 400 }
      );
    }

    const brandKitId = d.brandKitId as string;
    if (!brandKitId) {
      return NextResponse.json({ error: "Poster is missing brandKitId" }, { status: 400 });
    }

    // Load brand kit for colors, logo, contact info
    const kitSnap = await db
      .collection("users").doc(uid).collection("brand_kits").doc(brandKitId).get();

    if (!kitSnap.exists) {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }

    const kit = kitSnap.data()!;

    // Merge incoming copy fields over existing poster copy
    const mergedCopy = {
      headline:    body.headline    ?? (d.headline    as string) ?? "",
      subheadline: body.subheadline ?? (d.subheadline as string) ?? "",
      body:        body.body        ?? (d.body        as string) ?? "",
      cta:         body.cta         ?? (d.cta         as string) ?? "",
      hashtags:    body.hashtags    ?? (d.hashtags    as string[]) ?? [],
    };

    // Download background buffer
    const bgRes = await fetch(d.backgroundImageUrl as string);
    if (!bgRes.ok) {
      return NextResponse.json({ error: "Failed to download background image" }, { status: 502 });
    }
    const bgArrayBuffer = await bgRes.arrayBuffer();
    const backgroundBuffer = Buffer.from(bgArrayBuffer);

    const width  = (d.width  as number) ?? 1080;
    const height = (d.height as number) ?? 1080;

    // Re-run compositing with merged copy on existing background.
    // Use imageHasText: false so Sharp draws the full overlay (headline, body, CTA, hashtags)
    // with the updated copy — the gradient panel covers the lower area.
    const finalBuffer = await compositePoster({
      backgroundBuffer,
      imageHasText: false,
      brandKit: {
        brandName:       (kit.brandName       as string) ?? "",
        primaryColor:    (kit.primaryColor     as string) ?? "#E8FF47",
        secondaryColor:  (kit.secondaryColor   as string) ?? "#111111",
        accentColor:     (kit.accentColor      as string) ?? "#FFFFFF",
        logoUrl:         kit.logoUrl           as string | undefined,
        tone:            kit.tone              as string | undefined,
        phoneNumber:     kit.phoneNumber       as string | undefined,
        contactLocation: kit.contactLocation   as string | undefined,
        website:         kit.website           as string | undefined,
      },
      copy: mergedCopy,
      width,
      height,
    });

    const currentVersion = (d.version as number) ?? 1;
    const newVersion = currentVersion + 1;

    // Upload new composite
    const newImageUrl = await uploadBufferToCloudinary(
      finalBuffer,
      `artmaster/posters/${uid}`,
      `${posterId}_v${newVersion}`
    );

    // Build edit history entry
    const historyEntry = {
      version:     currentVersion,
      editedAt:    Date.now(),
      editType:    "recomposite" as const,
      previousUrl: d.imageUrl as string,
    };

    await posterRef.update({
      imageUrl:    newImageUrl,
      headline:    mergedCopy.headline,
      subheadline: mergedCopy.subheadline,
      body:        mergedCopy.body,
      cta:         mergedCopy.cta,
      hashtags:    mergedCopy.hashtags,
      version:     newVersion,
      editHistory: FieldValue.arrayUnion(historyEntry),
      updatedAt:   FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success:  true,
      imageUrl: newImageUrl,
      version:  newVersion,
      copy:     mergedCopy,
    });
  } catch (error) {
    console.error("[recomposite]", error);
    return NextResponse.json(
      { error: "Recomposite failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
