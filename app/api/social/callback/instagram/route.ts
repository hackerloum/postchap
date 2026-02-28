import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const APP_ID = process.env.FACEBOOK_APP_ID!;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://artmasterpro.com";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?instagram=cancelled", APP_URL)
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
    // Step 1: Exchange code for short-lived access token
    const tokenParams = new URLSearchParams({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`
    );
    const tokenData = await tokenRes.json() as {
      access_token?: string;
      error?: { message: string };
    };

    if (!tokenData.access_token) {
      console.error("[Instagram callback] Token exchange failed:", tokenData.error);
      return NextResponse.redirect(
        new URL("/dashboard/settings?instagram=error", APP_URL)
      );
    }

    const shortToken = tokenData.access_token;

    // Step 2: Exchange for long-lived token (60 days)
    const longTokenParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: APP_ID,
      client_secret: APP_SECRET,
      fb_exchange_token: shortToken,
    });

    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${longTokenParams.toString()}`
    );
    const longTokenData = await longTokenRes.json() as {
      access_token?: string;
      expires_in?: number;
      error?: { message: string };
    };

    const accessToken = longTokenData.access_token ?? shortToken;
    const expiresIn = longTokenData.expires_in ?? 3600;

    // Step 3: Get connected Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json() as {
      data?: Array<{ id: string; name: string; access_token: string }>;
    };

    // Step 4: Find the Instagram Business Account linked to the first Page
    let instagramAccountId: string | null = null;
    let instagramUsername: string | null = null;
    let pageAccessToken: string | null = null;

    if (pagesData.data && pagesData.data.length > 0) {
      for (const page of pagesData.data) {
        const igRes = await fetch(
          `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        );
        const igData = await igRes.json() as {
          instagram_business_account?: { id: string };
        };

        if (igData.instagram_business_account?.id) {
          instagramAccountId = igData.instagram_business_account.id;
          pageAccessToken = page.access_token;

          // Get Instagram username
          const igInfoRes = await fetch(
            `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=username,name&access_token=${page.access_token}`
          );
          const igInfo = await igInfoRes.json() as {
            username?: string;
            name?: string;
          };
          instagramUsername = igInfo.username ?? igInfo.name ?? null;
          break;
        }
      }
    }

    // Step 5: Save to Firestore
    const db = getAdminDb();
    await db.collection("users").doc(uid).set(
      {
        instagram: {
          connected: true,
          accessToken,
          pageAccessToken,
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
