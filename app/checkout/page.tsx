"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";

const VALID_PLANS = ["free", "pro", "business"];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "";
  const billing = searchParams.get("billing") ?? "monthly";
  const [status, setStatus] = useState<"idle" | "loading" | "redirect" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

        const payRes = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ planId: plan, paymentMethod: "card" }),
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
  }, [plan, searchParams]);

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
            href="/pricing"
            className="inline-flex items-center gap-2 font-semibold text-[14px] text-accent hover:underline"
          >
            <ArrowLeft size={14} />
            Back to pricing
          </Link>
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
