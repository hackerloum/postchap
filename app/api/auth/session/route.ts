import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE = "__session";
const MAX_AGE = 5 * 24 * 60 * 60; // 5 days

function clearSessionCookie(request: NextRequest): NextResponse {
  const isHttps =
    request.nextUrl?.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  const next = request.nextUrl.searchParams.get("next") || "/login";
  const nextUrl = next.startsWith("/") && !next.startsWith("//")
    ? new URL(next, request.nextUrl.origin)
    : new URL("/login", request.nextUrl.origin);
  const res = NextResponse.redirect(nextUrl, 302);
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

/**
 * GET: clear session cookie and redirect (breaks redirect loop when token is invalid).
 * Use ?action=clear&next=/login so protected pages can send users to login with cookie cleared.
 */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("action") === "clear") {
    return clearSessionCookie(request);
  }
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

/**
 * POST: set session cookie from Firebase ID token.
 * Body: JSON { token: string } or form-urlencoded token=...
 * Query: ?redirect=/dashboard — if present and token valid, respond with 302 so the browser
 * follows with the cookie set (fixes Google redirect flow).
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let token: string | null = null;
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      const t = form.get("token");
      token = typeof t === "string" ? t.trim() : null;
    } else {
      const body = await request.json().catch(() => null);
      token = typeof body?.token === "string" ? body.token.trim() : null;
    }
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
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const baseUrl = request.nextUrl.origin;
    const redirectUrl =
      redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? new URL(redirectTo, baseUrl)
        : null;

    if (redirectUrl) {
      const res = NextResponse.redirect(redirectUrl, 302);
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE,
      });
      return res;
    }

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
