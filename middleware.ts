import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "__session";

export function middleware(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const pathname = req.nextUrl.pathname;

  const isDashboard = pathname.startsWith("/dashboard");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isWelcome = pathname === "/welcome";
  const isGenerating = pathname === "/generating";
  const isReveal = pathname === "/reveal";
  const isPostOnboarding = isWelcome || isGenerating || isReveal;
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/update-password");

  if ((isDashboard || isOnboarding || isPostOnboarding) && !session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isGenerating && !req.nextUrl.searchParams.get("posterId")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/welcome",
    "/generating",
    "/reveal",
    "/login",
    "/signup",
    "/reset-password",
    "/update-password",
  ],
};
