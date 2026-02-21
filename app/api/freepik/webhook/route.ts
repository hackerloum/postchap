/**
 * Optional Freepik webhook endpoint for production.
 * Instead of polling, Freepik can POST here when a task completes.
 * Currently we use polling; this is a placeholder for future webhook implementation.
 */

export async function POST(request: Request) {
  // TODO: Implement Freepik webhook handler
  // This will receive task completion notifications from Freepik
  // and update RTDB status directly instead of polling
  const body = await request.json().catch(() => ({}));
  console.log("[Freepik Webhook]", body);
  return Response.json({ received: true });
}
