/**
 * Freepik Improve Prompt API — enhance basic prompts with lighting, composition, style.
 * Use before Seedream 4.5 for better poster generation.
 * Docs: https://docs.freepik.com/api-reference/improve-prompt/overview
 */

const FREEPIK_KEY = process.env.FREEPIK_API_KEY!;
const IMPROVE_PROMPT_BASE = "https://api.freepik.com/v1/ai/improve-prompt";

export type ImprovePromptType = "image" | "video";

export interface ImprovePromptOptions {
  type?: ImprovePromptType;
  /** ISO 639-1, e.g. "en", "sw". Default "en". */
  language?: string;
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

function extractImprovedPrompt(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const inner = d?.data as Record<string, unknown> | null | undefined;
  const candidates = [
    inner?.generated,
    inner?.prompt,
    inner?.result,
    inner?.output,
    inner?.improved_prompt,
    inner?.generated_prompt,
    inner?.text,
    d?.generated,
    d?.prompt,
    d?.result,
    d?.output,
    d?.improved_prompt,
    d?.text,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  if (inner && typeof inner === "object") {
    for (const v of Object.values(inner)) {
      if (typeof v === "string" && v.trim().length > 0) return v.trim();
    }
  }
  return null;
}

/**
 * Enhance a prompt using Freepik Improve Prompt API (async: submit then poll).
 * Returns the improved prompt string. Throws on missing key or API errors.
 */
export async function improvePrompt(
  prompt: string,
  options: ImprovePromptOptions = {}
): Promise<string> {
  if (!FREEPIK_KEY) throw new Error("Prompt enhancement is not available");

  const { type = "image", language = "en" } = options;

  const res = await fetch(IMPROVE_PROMPT_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": FREEPIK_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify({
      prompt: prompt.slice(0, 2500),
      type,
      language,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.warn("[ImprovePrompt] Submit failed:", res.status, text.slice(0, 200));
    throw new Error("Prompt enhancement failed");
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    console.warn("[ImprovePrompt] Invalid response");
    throw new Error("Prompt enhancement failed");
  }

  const taskId =
    (data as Record<string, unknown>)?.data != null
      ? ((data as Record<string, unknown>).data as Record<string, unknown>)
          ?.task_id
      : null;
  const taskIdTop = (data as Record<string, unknown>)?.task_id as
    | string
    | undefined;
  const id = taskId ?? taskIdTop ?? (data as Record<string, unknown>)?.id;

  if (!id || typeof id !== "string") {
    console.warn("[ImprovePrompt] No task_id in response");
    throw new Error("Prompt enhancement failed");
  }

  const MAX = 15;
  const INTERVAL_MS = 1500;

  for (let i = 1; i <= MAX; i++) {
    await new Promise((r) => setTimeout(r, INTERVAL_MS));

    const getRes = await fetch(`${IMPROVE_PROMPT_BASE}/${id}`, {
      headers: {
        "x-freepik-api-key": FREEPIK_KEY,
        Accept: "application/json",
      },
    });
    const getText = await getRes.text();

    if (!getRes.ok) {
      console.warn(`[ImprovePrompt] Poll ${i} HTTP ${getRes.status}`);
      continue;
    }

    let pollData: unknown;
    try {
      pollData = JSON.parse(getText);
    } catch {
      continue;
    }

    const status = getStatus(pollData);
    console.log(`[ImprovePrompt] Task ${id} — ${status} (${i}/${MAX})`);

    if (
      status === "COMPLETED" ||
      status === "SUCCESS" ||
      status === "DONE"
    ) {
      const improved = extractImprovedPrompt(pollData);
      if (improved) {
        console.log("[ImprovePrompt] Enhanced:", improved.slice(0, 120));
        return improved;
      }
      console.warn("[ImprovePrompt] Completed but no text in response, using original prompt");
      return prompt;
    }

    if (
      status === "FAILED" ||
      status === "ERROR" ||
      status === "CANCELLED"
    ) {
      console.warn("[ImprovePrompt] Task failed:", status);
      throw new Error("Prompt enhancement failed");
    }
  }

  console.warn("[ImprovePrompt] Timed out");
  throw new Error("Prompt enhancement failed");
}
