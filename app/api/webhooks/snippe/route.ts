import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyWebhookSignature } from "@/lib/snippe";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type WebhookEvent = {
  id: string;
  type: string;
  api_version?: string;
  created_at?: string;
  data?: {
    reference: string;
    status: string;
    amount?: { value: number; currency: string };
    metadata?: Record<string, string>;
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const secret = process.env.SNIPPE_WEBHOOK_SECRET ?? "";

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.type;
  const data = event.data;
  if (!data?.reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const db = getAdminDb();
  const paymentRef = db.collection("payments").doc(data.reference);
  const paymentSnap = await paymentRef.get();

  if (!paymentSnap.exists) {
    console.warn("[webhooks/snippe] Payment not found:", data.reference);
    return NextResponse.json({ ok: true });
  }

  const paymentData = paymentSnap.data()!;
  const status = data.status === "completed" ? "completed" : "failed";

  await paymentRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
    eventId: event.id,
  });

  if (eventType === "payment.completed" && data.status === "completed") {
    const userId = paymentData.userId as string;
    const planId = paymentData.planId as string;
    if (userId && (planId === "pro" || planId === "business")) {
      await db.collection("users").doc(userId).set(
        { plan: planId, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  }

  return NextResponse.json({ received: true });
}
