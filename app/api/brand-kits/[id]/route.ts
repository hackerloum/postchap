import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

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

function kitFromDoc(id: string, data: Record<string, unknown>) {
  const ts = data.createdAt as { toMillis?: () => number } | undefined;
  const createdAt = (ts?.toMillis?.() ?? (data.createdAt as number) ?? 0) as number;
  return {
    id,
    brandName: data.brandName,
    industry: data.industry,
    tagline: data.tagline,
    website: data.website,
    phoneNumber: data.phoneNumber,
    contactLocation: data.contactLocation,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    accentColor: data.accentColor,
    logoUrl: data.logoUrl,
    brandLocation: data.brandLocation,
    targetAudience: data.targetAudience,
    ageRange: data.ageRange,
    platforms: data.platforms,
    language: data.language,
    tone: data.tone,
    styleNotes: data.styleNotes,
    sampleContent: data.sampleContent,
    _createdAt: createdAt,
  };
}

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
  const { id } = params;
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
    const out = kitFromDoc(snap.id, snap.data()!);
    const { _createdAt, ...kit } = out;
    return NextResponse.json({ ...kit, createdAt: _createdAt });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch brand kit", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Brand kit ID required" }, { status: 400 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const allowed = [
    "brandName", "industry", "tagline", "website",
    "phoneNumber", "contactLocation",
    "primaryColor", "secondaryColor", "accentColor", "logoUrl",
    "brandLocation", "targetAudience", "ageRange", "platforms",
    "language", "tone", "styleNotes", "sampleContent",
  ];
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ success: true });
  }
  try {
    const ref = getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }
    await ref.update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update brand kit", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Brand kit ID required" }, { status: 400 });
  }
  try {
    const ref = getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }
    await ref.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete brand kit", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
