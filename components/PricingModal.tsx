"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Check, X, Smartphone, CreditCard, Loader2, ChevronLeft } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";
import {
  getPlanPriceForCountry,
  getPerPosterPriceForCountry,
  getPlanEffectivePerPosterLabel,
} from "@/lib/pricing";
import { useCurrency } from "@/lib/geo/useCurrency";
import { Button } from "@/components/ui/Button";

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: PlanId;
  countryCode?: string | null;
  /** Pre-fill phone input from profile */
  profilePhoneNumber?: string | null;
  onPlanSelected?: () => void;
}

type BillingForm = {
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
};

const EMPTY_BILLING: BillingForm = { phone: "", address: "", city: "", state: "", postcode: "" };

const INPUT_CLS =
  "w-full min-w-0 rounded-lg border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50";

function BillingFields({
  value,
  onChange,
}: {
  value: BillingForm;
  onChange: (v: BillingForm) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="tel"
        placeholder="Phone number (optional)"
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
        className={INPUT_CLS}
      />
      <input
        type="text"
        placeholder="Billing address"
        value={value.address}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
        className={INPUT_CLS}
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="City"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          className={INPUT_CLS}
        />
        <input
          type="text"
          placeholder="State / Region"
          value={value.state}
          onChange={(e) => onChange({ ...value, state: e.target.value })}
          className={INPUT_CLS}
        />
      </div>
      <input
        type="text"
        placeholder="Postcode"
        value={value.postcode}
        onChange={(e) => onChange({ ...value, postcode: e.target.value })}
        className={INPUT_CLS}
      />
    </div>
  );
}

export function PricingModal({
  open,
  onClose,
  currentPlan,
  countryCode = null,
  profilePhoneNumber = null,
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
  const [paymentMessageDialog, setPaymentMessageDialog] = useState<string | null>(null);

  // --- Plan card billing form state ---
  const [cardBillingPlanId, setCardBillingPlanId] = useState<PlanId | null>(null);
  const [cardBilling, setCardBilling] = useState<BillingForm>(EMPTY_BILLING);

  // --- "Buy 1 poster" flow state ---
  // null = not open, "choose" = picking method, "card" = card billing form, "mobile" = phone input
  const [posterStep, setPosterStep] = useState<null | "choose" | "card" | "mobile">(null);
  const [posterBilling, setPosterBilling] = useState<BillingForm>(EMPTY_BILLING);
  const [buyingPoster, setBuyingPoster] = useState(false);

  useEffect(() => {
    if (open && profilePhoneNumber) setMobilePhone(profilePhoneNumber);
  }, [open, profilePhoneNumber]);

  function closePosterFlow() {
    setPosterStep(null);
    setPosterBilling(EMPTY_BILLING);
  }

  function openCardBilling(planId: PlanId) {
    setCardBilling({ ...EMPTY_BILLING, phone: profilePhoneNumber ?? "" });
    setCardBillingPlanId(planId);
    setSelectedPlanForMobile(null);
  }

  async function handleSelectPlan(
    planId: PlanId,
    method: "card" | "mobile" = "card",
    phone?: string,
    billing?: BillingForm
  ) {
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
      const body: {
        planId: string;
        paymentMethod: "card" | "mobile";
        phone_number?: string;
        billing?: { phone_number?: string; address?: string; city?: string; state?: string; postcode?: string };
      } = { planId, paymentMethod: method };
      if (method === "mobile" && phone) body.phone_number = phone;
      if (method === "card" && billing) {
        body.billing = {
          ...(billing.phone && { phone_number: billing.phone }),
          ...(billing.address && { address: billing.address }),
          ...(billing.city && { city: billing.city }),
          ...(billing.state && { state: billing.state }),
          ...(billing.postcode && { postcode: billing.postcode }),
        };
      }
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
        setPaymentMessageDialog(data.message);
        onPlanSelected?.();
        onClose();
        return;
      }
      if (method === "card") throw new Error("No payment URL returned");
    } catch (err) {
      console.error(err);
      setPaymentMessageDialog(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingPlan(null);
      setSelectedPlanForMobile(null);
      setMobilePhone("");
      setCardBillingPlanId(null);
      setCardBilling(EMPTY_BILLING);
    }
  }

  async function handleBuyOnePoster(method: "card" | "mobile", billing: BillingForm) {
    setBuyingPoster(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "poster",
          paymentMethod: method,
          ...(method === "mobile"
            ? { phone_number: billing.phone.trim().replace(/\D/g, "").replace(/^0/, "255") }
            : {
                billing: {
                  ...(billing.phone && { phone_number: billing.phone }),
                  ...(billing.address && { address: billing.address }),
                  ...(billing.city && { city: billing.city }),
                  ...(billing.state && { state: billing.state }),
                  ...(billing.postcode && { postcode: billing.postcode }),
                },
              }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Payment could not be started");
      if (data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      if (data.message) {
        setPaymentMessageDialog(data.message);
        closePosterFlow();
      }
    } catch (err) {
      setPaymentMessageDialog(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBuyingPoster(false);
    }
  }

  if (!open) return null;

  const { format, prices, currency } = useCurrency();
  const perPosterPrice = getPerPosterPriceForCountry(countryCode);
  const proPerPosterLabel = getPlanEffectivePerPosterLabel("pro", countryCode);
  const posterHasMobile = perPosterPrice.mobileMoney;

  function planDisplayPrice(planId: PlanId): string {
    if (planId === "free") return "Free";
    if (planId === "pro") return format(prices.pro_monthly);
    return format(prices.business_monthly);
  }

  // -----------------------------------------------------------------
  // "Buy 1 poster" panel — rendered as a full overlay inside the modal
  // so it can't get clipped by any parent overflow
  // -----------------------------------------------------------------
  const posterPanel = posterStep !== null && (
    <div className="absolute inset-0 z-10 flex flex-col bg-bg-base rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-subtle px-6 py-4">
        <button
          type="button"
          onClick={closePosterFlow}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-semibold text-[15px] text-text-primary">
          Buy 1 poster · {perPosterPrice.label}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {/* Step: choose method (TZ only) */}
        {posterStep === "choose" && (
          <>
            <p className="font-mono text-[11px] text-text-muted">How would you like to pay?</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setPosterBilling({ ...EMPTY_BILLING, phone: profilePhoneNumber ?? "" });
                  setPosterStep("mobile");
                }}
                className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-surface px-5 py-4 text-left hover:border-accent/50 hover:bg-bg-elevated transition-all"
              >
                <Smartphone size={20} className="text-accent shrink-0" />
                <div>
                  <p className="font-semibold text-[14px] text-text-primary">Mobile money</p>
                  <p className="font-mono text-[11px] text-text-muted">M-Pesa, Tigo Pesa, Airtel Money</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPosterBilling({ ...EMPTY_BILLING, phone: profilePhoneNumber ?? "" });
                  setPosterStep("card");
                }}
                className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-surface px-5 py-4 text-left hover:border-accent/50 hover:bg-bg-elevated transition-all"
              >
                <CreditCard size={20} className="text-accent shrink-0" />
                <div>
                  <p className="font-semibold text-[14px] text-text-primary">Card</p>
                  <p className="font-mono text-[11px] text-text-muted">Visa, Mastercard, debit card</p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Step: mobile money phone input */}
        {posterStep === "mobile" && (
          <>
            <p className="font-mono text-[11px] text-text-muted">Enter your mobile money number</p>
            <input
              type="tel"
              placeholder="07XX XXX XXX"
              value={posterBilling.phone}
              onChange={(e) => setPosterBilling((p) => ({ ...p, phone: e.target.value }))}
              className={INPUT_CLS}
              autoFocus
            />
            <p className="font-mono text-[10px] text-text-muted">
              You will receive a USSD push to complete payment.
            </p>
            <Button
              variant="primary"
              className="w-full gap-1.5 mt-auto"
              disabled={!posterBilling.phone.trim() || buyingPoster}
              onClick={() => handleBuyOnePoster("mobile", posterBilling)}
            >
              {buyingPoster ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
              {buyingPoster ? "Requesting payment…" : `Pay ${perPosterPrice.label} with mobile`}
            </Button>
          </>
        )}

        {/* Step: card billing form */}
        {posterStep === "card" && (
          <>
            <p className="font-mono text-[11px] text-text-muted">
              Billing details — you will be redirected to the card checkout.
            </p>
            <BillingFields value={posterBilling} onChange={setPosterBilling} />
            <Button
              variant="primary"
              className="w-full gap-1.5 mt-auto"
              disabled={buyingPoster}
              onClick={() => handleBuyOnePoster("card", posterBilling)}
            >
              {buyingPoster ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
              {buyingPoster ? "Redirecting…" : `Pay ${perPosterPrice.label} with card`}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={posterStep !== null ? undefined : onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border-default bg-bg-base shadow-xl">
        {/* Poster purchase panel — overlays the entire modal when active */}
        {posterPanel}

        {/* Main modal content */}
        <div className={`flex flex-col max-h-[90vh] ${posterStep !== null ? "invisible" : ""}`}>
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
          <div className="overflow-y-auto p-6 md:p-8">
            {currency.code !== "USD" && (
              <p className="font-mono text-[10px] text-text-muted mb-4">
                Charged in USD · shown in {currency.code} for reference
              </p>
            )}
            {/* Upsell hook: per-poster cost comparison */}
            {currentPlan === "free" && (
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                <p className="font-mono text-[11px] text-text-secondary">
                  Pro = <span className="text-accent font-semibold">{proPerPosterLabel}</span> · Pay-per-poster = <span className="text-text-primary font-semibold">{perPosterPrice.label}/poster</span> · <span className="text-accent">Save 6x with monthly</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPosterBilling({ ...EMPTY_BILLING, phone: profilePhoneNumber ?? "" });
                    setPosterStep(posterHasMobile ? "choose" : "card");
                  }}
                  className="shrink-0 flex items-center gap-1.5 font-mono text-[11px] text-text-primary bg-bg-elevated border border-border-default rounded-lg px-3 py-1.5 hover:border-border-strong transition-colors"
                >
                  Buy 1 poster · {perPosterPrice.label}
                </button>
              </div>
            )}
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
                const displayPrice = planDisplayPrice(plan.id);
                const showMobileInput = selectedPlanForMobile === plan.id;
                const showCardBilling = cardBillingPlanId === plan.id;

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
                          {displayPrice}
                        </span>
                        {plan.id !== "free" && (
                          <span className="text-[13px] font-medium text-text-muted">/mo</span>
                        )}
                      </div>
                      {plan.id !== "free" && plan.priceYearlyUSD != null && (
                        <p className="text-[12px] text-text-muted mb-4" title="Pay yearly and save 2 months. Billed annually.">
                          or {format((plan.id === "pro" ? prices.pro_annual : prices.business_annual) * 10)}/year — save 2 months
                        </p>
                      )}
                      <div className="h-px bg-border-default mb-5" />
                      <ul className="space-y-3.5 mb-6 flex-1">
                        <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                            <Check size={12} className="text-accent" />
                          </span>
                          {brandKitsLabel} brand kit{limits.brandKits !== 1 ? "s" : ""}
                        </li>
                        <li className="flex items-center gap-3 text-[14px] text-text-secondary" title="Maximum number of posters you can generate per calendar month. Resets on the 1st.">
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
                      ) : (
                        <div className="space-y-2">
                          {/* Mobile money phone input */}
                          {showMobileInput && (
                            <div className="flex flex-col gap-2 min-w-0">
                              <input
                                type="tel"
                                placeholder="07XX XXX XXX"
                                value={mobilePhone}
                                onChange={(e) => setMobilePhone(e.target.value)}
                                className={INPUT_CLS}
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
                          {/* Card billing form */}
                          {showCardBilling && (
                            <div className="flex flex-col gap-2 min-w-0 pt-1">
                              <p className="font-mono text-[10px] text-text-muted">Billing details</p>
                              <BillingFields value={cardBilling} onChange={setCardBilling} />
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  className="flex-1"
                                  disabled={loadingPlan !== null}
                                  onClick={() => { setCardBillingPlanId(null); setCardBilling(EMPTY_BILLING); }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant={isPro ? "primary" : "secondary"}
                                  className="flex-1 gap-1.5"
                                  disabled={loadingPlan !== null}
                                  onClick={() => handleSelectPlan(plan.id, "card", undefined, cardBilling)}
                                >
                                  {loadingPlan === plan.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <CreditCard size={12} />
                                  )}
                                  {loadingPlan === plan.id ? "Redirecting…" : "Pay →"}
                                </Button>
                              </div>
                            </div>
                          )}
                          {/* Payment method buttons */}
                          {!showCardBilling && (
                            <div className={showMobileOption ? "flex gap-2 min-w-0" : ""}>
                              {showMobileOption && (
                                <Button
                                  variant={isPro ? "primary" : "secondary"}
                                  className="flex-1 gap-1.5"
                                  disabled={loadingPlan !== null}
                                  onClick={() => {
                                    setSelectedPlanForMobile(showMobileInput ? null : plan.id);
                                    setCardBillingPlanId(null);
                                  }}
                                >
                                  <Smartphone size={14} />
                                  Mobile money
                                </Button>
                              )}
                              <Button
                                variant={isPro ? "primary" : "secondary"}
                                className={showMobileOption ? "flex-1 gap-1.5" : "w-full gap-1.5"}
                                disabled={loadingPlan !== null}
                                onClick={() => openCardBilling(plan.id)}
                              >
                                <CreditCard size={14} />
                                {showMobileOption ? "Card" : "Pay with card"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const notificationDialog =
    paymentMessageDialog && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-notification-title"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPaymentMessageDialog(null)}
              aria-hidden="true"
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-default bg-bg-base shadow-xl p-6">
              <h3 id="payment-notification-title" className="font-semibold text-base text-text-primary mb-2">
                Payment
              </h3>
              <p className="text-sm text-text-secondary mb-6">{paymentMessageDialog}</p>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setPaymentMessageDialog(null)}
              >
                OK
              </Button>
            </div>
          </div>,
          document.body
        )
      : null;

  if (typeof document === "undefined") return null;
  return (
    <>
      {createPortal(modalContent, document.body)}
      {notificationDialog}
    </>
  );
}
