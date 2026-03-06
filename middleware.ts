import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass pathname to server components via header (used by studio layout for bypass routes)
  const response = NextResponse.next({
    request: { headers: new Headers({ ...Object.fromEntries(request.headers), "x-pathname": pathname }) },
  });

  if (!pathname.startsWith("/admin")) {
    return response;
  }

  const token = request.cookies.get("__session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Decode the JWT payload without verifying signature (Edge runtime can't use Firebase Admin SDK).
    // The actual signature verification happens in every admin API route server-side.
    // This middleware only prevents accidental navigation — the API routes are the real security layer.
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as { isAdmin?: boolean; role?: string; exp?: number };

    const now = Math.floor(Date.now() / 1000);
    if (!payload.isAdmin || (payload.exp && payload.exp < now)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Terminal route requires superadmin role
    if (pathname.startsWith("/admin/terminal") && payload.role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/studio/:path*"],
};
