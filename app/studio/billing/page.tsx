"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Zap } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { STUDIO_PLANS } from "@/lib/studio-plans";

interface Agency {
  plan: string;
}

export default function StudioBillingPage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-5 py-8"><div className="h-8 w-48 bg-bg-surface rounded animate-pulse" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="font-semibold text-[24px] text-text-primary tracking-tight">Studio billing</h1>
        <p className="font-mono text-[13px] text-text-muted mt-1">
          Current plan: <span className="text-text-primary capitalize font-semibold">{agency?.plan ?? "starter"}</span>
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {STUDIO_PLANS.map((plan) => {
          const isCurrent = agency?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col ${
                isCurrent
                  ? "bg-info/5 border-info/30"
                  : plan.id === "pro"
                  ? "bg-bg-surface border-border-strong"
                  : "bg-bg-surface border-border-default"
              }`}
            >
              {isCurrent && (
                <span className="font-mono text-[10px] bg-info/15 text-info px-2 py-0.5 rounded-full self-start mb-3">
                  Current plan
                </span>
              )}
              <h2 className="font-semibold text-[18px] text-text-primary mb-1">{plan.name}</h2>
              <p className="font-semibold text-[28px] text-text-primary mb-1">{plan.priceLabel}</p>
              <p className="font-mono text-[11px] text-text-muted mb-4">{plan.tagline}</p>

              <div className="space-y-2 flex-1 mb-5">
                {[
                  `Up to ${plan.limits.maxClients === -1 ? "unlimited" : plan.limits.maxClients} clients`,
                  `${plan.limits.maxBrandKitsPerClient === -1 ? "Unlimited" : plan.limits.maxBrandKitsPerClient} brand kits/client`,
                  `${plan.limits.maxPostersPerMonth} posters/month`,
                  plan.limits.teamMembers === 0 ? "No team members" : plan.limits.teamMembers === -1 ? "Unlimited team" : `${plan.limits.teamMembers} team members`,
                  plan.limits.clientPortal ? "Client portal" : null,
                  plan.limits.whiteLabel ? "White-label branding" : null,
                  plan.limits.bulkGeneration ? "Bulk generation" : null,
                  plan.limits.pdfReports ? "Monthly PDF reports" : null,
                  plan.limits.directPublishing ? "Direct Instagram publishing" : null,
                ].filter(Boolean).map((feature) => (
                  <div key={feature!} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-success shrink-0" />
                    <span className="font-mono text-[12px] text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <button disabled className="w-full py-3 rounded-xl border border-border-default text-text-muted font-medium text-[13px] disabled:opacity-50">
                  Current plan
                </button>
              ) : (
                <a
                  href={`/studio/checkout?plan=${plan.id}`}
                  className="w-full py-3 rounded-xl bg-info text-black font-semibold text-[13px] text-center hover:bg-info/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={14} />
                  Upgrade to {plan.name}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-bg-surface border border-border-default rounded-2xl p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">Add-ons</p>
        <div className="grid md:grid-cols-2 gap-3 text-[13px] text-text-secondary">
          <div className="flex items-center justify-between p-3 bg-bg-base rounded-xl border border-border-default">
            <span>+500 posters/month</span>
            <span className="font-semibold text-text-primary">$19/mo</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-bg-base rounded-xl border border-border-default">
            <span>+1,000 posters/month</span>
            <span className="font-semibold text-text-primary">$34/mo</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-bg-base rounded-xl border border-border-default">
            <span>Client portal (Starter)</span>
            <span className="font-semibold text-text-primary">$15/mo</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-bg-base rounded-xl border border-border-default">
            <span>Additional team member</span>
            <span className="font-semibold text-text-primary">$9/mo each</span>
          </div>
        </div>
      </div>
    </div>
  );
}
