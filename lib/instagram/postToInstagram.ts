/**
 * Server-side helper to post an image to Instagram via Graph API.
 * Used by POST /api/social/instagram/post and the scheduled-posts cron.
 */
export interface PostToInstagramOptions {
  imageUrl: string;
  caption: string;
  accessToken: string;
  accountId: string;
}

export interface PostToInstagramResult {
  success: true;
  instagramPostId: string;
}

export async function postToInstagram(
  options: PostToInstagramOptions
): Promise<PostToInstagramResult> {
  const { imageUrl, caption, accessToken, accountId } = options;

  const containerParams = new URLSearchParams({
    image_url: imageUrl,
    caption: caption ?? "",
    access_token: accessToken,
  });

  const containerRes = await fetch(
    `https://graph.instagram.com/v19.0/${accountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: containerParams.toString(),
    }
  );
  const containerData = (await containerRes.json()) as {
    id?: string;
    error?: { message: string };
  };

  if (!containerData.id) {
    throw new Error(containerData.error?.message ?? "Failed to prepare post");
  }

  // Poll until container is ready
  let ready = false;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusRes = await fetch(
      `https://graph.instagram.com/v19.0/${containerData.id}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = (await statusRes.json()) as { status_code?: string };
    if (statusData.status_code === "FINISHED") {
      ready = true;
      break;
    }
    if (statusData.status_code === "ERROR") {
      throw new Error("Post preparation failed");
    }
  }

  if (!ready) {
    throw new Error("Post preparation timed out. Try again.");
  }

  const publishParams = new URLSearchParams({
    creation_id: containerData.id,
    access_token: accessToken,
  });

  const publishRes = await fetch(
    `https://graph.instagram.com/v19.0/${accountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishParams.toString(),
    }
  );
  const publishData = (await publishRes.json()) as {
    id?: string;
    error?: { message: string };
  };

  if (!publishData.id) {
    throw new Error(publishData.error?.message ?? "Failed to publish post");
  }

  return {
    success: true,
    instagramPostId: publishData.id,
  };
}
