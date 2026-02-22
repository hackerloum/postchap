import { NextResponse } from "next/server";

// Disabled: no auth checks or redirects. Dashboard and all routes load without redirecting to login.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
