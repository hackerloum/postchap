import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getPlanLimits } from "@/lib/plans";
import { getUserPlan } from "@/lib/user-plan";

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

  const plan = await getUserPlan(uid);
  const limits = getPlanLimits(plan);
  if (limits.brandKits !== -1) {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .count()
      .get();
    const count = snap.data().count;
    if (count >= limits.brandKits) {
      return NextResponse.json(
        {
          error: "Brand kit limit reached for your plan. Upgrade to create more.",
          code: "BRAND_KIT_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }
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

    const brandLocation = (body.brandLocation as { country?: string; countryCode?: string; currency?: string }) ?? {};
    await db.collection("users").doc(uid).set(
      {
        hasOnboarded: true,
        updatedAt: FieldValue.serverTimestamp(),
        country: brandLocation.country ?? null,
        countryCode: brandLocation.countryCode ?? null,
        currency: brandLocation.currency ?? null,
      },
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
    uid = await getUidFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .get();

    const withTime = snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toMillis?.() ?? 0;
      return {
        id: d.id,
        brandName: data.brandName,
        industry: data.industry,
        tagline: data.tagline,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        logoUrl: data.logoUrl,
        brandLocation: data.brandLocation,
        _createdAt: createdAt,
      };
    });
    withTime.sort((a, b) => b._createdAt - a._createdAt);
    const kits = withTime.map(({ _createdAt, ...k }) => k);
    return NextResponse.json({ kits });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
