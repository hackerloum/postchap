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
  const text =
    (inner?.generated as string) ??
    (inner?.prompt as string) ??
    (d?.generated as string) ??
    (d?.prompt as string);
  return typeof text === "string" && text.length > 0 ? text : null;
}

/**
 * Enhance a prompt using Freepik Improve Prompt API (async: submit then poll).
 * Returns the improved prompt string. Throws on missing key or API errors.
 */
export async function improvePrompt(
  prompt: string,
  options: ImprovePromptOptions = {}
): Promise<string> {
  if (!FREEPIK_KEY) throw new Error("FREEPIK_API_KEY is not set");

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
    throw new Error(`Improve Prompt submit failed ${res.status}: ${text}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Improve Prompt invalid JSON: ${text.slice(0, 200)}`);
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
    throw new Error(`Improve Prompt: No task_id. Response: ${text.slice(0, 300)}`);
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
      throw new Error(
        `Improve Prompt: COMPLETED but no generated text. Response: ${getText.slice(0, 400)}`
      );
    }

    if (
      status === "FAILED" ||
      status === "ERROR" ||
      status === "CANCELLED"
    ) {
      const err =
        (pollData as Record<string, unknown>)?.data != null
          ? ((pollData as Record<string, unknown>).data as Record<string, unknown>)
              ?.error
          : (pollData as Record<string, unknown>)?.error;
      throw new Error(
        `Improve Prompt task ${status}: ${err ?? getText.slice(0, 200)}`
      );
    }
  }

  throw new Error(
    `Improve Prompt: Timed out after ${(MAX * INTERVAL_MS) / 1000}s`
  );
}
