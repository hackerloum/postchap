import { NextRequest, NextResponse } from "next/server";
import adminApp from "@/lib/firebase/admin";
import { adminAuth } from "@/lib/firebase/admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// getFirestore(adminApp) returns the real Firestore instance; .collection() works in Vercel bundle
function getDb() {
  return getFirestore(adminApp);
}

export async function POST(request: NextRequest) {
  console.log("[onboarding/complete] Request received");

  try {
    const authHeader = request.headers.get("Authorization");
    console.log("[onboarding/complete] Auth header present:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[onboarding/complete] No Bearer token found");
      return NextResponse.json(
        { error: "Unauthorized — no token" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    console.log("[onboarding/complete] Token extracted, length:", token?.length);

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
      console.log("[onboarding/complete] Token verified, uid:", uid);
    } catch (tokenError) {
      console.error("[onboarding/complete] Token verification failed:", tokenError);
      return NextResponse.json(
        { error: "Unauthorized — invalid token", details: String(tokenError) },
        { status: 401 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
      console.log("[onboarding/complete] Body parsed, keys:", Object.keys(body));
    } catch (parseError) {
      console.error("[onboarding/complete] Body parse failed:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      brandName,
      industry,
      tagline = "",
      website = "",
      primaryColor,
      secondaryColor,
      accentColor,
      logoUrl = "",
      targetAudience = "",
      ageRange = "",
      brandLocation: bodyBrandLocation,
      platforms = [],
      language = "en",
      tone,
      styleNotes = "",
      sampleContent = "",
      competitors = "",
    } = body;

    const defaultLocation = {
      country: "Unknown",
      countryCode: "XX",
      city: "",
      region: "Global",
      continent: "Global",
      timezone: "UTC",
      currency: "USD",
      languages: ["English"],
    };
    const brandLocation =
      bodyBrandLocation &&
      typeof bodyBrandLocation === "object" &&
      (bodyBrandLocation as { country?: string }).country
        ? (bodyBrandLocation as {
            country: string;
            countryCode: string;
            city: string;
            region: string;
            continent: string;
            timezone: string;
            currency: string;
            languages: string[];
          })
        : defaultLocation;

    if (!brandName || !industry || !primaryColor || !tone) {
      console.error("[onboarding/complete] Missing required fields:", {
        brandName: !!brandName,
        industry: !!industry,
        primaryColor: !!primaryColor,
        tone: !!tone,
      });
      return NextResponse.json(
        { error: "Missing required fields: brandName, industry, primaryColor, tone" },
        { status: 400 }
      );
    }

    console.log("[onboarding/complete] All fields validated");

    let brandKitId: string;
    try {
      const brandKitData = {
        userId: uid,
        brandName,
        industry,
        tagline,
        website,
        primaryColor,
        secondaryColor: secondaryColor || "#ffffff",
        accentColor: accentColor || "#E8FF47",
        logoUrl,
        targetAudience,
        ageRange,
        brandLocation,
        platforms,
        language,
        tone,
        styleNotes,
        sampleContent,
        competitors,
        enabled: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      console.log("[onboarding/complete] Writing brand kit to Firestore...");

      const brandKitRef = await getDb()
        .collection("users")
        .doc(uid)
        .collection("brand_kits")
        .add(brandKitData);

      brandKitId = brandKitRef.id;
      console.log("[onboarding/complete] Brand kit created:", brandKitId);
    } catch (firestoreError) {
      console.error("[onboarding/complete] Firestore write failed:", firestoreError);
      return NextResponse.json(
        {
          error: "Failed to create brand kit in database",
          details: String(firestoreError),
        },
        { status: 500 }
      );
    }

    try {
      await db
        .collection("users")
        .doc(uid)
        .collection("poster_jobs")
        .add({
          userId: uid,
          brandKitId,
          enabled: true,
          posterSize: "1080x1080",
          timezone: brandLocation.timezone,
          preferredTime: "08:00",
          createdAt: FieldValue.serverTimestamp(),
        });
      console.log("[onboarding/complete] Poster job created");
    } catch (jobError) {
      console.warn("[onboarding/complete] Poster job creation failed (non-fatal):", jobError);
    }

    try {
      await adminAuth.setCustomUserClaims(uid, { hasOnboarded: true });
      console.log("[onboarding/complete] Custom claim set: hasOnboarded=true");
    } catch (claimError) {
      console.warn("[onboarding/complete] Custom claim failed (non-fatal):", claimError);
    }

    try {
      await getDb().collection("users").doc(uid).set(
        {
          hasOnboarded: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log("[onboarding/complete] User profile updated");
    } catch (profileError) {
      console.warn("[onboarding/complete] Profile update failed (non-fatal):", profileError);
    }

    console.log("[onboarding/complete] SUCCESS — brandKitId:", brandKitId);

    return NextResponse.json({
      success: true,
      brandKitId,
    });
  } catch (unexpectedError) {
    console.error("[onboarding/complete] UNEXPECTED ERROR:", unexpectedError);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(unexpectedError),
      },
      { status: 500 }
    );
  }
}
