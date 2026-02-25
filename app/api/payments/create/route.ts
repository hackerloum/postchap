import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isValidPlanId, type PlanId } from "@/lib/plans";
import { getPaymentCurrencyAndAmount, isTanzania } from "@/lib/pricing";
import { createCardPayment, createMobilePayment } from "@/lib/snippe";

async function getUid(request: NextRequest): Promise<string> {
  const header = request.headers.get("Authorization");
  const token =
    header?.startsWith("Bearer ")
      ? header.replace("Bearer ", "")
      : request.cookies.get("__session")?.value;
  if (!token) throw new Error("Unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await getUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SNIPPE_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "Payments not configured" },
      { status: 503 }
    );
  }

  let body: { planId?: string; paymentMethod?: "card" | "mobile"; phone_number?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const planId = body.planId as string | undefined;
  if (!planId || !isValidPlanId(planId)) {
    return NextResponse.json(
      { error: "Invalid plan. Must be pro or business." },
      { status: 400 }
    );
  }

  if (planId === "free") {
    return NextResponse.json(
      { error: "Use PATCH /api/me to set Free plan." },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userData = userSnap.data()!;
  const countryCode = (userData.countryCode as string) ?? "US";
  const email = (userData.email as string) ?? "";
  const displayName = (userData.displayName as string) ?? "Customer";
  const [firstname, ...rest] = displayName.trim().split(/\s+/);
  const lastname = rest.length ? rest.join(" ") : "User";

  const paymentMethod = body.paymentMethod === "mobile" ? "mobile" : "card";
  if (paymentMethod === "mobile" && !isTanzania(countryCode)) {
    return NextResponse.json(
      { error: "Mobile money is only available in Tanzania." },
      { status: 400 }
    );
  }
  if (paymentMethod === "mobile") {
    const profilePhone = (userData.phoneNumber as string) ?? "";
    const phone = (body.phone_number ?? profilePhone).trim().replace(/\D/g, "");
    if (phone.length < 9) {
      return NextResponse.json(
        { error: "Valid phone number is required for mobile money. Add your phone in Profile (dashboard) or enter it when paying." },
        { status: 400 }
      );
    }
  }

  const { currency, amount } = getPaymentCurrencyAndAmount(planId as PlanId, countryCode);
  if (amount < 500 && currency === "TZS") {
    return NextResponse.json(
      { error: "Plan not available for payment." },
      { status: 400 }
    );
  }

  const base = getBaseUrl(request);
  const redirectUrl = `${base}/dashboard?payment=success`;
  const cancelUrl = `${base}/dashboard?payment=cancelled`;
  const webhookUrl = `${base}/api/webhooks/snippe`;
  const idempotencyKey = `plan-${uid}-${planId}-${paymentMethod}-${Math.floor(Date.now() / 1000)}`;

  const customer = {
    firstname: firstname || "Customer",
    lastname: lastname || "User",
    email: email || "customer@example.com",
    country: countryCode === "TZ" ? "TZ" : "US",
  };

  let paymentData: { reference: string; payment_url?: string };
  try {
    if (paymentMethod === "mobile" && isTanzania(countryCode)) {
      const profilePhone = (userData.phoneNumber as string) ?? "";
      const phoneRaw = (body.phone_number ?? profilePhone).trim().replace(/\D/g, "").replace(/^0/, "255");
      const phone = phoneRaw.startsWith("255") ? phoneRaw : `255${phoneRaw}`;
      const res = await createMobilePayment(
        {
          amount,
          currency,
          phone_number: phone,
          customer,
          webhook_url: webhookUrl,
          metadata: { user_id: uid, plan_id: planId },
          idempotencyKey,
        },
        apiKey
      );
      paymentData = { reference: res.reference };
    } else {
      paymentData = await createCardPayment(
        {
          amount: currency === "USD" ? amount : amount,
          currency,
          redirect_url: redirectUrl,
          cancel_url: cancelUrl,
          customer: {
            ...customer,
            address: "N/A",
            city: "N/A",
            state: "N/A",
            postcode: "N/A",
          },
          webhook_url: webhookUrl,
          metadata: { user_id: uid, plan_id: planId },
          idempotencyKey,
        },
        apiKey
      );
    }
  } catch (err) {
    console.error("[payments/create] Snippe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment creation failed" },
      { status: 502 }
    );
  }

  await db.collection("payments").doc(paymentData.reference).set({
    userId: uid,
    planId: planId as PlanId,
    status: "pending",
    amount,
    currency,
    paymentMethod,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    payment_url: paymentData.payment_url ?? null,
    reference: paymentData.reference,
    message: paymentMethod === "mobile" ? "USSD push sent to your phone. Complete payment on your device." : undefined,
  });
}
