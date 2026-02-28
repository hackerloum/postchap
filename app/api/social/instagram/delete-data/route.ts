/**
 * Instagram Data Deletion Callback
 * Meta calls this when a user requests deletion of their data via Facebook's
 * "Apps and Websites" settings. We must delete all their data and return a
 * status URL where they can check progress.
 * Must be registered in Meta dashboard → Business login settings → Data deletion request URL
 * URL: https://artmasterpro.com/api/social/instagram/delete-data
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const APP_SECRET = (process.env.INSTAGRAM_APP_SECRET ?? process.env.FACEBOOK_APP_SECRET)!;
const APP_URL = "https://artmasterpro.com";

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

    // Generate a confirmation code for the status URL
    const confirmationCode = crypto
      .createHash("sha256")
      .update(`${instagramUserId}-${Date.now()}`)
      .digest("hex")
      .slice(0, 16);

    // Find user by Instagram account ID and delete their Instagram data
    const db = getAdminDb();
    const snapshot = await db
      .collection("users")
      .where("instagram.accountId", "==", instagramUserId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const uid = userDoc.id;

      // Remove Instagram connection
      await userDoc.ref.update({ instagram: FieldValue.delete() });

      // Log the deletion request
      await db.collection("data_deletion_requests").add({
        instagramUserId,
        uid,
        confirmationCode,
        status: "deleted",
        requestedAt: FieldValue.serverTimestamp(),
      });

      console.log(`[Instagram delete-data] Deleted data for IG user ${instagramUserId}, uid ${uid}`);
    } else {
      // User not found — log anyway for compliance
      await db.collection("data_deletion_requests").add({
        instagramUserId,
        uid: null,
        confirmationCode,
        status: "not_found",
        requestedAt: FieldValue.serverTimestamp(),
      });
    }

    // Meta requires this exact response format
    return NextResponse.json({
      url: `${APP_URL}/data-deletion?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (err) {
    console.error("[Instagram delete-data] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
