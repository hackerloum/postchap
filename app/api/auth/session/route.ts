import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE = "__session";
const MAX_AGE = 5 * 24 * 60 * 60; // 5 days

/**
 * POST: set session cookie from Firebase ID token.
 * Body: { token: string }
 * Cookie is set so it works on both HTTP (localhost) and HTTPS (production).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token =
      typeof body?.token === "string" ? body.token.trim() : null;
    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      );
    }
    await adminAuth.verifyIdToken(token);
    const isHttps =
      request.nextUrl?.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}

/**
 * DELETE: clear session cookie (logout).
 */
export async function DELETE(request: NextRequest) {
  const isHttps =
    request.nextUrl?.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
