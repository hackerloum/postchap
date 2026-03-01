import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

const DOC_PATH = "admin_config/artmaster_brand_kit";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = await getAdminDb().doc(DOC_PATH).get();
    return NextResponse.json(snap.exists ? snap.data() : {});
  } catch (err) {
    console.error("[admin/artmaster-kit GET]", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    await getAdminDb()
      .doc(DOC_PATH)
      .set({ ...body, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/artmaster-kit PUT]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
