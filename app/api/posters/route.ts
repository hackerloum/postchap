import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

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

export async function GET(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 50);
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("posters")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const posters = snap.docs.map((doc) => {
      const d = doc.data();
      const copy = d.copy ?? {};
      const createdAt = d.createdAt?.toMillis?.() ?? null;
      return {
        id: doc.id,
        imageUrl: d.imageUrl ?? null,
        headline: d.headline ?? copy.headline ?? d.message ?? "Poster",
        subheadline: d.subheadline ?? copy.subheadline ?? "",
        body: d.body ?? copy.body ?? "",
        cta: d.cta ?? copy.cta ?? "",
        hashtags: d.hashtags ?? copy.hashtags ?? [],
        theme: d.theme ?? "General",
        topic: d.topic ?? "",
        status: d.status ?? "generated",
        createdAt,
      };
    });

    return NextResponse.json({ posters });
  } catch (error) {
    console.error("[posters GET]", error);
    return NextResponse.json(
      { error: "Failed to list posters", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { brandKitId?: string; theme?: string; occasion?: string; customPrompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const docRef = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("posters")
      .add({
        userId: uid,
        brandKitId: body.brandKitId ?? "",
        theme: body.theme ?? "",
        occasion: body.occasion ?? "",
        customPrompt: body.customPrompt ?? "",
        status: "draft",
        platform: "instagram",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ success: true, posterId: docRef.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create poster", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
