import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
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
    ) as { isAdmin?: boolean; exp?: number };

    const now = Math.floor(Date.now() / 1000);
    if (!payload.isAdmin || (payload.exp && payload.exp < now)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
