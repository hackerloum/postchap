/**
 * Freepik image generation — Seedream v4.5 (primary) + Mystic (fallback).
 *
 * When a brand logo is available:
 *   - Seedream: logo sent as `reference_image` (base64 data URI) with
 *     `reference_weight: 0.35` so the model uses it as a color/style anchor
 *     and integrates it top-left without being prompted to draw a fake one.
 *   - Mystic: does NOT support reference_image — Sharp handles logo placement.
 */

const FREEPIK_KEY = process.env.FREEPIK_API_KEY!;
const SEEDREAM_BASE = "https://api.freepik.com/v1/ai/text-to-image/seedream-v4-5";
const MYSTIC_BASE = "https://api.freepik.com/v1/ai/mystic";

// ─── SHARED HELPER ───────────────────────────────────────────────────────────

/**
 * Fetch a remote image and return its base64 representation + MIME type.
 * Used to send logo / sample poster as inline data to both Seedream and Gemini.
 */
export async function fetchImageAsBase64(url: string): Promise<{
  base64: string;
  mimeType: string;
} | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const ct = res.headers.get("content-type") ?? "image/png";
    const mimeType = ct.split(";")[0].trim();
    return { base64, mimeType };
  } catch (err) {
    console.warn("[fetchImageAsBase64] failed:", err);
    return null;
  }
}

// ─── BRAND KIT INTERFACE ─────────────────────────────────────────────────────

export interface FreepikBrandKit {
  logoUrl?: string;
  samplePosterUrl?: string;
  brandName?: string;
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function extractImageUrl(obj: unknown, depth = 0): string | null {
  if (depth > 6 || !obj) return null;
  if (typeof obj === "string") {
    if (obj.startsWith("https://") || obj.startsWith("http://")) return obj;
    if (obj.startsWith("data:image")) return obj;
    if (obj.length > 200 && (obj.startsWith("/9j/") || obj.startsWith("iVBOR")))
      return `data:image/jpeg;base64,${obj}`;
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
      "url", "image_url", "imageUrl", "src", "base64",
      "image", "generated", "images", "data", "result", "output",
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
    return Buffer.from(url.split(",")[1] ?? "", "base64");
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.warn("[ImageGen] Download failed:", res.status);
    throw new Error("Image generation failed");
  }
  return Buffer.from(await res.arrayBuffer());
}

// ─── SEEDREAM ─────────────────────────────────────────────────────────────────

/**
 * Submit a Seedream v4.5 task.
 * When brandKit.logoUrl exists, attaches it as `reference_image` with
 * `reference_weight: 0.35` — a subtle identity anchor that guides the model's
 * color palette and style without making the entire poster look like the logo.
 */
async function submitSeedream(
  prompt: string,
  aspectRatio = "square_1_1",
  brandKit?: FreepikBrandKit
): Promise<string> {
  console.log("[Seedream] Submitting task...");
  console.log("[Seedream] Prompt:", prompt.slice(0, 200));
  console.log("[Seedream] Aspect ratio:", aspectRatio);

  const body: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio,
    enable_safety_checker: true,
  };

  const hasLogo = !!brandKit?.logoUrl;

  if (hasLogo) {
    const logoData = await fetchImageAsBase64(brandKit!.logoUrl!);
    if (logoData) {
      // Seedream accepts reference_image as a base64 data URI.
      // reference_weight 0.35 = subtle color/style anchor.
      // Too high (>0.6) causes the whole poster to visually mimic the logo.
      body.reference_image = `data:${logoData.mimeType};base64,${logoData.base64}`;
      body.reference_weight = 0.35;
      console.log("[Seedream] Logo reference attached:", brandKit!.logoUrl!.slice(0, 60));
    }
  } else if (brandKit?.samplePosterUrl) {
    // Only use sample poster when no logo — Seedream supports one reference at a time
    const sampleData = await fetchImageAsBase64(brandKit.samplePosterUrl);
    if (sampleData) {
      body.reference_image = `data:${sampleData.mimeType};base64,${sampleData.base64}`;
      body.reference_weight = 0.25; // Lower weight for layout reference
      console.log("[Seedream] Sample poster reference attached");
    }
  }

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

    if (status === "COMPLETED" || status === "SUCCESS" || status === "DONE") {
      console.log("[Seedream] COMPLETED response:");
      console.log(JSON.stringify(data, null, 2));
      const url = extractImageUrl(data);
      if (url) {
        console.log("[Seedream] URL found:", url.slice(0, 80));
        return url;
      }
      throw new Error(`Seedream: COMPLETED but no URL. Response: ${JSON.stringify(data)}`);
    }

    if (status === "FAILED" || status === "ERROR" || status === "CANCELLED") {
      const d = data as Record<string, unknown>;
      const innerData = d?.data as Record<string, unknown> | undefined;
      console.warn("[ImageGen] Task failed:", status, (innerData?.error as string) ?? (d?.error as string));
      throw new Error("Image generation failed");
    }
  }

  console.warn("[ImageGen] Timed out waiting for image");
  throw new Error("Image generation failed");
}

// ─── MYSTIC ──────────────────────────────────────────────────────────────────
// Mystic does NOT support reference_image.
// Logo is handled by Sharp after generation (logoHandledByAI: false).

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

    if (status === "COMPLETED" || status === "SUCCESS" || status === "DONE") {
      console.log("[Mystic] COMPLETED:");
      console.log(JSON.stringify(data, null, 2));
      const url = extractImageUrl(data);
      if (url) return url;
      console.warn("[ImageGen] Fallback completed but no URL");
      throw new Error("Image generation failed");
    }

    if (status === "FAILED" || status === "ERROR" || status === "CANCELLED") {
      console.warn("[ImageGen] Fallback task failed:", status);
      throw new Error("Image generation failed");
    }
  }

  console.warn("[ImageGen] Fallback timed out");
  throw new Error("Image generation failed");
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export type ImageGenResult = {
  buffer: Buffer;
  imageHasText: boolean;
  /** True when the provider natively integrated the logo (Seedream with logo ref).
   *  Sharp should skip its logo badge overlay in this case. */
  logoHandledByAI: boolean;
};

/**
 * Generate a poster background via Seedream (primary) → Mystic (fallback).
 * Pass brandKit to enable the Seedream logo reference feature.
 */
export async function generateImage(
  prompt: string,
  aspectRatio = "square_1_1",
  brandKit?: FreepikBrandKit
): Promise<ImageGenResult> {
  if (!FREEPIK_KEY) {
    console.error("[ImageGen] Image service not configured");
    throw new Error("Image generation is not available. Please try again later.");
  }

  const hasLogo = !!brandKit?.logoUrl;

  try {
    console.log("[ImageGen] Primary provider...");
    const taskId = await submitSeedream(prompt, aspectRatio, brandKit);
    const url = await pollSeedream(taskId);
    const buffer = await downloadBuffer(url);
    console.log("[ImageGen] Success:", buffer.length, "bytes");
    return {
      buffer,
      imageHasText: true,
      // Seedream reference_image is style-only; the logo is often not visibly rendered.
      // Always let Sharp composite the logo so it appears on the poster.
      logoHandledByAI: false,
    };
  } catch (primaryErr) {
    console.error("[ImageGen] Primary failed:", primaryErr);

    try {
      console.log("[ImageGen] Fallback provider (Mystic)...");
      const taskId = await submitMystic(prompt, aspectRatio);
      const url = await pollMystic(taskId);
      const buffer = await downloadBuffer(url);
      console.log("[ImageGen] Fallback success:", buffer.length, "bytes");
      return {
        buffer,
        imageHasText: false,
        // Mystic doesn't support reference_image — Sharp handles logo
        logoHandledByAI: false,
      };
    } catch (fallbackErr) {
      console.error("[ImageGen] Fallback failed:", fallbackErr);
      throw new Error("Image generation failed. Please try again.");
    }
  }
}
