/**
 * Snippe payment API client and webhook verification.
 * Base URL: https://api.snippe.sh
 */

import crypto from "crypto";

const SNIPPE_BASE = "https://api.snippe.sh";

export interface SnippeCustomer {
  firstname: string;
  lastname: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface CreateCardPaymentParams {
  amount: number; // smallest currency unit (e.g. TZS)
  currency: string;
  redirect_url: string;
  cancel_url: string;
  customer: SnippeCustomer;
  webhook_url: string;
  metadata?: Record<string, string>;
  idempotencyKey: string;
}

export interface SnippePaymentResponse {
  reference: string;
  payment_url?: string;
  payment_token?: string;
  payment_qr_code?: string;
  status: string;
  expires_at: string;
  amount: { currency: string; value: number };
}

export interface CreateMobilePaymentParams {
  amount: number;
  currency: string;
  phone_number: string; // 255XXXXXXXXX
  customer: { firstname: string; lastname: string; email: string };
  webhook_url: string;
  metadata?: Record<string, string>;
  idempotencyKey: string;
}

export async function createCardPayment(
  params: CreateCardPaymentParams,
  apiKey: string
): Promise<SnippePaymentResponse> {
  const res = await fetch(`${SNIPPE_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify({
      payment_type: "card",
      details: {
        amount: params.amount,
        currency: params.currency,
        redirect_url: params.redirect_url,
        cancel_url: params.cancel_url,
      },
      customer: {
        firstname: params.customer.firstname,
        lastname: params.customer.lastname,
        email: params.customer.email,
        address: params.customer.address ?? "N/A",
        city: params.customer.city ?? "N/A",
        state: params.customer.state ?? "N/A",
        postcode: params.customer.postcode ?? "N/A",
        country: params.customer.country ?? "TZ",
      },
      webhook_url: params.webhook_url,
      metadata: params.metadata ?? {},
    }),
  });

  const json = (await res.json()) as {
    status: string;
    code: number;
    data?: SnippePaymentResponse;
    error_code?: string;
    message?: string;
  };

  if (!res.ok || json.status === "error") {
    const msg = json.message ?? `Snippe API error: ${res.status}`;
    throw new Error(msg);
  }

  if (!json.data) throw new Error("Snippe API returned no data");
  return json.data;
}

export async function createMobilePayment(
  params: CreateMobilePaymentParams,
  apiKey: string
): Promise<SnippePaymentResponse> {
  const res = await fetch(`${SNIPPE_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify({
      payment_type: "mobile",
      details: { amount: params.amount, currency: params.currency },
      phone_number: params.phone_number.replace(/\D/g, "").replace(/^0/, "255"),
      customer: {
        firstname: params.customer.firstname,
        lastname: params.customer.lastname,
        email: params.customer.email,
      },
      webhook_url: params.webhook_url,
      metadata: params.metadata ?? {},
    }),
  });

  const json = (await res.json()) as {
    status: string;
    code: number;
    data?: SnippePaymentResponse;
    error_code?: string;
    message?: string;
  };

  if (!res.ok || json.status === "error") {
    const msg = json.message ?? `Snippe API error: ${res.status}`;
    throw new Error(msg);
  }

  if (!json.data) throw new Error("Snippe API returned no data");
  return json.data;
}

/**
 * Verify webhook signature (HMAC-SHA256) as per Snippe docs.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expected, "utf8")
    );
  } catch {
    return false;
  }
}
