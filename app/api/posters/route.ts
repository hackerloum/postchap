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
