import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

async function getUidFromRequest(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * POST /api/posters/[posterId]/cancel-schedule
 * Cancel a scheduled Instagram post.
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

  const db = getAdminDb();

  const posterRef = db.collection("users").doc(uid).collection("posters").doc(posterId);
  const posterSnap = await posterRef.get();

  if (!posterSnap.exists) {
    return NextResponse.json({ error: "Poster not found" }, { status: 404 });
  }

  const d = posterSnap.data()!;
  if ((d.postStatus as string) !== "scheduled") {
    return NextResponse.json(
      { error: "Post is not scheduled" },
      { status: 400 }
    );
  }

  try {
    const scheduledSnap = await db
      .collection("scheduled_instagram_posts")
      .where("userId", "==", uid)
      .where("posterId", "==", posterId)
      .limit(1)
      .get();

    scheduledSnap.docs.forEach((doc) => doc.ref.delete());

    await posterRef.update({
      postStatus: FieldValue.delete(),
      scheduledFor: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cancel-schedule]", error);
    return NextResponse.json(
      { error: "Failed to cancel schedule", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
