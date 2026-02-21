import { NextResponse } from "next/server";

/**
 * Debug route: shows whether required env vars are SET or MISSING.
 * Do NOT use in production — delete after fixing onboarding.
 */
export async function GET() {
  return NextResponse.json({
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID
      ? "✓ SET"
      : "✗ MISSING",
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL
      ? "✓ SET"
      : "✗ MISSING",
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? `✓ SET (length: ${process.env.FIREBASE_ADMIN_PRIVATE_KEY.length})`
      : "✗ MISSING",
    FIREBASE_ADMIN_PRIVATE_KEY_HAS_HEADER: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.includes(
      "BEGIN PRIVATE KEY"
    )
      ? "✓ Has correct header"
      : "✗ Missing -----BEGIN PRIVATE KEY----- header — KEY IS MALFORMED",
    FIREBASE_ADMIN_PRIVATE_KEY_HAS_NEWLINES: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.includes(
      "\n"
    )
      ? "✓ Has real newlines"
      : process.env.FIREBASE_ADMIN_PRIVATE_KEY?.includes("\\n")
        ? "⚠ Has escaped \\n — will be fixed by admin.ts"
        : "✗ No newlines detected — KEY IS MALFORMED",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ? "✓ SET"
      : "✗ MISSING",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env
      .NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      ? "✓ SET"
      : "✗ MISSING",
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env
      .NEXT_PUBLIC_FIREBASE_DATABASE_URL
      ? "✓ SET"
      : "✗ MISSING",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✓ SET" : "✗ MISSING",
    FREEPIK_API_KEY: process.env.FREEPIK_API_KEY ? "✓ SET" : "✗ MISSING",
  });
}
