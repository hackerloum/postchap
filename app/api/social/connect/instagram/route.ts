import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

const APP_ID = process.env.FACEBOOK_APP_ID!;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI ?? "https://artmasterpro.com/api/social/callback/instagram";

export async function GET(request: NextRequest) {
  // Verify user is authenticated
  const token = request.cookies.get("__session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await getAdminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!APP_ID || !REDIRECT_URI) {
    return NextResponse.json(
      { error: "Instagram connection not configured" },
      { status: 503 }
    );
  }

  // Instagram Business Login — exact scopes from Meta dashboard
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights",
    response_type: "code",
    state: Buffer.from(token.slice(0, 32)).toString("base64"),
  });

  const oauthUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  return NextResponse.redirect(oauthUrl);
}
