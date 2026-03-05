import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveStudioContext, hasClientAccess } from "@/lib/studio/auth";
import { getClient, postersRef } from "@/lib/studio/db";
import { getStudioPlanLimits } from "@/lib/studio-plans";

type Params = { params: Promise<{ clientId: string }> };

/**
 * POST /api/studio/clients/[clientId]/publish
 * Publishes a poster directly to the client's connected Instagram account.
 * Body: { posterId, imageUrl, caption }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { clientId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied to this client" }, { status: 403 });
  }

  const limits = getStudioPlanLimits(agency.plan);
  if (!limits.directPublishing) {
    return NextResponse.json(
      { error: "Direct publishing requires a Pro or Agency plan.", code: "FEATURE_LOCKED" },
      { status: 403 }
    );
  }

  let body: { posterId?: string; imageUrl?: string; caption?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { posterId, imageUrl, caption = "" } = body;
  if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });

  const client = await getClient(agency.id, clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const instagram = client.instagramTokens;
  if (!instagram?.accessToken || !instagram.userId) {
    return NextResponse.json(
      { error: "Client's Instagram account is not connected. Connect it in the client settings." },
      { status: 400 }
    );
  }

  try {
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: instagram.accessToken,
    });

    const containerRes = await fetch(
      `https://graph.instagram.com/v19.0/${instagram.userId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: containerParams.toString(),
      }
    );
    const containerData = await containerRes.json() as { id?: string; error?: { message: string } };

    if (!containerData.id) {
      return NextResponse.json(
        { error: containerData.error?.message ?? "Failed to prepare Instagram post" },
        { status: 502 }
      );
    }

    // Poll until ready
    let ready = false;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const statusRes = await fetch(
        `https://graph.instagram.com/v19.0/${containerData.id}?fields=status_code&access_token=${instagram.accessToken}`
      );
      const statusData = await statusRes.json() as { status_code?: string };
      if (statusData.status_code === "FINISHED") { ready = true; break; }
      if (statusData.status_code === "ERROR") break;
    }

    if (!ready) {
      return NextResponse.json({ error: "Post preparation timed out." }, { status: 502 });
    }

    const publishParams = new URLSearchParams({
      creation_id: containerData.id,
      access_token: instagram.accessToken,
    });

    const publishRes = await fetch(
      `https://graph.instagram.com/v19.0/${instagram.userId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: publishParams.toString(),
      }
    );
    const publishData = await publishRes.json() as { id?: string; error?: { message: string } };

    if (!publishData.id) {
      return NextResponse.json(
        { error: publishData.error?.message ?? "Failed to publish post" },
        { status: 502 }
      );
    }

    if (posterId) {
      await postersRef(agency.id, clientId).doc(posterId).set(
        {
          instagramPostId: publishData.id,
          postedToInstagram: true,
          postStatus: "posted",
          postedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({
      success: true,
      instagramPostId: publishData.id,
      username: instagram.username,
    });
  } catch (err) {
    console.error("[studio/publish]", err);
    const errMsg = err instanceof Error ? err.message : "Failed to publish post";
    if (posterId) {
      await postersRef(agency.id, clientId).doc(posterId)
        .set({ postStatus: "failed", postError: errMsg }, { merge: true })
        .catch(() => {});
    }
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
