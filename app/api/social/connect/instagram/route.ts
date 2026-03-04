import { NextRequest, NextResponse } from "next/server";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

const APP_ID = process.env.FACEBOOK_APP_ID!;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI ?? "https://artmasterpro.com/api/social/callback/instagram";

export async function GET(request: NextRequest) {
  // Verify user is authenticated
  try {
    await verifyRequestAuth(request);
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!APP_ID || !REDIRECT_URI) {
    return NextResponse.json(
      { error: "Instagram connection not configured" },
      { status: 503 }
    );
  }

  // Optional return path after OAuth (e.g. /admin/create); only allow /admin paths
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "";
  const state = returnTo.startsWith("/admin") ? returnTo : "";

  // Instagram Business Login — match exact URL format Meta dashboard generates
  const params = new URLSearchParams({
    force_reauth: "true",
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights",
  });
  if (state) params.set("state", state);

  const oauthUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  return NextResponse.redirect(oauthUrl);
}
