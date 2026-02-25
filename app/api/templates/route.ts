import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { listResources } from "@/lib/freepik/resources";

async function verifyAuth(request: NextRequest): Promise<string> {
  const header = request.headers.get("Authorization");
  const token =
    header?.startsWith("Bearer ")
      ? header.replace("Bearer ", "")
      : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

/**
 * GET /api/templates?term=birthday+poster&page=1&limit=20&order=relevance
 * Optional: filters[content_type][psd]=1, filters[orientation][portrait]=1
 * Returns Freepik template search results for the template picker.
 */
export async function GET(request: NextRequest) {
  try {
    await verifyAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term")?.trim() ?? "social media poster";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const order = (searchParams.get("order") === "recent" ? "recent" : "relevance") as "relevance" | "recent";

  const filters: Record<string, Record<string, number | string>> = {};
  const contentType = searchParams.get("filters[content_type][psd]");
  if (contentType !== null && contentType !== undefined) {
    filters.content_type = { psd: contentType === "1" ? 1 : 0 };
  }
  const orientationPortrait = searchParams.get("filters[orientation][portrait]");
  const orientationSquare = searchParams.get("filters[orientation][square]");
  if (orientationPortrait !== null && orientationPortrait !== undefined) {
    filters.orientation = { portrait: orientationPortrait === "1" ? 1 : 0 };
  }
  if (orientationSquare !== null && orientationSquare !== undefined) {
    filters.orientation = filters.orientation ?? {};
    filters.orientation.square = orientationSquare === "1" ? 1 : 0;
  }

  try {
    const result = await listResources({
      term,
      page,
      limit,
      order,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[templates]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Template search failed" },
      { status: 502 }
    );
  }
}
