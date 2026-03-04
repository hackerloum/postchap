/**
 * Cron: occasion alerts.
 * Runs daily to notify users of upcoming occasions.
 * In-app banner is driven by GET /api/occasions/upcoming.
 * This cron can be extended to send email notifications when email infra is added.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUpcomingOccasions } from "@/lib/occasions/upcoming";

function verifyCronSecret(request: NextRequest): { ok: boolean; reason?: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    return { ok: false, reason: "CRON_SECRET not set or too short" };
  }
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${secret.trim()}`;
  if (authHeader?.trim() !== expected) {
    return { ok: false, reason: "Authorization header missing or invalid" };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "Unauthorized", message: auth.reason },
      { status: 401 }
    );
  }

  // In-app banner is driven by GET /api/occasions/upcoming.
  // This cron can be extended to:
  // 1. Query users with brand kits
  // 2. For each user, get country from profile or brand kit
  // 3. Compute upcoming occasions via getUpcomingOccasions(countryCode)
  // 4. Send email: "Eid al-Fitr is in 5 days — Generate your Eid poster now"
  const occasions = getUpcomingOccasions(null, 3);
  console.log("[cron occasion-alerts] Upcoming occasions:", occasions.map((o) => o.name));

  return NextResponse.json({
    ok: true,
    message: "Occasion alerts ready. In-app banner via /api/occasions/upcoming.",
  });
}
