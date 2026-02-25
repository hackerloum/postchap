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

/**
 * POST /api/posters/[posterId]/duplicate
 * Creates a copy of the poster (same image, copy, theme). Returns the new poster id.
 */
export async function POST(
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

    const d = doc.data()!;
    const copy = d.copy ?? {};
    const newDoc = {
      userId: uid,
      brandKitId: d.brandKitId ?? "",
      imageUrl: d.imageUrl ?? null,
      headline: d.headline ?? copy.headline ?? "",
      subheadline: d.subheadline ?? copy.subheadline ?? "",
      body: d.body ?? copy.body ?? "",
      cta: d.cta ?? copy.cta ?? "",
      hashtags: d.hashtags ?? copy.hashtags ?? [],
      theme: d.theme ?? "General",
      topic: d.topic ?? "",
      status: "generated",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const ref = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("posters")
      .add(newDoc);

    return NextResponse.json({ success: true, posterId: ref.id });
  } catch (error) {
    console.error("[posters duplicate]", error);
    return NextResponse.json(
      { error: "Failed to duplicate poster", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
