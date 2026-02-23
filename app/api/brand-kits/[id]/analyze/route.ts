import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { analyzeBrandKit } from "@/lib/ai/analyzeBrandKit";
import type { BrandKit } from "@/types/generation";

async function getUid(request: NextRequest): Promise<string> {
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
 * GET — Return stored analysis only (no OpenAI call).
 * Returns { analysis: {...} | null, analyzedAt: number | null }.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Brand kit ID required" }, { status: 400 });
  }

  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(id)
      .get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }

    const data = snap.data();
    const analysis = data?.analysis ?? null;
    const analyzedAt = data?.analyzedAt?.toMillis?.() ?? null;

    return NextResponse.json({ analysis, analyzedAt });
  } catch (error) {
    console.error("[analyze GET]", error);
    return NextResponse.json({ error: "Failed to get analysis" }, { status: 500 });
  }
}

/**
 * POST — Run OpenAI analysis and save to Firestore.
 * Returns { analysis: {...}, analyzedAt: number }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Brand kit ID required" }, { status: 400 });
  }

  try {
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

    await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(id)
      .update({
        analysis,
        analyzedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    const analyzedAt = Date.now();
    return NextResponse.json({ analysis, analyzedAt });
  } catch (error) {
    console.error("[analyze POST]", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
