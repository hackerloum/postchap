import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-verify";
import { approvePoster, logActivity } from "@/lib/firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyRequest(request);
    const body = await request.json();
    const posterId = body.posterId;
    if (!posterId)
      return NextResponse.json(
        { error: "Missing posterId" },
        { status: 400 }
      );
    await approvePoster(userId, posterId);
    await logActivity(userId, posterId, "approved");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to approve poster" },
      { status: 500 }
    );
  }
}
