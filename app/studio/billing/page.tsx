"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { STUDIO_PLANS } from "@/lib/studio-plans";
import { useCurrency } from "@/lib/geo/useCurrency";

interface Agency {
  plan: string;
}

function featureLabel(plan: (typeof STUDIO_PLANS)[0]): string[] {
  const l = plan.limits;
  const out: string[] = [];
  out.push(l.maxClients === -1 ? "Unlimited clients" : `Up to ${l.maxClients} clients`);
  out.push(
    l.maxBrandKitsPerClient === -1
      ? "Unlimited brand kits per client"
      : `${l.maxBrandKitsPerClient} brand kits per client`
  );
  out.push(
    l.maxPostersPerMonth === -1
      ? "Unlimited posters/month"
      : `${l.maxPostersPerMonth} posters/month`
  );
  if (l.teamMembers === -1) out.push("Unlimited team members");
  else if (l.teamMembers === 0) out.push("Solo");
  else out.push(`${l.teamMembers} team members`);
  if (l.clientPortal) out.push("Client portal");
  if (l.whiteLabel) out.push("White-label branding");
  if (l.bulkGeneration) out.push("Bulk generation");
  if (l.pdfReports) out.push("Monthly PDF reports");
  if (l.directPublishing) out.push("Direct Instagram publishing");
  return out;
}

export default function StudioBillingPage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const { format, prices, currency } = useCurrency();

  function studioPriceLabel(planId: string): string {
    if (planId === "trial") return "Free";
    if (planId === "starter") return `${format(prices.studio_starter)}/mo`;
    if (planId === "pro") return `${format(prices.studio_pro)}/mo`;
    return `${format(prices.studio_agency)}/mo`;
  }

  useEffect(() => {
    async function load() {
      try {
        const token = await getClientIdToken();
        const res = await fetch("/api/studio/agency", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const d = await res.json();
          if (d.agency) setAgency(d.agency);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="h-8 w-56 rounded-lg bg-white/5 animate-pulse mb-8" />
        <div className="grid md:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[320px] rounded-xl border bg-white/5 animate-pulse" style={{ borderColor: "var(--studio-border)" }} />
          ))}
        </div>
      </div>
    );
  }

  const currentPlanId = agency?.plan ?? "trial";

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-[28px] font-bold tracking-tight"
          style={{ color: "var(--studio-text-primary)", letterSpacing: "-0.03em" }}
        >
          Billing
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--studio-text-muted)" }}>
          Current plan:{" "}
          <span className="font-semibold capitalize" style={{ color: "var(--studio-accent)" }}>
            {currentPlanId}
          </span>
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STUDIO_PLANS.map((plan, index) => {
          const isCurrent = currentPlanId === plan.id;
          const isTrial = plan.id === "trial";
          const isPro = plan.id === "pro";
          const isRecommended = plan.id === "pro";

          return (
            <div
              key={plan.id}
              className="studio-animate-fade-up rounded-xl border flex flex-col overflow-hidden transition-all duration-200 hover:border-white/10"
              style={{
                animationDelay: `${index * 60}ms`,
                background: isCurrent
                  ? "rgba(232,255,71,0.04)"
                  : "var(--studio-bg-surface)",
                borderColor: isCurrent
                  ? "rgba(232,255,71,0.3)"
                  : isRecommended
                    ? "var(--studio-border)"
                    : "var(--studio-border-subtle)",
                boxShadow: isRecommended ? "0 0 0 1px rgba(255,255,255,0.06)" : undefined,
              }}
            >
              {/* Card header */}
              <div className="p-5 pb-0">
                {isCurrent && (
                  <span
                    className="inline-block text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full mb-3"
                    style={{
                      background: "rgba(232,255,71,0.12)",
                      color: "var(--studio-accent)",
                    }}
                  >
                    Current
                  </span>
                )}
                {isRecommended && !isCurrent && (
                  <span
                    className="inline-block text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full mb-3"
                    style={{
                      background: "var(--studio-card-glow)",
                      color: "var(--studio-accent)",
                    }}
                  >
                    Recommended
                  </span>
                )}
                {!isCurrent && !isRecommended && !isTrial && <div className="h-6 mb-1" />}
                {isTrial && !isCurrent && <div className="h-6 mb-1" />}

                <h2
                  className="text-[18px] font-bold tracking-tight"
                  style={{ color: "var(--studio-text-primary)" }}
                >
                  {plan.name}
                </h2>
                <p
                  className="text-[28px] font-bold tracking-tight mt-1 tabular-nums"
                  style={{ color: "var(--studio-text-primary)" }}
                >
                  {studioPriceLabel(plan.id)}
                </p>
                <p className="text-[11px] mt-1" style={{ color: "var(--studio-text-muted)" }}>
                  {plan.tagline}
                </p>
              </div>

              {/* Features */}
              <ul className="p-5 pt-4 flex-1 space-y-2">
                {featureLabel(plan).map((label) => (
                  <li key={label} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--studio-text-secondary)" }}>
                    <Check size={12} className="shrink-0" style={{ color: "var(--studio-accent)" }} />
                    {label}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="p-5 pt-0">
                {isCurrent ? (
                  <div
                    className="w-full py-3 rounded-lg text-center text-[12px] font-medium"
                    style={{
                      background: "var(--studio-border)",
                      color: "var(--studio-text-muted)",
                    }}
                  >
                    Current plan
                  </div>
                ) : isTrial ? (
                  <div
                    className="w-full py-3 rounded-lg text-center text-[12px] font-medium"
                    style={{
                      background: "var(--studio-border)",
                      color: "var(--studio-text-muted)",
                    }}
                  >
                    View only
                  </div>
                ) : (
                  <Link
                    href="/studio/billing#upgrade"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-[13px] font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                    style={{
                      background: "var(--studio-accent)",
                      color: "#080808",
                      boxShadow: "0 2px 12px var(--studio-accent-glow)",
                    }}
                  >
                    Upgrade to {plan.name}
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add-ons */}
      <div
        className="mt-10 rounded-xl border p-6 studio-animate-fade-up"
        style={{
          animationDelay: "280ms",
          background: "var(--studio-bg-surface)",
          borderColor: "var(--studio-border)",
        }}
      >
        <p
          className="text-[11px] font-semibold tracking-widest mb-4"
          style={{ color: "var(--studio-text-muted)" }}
        >
          Add-ons
        </p>
        <p className="font-mono text-[10px] text-text-muted mb-3">
          Charged in USD · shown in {currency.code} for reference
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "+500 posters/month", usd: 19 },
            { label: "+1,000 posters/month", usd: 34 },
            { label: "Client portal (Starter)", usd: 15 },
            { label: "Additional team member", usd: 9, suffix: " each" },
          ].map((addon) => (
            <div
              key={addon.label}
              className="flex items-center justify-between px-4 py-3 rounded-lg border"
              style={{
                background: "var(--studio-bg-base)",
                borderColor: "var(--studio-border-subtle)",
              }}
            >
              <span className="text-[13px]" style={{ color: "var(--studio-text-secondary)" }}>
                {addon.label}
              </span>
              <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--studio-text-primary)" }}>
                {format(addon.usd * (prices.pro_monthly / 12))}/mo{addon.suffix ?? ""}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-4" style={{ color: "var(--studio-text-muted)" }}>
          Add-ons can be enabled from Settings or by contacting support.
        </p>
      </div>
    </div>
  );
}
