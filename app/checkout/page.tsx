"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CreditCard } from "lucide-react";

const VALID_PLANS = ["free", "pro", "business"];
const PLAN_LABELS: Record<string, string> = { pro: "Pro", business: "Business" };

type BillingForm = {
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "";
  const from = searchParams.get("from");
  const backHref = from === "dashboard" ? "/dashboard/upgrade" : "/pricing";
  const [status, setStatus] = useState<"idle" | "loading" | "form" | "paying" | "redirect" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [billingForm, setBillingForm] = useState<BillingForm>({ phone: "", address: "", city: "", state: "", postcode: "" });
  const [isPending, startTransition] = useTransition();

  const inputCls =
    "w-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50";

  useEffect(() => {
    if (!plan || !VALID_PLANS.includes(plan)) {
      setStatus("error");
      setErrorMessage("Invalid plan. Choose a plan from the pricing page.");
      return;
    }

    setStatus("loading");
    startTransition(async () => {
      try {
        const meRes = await fetch("/api/me", { credentials: "same-origin" });
        if (!meRes.ok) {
          const returnUrl = encodeURIComponent(
            `${window.location.pathname}?${searchParams.toString()}`
          );
          window.location.href = `/login?returnUrl=${returnUrl}`;
          return;
        }

        if (plan === "free") {
          const res = await fetch("/api/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ plan: "free" }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Failed to update plan");
          }
          window.location.href = "/dashboard";
          return;
        }

        // Pre-fill phone from profile
        const meData = await meRes.json().catch(() => ({}));
        if (meData.phoneNumber) {
          setBillingForm((prev) => ({ ...prev, phone: meData.phoneNumber }));
        }

        setStatus("form");
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Something went wrong");
        setStatus("error");
      }
    });
  }, [plan, searchParams]);

  async function handleBillingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("paying");
    startTransition(async () => {
      try {
        const payRes = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            planId: plan,
            paymentMethod: "card",
            billing: {
              ...(billingForm.phone && { phone_number: billingForm.phone }),
              ...(billingForm.address && { address: billingForm.address }),
              ...(billingForm.city && { city: billingForm.city }),
              ...(billingForm.state && { state: billingForm.state }),
              ...(billingForm.postcode && { postcode: billingForm.postcode }),
            },
          }),
        });
        const data = await payRes.json().catch(() => ({}));

        if (!payRes.ok) {
          throw new Error((data.error as string) ?? "Payment could not be started");
        }

        if (data.payment_url) {
          setStatus("redirect");
          window.location.href = data.payment_url;
          return;
        }

        if (data.message) {
          window.location.href = "/dashboard?payment=pending";
          return;
        }

        throw new Error("No payment URL returned");
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Something went wrong");
        setStatus("error");
      }
    });
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-bg-surface border border-border-default rounded-2xl p-8 text-center">
          <p className="font-semibold text-[16px] text-text-primary mb-2">
            Checkout failed
          </p>
          <p className="font-mono text-[13px] text-text-muted mb-6">
            {errorMessage}
          </p>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 font-semibold text-[14px] text-accent hover:underline"
          >
            <ArrowLeft size={14} />
            Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  if (status === "form") {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 font-mono text-[12px] text-text-muted hover:text-text-primary mb-6 transition-colors"
          >
            <ArrowLeft size={12} />
            Back
          </Link>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <CreditCard size={18} className="text-accent" />
              </div>
              <div>
                <p className="font-semibold text-[15px] text-text-primary">
                  {PLAN_LABELS[plan] ?? plan} Plan
                </p>
                <p className="font-mono text-[11px] text-text-muted">Card payment via Snippe</p>
              </div>
            </div>
            <form onSubmit={handleBillingSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1.5">
                  Phone number <span className="text-text-muted/60">(optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0712 345 678"
                  value={billingForm.phone}
                  onChange={(e) => setBillingForm((p) => ({ ...p, phone: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1.5">
                  Billing address <span className="text-text-muted/60">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Street address"
                  value={billingForm.address}
                  onChange={(e) => setBillingForm((p) => ({ ...p, address: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] text-text-muted mb-1.5">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={billingForm.city}
                    onChange={(e) => setBillingForm((p) => ({ ...p, city: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-text-muted mb-1.5">State / Region</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={billingForm.state}
                    onChange={(e) => setBillingForm((p) => ({ ...p, state: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1.5">Postcode</label>
                <input
                  type="text"
                  placeholder="Postal / ZIP code"
                  value={billingForm.postcode}
                  onChange={(e) => setBillingForm((p) => ({ ...p, postcode: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-[14px] text-black hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                Continue to payment
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6">
        <Loader2 size={32} className="text-accent animate-spin" />
        <p className="font-semibold text-[16px] text-text-primary">
          {status === "redirect"
            ? "Redirecting to payment..."
            : status === "paying"
            ? "Creating payment…"
            : "Setting up your plan..."}
        </p>
        <p className="font-mono text-[12px] text-text-muted">
          Do not close this window.
        </p>
      </div>
    </div>
  );
}

function CheckoutFallback() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6">
        <Loader2 size={32} className="text-accent animate-spin" />
        <p className="font-semibold text-[16px] text-text-primary">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}
