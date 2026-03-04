import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

async function getUid(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
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
