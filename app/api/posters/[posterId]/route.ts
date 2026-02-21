import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-verify";
import { getPoster } from "@/lib/firebase/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ posterId: string }> }
) {
  try {
    const userId = await verifyRequest(request);
    const { posterId } = await params;
    if (!posterId) {
      return NextResponse.json({ error: "Missing posterId" }, { status: 400 });
    }
    const poster = await getPoster(userId, posterId);
    if (!poster) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }
    const p = poster as unknown as Record<string, unknown>;
    const serialized = {
      ...p,
      createdAt: p.createdAt && typeof (p.createdAt as { toDate?: () => Date }).toDate === "function"
        ? (p.createdAt as { toDate: () => Date }).toDate().toISOString()
        : p.createdAt,
      updatedAt: p.updatedAt && typeof (p.updatedAt as { toDate?: () => Date }).toDate === "function"
        ? (p.updatedAt as { toDate: () => Date }).toDate().toISOString()
        : p.updatedAt,
    };
    return NextResponse.json(serialized);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to fetch poster" },
      { status: 500 }
    );
  }
}
