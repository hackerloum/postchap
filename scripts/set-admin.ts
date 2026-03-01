/**
 * One-time script to grant admin privileges to a Firebase user.
 *
 * Usage:
 *   npx ts-node -e "require('./scripts/set-admin.ts')" -- <uid>
 *
 * Or with tsx:
 *   npx tsx scripts/set-admin.ts <uid>
 *
 * The UID can be found in the Firebase Console → Authentication → Users.
 */

// Load .env.local manually without requiring dotenv
import { readFileSync } from "fs";
import { resolve } from "path";
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on existing env vars
}

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const uid = process.argv[2];
if (!uid) {
  console.error("Usage: npx tsx scripts/set-admin.ts <firebase-uid>");
  process.exit(1);
}

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
  console.error("Missing FIREBASE_ADMIN_PRIVATE_KEY or FIREBASE_ADMIN_CLIENT_EMAIL in .env.local");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

(async () => {
  try {
    await getAuth().setCustomUserClaims(uid, { isAdmin: true });
    const user = await getAuth().getUser(uid);
    console.log(`✓ isAdmin claim set on ${user.email ?? uid}`);
    console.log("  The user must sign out and sign back in for the claim to take effect.");
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
})();
