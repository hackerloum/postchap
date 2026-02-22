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

  if (!token) {
    if (isDashboard || isOnboarding) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  try {
    const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    const hasOnboarded = (payload.hasOnboarded as boolean) ?? false;

    if (isAuthPage) {
      if (hasOnboarded) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    if (isDashboard && !hasOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (isOnboarding && hasOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("__session", "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/login", "/signup"],
};
