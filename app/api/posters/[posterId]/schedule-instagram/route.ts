import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

async function getUidFromRequest(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * POST /api/posters/[posterId]/schedule-instagram
 * Schedule a poster to be auto-posted to Instagram at a future time.
 * Body: { scheduledFor: ISO string }
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

  let body: { scheduledFor?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const scheduledForRaw = body.scheduledFor?.trim();
  if (!scheduledForRaw) {
    return NextResponse.json({ error: "scheduledFor is required (ISO string)" }, { status: 400 });
  }

  const scheduledForDate = new Date(scheduledForRaw);
  if (isNaN(scheduledForDate.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledFor date" }, { status: 400 });
  }

  if (scheduledForDate.getTime() <= Date.now()) {
    return NextResponse.json({ error: "scheduledFor must be in the future" }, { status: 400 });
  }

  const db = getAdminDb();

  // Check Instagram connected
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data();
  const instagram = userData?.instagram as {
    connected?: boolean;
    accountId?: string;
    pageAccessToken?: string;
  } | undefined;

  if (!instagram?.connected || !instagram.accountId || !instagram.pageAccessToken) {
    return NextResponse.json(
      { error: "Instagram not connected. Go to Settings → Connected Accounts." },
      { status: 400 }
    );
  }

  // Load poster
  const posterRef = db.collection("users").doc(uid).collection("posters").doc(posterId);
  const posterSnap = await posterRef.get();

  if (!posterSnap.exists) {
    return NextResponse.json({ error: "Poster not found" }, { status: 404 });
  }

  const d = posterSnap.data()!;
  const imageUrl = d.imageUrl as string | undefined;

  if (!imageUrl || !imageUrl.startsWith("http")) {
    return NextResponse.json({ error: "Poster has no image to post" }, { status: 400 });
  }

  try {
    const scheduledForTimestamp = Timestamp.fromDate(scheduledForDate);

    await db.collection("scheduled_instagram_posts").add({
      userId: uid,
      posterId,
      scheduledFor: scheduledForTimestamp,
      createdAt: FieldValue.serverTimestamp(),
    });

    await posterRef.update({
      postStatus: "scheduled",
      scheduledFor: scheduledForTimestamp,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      scheduledFor: scheduledForDate.toISOString(),
    });
  } catch (error) {
    console.error("[schedule-instagram]", error);
    return NextResponse.json(
      { error: "Failed to schedule post", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
