/**
 * Freepik Resources API — search templates and download by format.
 * GET /v1/resources (list), GET /v1/resources/{id}/download/{format} (download).
 */

const FREEPIK_KEY = process.env.FREEPIK_API_KEY!;
const RESOURCES_BASE = "https://api.freepik.com/v1/resources";

export interface ResourceItem {
  id: number | string;
  title?: string;
  thumbnail?: string;
  available_formats?: string[];
}

export interface ListResourcesParams {
  term: string;
  page?: number;
  limit?: number;
  order?: "relevance" | "recent";
  filters?: Record<string, Record<string, number | string>>;
}

export async function listResources(params: ListResourcesParams): Promise<{
  items: ResourceItem[];
  total?: number;
  page?: number;
}> {
  if (!FREEPIK_KEY) throw new Error("Freepik API key not configured");

  const { term, page = 1, limit = 20, order = "relevance", filters } = params;
  const url = new URL(RESOURCES_BASE);
  url.searchParams.set("term", term);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("order", order);

  if (filters && typeof filters === "object") {
    for (const [key, sub] of Object.entries(filters)) {
      if (sub && typeof sub === "object") {
        for (const [k, v] of Object.entries(sub)) {
          url.searchParams.set(`filters[${key}][${k}]`, String(v));
        }
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-freepik-api-key": FREEPIK_KEY,
      Accept: "application/json",
      "Accept-Language": "en-US",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    console.warn("[Freepik resources] List failed:", res.status, text.slice(0, 300));
    throw new Error("Template search failed");
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Template search failed");
  }

  const root = data as Record<string, unknown>;
  const inner = root?.data as Record<string, unknown> | undefined;
  const arr = (inner?.items ?? inner?.data ?? root?.items ?? root?.data) as unknown[] | undefined;
  const list = Array.isArray(arr) ? arr : [];

  const items: ResourceItem[] = list.map((item: unknown) => {
    const o = item as Record<string, unknown>;
    const id = o?.id ?? o?.resource_id;
    const image = o?.image as Record<string, unknown> | undefined;
    const source = image?.source as Record<string, unknown> | undefined;
    const meta = o?.meta as Record<string, unknown> | undefined;
    const formats = meta?.available_formats as string[] | undefined;
    return {
      id: id as number | string,
      title: (o?.title as string) ?? (o?.description as string),
      thumbnail: (source?.url as string) ?? (image?.url as string) ?? (o?.thumbnail as string),
      available_formats: Array.isArray(formats) ? formats : undefined,
    };
  });

  return {
    items,
    total: (inner?.total as number) ?? (root?.total as number),
    page: (inner?.page as number) ?? (root?.page as number) ?? page,
  };
}

export async function downloadResource(
  resourceId: string | number,
  format: "jpg" | "png" = "jpg"
): Promise<{ url: string; signed_url?: string; filename?: string }> {
  if (!FREEPIK_KEY) throw new Error("Freepik API key not configured");

  const path = `${RESOURCES_BASE}/${resourceId}/download/${format}`;
  const res = await fetch(path, {
    headers: {
      "x-freepik-api-key": FREEPIK_KEY,
      Accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    console.warn("[Freepik resources] Download failed:", res.status, text.slice(0, 300));
    throw new Error("Template download failed");
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Template download failed");
  }

  const root = data as Record<string, unknown>;
  const rawData = root?.data ?? root;
  // Freepik can return data as single object or as array of one item
  const inner = Array.isArray(rawData) && rawData.length > 0
    ? (rawData[0] as Record<string, unknown>)
    : (rawData as Record<string, unknown>);
  const fileUrl = inner?.url as string | undefined;
  const signedUrl = inner?.signed_url as string | undefined;
  const filename = inner?.filename as string | undefined;

  const finalUrl = signedUrl ?? fileUrl;
  if (!finalUrl) {
    console.warn("[Freepik resources] No URL in response:", text.slice(0, 200));
    throw new Error("Template download failed");
  }

  return { url: finalUrl, signed_url: signedUrl, filename };
}
