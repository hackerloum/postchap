import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const APP_ID = process.env.FACEBOOK_APP_ID!;
const APP_SECRET = (process.env.INSTAGRAM_APP_SECRET ?? process.env.FACEBOOK_APP_SECRET)!;
const APP_URL = "https://artmasterpro.com";
const REDIRECT_URI = "https://artmasterpro.com/api/social/callback/instagram";

// Prevent double-processing the same code (Vercel can invoke route handlers twice)
const usedCodes = new Set<string>();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");

  if (error || !code) {
    const status = errorReason === "user_denied" ? "cancelled" : "error";
    return NextResponse.redirect(new URL(`/dashboard/settings?instagram=${status}`, APP_URL));
  }

  if (usedCodes.has(code)) {
    return NextResponse.redirect(new URL("/dashboard/settings?instagram=connected", APP_URL));
  }
  usedCodes.add(code);
  setTimeout(() => usedCodes.delete(code), 60_000);

  const token = request.cookies.get("__session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", APP_URL));

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  try {
    // Step 1: Exchange code for short-lived token
    const formBody = new FormData();
    formBody.append("client_id", APP_ID);
    formBody.append("client_secret", APP_SECRET);
    formBody.append("grant_type", "authorization_code");
    formBody.append("redirect_uri", REDIRECT_URI);
    formBody.append("code", code);

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: formBody,
    });
    const tokenData = await tokenRes.json() as {
      access_token?: string;
      user_id?: number;
      error_type?: string;
      error_message?: string;
    };

    if (!tokenData.access_token) {
      console.error("[Instagram callback] Token exchange failed:", tokenData.error_message);
      return NextResponse.redirect(new URL("/dashboard/settings?instagram=error", APP_URL));
    }

    const shortToken = tokenData.access_token;
    const igUserId = tokenData.user_id;

    // Step 2: Exchange for long-lived token (60 days)
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${APP_SECRET}&access_token=${shortToken}`
    );
    const longTokenData = await longTokenRes.json() as {
      access_token?: string;
      expires_in?: number;
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
          pageAccessToken: accessToken,
          accountId: instagramAccountId,
          username: instagramUsername,
          connectedAt: FieldValue.serverTimestamp(),
          expiresAt: Date.now() + expiresIn * 1000,
        },
      },
      { merge: true }
    );

    return NextResponse.redirect(new URL("/dashboard/settings?instagram=connected", APP_URL));
  } catch (err) {
    console.error("[Instagram callback] Unexpected error:", err);
    return NextResponse.redirect(new URL("/dashboard/settings?instagram=error", APP_URL));
  }
}
