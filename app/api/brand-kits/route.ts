import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-verify";
import {
  getBrandKits,
  createBrandKit,
  updateBrandKit,
  deleteBrandKit,
} from "@/lib/firebase/firestore";

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyRequest(request);
    const kits = await getBrandKits(userId);
    return NextResponse.json(kits);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to fetch brand kits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyRequest(request);
    const body = await request.json();
    const kit = await createBrandKit(userId, body);
    return NextResponse.json(kit);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to create brand kit" },
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
        { error: "Missing brand kit id" },
        { status: 400 }
      );
    await updateBrandKit(userId, body.id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to update brand kit" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyRequest(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    await deleteBrandKit(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to delete brand kit" },
      { status: 500 }
    );
  }
}
