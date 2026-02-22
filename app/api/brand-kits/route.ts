import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

async function verifyAuth(request: NextRequest) {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const decoded = await getAdminAuth().verifyIdToken(
    header.replace("Bearer ", "")
  );
  return decoded.uid;
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.brandName || !body.industry) {
    return NextResponse.json(
      { error: "brandName and industry are required" },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();

    const kitRef = await db
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .add({
        userId: uid,
        brandName: body.brandName || "",
        industry: body.industry || "other",
        tagline: body.tagline || "",
        website: body.website || "",
        primaryColor: body.primaryColor || "#E8FF47",
        secondaryColor: body.secondaryColor || "#111111",
        accentColor: body.accentColor || "#FFFFFF",
        logoUrl: body.logoUrl || "",
        brandLocation: body.brandLocation || {
          country: "Unknown",
          countryCode: "XX",
          city: "",
          continent: "Global",
          timezone: "UTC",
          currency: "USD",
          languages: ["English"],
        },
        targetAudience: body.targetAudience || "",
        ageRange: body.ageRange || "",
        platforms: body.platforms || [],
        language: body.language || "en",
        tone: body.tone || "professional",
        styleNotes: body.styleNotes || "",
        sampleContent: body.sampleContent || "",
        enabled: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    await db.collection("users").doc(uid).set(
      { hasOnboarded: true, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    await getAdminAuth()
      .setCustomUserClaims(uid, { hasOnboarded: true })
      .catch(() => null);

    return NextResponse.json({
      success: true,
      brandKitId: kitRef.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create brand kit",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .orderBy("createdAt", "desc")
      .get();

    const kits = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ kits });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
