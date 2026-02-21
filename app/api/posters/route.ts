import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-verify";
import { getPosters, updatePoster } from "@/lib/firebase/firestore";

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyRequest(request);
    const brandKitId = request.nextUrl.searchParams.get("brandKitId") ?? undefined;
    const posters = await getPosters(userId, brandKitId);
    return NextResponse.json(posters);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to fetch posters" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyRequest(request);
    const body = await request.json();
    if (!body.id)
      return NextResponse.json(
        { error: "Missing poster id" },
        { status: 400 }
      );
    await updatePoster(userId, body.id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to update poster" },
      { status: 500 }
    );
  }
}
