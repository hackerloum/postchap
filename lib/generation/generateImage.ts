import type { PosterSize } from "@/types/generation";

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY!;
const BASE_URL = "https://api.freepik.com";
const HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "x-freepik-api-key": FREEPIK_API_KEY,
};

function getMysticImageSize(posterSize: PosterSize): { width: number; height: number } {
  const map: Record<PosterSize, { width: number; height: number }> = {
    "1080x1080": { width: 1080, height: 1080 },
    "1080x1350": { width: 1080, height: 1350 },
    "1080x1920": { width: 1080, height: 1920 },
  };
  return map[posterSize];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitMysticTask(
  prompt: string,
  posterSize: PosterSize
): Promise<string> {
  const size = getMysticImageSize(posterSize);

  const response = await fetch(`${BASE_URL}/v1/ai/mystic`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      prompt,
      negative_prompt:
        "text, typography, words, letters, watermark, logo, blurry, " +
        "low quality, distorted, ugly, bad anatomy, deformed",
      image: {
        width: size.width,
        height: size.height,
      },
      styling: {
        style: "photo",
        color: "vibrant",
        lightning: "warm",
        framing: "portrait",
      },
      guidance_scale: 7,
      num_inference_steps: 30,
    }),
  });

  if (!response.ok) {
    const err = response.status;
    if (err === 401) throw new Error("Invalid API key. Check FREEPIK_API_KEY.");
    if (err === 402) throw new Error("Freepik credits exhausted. Top up your account.");
    if (err === 429) throw new Error("Rate limit hit. Retry after 60 seconds.");
    if (err === 503) throw new Error("Freepik service unavailable. Retrying later.");
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Freepik Mystic submit failed: ${response.status} — ${JSON.stringify(error)}`
    );
  }

  const data = await response.json();
  const taskId = data?.data?.task_id;
  if (!taskId) {
    throw new Error("Freepik Mystic: No task_id returned");
  }
  return taskId;
}

async function pollMysticTask(
  taskId: string,
  maxAttempts = 40,
  intervalMs = 3000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(intervalMs);

    const response = await fetch(`${BASE_URL}/v1/ai/mystic/${taskId}`, {
      method: "GET",
      headers: HEADERS,
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Rate limit hit. Retry after 60 seconds.");
      throw new Error(`Freepik poll failed: ${response.status}`);
    }

    const data = await response.json();
    const status = data?.data?.status;

    if (status === "COMPLETED") {
      const imageUrl = data?.data?.generated?.[0]?.url;
      if (!imageUrl) {
        throw new Error("Freepik: Task completed but no image URL found");
      }
      return imageUrl;
    }

    if (status === "FAILED" || status === "ERROR") {
      const errorMsg = data?.data?.error || "Unknown error";
      throw new Error(`Freepik Mystic task failed: ${errorMsg}`);
    }

    console.log(
      `[Freepik] Task ${taskId} status: ${status} (attempt ${attempt + 1}/${maxAttempts})`
    );
  }

  throw new Error(
    `Freepik Mystic: Task ${taskId} timed out after ${maxAttempts} attempts`
  );
}

async function downloadImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download Freepik image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateWithFluxTurbo(
  prompt: string,
  posterSize: PosterSize
): Promise<Buffer> {
  const size = getMysticImageSize(posterSize);

  const response = await fetch(`${BASE_URL}/v1/ai/text-to-image`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      prompt,
      negative_prompt: "text, typography, words, letters, watermark, blurry",
      model: "flux-2-turbo",
      image: {
        width: size.width,
        height: size.height,
      },
      num_inference_steps: 20,
      guidance_scale: 6,
    }),
  });

  if (!response.ok) {
    throw new Error(`Flux Turbo failed: ${response.status}`);
  }

  const data = await response.json();
  const taskId = data?.data?.task_id;
  if (!taskId) throw new Error("Flux Turbo: No task_id returned");

  for (let i = 0; i < 30; i++) {
    await sleep(3000);
    const poll = await fetch(`${BASE_URL}/v1/ai/text-to-image/${taskId}`, {
      method: "GET",
      headers: HEADERS,
    });
    const pollData = await poll.json();
    if (pollData?.data?.status === "COMPLETED") {
      const url = pollData?.data?.generated?.[0]?.url;
      if (!url) throw new Error("Flux Turbo: No image URL");
      return downloadImageBuffer(url);
    }
    if (pollData?.data?.status === "FAILED") {
      throw new Error("Flux Turbo task failed");
    }
  }

  throw new Error("Flux Turbo: Timed out");
}

export async function generateImage(
  prompt: string,
  posterSize: PosterSize
): Promise<Buffer> {
  try {
    console.log("[Freepik] Submitting to Mystic...");
    const taskId = await submitMysticTask(prompt, posterSize);

    console.log(`[Freepik] Mystic task submitted: ${taskId}`);
    const imageUrl = await pollMysticTask(taskId);

    console.log("[Freepik] Mystic completed. Downloading image...");
    return await downloadImageBuffer(imageUrl);
  } catch (primaryError) {
    console.error("[Freepik] Mystic failed, trying Flux Turbo fallback:", primaryError);
    try {
      return await generateWithFluxTurbo(prompt, posterSize);
    } catch (fallbackError) {
      console.error("[Freepik] All generation attempts failed:", fallbackError);
      throw new Error(
        `Image generation failed. Primary: ${primaryError}. Fallback: ${fallbackError}`
      );
    }
  }
}

export async function generatePreviewImage(prompt: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/v1/ai/text-to-image`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      prompt,
      model: "flux-2-klein",
      image: { width: 512, height: 512 },
      num_inference_steps: 8,
      guidance_scale: 5,
    }),
  });

  if (!response.ok) throw new Error("Preview generation failed");

  const data = await response.json();
  const taskId = data?.data?.task_id;

  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    const poll = await fetch(`${BASE_URL}/v1/ai/text-to-image/${taskId}`, {
      method: "GET",
      headers: HEADERS,
    });
    const pollData = await poll.json();
    if (pollData?.data?.status === "COMPLETED") {
      return pollData?.data?.generated?.[0]?.url ?? "";
    }
  }

  throw new Error("Preview timed out");
}
