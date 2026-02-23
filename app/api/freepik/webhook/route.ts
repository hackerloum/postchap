import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Placeholder for Freepik webhook: receive task completion notifications
  // and update RTDB/status instead of polling. Not implemented yet.
  const body = await request.json().catch(() => ({}));
  console.log("[Freepik Webhook]", body);
  return NextResponse.json({ received: true });
}
