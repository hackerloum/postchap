"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Check, X, Smartphone, CreditCard } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";
import { getPlanPriceForCountry } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: PlanId;
  countryCode?: string | null;
  onPlanSelected?: () => void;
}

export function PricingModal({
  open,
  onClose,
  currentPlan,
  countryCode = null,
  onPlanSelected,
}: PricingModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [selectedPlanForMobile, setSelectedPlanForMobile] = useState<PlanId | null>(null);
  const [mobilePhone, setMobilePhone] = useState("");

  async function handleSelectPlan(planId: PlanId, method: "card" | "mobile" = "card", phone?: string) {
    if (planId === currentPlan) {
      onClose();
      return;
    }
    setLoadingPlan(planId);
    try {
      if (planId === "free") {
        const res = await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "free" }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to update plan");
        }
        onPlanSelected?.();
        onClose();
        return;
      }
      const body: { planId: string; paymentMethod: "card" | "mobile"; phone_number?: string } = {
        planId,
        paymentMethod: method,
      };
      if (method === "mobile" && phone) body.phone_number = phone;
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Payment could not be started");
      }
      if (data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      if (data.message) {
        alert(data.message);
        onPlanSelected?.();
        onClose();
        return;
      }
      if (method === "card") throw new Error("No payment URL returned");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingPlan(null);
      setSelectedPlanForMobile(null);
      setMobilePhone("");
    }
  }

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-default bg-bg-base shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border-subtle bg-bg-base px-6 py-4">
          <h2 id="pricing-modal-title" className="font-semibold text-lg text-text-primary">
            Choose your plan
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const limits = plan.limits;
              const brandKitsLabel =
                limits.brandKits === -1 ? "Unlimited" : String(limits.brandKits);
              const postersLabel =
                limits.postersPerMonth === -1
                  ? "Unlimited"
                  : `${limits.postersPerMonth} / month`;
              const isCurrent = currentPlan === plan.id;
              const isPro = plan.id === "pro";
              const priceInfo = getPlanPriceForCountry(plan.id, countryCode);
              const showMobileOption = plan.id !== "free" && priceInfo.mobileMoney;
              const showMobileInput = selectedPlanForMobile === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
                    isPro
                      ? "border-accent/60 bg-bg-surface shadow-[0_0_0_1px_rgba(232,255,71,0.15),0_8px_32px_-8px_rgba(0,0,0,0.4)]"
                      : "border-border-default bg-bg-surface/80 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_-12px_rgba(0,0,0,0.25)] hover:border-border-strong"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-black font-mono text-[10px] font-semibold tracking-widest uppercase">
                      Most popular
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-semibold text-[20px] text-text-primary tracking-tight mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-[28px] font-semibold text-text-primary tracking-tight tabular-nums">
                        {priceInfo.label.replace(/\/mo$/, "").trim()}
                      </span>
                      {plan.id !== "free" && (
                        <span className="text-[13px] font-medium text-text-muted">/mo</span>
                      )}
                    </div>
                    <div className="h-px bg-border-default mb-5" />
                    <ul className="space-y-3.5 mb-6 flex-1">
                      <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                          <Check size={12} className="text-accent" />
                        </span>
                        {brandKitsLabel} brand kit{limits.brandKits !== 1 ? "s" : ""}
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                          <Check size={12} className="text-accent" />
                        </span>
                        {postersLabel} posters
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${limits.scheduledGeneration ? "bg-accent/15" : "bg-bg-elevated"}`}
                        >
                          {limits.scheduledGeneration ? (
                            <Check size={12} className="text-accent" />
                          ) : (
                            <span className="w-2 h-0.5 bg-border-strong rounded" />
                          )}
                        </span>
                        Scheduled generation
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                          <Check size={12} className="text-accent" />
                        </span>
                        Recommendations{" "}
                        {limits.aiRecommendationsFull ? "(full)" : "(limited)"}
                      </li>
                    </ul>
                    {isCurrent ? (
                      <Button variant="secondary" className="w-full" disabled>
                        Current plan
                      </Button>
                    ) : plan.id === "free" ? (
                      <Button
                        variant="secondary"
                        className="w-full"
                        disabled={loadingPlan !== null}
                        onClick={() => handleSelectPlan("free")}
                      >
                        Select Free
                      </Button>
                    ) : showMobileOption ? (
                      <div className="space-y-2">
                        {showMobileInput && (
                          <div className="flex flex-col gap-2 min-w-0">
                            <input
                              type="tel"
                              placeholder="07XX XXX XXX"
                              value={mobilePhone}
                              onChange={(e) => setMobilePhone(e.target.value)}
                              className="w-full min-w-0 rounded-lg border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                            <Button
                              variant="primary"
                              className="w-full"
                              disabled={!mobilePhone.trim() || loadingPlan !== null}
                              onClick={() => handleSelectPlan(plan.id, "mobile", mobilePhone.trim())}
                            >
                              {loadingPlan === plan.id ? "Requesting payment…" : "Pay with mobile money"}
                            </Button>
                          </div>
                        )}
                        <div className="flex gap-2 min-w-0">
                          <Button
                            variant={isPro ? "primary" : "secondary"}
                            className="flex-1 gap-1.5"
                            disabled={loadingPlan !== null}
                            onClick={() => setSelectedPlanForMobile(showMobileInput ? null : plan.id)}
                          >
                            <Smartphone size={14} />
                            Mobile money
                          </Button>
                          <Button
                            variant={isPro ? "primary" : "secondary"}
                            className="flex-1 gap-1.5"
                            disabled={loadingPlan !== null}
                            onClick={() => handleSelectPlan(plan.id, "card")}
                          >
                            <CreditCard size={14} />
                            Card
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant={isPro ? "primary" : "secondary"}
                        className="w-full gap-1.5"
                        disabled={loadingPlan !== null}
                        onClick={() => handleSelectPlan(plan.id, "card")}
                      >
                        <CreditCard size={14} />
                        {loadingPlan === plan.id ? "Redirecting…" : "Pay with card"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
