import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days
const SESSION_EXPIRES_IN_MS = SESSION_MAX_AGE_SECONDS * 1000;

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Verify the short-lived ID token from the client first
    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const isAdmin = decoded.isAdmin === true;

    const userRef = getAdminDb().collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      await userRef.set({
        uid,
        email: decoded.email ?? "",
        displayName: decoded.name ?? "",
        hasOnboarded: false,
        plan: "free",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        trialStartedAt: FieldValue.serverTimestamp(),
        trialPostCount: 0,
      });
    }

    const freshSnap = await userRef.get();
    const userData = freshSnap.exists ? freshSnap.data() : null;
    const hasOnboarded = userData?.hasOnboarded ?? false;
    const plan = (userData?.plan as string) ?? "free";

    // Create a long-lived Firebase session cookie (14 days) instead of storing
    // the raw ID token which only lasts 1 hour.
    const sessionCookie = await getAdminAuth().createSessionCookie(token, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    const response = NextResponse.json({
      success: true,
      hasOnboarded,
      isAdmin,
      uid,
      plan,
    });

    response.cookies.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[auth/session POST]", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("__session", "", {
    maxAge: 0,
    path: "/",
  });
  return response;
}
