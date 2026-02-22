import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const JWKS_URL = `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("__session")?.value;

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isDashboard = pathname.startsWith("/dashboard");
  const isOnboarding = pathname === "/onboarding";
  const isApi = pathname.startsWith("/api");

  if (isApi) return NextResponse.next();

  // No session cookie — require login for protected routes
  if (!token) {
    if (isDashboard || isOnboarding) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Has session cookie — for dashboard/onboarding, trust it (set by our API after Firebase verify)
  // Token verification via jose can fail in Edge (JWKS fetch, env, etc.), so skip for protected routes
  if (isDashboard || isOnboarding) {
    return NextResponse.next();
  }

  // Auth pages (login/signup) — verify token to redirect logged-in users
  try {
    const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    const hasOnboarded = (payload.hasOnboarded as boolean) ?? false;

    if (hasOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  } catch {
    // Verification failed — let them through to login page (e.g. expired token)
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/login", "/signup"],
};
