import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { analyzeBrandKit } from "@/lib/ai/analyzeBrandKit";
import type { BrandKit } from "@/types/generation";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let uid: string;
  try {
    const header = request.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await getAdminAuth().verifyIdToken(header.replace("Bearer ", ""));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = params.id;
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(id)
      .get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }

    const brandKit: BrandKit = { id: snap.id, ...snap.data() } as BrandKit;
    const analysis = await analyzeBrandKit(brandKit);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("[analyze]", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
