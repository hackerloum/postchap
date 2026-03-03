/**
 * Unified image generation.
 * Routes to the provider the user selected via `imageProviderId`.
 * Falls back to freepik:seedream when no valid provider is given.
 */

import { generateImage as generateFreepikPrimary } from "@/lib/freepik/generateImage";
import { generateImageNanoBanana, isNanoBananaConfigured } from "@/lib/gemini/nanoBanana";
import {
  getImageProvider,
  isValidImageProviderId,
  DEFAULT_IMAGE_PROVIDER,
  type ImageProviderId,
} from "@/lib/image-models";

export type ImageGenResult = { buffer: Buffer; imageHasText: boolean };

export { IMAGE_PROVIDERS, DEFAULT_IMAGE_PROVIDER } from "@/lib/image-models";

/**
 * Generate a poster background image using the provider the user selected.
 * @param prompt         Image prompt
 * @param freepikAspectRatio  Aspect ratio in Freepik format (e.g. "square_1_1")
 * @param imageProviderId     One of the IMAGE_PROVIDERS ids
 */
export async function generateImage(
  prompt: string,
  freepikAspectRatio = "square_1_1",
  imageProviderId?: string | null
): Promise<ImageGenResult> {
  const resolvedId: ImageProviderId = isValidImageProviderId(imageProviderId ?? "")
    ? (imageProviderId as ImageProviderId)
    : DEFAULT_IMAGE_PROVIDER;

  const provider = getImageProvider(resolvedId)!;

  console.log(`[ImageProvider] Using ${resolvedId}`);

  if (provider.provider === "gemini") {
    if (!isNanoBananaConfigured()) {
      console.warn("[ImageProvider] Gemini not configured — falling back to Freepik Seedream");
      return generateFreepikPrimary(prompt, freepikAspectRatio);
    }

    // Build a cascade of Gemini models to try in order.
    // Start with the user's chosen model; if quota is exhausted, cascade through
    // the remaining Gemini models (cheapest/most available last) before giving up.
    const GEMINI_CASCADE = ["gemini-2.5-flash-image", "gemini-2.0-flash-image"];
    const modelsToTry: string[] = [provider.geminiModel!];
    for (const m of GEMINI_CASCADE) {
      if (m !== provider.geminiModel) modelsToTry.push(m);
    }

    for (const model of modelsToTry) {
      try {
        if (model !== provider.geminiModel) {
          console.warn(`[ImageProvider] Cascading to Gemini model: ${model}`);
        }
        return await generateImageNanoBanana(prompt, freepikAspectRatio, model);
      } catch (err) {
        if (isGeminiQuotaError(err)) {
          console.warn(`[ImageProvider] Gemini quota exhausted for ${model}`);
          continue; // try next model in cascade
        }
        throw err; // non-quota errors bubble up immediately
      }
    }

    // All Gemini models exhausted — fall back to Freepik
    console.warn("[ImageProvider] All Gemini models quota-exhausted — falling back to Freepik Seedream");
    return generateFreepikPrimary(prompt, freepikAspectRatio);
  }

  // Freepik: force mystic-only or seedream-first (default)
  if (resolvedId === "freepik:mystic") {
    return generateFreepikMysticOnly(prompt, freepikAspectRatio);
  }

  // freepik:seedream — default Freepik flow (Seedream → Mystic fallback)
  return generateFreepikPrimary(prompt, freepikAspectRatio);
}

/**
 * Use Freepik Mystic directly (no Seedream first).
 * Mirrors the internals of lib/freepik/generateImage.ts's Mystic flow.
 */
async function generateFreepikMysticOnly(
  prompt: string,
  aspectRatio = "square_1_1"
): Promise<ImageGenResult> {
  const FREEPIK_KEY = process.env.FREEPIK_API_KEY!;
  const MYSTIC_BASE = "https://api.freepik.com/v1/ai/mystic";

  if (!FREEPIK_KEY) {
    throw new Error("Image generation is not available. FREEPIK_API_KEY is not configured.");
  }

  const submitRes = await fetch(MYSTIC_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": FREEPIK_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: "blurry, ugly, distorted, low quality, logo, watermark",
      aspect_ratio: aspectRatio,
      model: "realism",
      generative_upscaler: false,
    }),
  });

  const submitText = await submitRes.text();
  if (!submitRes.ok) {
    throw new Error(`Freepik Mystic submit failed: ${submitRes.status}`);
  }

  const submitData = JSON.parse(submitText) as Record<string, unknown>;
  const inner = submitData?.data as Record<string, unknown> | undefined;
  const taskId =
    (inner?.task_id as string) ?? (submitData?.task_id as string) ??
    (inner?.id as string) ?? (submitData?.id as string);

  if (!taskId) throw new Error("Freepik Mystic: no task_id in response");

  for (let i = 1; i <= 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetch(`${MYSTIC_BASE}/${taskId}`, {
      headers: { "x-freepik-api-key": FREEPIK_KEY, Accept: "application/json" },
    });
    if (!pollRes.ok) continue;

    let data: unknown;
    try { data = await pollRes.json(); } catch { continue; }

    const d = data as Record<string, unknown>;
    const di = d?.data as Record<string, unknown> | undefined;
    const status = String(
      (di?.status as string) ?? (d?.status as string) ?? (di?.state as string) ?? (d?.state as string) ?? ""
    ).toUpperCase();

    console.log(`[Mystic] Task ${taskId} — ${status} (${i}/40)`);

    if (status === "COMPLETED" || status === "SUCCESS" || status === "DONE") {
      const url = extractUrl(data);
      if (!url) throw new Error("Freepik Mystic: completed but no URL");
      const buf = await downloadBuffer(url);
      return { buffer: buf, imageHasText: false };
    }
    if (status === "FAILED" || status === "ERROR" || status === "CANCELLED") {
      throw new Error("Freepik Mystic task failed");
    }
  }
  throw new Error("Freepik Mystic timed out");
}

function extractUrl(obj: unknown, depth = 0): string | null {
  if (depth > 6 || !obj) return null;
  if (typeof obj === "string") {
    if (obj.startsWith("https://") || obj.startsWith("http://")) return obj;
    if (obj.startsWith("data:image")) return obj;
    if (obj.length > 200 && (obj.startsWith("/9j/") || obj.startsWith("iVBOR")))
      return `data:image/jpeg;base64,${obj}`;
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) { const f = extractUrl(item, depth + 1); if (f) return f; }
    return null;
  }
  if (typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    for (const key of ["url", "image_url", "imageUrl", "src", "base64", "image", "generated", "images", "data", "result", "output"]) {
      if (key in o) { const f = extractUrl(o[key], depth + 1); if (f) return f; }
    }
    for (const key of Object.keys(o)) {
      const f = extractUrl(o[key], depth + 1); if (f) return f;
    }
  }
  return null;
}

async function downloadBuffer(url: string): Promise<Buffer> {
  if (url.startsWith("data:")) return Buffer.from(url.split(",")[1] ?? "", "base64");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Returns true if the error is a Gemini quota/rate-limit error (HTTP 429 /
 * RESOURCE_EXHAUSTED). These are transient billing/quota issues that should
 * fall back to Freepik rather than surface as a hard error to the user.
 */
function isGeminiQuotaError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  if (/RESOURCE_EXHAUSTED/i.test(msg)) return true;
  if (/quota/i.test(msg) && /429|exceeded/i.test(msg)) return true;
  // The @google/genai SDK throws ApiError objects with a `.status` number
  const e = err as Record<string, unknown>;
  if (e?.status === 429) return true;
  if (typeof e?.status === "string" && e.status === "RESOURCE_EXHAUSTED") return true;
  return false;
}
