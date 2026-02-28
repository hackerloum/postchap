import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

async function getUid(request: NextRequest): Promise<string> {
  const header = request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ")
    ? header.replace("Bearer ", "")
    : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { posterId?: string; imageUrl?: string; caption?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { imageUrl, caption = "" } = body;
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  // Get user's Instagram connection from Firestore
  const db = getAdminDb();
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data();
  const instagram = userData?.instagram as {
    connected?: boolean;
    pageAccessToken?: string;
    accountId?: string;
    username?: string;
  } | undefined;

  if (!instagram?.connected || !instagram.accountId || !instagram.pageAccessToken) {
    return NextResponse.json(
      { error: "Instagram not connected. Go to Settings → Connected Accounts." },
      { status: 400 }
    );
  }

  try {
    // Step 1: Create media container
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: instagram.pageAccessToken,
    });

    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagram.accountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: containerParams.toString(),
      }
    );
    const containerData = await containerRes.json() as {
      id?: string;
      error?: { message: string };
    };

    if (!containerData.id) {
      console.error("[Instagram post] Container failed:", containerData.error);
      return NextResponse.json(
        { error: containerData.error?.message ?? "Failed to prepare post" },
        { status: 502 }
      );
    }

    // Step 2: Poll until container is ready (usually instant)
    let ready = false;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${containerData.id}?fields=status_code&access_token=${instagram.pageAccessToken}`
      );
      const statusData = await statusRes.json() as { status_code?: string };
      if (statusData.status_code === "FINISHED") {
        ready = true;
        break;
      }
      if (statusData.status_code === "ERROR") break;
    }

    if (!ready) {
      return NextResponse.json(
        { error: "Post preparation timed out. Try again." },
        { status: 502 }
      );
    }

    // Step 3: Publish the container
    const publishParams = new URLSearchParams({
      creation_id: containerData.id,
      access_token: instagram.pageAccessToken,
    });

    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagram.accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: publishParams.toString(),
      }
    );
    const publishData = await publishRes.json() as {
      id?: string;
      error?: { message: string };
    };

    if (!publishData.id) {
      console.error("[Instagram post] Publish failed:", publishData.error);
      return NextResponse.json(
        { error: publishData.error?.message ?? "Failed to publish post" },
        { status: 502 }
      );
    }

    // Log the post in Firestore
    if (body.posterId) {
      await db
        .collection("users")
        .doc(uid)
        .collection("posters")
        .doc(body.posterId)
        .set({ instagramPostId: publishData.id, postedToInstagram: true }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      instagramPostId: publishData.id,
      username: instagram.username,
    });
  } catch (err) {
    console.error("[Instagram post] Error:", err);
    return NextResponse.json(
      { error: "Failed to post to Instagram. Please try again." },
      { status: 500 }
    );
  }
}
