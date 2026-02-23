import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

async function getUidFromRequest(request: NextRequest): Promise<string> {
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
 * GET /api/posters/[posterId]/download
 * Returns the poster image as a download (no redirect to Cloudinary).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { posterId: string } }
) {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posterId = params.posterId;
  if (!posterId) {
    return NextResponse.json({ error: "Poster ID required" }, { status: 400 });
  }

  try {
    const doc = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("posters")
      .doc(posterId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }

    const imageUrl = doc.data()?.imageUrl as string | undefined;
    if (!imageUrl || !imageUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Poster image not available" },
        { status: 404 }
      );
    }

    const res = await fetch(imageUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("Content-Type") || "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `poster-${posterId}.png`;
    const inline = request.nextUrl.searchParams.get("inline") === "1";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": inline
          ? "inline"
          : `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[posters download]", err);
    return NextResponse.json(
      {
        error: "Download failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
