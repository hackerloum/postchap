const FREEPIK_KEY = process.env.FREEPIK_API_KEY!;
const SEEDREAM_BASE =
  "https://api.freepik.com/v1/ai/text-to-image/seedream-v4-5";
const MYSTIC_BASE = "https://api.freepik.com/v1/ai/mystic";

function extractImageUrl(obj: unknown, depth = 0): string | null {
  if (depth > 6 || !obj) return null;

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

async function downloadBuffer(url: string): Promise<Buffer> {
  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1] ?? "";
    return Buffer.from(base64, "base64");
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.warn("[ImageGen] Download failed:", res.status);
    throw new Error("Image generation failed");
  }
  return Buffer.from(await res.arrayBuffer());
}

async function submitSeedream(prompt: string, aspectRatio = "square_1_1"): Promise<string> {
  console.log("[Seedream] Submitting task...");
  console.log("[Seedream] Prompt:", prompt.slice(0, 200));
  console.log("[Seedream] Aspect ratio:", aspectRatio);

  const body = {
    prompt,
    aspect_ratio: aspectRatio,
    enable_safety_checker: true,
  };

  const res = await fetch(SEEDREAM_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": FREEPIK_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log("[Seedream] Submit status:", res.status);
  console.log("[Seedream] Submit response:", text);

  if (!res.ok) {
    console.warn("[ImageGen] Submit failed:", res.status, text.slice(0, 200));
    throw new Error("Image generation failed");
  }

  const data = JSON.parse(text) as Record<string, unknown>;
  const inner = data?.data as Record<string, unknown> | undefined;
  const taskId =
    (inner?.task_id as string) ??
    (data?.task_id as string) ??
    (inner?.id as string) ??
    (data?.id as string);

  if (!taskId) {
    console.warn("[ImageGen] No task_id in response:", text.slice(0, 200));
    throw new Error("Image generation failed");
  }

  console.log("[Seedream] Task ID:", taskId);
  return String(taskId);
}

async function pollSeedream(taskId: string): Promise<string> {
  const MAX = 40;
  const INTERVAL = 3000;

  for (let i = 1; i <= MAX; i++) {
    await new Promise((r) => setTimeout(r, INTERVAL));

    const res = await fetch(`${SEEDREAM_BASE}/${taskId}`, {
      headers: {
        "x-freepik-api-key": FREEPIK_KEY,
        Accept: "application/json",
      },
    });

    const text = await res.text();

    if (!res.ok) {
      console.warn(`[Seedream] Poll ${i} HTTP ${res.status}`);
      continue;
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.warn(`[Seedream] Poll ${i} invalid JSON`);
      continue;
    }

    const status = getStatus(data);
    console.log(`[Seedream] Task ${taskId} — ${status} (${i}/${MAX})`);

    if (
      status === "COMPLETED" ||
      status === "SUCCESS" ||
      status === "DONE"
    ) {
      console.log("[Seedream] COMPLETED response:");
      console.log(JSON.stringify(data, null, 2));

      const url = extractImageUrl(data);
      if (url) {
        console.log("[Seedream] URL found:", url.slice(0, 80));
        return url;
      }

      throw new Error(
        `Seedream: COMPLETED but no URL. Response: ${JSON.stringify(data)}`
      );
    }

    if (
      status === "FAILED" ||
      status === "ERROR" ||
      status === "CANCELLED"
    ) {
      const d = data as Record<string, unknown>;
      const innerData = d?.data as Record<string, unknown> | undefined;
      console.warn("[ImageGen] Task failed:", status, (innerData?.error as string) ?? (d?.error as string));
      throw new Error("Image generation failed");
    }
  }

  console.warn("[ImageGen] Timed out waiting for image");
  throw new Error("Image generation failed");
}

async function submitMystic(prompt: string, aspectRatio = "square_1_1"): Promise<string> {
  console.log("[Mystic] Submitting fallback task...");

  const res = await fetch(MYSTIC_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": FREEPIK_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: "blurry, ugly, distorted, low quality, logo, logos, watermark, emblem, brand mark, text on objects",
      aspect_ratio: aspectRatio,
      model: "realism",
      generative_upscaler: false,
    }),
  });

  const text = await res.text();
  console.log("[Mystic] Submit status:", res.status);
  console.log("[Mystic] Submit response:", text);

  if (!res.ok) {
    console.warn("[ImageGen] Fallback submit failed:", res.status, text.slice(0, 200));
    throw new Error("Image generation failed");
  }

  const data = JSON.parse(text) as Record<string, unknown>;
  const inner = data?.data as Record<string, unknown> | undefined;
  const taskId =
    (inner?.task_id as string) ??
    (data?.task_id as string) ??
    (inner?.id as string) ??
    (data?.id as string);

  if (!taskId) throw new Error(`Mystic: No task_id. Response: ${text}`);

  console.log("[Mystic] Task ID:", taskId);
  return String(taskId);
}

async function pollMystic(taskId: string): Promise<string> {
  const MAX = 40;
  const INTERVAL = 3000;

  for (let i = 1; i <= MAX; i++) {
    await new Promise((r) => setTimeout(r, INTERVAL));

    const res = await fetch(`${MYSTIC_BASE}/${taskId}`, {
      headers: {
        "x-freepik-api-key": FREEPIK_KEY,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[Mystic] Poll ${i} HTTP ${res.status}`);
      continue;
    }

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      continue;
    }

    const status = getStatus(data);
    console.log(`[Mystic] Task ${taskId} — ${status} (${i}/${MAX})`);

    if (
      status === "COMPLETED" ||
      status === "SUCCESS" ||
      status === "DONE"
    ) {
      console.log("[Mystic] COMPLETED:");
      console.log(JSON.stringify(data, null, 2));

      const url = extractImageUrl(data);
      if (url) return url;

      console.warn("[ImageGen] Fallback completed but no URL");
      throw new Error("Image generation failed");
    }

    if (
      status === "FAILED" ||
      status === "ERROR" ||
      status === "CANCELLED"
    ) {
      console.warn("[ImageGen] Fallback task failed:", status);
      throw new Error("Image generation failed");
    }
  }

  console.warn("[ImageGen] Fallback timed out");
  throw new Error("Image generation failed");
}

export type ImageGenResult = { buffer: Buffer; imageHasText: boolean };

export async function generateImage(prompt: string, aspectRatio = "square_1_1"): Promise<ImageGenResult> {
  if (!FREEPIK_KEY) {
    console.error("[ImageGen] Image service not configured");
    throw new Error("Image generation is not available. Please try again later.");
  }

  try {
    console.log("[ImageGen] Primary provider...");
    const taskId = await submitSeedream(prompt, aspectRatio);
    const url = await pollSeedream(taskId);
    const buffer = await downloadBuffer(url);
    console.log("[ImageGen] Success:", buffer.length, "bytes");
    return { buffer, imageHasText: true };
  } catch (primaryErr) {
    console.error("[ImageGen] Primary failed:", primaryErr);

    try {
      console.log("[ImageGen] Fallback provider...");
      const taskId = await submitMystic(prompt, aspectRatio);
      const url = await pollMystic(taskId);
      const buffer = await downloadBuffer(url);
      console.log("[ImageGen] Fallback success:", buffer.length, "bytes");
      return { buffer, imageHasText: false };
    } catch (fallbackErr) {
      console.error("[ImageGen] Fallback failed:", fallbackErr);
      throw new Error("Image generation failed. Please try again.");
    }
  }
}
