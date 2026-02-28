/**
 * Instagram Deauthorize Callback
 * Meta calls this when a user removes your app from their Instagram settings.
 * We remove their Instagram connection from Firestore.
 * Must be registered in Meta dashboard → Business login settings → Deauthorize callback URL
 * URL: https://artmasterpro.com/api/social/instagram/deauthorize
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const APP_SECRET = (process.env.INSTAGRAM_APP_SECRET ?? process.env.FACEBOOK_APP_SECRET)!;

function parseSignedRequest(signedRequest: string): Record<string, unknown> | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".");
    const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const expectedSig = crypto
      .createHmac("sha256", APP_SECRET)
      .update(payload)
      .digest();
    if (!crypto.timingSafeEqual(sig, expectedSig)) return null;
    const data = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(data) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const signedRequest = params.get("signed_request");

    if (!signedRequest) {
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    const data = parseSignedRequest(signedRequest);
    if (!data) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const instagramUserId = data.user_id as string | undefined;
    if (!instagramUserId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Find user by Instagram account ID and remove their connection
    const db = getAdminDb();
    const snapshot = await db
      .collection("users")
      .where("instagram.accountId", "==", instagramUserId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await userDoc.ref.update({ instagram: FieldValue.delete() });
      console.log(`[Instagram deauthorize] Removed connection for IG user ${instagramUserId}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Instagram deauthorize] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
