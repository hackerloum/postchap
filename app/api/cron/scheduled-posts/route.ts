/**
 * Cron: scheduled Instagram posts.
 * Vercel invokes GET /api/cron/scheduled-posts once daily at 8:00 UTC (see vercel.json).
 * On Hobby plan crons run at most once per day; all due posts are processed in this run.
 *
 * Required:
 * - CRON_SECRET env var (min 16 chars); Vercel sends Authorization: Bearer <CRON_SECRET>.
 * - Firestore index on collection "scheduled_instagram_posts", field "scheduledFor" (Ascending).
 *   See firestore.indexes.json or create via the link in the first run error.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { postToInstagram } from "@/lib/instagram/postToInstagram";

export const maxDuration = 120;

const MAX_PER_RUN = 15;

function verifyCronSecret(request: NextRequest): { ok: boolean; reason?: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    return { ok: false, reason: "CRON_SECRET not set or too short" };
  }
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${secret.trim()}`;
  if (authHeader?.trim() !== expected) {
    return { ok: false, reason: "Authorization header missing or invalid" };
  }
  return { ok: true };
}

function buildCaption(d: Record<string, unknown>): string {
  const headline = (d.headline as string) ?? "";
  const body = (d.body as string) ?? "";
  const hashtags = ((d.hashtags as string[]) ?? []).join(" ");
  return [headline, body, hashtags].filter(Boolean).join("\n\n");
}

export async function GET(request: NextRequest) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    console.error("[cron scheduled-posts] Auth failed:", auth.reason);
    return NextResponse.json(
      { error: "Unauthorized", message: auth.reason },
      { status: 401 }
    );
  }

  const db = getAdminDb();
  const now = Timestamp.now();

  const snap = await db
    .collection("scheduled_instagram_posts")
    .where("scheduledFor", "<=", now)
    .orderBy("scheduledFor", "asc")
    .limit(MAX_PER_RUN)
    .get();

  const results: { posterId: string; success: boolean; error?: string }[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const userId = data.userId as string;
    const posterId = data.posterId as string;

    try {
      const userSnap = await db.collection("users").doc(userId).get();
      const userData = userSnap.data();
      const instagram = userData?.instagram as {
        connected?: boolean;
        pageAccessToken?: string;
        accountId?: string;
      } | undefined;

      if (!instagram?.connected || !instagram.pageAccessToken || !instagram.accountId) {
        await doc.ref.delete();
        await db
          .collection("users")
          .doc(userId)
          .collection("posters")
          .doc(posterId)
          .set({ postStatus: "failed", postError: "Instagram disconnected" }, { merge: true });
        results.push({ posterId, success: false, error: "Instagram disconnected" });
        continue;
      }

      const posterSnap = await db
        .collection("users")
        .doc(userId)
        .collection("posters")
        .doc(posterId)
        .get();

      if (!posterSnap.exists) {
        await doc.ref.delete();
        results.push({ posterId, success: false, error: "Poster not found" });
        continue;
      }

      const posterData = posterSnap.data()!;
      const imageUrl = posterData.imageUrl as string | undefined;

      if (!imageUrl || !imageUrl.startsWith("http")) {
        await doc.ref.delete();
        await db
          .collection("users")
          .doc(userId)
          .collection("posters")
          .doc(posterId)
          .set({ postStatus: "failed", postError: "No image" }, { merge: true });
        results.push({ posterId, success: false, error: "No image" });
        continue;
      }

      const caption = buildCaption(posterData);

      const result = await postToInstagram({
        imageUrl,
        caption,
        accessToken: instagram.pageAccessToken,
        accountId: instagram.accountId,
      });

      await doc.ref.delete();
      await db
        .collection("users")
        .doc(userId)
        .collection("posters")
        .doc(posterId)
        .set(
          {
            instagramPostId: result.instagramPostId,
            postedToInstagram: true,
            postStatus: "posted",
            postedAt: FieldValue.serverTimestamp(),
            scheduledFor: FieldValue.delete(),
            postError: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      results.push({ posterId, success: true });
      console.log("[cron scheduled-posts] Posted", posterId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[cron scheduled-posts] Failed", posterId, msg);
      await db
        .collection("users")
        .doc(userId)
        .collection("posters")
        .doc(posterId)
        .set(
          { postStatus: "failed", postError: msg, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      results.push({ posterId, success: false, error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: snap.size,
    results,
  });
}
