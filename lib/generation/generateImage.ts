import type { PosterSize } from "@/types/generation";

const FREEPIK_KEY = process.env.FREEPIK_API_KEY!;
const BASE = "https://api.freepik.com/v1/ai";

// Recursively finds any image URL or base64 in response
function extractImageUrl(obj: unknown, depth = 0): string | null {
  if (depth > 6 || obj == null) return null;

  if (typeof obj === "string") {
    if (obj.startsWith("https://") || obj.startsWith("http://")) return obj;
    if (obj.startsWith("data:image")) return obj;
    if (
      obj.length > 200 &&
      (obj.startsWith("/9j/") || obj.startsWith("iVBOR"))
    ) {
      return `data:image/jpeg;base64,${obj}`;
    }
    return null;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = extractImageUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    // Check URL-like keys first
    const priority = [
      "url",
      "image_url",
      "imageUrl",
      "src",
      "base64",
      "image",
      "generated",
      "images",
      "data",
      "result",
      "output",
    ];
    for (const key of priority) {
      if (key in o) {
        const found = extractImageUrl(o[key], depth + 1);
        if (found) return found;
      }
    }
    // Then check remaining keys
    for (const key of Object.keys(o)) {
      if (!priority.includes(key)) {
        const found = extractImageUrl(o[key], depth + 1);
        if (found) return found;
      }
    }
  }

  return null;
}

function getStatus(data: unknown): string {
  const d = data as Record<string, unknown> | null | undefined;
  const inner = d?.data as Record<string, unknown> | null | undefined;
  const status =
    (inner?.status as string) ??
    (d?.status as string) ??
    (inner?.state as string) ??
    (d?.state as string) ??
    "";
  return String(status).toUpperCase().trim() || "UNKNOWN";
}

async function submitMystic(prompt: string): Promise<string> {
  console.log("[Freepik] Submitting to Mystic...");

  const res = await fetch(`${BASE}/mystic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": FREEPIK_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt:
        "text, typography, words, letters, watermark, logo, blurry",
      image: { size: "1_1" },
      styling: {
        style: "photo",
        color: "vibrant",
        lightning: "warm",
        framing: "portrait",
      },
      generative_upscaler: false,
    }),
  });

  const text = await res.text();
  console.log("[Freepik] Submit status:", res.status);
  console.log("[Freepik] Submit response:", text);

  if (!res.ok) {
    throw new Error(`Mystic submit failed ${res.status}: ${text}`);
  }

  const data = JSON.parse(text) as Record<string, unknown>;
  const inner = data?.data as Record<string, unknown> | undefined;

  const taskId =
    (inner?.task_id as string) ??
    (data?.task_id as string) ??
    (inner?.id as string) ??
    (data?.id as string);

  if (!taskId) {
    throw new Error(`No task_id found. Response: ${text}`);
  }

  console.log("[Freepik] Mystic task submitted:", taskId);
  return String(taskId);
}

async function pollMystic(taskId: string): Promise<string> {
  const MAX = 40;
  const INTERVAL = 3000;

  for (let i = 1; i <= MAX; i++) {
    await new Promise((r) => setTimeout(r, INTERVAL));

    const res = await fetch(`${BASE}/mystic/${taskId}`, {
      headers: {
        "x-freepik-api-key": FREEPIK_KEY,
        Accept: "application/json",
      },
    });

    const text = await res.text();

    if (!res.ok) {
      console.warn(`[Freepik] Poll ${i} HTTP error: ${res.status}`);
      continue;
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.warn(`[Freepik] Poll ${i} invalid JSON:`, text);
      continue;
    }

    const status = getStatus(data);
    console.log(`[Freepik] Task ${taskId} status: ${status} (attempt ${i}/40)`);

    if (
      status === "COMPLETED" ||
      status === "SUCCESS" ||
      status === "DONE"
    ) {
      // Log EVERYTHING so we can see exactly what came back
      console.log("[Freepik] COMPLETED response:");
      console.log(JSON.stringify(data, null, 2));

      const url = extractImageUrl(data);
      if (url) {
        console.log("[Freepik] Extracted URL:", url.slice(0, 100));
        return url;
      }

      throw new Error(
        `Freepik: Task completed but no image URL found. ` +
          `Response was: ${JSON.stringify(data)}`
      );
    }

    if (
      status === "FAILED" ||
      status === "ERROR" ||
      status === "CANCELLED"
    ) {
      const d = data as Record<string, unknown>;
      const innerData = d?.data as Record<string, unknown> | undefined;
      const errMsg =
        (innerData?.error as string) ?? (d?.error as string) ?? text;
      throw new Error(`Freepik task ${status}: ${errMsg}`);
    }

    // IN_PROGRESS / PENDING / QUEUED — keep polling
  }

  throw new Error(`Freepik: Timed out after ${(MAX * INTERVAL) / 1000}s`);
}

async function fallbackGenerate(prompt: string): Promise<string> {
  console.log("[Freepik Fallback] Trying text-to-image endpoint...");

  const res = await fetch(`${BASE}/text-to-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": FREEPIK_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify({
      prompt: prompt.slice(0, 500),
      negative_prompt: "text, words, letters, watermark",
      num_images: 1,
      image: { size: "1_1" },
      styling: { style: "photo" },
    }),
  });

  const text = await res.text();
  console.log("[Freepik Fallback] Status:", res.status);
  console.log("[Freepik Fallback] Response:", text);

  if (!res.ok) {
    throw new Error(`Flux Turbo failed: ${res.status}`);
  }

  const data = JSON.parse(text) as unknown;
  const url = extractImageUrl(data);

  if (!url) {
    throw new Error(`Fallback: No URL found. Response: ${text}`);
  }

  return url;
}

async function downloadBuffer(url: string): Promise<Buffer> {
  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1];
    return Buffer.from(base64 ?? "", "base64");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function generateImage(
  prompt: string,
  _posterSize?: PosterSize
): Promise<Buffer> {
  if (!FREEPIK_KEY) {
    throw new Error("FREEPIK_API_KEY is not set");
  }

  // Try Mystic first (size fixed to 1_1 for API compatibility; poster resized in composite)
  try {
    const taskId = await submitMystic(prompt);
    const url = await pollMystic(taskId);
    const buffer = await downloadBuffer(url);
    console.log("[Freepik] Mystic success. Size:", buffer.length, "bytes");
    return buffer;
  } catch (primaryErr) {
    console.error("[Freepik] Mystic failed, trying fallback:", primaryErr);

    try {
      const url = await fallbackGenerate(prompt);
      const buffer = await downloadBuffer(url);
      console.log("[Freepik] Fallback success. Size:", buffer.length, "bytes");
      return buffer;
    } catch (fallbackErr) {
      console.error("[Freepik] All generation attempts failed:", fallbackErr);
      throw new Error(
        `Image generation failed. ` +
          `Primary: ${primaryErr instanceof Error ? primaryErr.message : String(primaryErr)}. ` +
          `Fallback: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`
      );
    }
  }
}
