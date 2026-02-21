"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Try Kichwa with one brand.",
    features: [
      "1 brand kit",
      "1 poster per day",
      "7-day history",
      "Email support",
    ],
    cta: "Get started",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For teams that ship daily.",
    features: [
      "Unlimited brand kits",
      "1 poster per brand per day",
      "Unlimited history",
      "Approval workflow",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Contact us",
    period: "",
    description: "Custom volume and SLAs.",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "Custom integrations",
      "SSO & audit logs",
    ],
    cta: "Contact sales",
    href: "#",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl"
        >
          Simple pricing
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-2 font-apple text-sm font-normal leading-relaxed text-text-secondary"
        >
          Start free. Upgrade when you need more.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-xl border bg-bg-surface p-6 transition-colors duration-200",
                tier.popular
                  ? "border-accent hover:border-accent-dim"
                  : "border-border-default hover:border-border-strong"
              )}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-6 rounded-full border border-accent bg-bg-base px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-accent">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
                {tier.name}
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold tracking-tight text-text-primary">
                  {tier.price}
                </span>
                <span className="font-mono text-xs text-text-muted">
                  {tier.period}
                </span>
              </div>
              <p className="mt-2 font-apple text-sm font-normal leading-relaxed text-text-secondary">
                {tier.description}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 font-apple text-sm text-text-secondary"
                  >
                    <Check className="h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={tier.popular ? "primary" : "ghost"}
                className="mt-6 w-full"
                asChild
              >
                <a href={tier.href}>{tier.cta}</a>
              </Button>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
