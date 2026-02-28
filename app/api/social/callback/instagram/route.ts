import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const APP_ID = process.env.FACEBOOK_APP_ID!;
const APP_SECRET = (process.env.INSTAGRAM_APP_SECRET ?? process.env.FACEBOOK_APP_SECRET)!;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI ?? "https://artmasterpro.com/api/social/callback/instagram";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://artmasterpro.com";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");
  const errorDescription = searchParams.get("error_description");

  if (error || !code) {
    console.error("[Instagram callback] OAuth error:", { error, errorReason, errorDescription });
    const status = errorReason === "user_denied" ? "cancelled" : "error";
    return NextResponse.redirect(
      new URL(`/dashboard/settings?instagram=${status}`, APP_URL)
    );
  }

  // Verify session
  const token = request.cookies.get("__session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  try {
    console.log("[Instagram callback] Using redirect URI:", REDIRECT_URI);
    console.log("[Instagram callback] Using APP_ID:", APP_ID);

    // Step 1: Exchange code for short-lived token via Instagram Business Login
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
      }).toString(),
    });
    const tokenData = await tokenRes.json() as {
      access_token?: string;
      user_id?: number;
      error?: { message: string };
      error_type?: string;
      error_message?: string;
    };

    console.log("[Instagram callback] Token response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      console.error("[Instagram callback] Token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL("/dashboard/settings?instagram=error", APP_URL)
      );
    }

    const shortToken = tokenData.access_token;
    const igUserId = tokenData.user_id;

    // Step 2: Exchange for long-lived token (60 days)
    const longTokenParams = new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: APP_SECRET,
      access_token: shortToken,
    });

    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?${longTokenParams.toString()}`
    );
    const longTokenData = await longTokenRes.json() as {
      access_token?: string;
      expires_in?: number;
      error?: { message: string };
    };

    const accessToken = longTokenData.access_token ?? shortToken;
    const expiresIn = longTokenData.expires_in ?? 3600;

    // Step 3: Get Instagram account info
    const igInfoRes = await fetch(
      `https://graph.instagram.com/v19.0/me?fields=id,username,name&access_token=${accessToken}`
    );
    const igInfo = await igInfoRes.json() as {
      id?: string;
      username?: string;
      name?: string;
    };

    const instagramAccountId = igInfo.id ?? String(igUserId) ?? null;
    const instagramUsername = igInfo.username ?? igInfo.name ?? null;

    // Step 4: Save to Firestore
    const db = getAdminDb();
    await db.collection("users").doc(uid).set(
      {
        instagram: {
          connected: true,
          accessToken,
          pageAccessToken: accessToken, // Instagram Business Login uses same token for publishing
          accountId: instagramAccountId,
          username: instagramUsername,
          connectedAt: FieldValue.serverTimestamp(),
          expiresAt: Date.now() + expiresIn * 1000,
        },
      },
      { merge: true }
    );

    return NextResponse.redirect(
      new URL("/dashboard/settings?instagram=connected", APP_URL)
    );
  } catch (err) {
    console.error("[Instagram callback] Error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?instagram=error", APP_URL)
    );
  }
}
