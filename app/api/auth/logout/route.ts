import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const url = returnTo.startsWith("http") ? returnTo : new URL(returnTo, base).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("__session", "", { maxAge: 0, path: "/" });
  return response;
}
