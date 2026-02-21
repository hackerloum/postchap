/**
 * Freepik AI image generation — Mystic (primary) + Flux 2 Turbo (fallback).
 * Uses async task submission and polling. Base URL: https://api.freepik.com
 */

import type { PosterSize } from "@/types";

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY!;
const BASE_URL = "https://api.freepik.com";
const HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "x-freepik-api-key": FREEPIK_API_KEY || "",
};

function getApiKey(): string {
  const key = process.env.FREEPIK_API_KEY;
  if (!key) throw new Error("FREEPIK_API_KEY is not set");
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Size mapping ───────────────────────────────────────────
function getMysticImageSize(posterSize: PosterSize): { width: number; height: number } {
  const map: Record<PosterSize, { width: number; height: number }> = {
    "1080x1080": { width: 1080, height: 1080 },
    "1080x1350": { width: 1080, height: 1350 },
    "1080x1920": { width: 1080, height: 1920 },
  };
  return map[posterSize];
}

function mapFreepikError(status: number, body: unknown): string {
  switch (status) {
    case 401:
      return "Invalid API key. Check FREEPIK_API_KEY.";
    case 402:
      return "Freepik credits exhausted. Top up your account.";
    case 429:
      return "Rate limit hit. Retry after 60 seconds.";
    case 503:
      return "Freepik service unavailable. Retrying...";
    default:
      return typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: string }).message)
        : `Freepik API error: ${status}`;
  }
}

// ─── 503 retry with exponential backoff ──────────────────────
async function fetchWith503Retry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastRes: Response | null = null;
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);
    lastRes = res;
    if (res.status !== 503) return res;
    const delay = 5000 * Math.pow(2, i);
    console.log(`[Freepik] 503 service unavailable. Retrying in ${delay}ms (${i + 1}/${maxRetries})`);
    await sleep(delay);
  }
  return lastRes!;
}

// ─── STEP 1: Submit generation task to Mystic ───────────────
async function submitMysticTask(
  prompt: string,
  posterSize: PosterSize
): Promise<string> {
  getApiKey();
  const size = getMysticImageSize(posterSize);

  const response = await fetchWith503Retry(
    `${BASE_URL}/v1/ai/mystic`,
    {
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
    }
  );

  const errorBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Freepik Mystic submit failed: ${response.status} — ${mapFreepikError(response.status, errorBody)}`
    );
  }

  const data = errorBody as { data?: { task_id?: string } };
  const taskId = data?.data?.task_id;
  if (!taskId) {
    throw new Error("Freepik Mystic: No task_id returned");
  }

  return taskId;
}

// ─── STEP 2: Poll task status until COMPLETED ───────────────
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
      throw new Error(`Freepik poll failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      data?: {
        status?: string;
        generated?: Array<{ url?: string }>;
        error?: string;
      };
    };
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

// ─── STEP 3: Download image as Buffer ───────────────────────
async function downloadImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download Freepik image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── FALLBACK: Flux 2 Turbo ─────────────────────────────────
async function generateWithFluxTurbo(
  prompt: string,
  posterSize: PosterSize
): Promise<Buffer> {
  getApiKey();
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

  const data = (await response.json()) as { data?: { task_id?: string } };
  const taskId = data?.data?.task_id;

  if (!taskId) throw new Error("Flux Turbo: No task_id returned");

  for (let i = 0; i < 30; i++) {
    await sleep(3000);
    const poll = await fetch(`${BASE_URL}/v1/ai/text-to-image/${taskId}`, {
      method: "GET",
      headers: HEADERS,
    });
    const pollData = (await poll.json()) as {
      data?: {
        status?: string;
        generated?: Array<{ url?: string }>;
      };
    };
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

// ─── MAIN EXPORT ────────────────────────────────────────────
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
    console.error(
      "[Freepik] Mystic failed, trying Flux Turbo fallback:",
      primaryError
    );

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

// ─── PREVIEW GENERATION (for wizard) ────────────────────────
export async function generatePreviewImage(prompt: string): Promise<string> {
  getApiKey();

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

  const data = (await response.json()) as { data?: { task_id?: string } };
  const taskId = data?.data?.task_id;

  if (!taskId) throw new Error("Preview: No task_id returned");

  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    const poll = await fetch(`${BASE_URL}/v1/ai/text-to-image/${taskId}`, {
      method: "GET",
      headers: HEADERS,
    });
    const pollData = (await poll.json()) as {
      data?: { status?: string; generated?: Array<{ url?: string }> };
    };
    if (pollData?.data?.status === "COMPLETED") {
      return pollData?.data?.generated?.[0]?.url ?? "";
    }
  }

  throw new Error("Preview timed out");
}
