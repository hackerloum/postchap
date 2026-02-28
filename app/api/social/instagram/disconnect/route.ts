import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

async function getUid(request: NextRequest): Promise<string> {
  const header = request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ")
    ? header.replace("Bearer ", "")
    : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    await db.collection("users").doc(uid).update({
      instagram: FieldValue.delete(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Instagram disconnect] Error:", err);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
