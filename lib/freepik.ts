/**
 * Freepik API client for searching and downloading stock photos.
 * Docs: https://docs.freepik.com/
 * Auth: x-freepik-api-key header.
 */

const BASE = "https://api.freepik.com/v1";

function getApiKey(): string {
  const key = process.env.FREEPIK_API_KEY;
  if (!key) throw new Error("FREEPIK_API_KEY is not set");
  return key;
}

export type FreepikResourceType = "photo" | "vector" | "psd";

export interface FreepikSearchFilters {
  "content_type"?: { photo?: 0 | 1; vector?: 0 | 1; psd?: 0 | 1 };
  orientation?: "horizontal" | "vertical" | "square" | "panoramic";
  license?: { freemium?: 0 | 1; premium?: 0 | 1 };
}

export interface FreepikSearchResultItem {
  id: number;
  title?: string;
  url?: string;
  image?: {
    type: FreepikResourceType;
    orientation?: string;
    source?: { size?: string; key?: string; url?: string };
  };
}

export interface FreepikSearchResponse {
  data?: FreepikSearchResultItem[];
}

export interface FreepikDownloadResponse {
  data: {
    url: string;
    signed_url?: string | null;
    filename: string;
    prompt?: string;
  };
}

/**
 * Search resources (photos, vectors, etc.).
 * Use filters to restrict to photos: { "content_type": { "photo": 1 } }
 */
export async function searchResources(
  options: {
    term: string;
    page?: number;
    limit?: number;
    order?: "relevance" | "recent";
    filters?: FreepikSearchFilters;
  }
): Promise<FreepikSearchResponse> {
  const { term, page = 1, limit = 10, order = "relevance", filters } = options;
  const params = new URLSearchParams();
  params.set("term", term);
  if (page > 0) params.set("page", String(page));
  if (limit > 0) params.set("limit", String(Math.min(limit, 100)));
  params.set("order", order);
  if (filters) {
    if (filters["content_type"]) {
      if (filters["content_type"].photo !== undefined)
        params.set("filters[content_type][photo]", String(filters["content_type"].photo));
      if (filters["content_type"].vector !== undefined)
        params.set("filters[content_type][vector]", String(filters["content_type"].vector));
      if (filters["content_type"].psd !== undefined)
        params.set("filters[content_type][psd]", String(filters["content_type"].psd));
    }
    if (filters.orientation)
      params.set("filters[orientation]", filters.orientation);
    if (filters.license) {
      if (filters.license.freemium !== undefined)
        params.set("filters[license][freemium]", String(filters.license.freemium));
      if (filters.license.premium !== undefined)
        params.set("filters[license][premium]", String(filters.license.premium));
    }
  }
  const url = `${BASE}/resources?${params.toString()}`;
  const res = await fetch(url, {
    headers: { "x-freepik-api-key": getApiKey() },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Freepik search failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<FreepikSearchResponse>;
}

/**
 * Get download URL for a resource. For photos, image_size resizes (100–2000px or small/medium/large/original).
 */
export async function getDownloadUrl(
  resourceId: number,
  options?: { image_size?: "small" | "medium" | "large" | "original" | string }
): Promise<FreepikDownloadResponse> {
  const params = new URLSearchParams();
  if (options?.image_size) params.set("image_size", options.image_size);
  const qs = params.toString();
  const url = `${BASE}/resources/${resourceId}/download${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: { "x-freepik-api-key": getApiKey() },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Freepik download failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<FreepikDownloadResponse>;
}

/**
 * Download image bytes for a photo resource. Prefer photo IDs for raster output.
 * Returns { buffer, contentType } (e.g. image/jpeg).
 */
export async function downloadPhotoBuffer(
  resourceId: number,
  imageSize: "small" | "medium" | "large" | "original" | string = "large"
): Promise<{ buffer: Buffer; contentType: string }> {
  const { data } = await getDownloadUrl(resourceId, { image_size: imageSize });
  const downloadUrl = data.url || data.signed_url;
  if (!downloadUrl) throw new Error("No download URL in Freepik response");
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Freepik image fetch failed: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return { buffer, contentType };
}

/**
 * Search for photos and return the first result's ID, or null if none.
 */
export async function findOnePhotoId(searchTerm: string): Promise<number | null> {
  const result = await searchResources({
    term: searchTerm,
    limit: 5,
    order: "relevance",
    filters: { "content_type": { photo: 1 } },
  });
  const items = result.data;
  if (!items?.length) return null;
  const first = items[0];
  return first?.id ?? null;
}
