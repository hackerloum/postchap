"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  X,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";

export type PlanId = "free" | "pro" | "business";

interface PricingPlansProps {
  currentPlan?: PlanId;
  context?: "landing" | "dashboard";
}

interface PlanLimit {
  postersPerMonth: number;
  brandKits: number;
  platforms: number;
  aiRecommendations: boolean;
  scheduling: boolean;
  customTemplates: boolean;
  teamMembers: number;
  analytics: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  resolution: string;
}

interface PlanFeature {
  label: string;
  included: boolean;
}

interface PlanItem {
  id: PlanId;
  name: string;
  price: { monthly: number; annual: number };
  description: string;
  badge: string | null;
  cta: string;
  ctaVariant: "outline" | "accent";
  limits: PlanLimit;
  features: PlanFeature[];
}

const PLANS: PlanItem[] = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    description: "Perfect for getting started",
    badge: null,
    cta: "Get started free",
    ctaVariant: "outline",
    limits: {
      postersPerMonth: 5,
      brandKits: 1,
      platforms: 2,
      aiRecommendations: true,
      scheduling: false,
      customTemplates: false,
      teamMembers: 1,
      analytics: false,
      prioritySupport: false,
      apiAccess: false,
      whiteLabel: false,
      resolution: "1080px",
    },
    features: [
      { label: "5 posters per month", included: true },
      { label: "1 brand kit", included: true },
      { label: "AI content recommendations", included: true },
      { label: "2 social platforms", included: true },
      { label: "Standard resolution", included: true },
      { label: "Daily scheduling", included: false },
      { label: "Custom templates", included: false },
      { label: "Analytics dashboard", included: false },
      { label: "Priority support", included: false },
      { label: "API access", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 12, annual: 10 },
    description: "For growing businesses posting daily",
    badge: "Most popular",
    cta: "Start Pro",
    ctaVariant: "accent",
    limits: {
      postersPerMonth: 60,
      brandKits: 3,
      platforms: 8,
      aiRecommendations: true,
      scheduling: true,
      customTemplates: true,
      teamMembers: 3,
      analytics: true,
      prioritySupport: false,
      apiAccess: false,
      whiteLabel: false,
      resolution: "2048px",
    },
    features: [
      { label: "60 posters per month", included: true },
      { label: "3 brand kits", included: true },
      { label: "AI content recommendations", included: true },
      { label: "All 8 social platforms", included: true },
      { label: "High resolution (2048px)", included: true },
      { label: "Daily scheduling", included: true },
      { label: "Custom templates", included: true },
      { label: "Analytics dashboard", included: true },
      { label: "Priority support", included: false },
      { label: "API access", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    price: { monthly: 24, annual: 20 },
    description: "For agencies and scaling brands",
    badge: null,
    cta: "Start Business",
    ctaVariant: "outline",
    limits: {
      postersPerMonth: -1,
      brandKits: -1,
      platforms: 8,
      aiRecommendations: true,
      scheduling: true,
      customTemplates: true,
      teamMembers: -1,
      analytics: true,
      prioritySupport: true,
      apiAccess: true,
      whiteLabel: true,
      resolution: "4096px",
    },
    features: [
      { label: "Unlimited posters", included: true },
      { label: "Unlimited brand kits", included: true },
      { label: "AI content recommendations", included: true },
      { label: "All 8 social platforms", included: true },
      { label: "4K resolution (4096px)", included: true },
      { label: "Daily scheduling", included: true },
      { label: "Custom templates", included: true },
      { label: "Analytics dashboard", included: true },
      { label: "Priority support", included: true },
      { label: "API access", included: true },
    ],
  },
];

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        open
          ? "border-border-strong bg-bg-surface"
          : "border-border-default bg-bg-surface hover:border-border-strong"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className="font-semibold text-[14px] text-text-primary">
          {question}
        </span>
        <div
          className={`w-5 h-5 rounded-full border border-border-default flex items-center justify-center shrink-0 transition-transform duration-200 ${
            open ? "rotate-45 border-accent" : ""
          }`}
        >
          <Plus size={11} className={open ? "text-accent" : "text-text-muted"} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4">
          <p className="font-mono text-[13px] text-text-secondary leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export function PricingPlans({
  currentPlan,
  context = "landing",
}: PricingPlansProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="w-full">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span
          className={`font-mono text-[13px] transition-colors ${
            billing === "monthly" ? "text-text-primary" : "text-text-muted"
          }`}
        >
          Monthly
        </span>

        <button
          type="button"
          onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
          className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
            billing === "annual"
              ? "bg-accent"
              : "bg-bg-elevated border border-border-strong"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${
              billing === "annual" ? "left-7 bg-black" : "left-1 bg-text-muted"
            }`}
          />
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-[13px] transition-colors ${
              billing === "annual" ? "text-text-primary" : "text-text-muted"
            }`}
          >
            Annual
          </span>
          <div className="bg-accent/15 border border-accent/30 rounded-full px-2 py-0.5">
            <span className="font-mono text-[10px] text-accent">Save 17%</span>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const price = plan.price[billing];
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.badge === "Most popular";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 ${
                isPopular
                  ? "border-accent shadow-[0_0_0_1px_rgba(232,255,71,0.2)] shadow-accent/10"
                  : "border-border-default hover:border-border-strong"
              } ${isCurrent ? "ring-2 ring-accent/30" : ""}`}
            >
              {isPopular && (
                <div className="bg-accent px-5 py-2 flex items-center justify-center gap-2">
                  <Sparkles size={12} className="text-black" />
                  <span className="font-mono text-[11px] font-bold text-black tracking-wider">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {isCurrent && !isPopular && (
                <div className="bg-bg-elevated border-b border-border-default px-5 py-2 flex items-center justify-center">
                  <span className="font-mono text-[11px] text-text-muted tracking-wider">
                    YOUR CURRENT PLAN
                  </span>
                </div>
              )}
              {isCurrent && isPopular && (
                <div className="absolute top-10 right-3">
                  <div className="bg-success/10 border border-success/20 rounded-full px-2 py-0.5">
                    <span className="font-mono text-[9px] text-success">
                      Current
                    </span>
                  </div>
                </div>
              )}

              <div
                className={`flex flex-col flex-1 p-6 ${
                  isPopular ? "bg-bg-surface" : "bg-bg-surface"
                }`}
              >
                <div className="mb-6">
                  <p className="font-semibold text-[16px] text-text-primary mb-1">
                    {plan.name}
                  </p>
                  <p className="font-mono text-[12px] text-text-muted leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-border-subtle">
                  <div className="flex items-end gap-1.5">
                    <span className="font-bold text-[42px] text-text-primary leading-none tracking-tight">
                      ${price}
                    </span>
                    <div className="mb-1">
                      <span className="font-mono text-[12px] text-text-muted">
                        /mo
                      </span>
                      {billing === "annual" && price > 0 && (
                        <p className="font-mono text-[10px] text-text-muted">
                          billed annually
                        </p>
                      )}
                    </div>
                  </div>

                  {billing === "annual" && price > 0 && (
                    <p className="font-mono text-[11px] text-text-muted/60 mt-1 line-through">
                      ${plan.price.monthly}/mo monthly
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-border-subtle/50">
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="font-bold text-[18px] text-text-primary leading-tight">
                      {plan.limits.postersPerMonth === -1
                        ? "∞"
                        : plan.limits.postersPerMonth}
                    </p>
                    <p className="font-mono text-[10px] text-text-muted">
                      posters/mo
                    </p>
                  </div>
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="font-bold text-[18px] text-text-primary leading-tight">
                      {plan.limits.brandKits === -1
                        ? "∞"
                        : plan.limits.brandKits}
                    </p>
                    <p className="font-mono text-[10px] text-text-muted">
                      brand kit{plan.limits.brandKits !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-center gap-2.5"
                    >
                      {feature.included ? (
                        <CheckCircle
                          size={14}
                          className={
                            isPopular
                              ? "text-accent shrink-0"
                              : "text-success shrink-0"
                          }
                        />
                      ) : (
                        <X
                          size={14}
                          className="text-text-muted/30 shrink-0"
                        />
                      )}
                      <span
                        className={`font-mono text-[12px] ${
                          feature.included
                            ? "text-text-secondary"
                            : "text-text-muted/40"
                        }`}
                      >
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border-default bg-bg-elevated">
                    <CheckCircle size={14} className="text-success" />
                    <span className="font-semibold text-[13px] text-text-secondary">
                      Current plan
                    </span>
                  </div>
                ) : plan.ctaVariant === "accent" ? (
                  <Link
                    href={
                      price === 0
                        ? "/signup"
                        : `/checkout?plan=${plan.id}&billing=${billing}${context === "dashboard" ? "&from=dashboard" : ""}`
                    }
                    className="flex items-center justify-center gap-2 bg-accent text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-accent-dim transition-all active:scale-[0.99] min-h-[52px]"
                  >
                    {plan.cta}
                    <ArrowRight size={15} />
                  </Link>
                ) : (
                  <Link
                    href={
                      price === 0
                        ? "/signup"
                        : `/checkout?plan=${plan.id}&billing=${billing}${context === "dashboard" ? "&from=dashboard" : ""}`
                    }
                    className="flex items-center justify-center gap-2 bg-bg-elevated border border-border-default text-text-primary font-semibold text-[14px] py-3.5 rounded-xl hover:border-border-strong hover:bg-bg-base transition-all min-h-[52px]"
                  >
                    {plan.cta}
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="max-w-5xl mx-auto mt-20">
        <h3 className="font-semibold text-[20px] text-text-primary text-center tracking-tight mb-8">
          Full comparison
        </h3>

        <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-4 min-w-[600px] border-b border-border-subtle">
            <div className="px-6 py-4 col-span-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Feature
              </span>
            </div>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`px-6 py-4 text-center ${
                  plan.id === "pro"
                    ? "bg-accent/5 border-x border-accent/10"
                    : ""
                }`}
              >
                <p className="font-semibold text-[13px] text-text-primary">
                  {plan.name}
                </p>
                <p className="font-mono text-[11px] text-text-muted mt-0.5">
                  ${plan.price.monthly}/mo
                </p>
              </div>
            ))}
          </div>

          {[
            {
              category: "Generation",
              rows: [
                {
                  label: "Posters per month",
                  values: ["5", "60", "Unlimited"],
                },
                {
                  label: "Image resolution",
                  values: ["1080px", "2048px", "4096px"],
                },
                {
                  label: "AI recommendations",
                  values: [true, true, true],
                },
                {
                  label: "Daily scheduling",
                  values: [false, true, true],
                },
              ],
            },
            {
              category: "Brand",
              rows: [
                {
                  label: "Brand kits",
                  values: ["1", "3", "Unlimited"],
                },
                {
                  label: "Social platforms",
                  values: ["2", "8", "8"],
                },
                {
                  label: "Custom templates",
                  values: [false, true, true],
                },
                {
                  label: "White label",
                  values: [false, false, true],
                },
              ],
            },
            {
              category: "Team & Support",
              rows: [
                {
                  label: "Team members",
                  values: ["1", "3", "Unlimited"],
                },
                {
                  label: "Analytics",
                  values: [false, true, true],
                },
                {
                  label: "Priority support",
                  values: [false, false, true],
                },
                {
                  label: "API access",
                  values: [false, false, true],
                },
              ],
            },
          ].map((section) => (
            <div key={section.category} className="min-w-[600px]">
              <div className="px-6 py-3 bg-bg-elevated/50 border-y border-border-subtle/40">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  {section.category}
                </span>
              </div>

              {section.rows.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-4 ${
                    i < section.rows.length - 1
                      ? "border-b border-border-subtle/30"
                      : ""
                  }`}
                >
                  <div className="px-6 py-4">
                    <span className="font-mono text-[12px] text-text-secondary">
                      {row.label}
                    </span>
                  </div>

                  {row.values.map((val, vi) => (
                    <div
                      key={vi}
                      className={`px-6 py-4 flex items-center justify-center ${
                        vi === 1 ? "bg-accent/3 border-x border-accent/10" : ""
                      }`}
                    >
                      {typeof val === "boolean" ? (
                        val ? (
                          <CheckCircle
                            size={15}
                            className={
                              vi === 1 ? "text-accent" : "text-success"
                            }
                          />
                        ) : (
                          <div className="w-3 h-px bg-border-strong rounded" />
                        )
                      ) : (
                        <span
                          className={`font-mono text-[12px] text-center ${
                            vi === 1
                              ? "text-accent font-semibold"
                              : "text-text-secondary"
                          }`}
                        >
                          {val}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-20">
        <h3 className="font-semibold text-[20px] text-text-primary text-center tracking-tight mb-8">
          Common questions
        </h3>

        <div className="space-y-2">
          {[
            {
              q: "Can I change plans at any time?",
              a: "Yes. Upgrade or downgrade at any time. When upgrading, the difference is prorated immediately. When downgrading, changes take effect at the next billing cycle.",
            },
            {
              q: "What happens when I reach my poster limit?",
              a: "Generation is paused until your next billing cycle resets the counter. You can upgrade at any time to continue generating immediately.",
            },
            {
              q: "Do unused posters roll over?",
              a: "No. Poster credits reset on your monthly billing date. We recommend setting up daily scheduling so you never miss a day.",
            },
            {
              q: "Is there a free trial for Pro or Business?",
              a: "The Free plan lets you test the full generation flow with 5 posters. No credit card required to get started.",
            },
            {
              q: "What currencies do you accept?",
              a: "We accept USD via card payment. Local payment methods for African markets including M-Pesa are coming soon.",
            },
          ].map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
