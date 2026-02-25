/**
 * Freepik Image to Prompt API — extract a text prompt from an image (async: submit then poll).
 * POST /v1/ai/image-to-prompt, GET /v1/ai/image-to-prompt/{task-id}
 */

const FREEPIK_KEY = process.env.FREEPIK_API_KEY!;
const IMAGE_TO_PROMPT_BASE = "https://api.freepik.com/v1/ai/image-to-prompt";

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

function extractPrompt(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const inner = d?.data as Record<string, unknown> | null | undefined;
  const generated = inner?.generated;
  if (Array.isArray(generated) && generated.length > 0 && typeof generated[0] === "string") {
    return generated[0];
  }
  if (typeof generated === "string") return generated;
  const prompt = (inner?.prompt as string) ?? (d?.prompt as string);
  return typeof prompt === "string" && prompt.length > 0 ? prompt : null;
}

/**
 * Submit an image URL (or data URI) and poll until completion. Returns the extracted text prompt.
 */
export async function imageToPrompt(imageUrl: string): Promise<string> {
  if (!FREEPIK_KEY) throw new Error("Image-to-prompt is not available");

  const res = await fetch(IMAGE_TO_PROMPT_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": FREEPIK_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify({ image: imageUrl }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.warn("[ImageToPrompt] Submit failed:", res.status, text.slice(0, 200));
    throw new Error("Image analysis failed");
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Image analysis failed");
  }

  const root = data as Record<string, unknown>;
  const inner = root?.data as Record<string, unknown> | null | undefined;
  const taskId =
    (inner?.task_id as string) ??
    (root?.task_id as string) ??
    (root?.id as string);

  if (!taskId || typeof taskId !== "string") {
    console.warn("[ImageToPrompt] No task_id:", text.slice(0, 200));
    throw new Error("Image analysis failed");
  }

  const MAX = 25;
  const INTERVAL_MS = 2000;

  for (let i = 1; i <= MAX; i++) {
    await new Promise((r) => setTimeout(r, INTERVAL_MS));

    const getRes = await fetch(`${IMAGE_TO_PROMPT_BASE}/${taskId}`, {
      headers: {
        "x-freepik-api-key": FREEPIK_KEY,
        Accept: "application/json",
      },
    });
    const getText = await getRes.text();

    if (!getRes.ok) {
      console.warn(`[ImageToPrompt] Poll ${i} HTTP ${getRes.status}`);
      continue;
    }

    let pollData: unknown;
    try {
      pollData = JSON.parse(getText);
    } catch {
      continue;
    }

    const status = getStatus(pollData);
    console.log(`[ImageToPrompt] Task ${taskId} — ${status} (${i}/${MAX})`);

    if (
      status === "COMPLETED" ||
      status === "SUCCESS" ||
      status === "DONE"
    ) {
      const prompt = extractPrompt(pollData);
      if (prompt) {
        console.log("[ImageToPrompt] Extracted:", prompt.slice(0, 120));
        return prompt;
      }
      console.warn("[ImageToPrompt] Completed but no prompt in response");
      throw new Error("Image analysis failed");
    }

    if (status === "FAILED" || status === "ERROR" || status === "CANCELLED") {
      console.warn("[ImageToPrompt] Task failed:", status);
      throw new Error("Image analysis failed");
    }
  }

  console.warn("[ImageToPrompt] Timed out");
  throw new Error("Image analysis timed out");
}
