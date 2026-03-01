/**
 * ONE-TIME setup endpoint to grant isAdmin claim to the owner UID.
 * Protected by a secret token. DELETE THIS FILE after use.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

const OWNER_UID = "KXDy0d47vcbgqJKA75KJScxEexy2";
const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET;

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!SETUP_SECRET) {
    return NextResponse.json({ error: "ADMIN_SETUP_SECRET env var not set" }, { status: 500 });
  }

  if (secret !== SETUP_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  try {
    await getAdminAuth().setCustomUserClaims(OWNER_UID, { isAdmin: true });
    const user = await getAdminAuth().getUser(OWNER_UID);
    return NextResponse.json({
      success: true,
      message: `isAdmin claim set on ${user.email}. Sign out and sign back in, then delete this file.`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
