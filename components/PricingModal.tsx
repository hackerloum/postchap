"use client";

import { useEffect, useCallback } from "react";
import { Check, X } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/Button";

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: PlanId;
  onPlanSelected?: () => void;
}

export function PricingModal({
  open,
  onClose,
  currentPlan,
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

  async function handleSelectPlan(planId: PlanId) {
    if (planId === currentPlan) {
      onClose();
      return;
    }
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update plan");
      }
      onPlanSelected?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to update plan");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
              const [priceMain, priceSub] =
                plan.priceMonthly === 0
                  ? ["Free", ""]
                  : plan.priceLabel.split("/");

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
                        {priceMain}
                      </span>
                      {priceSub && (
                        <span className="text-[13px] font-medium text-text-muted">
                          /{priceSub}
                        </span>
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
                    <Button
                      variant={isPro ? "primary" : "secondary"}
                      className="w-full"
                      disabled={isCurrent}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {isCurrent ? "Current plan" : plan.id === "free" ? "Select Free" : "Select"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
