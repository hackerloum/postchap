"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

interface ClientUsage {
  clientId: string;
  clientName: string;
  postersThisMonth: number;
  monthlyQuota: number;
  estimatedCostUsd: number;
}

interface UsageData {
  plan: string;
  postersUsedThisMonth: number;
  posterLimit: number | null;
  postersRemaining: number | null;
  percentUsed: number;
  activeClients: number;
  clientUsage: ClientUsage[];
  totalEstimatedCostUsd: number;
}

export default function StudioUsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getClientIdToken();
        const res = await fetch("/api/studio/usage", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setUsage(await res.json());
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-bg-surface rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!usage) return <div className="max-w-3xl mx-auto px-5 py-8 text-center"><p className="text-text-muted font-mono text-[13px]">Failed to load usage data.</p></div>;

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="font-semibold text-[24px] text-text-primary tracking-tight">Usage</h1>
        <p className="font-mono text-[13px] text-text-muted mt-1">Track poster usage and costs per client.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Posters used</p>
          <p className="font-semibold text-[26px] text-text-primary">{usage.postersUsedThisMonth}</p>
          {usage.posterLimit && <p className="font-mono text-[10px] text-text-muted">of {usage.posterLimit}</p>}
        </div>
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Remaining</p>
          <p className="font-semibold text-[26px] text-text-primary">{usage.postersRemaining ?? "∞"}</p>
          <p className="font-mono text-[10px] text-text-muted">this month</p>
        </div>
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Est. AI cost</p>
          <p className="font-semibold text-[26px] text-text-primary">${usage.totalEstimatedCostUsd.toFixed(2)}</p>
          <p className="font-mono text-[10px] text-text-muted">this month</p>
        </div>
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Active clients</p>
          <p className="font-semibold text-[26px] text-text-primary">{usage.activeClients}</p>
        </div>
      </div>

      {/* Quota bar */}
      {usage.posterLimit && (
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[11px] text-text-muted">Monthly poster quota</p>
            <p className="font-mono text-[11px] text-text-secondary font-semibold capitalize">{usage.plan} plan</p>
          </div>
          <div className="w-full bg-bg-elevated rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all ${
                usage.percentUsed >= 90 ? "bg-error" : usage.percentUsed >= 70 ? "bg-warning" : "bg-info"
              }`}
              style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
            />
          </div>
          <p className="font-mono text-[11px] text-text-muted">{usage.percentUsed}% used</p>
          {usage.percentUsed >= 80 && (
            <div className="flex items-center gap-2 mt-2 p-3 bg-warning/10 border border-warning/20 rounded-xl">
              <AlertCircle size={13} className="text-warning" />
              <p className="font-mono text-[11px] text-warning">
                Running low on posters.{" "}
                <Link href="/studio/billing" className="underline">Upgrade your plan →</Link>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Per-client breakdown */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Usage by client</p>
        {usage.clientUsage.length === 0 ? (
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 text-center">
            <p className="font-mono text-[12px] text-text-muted">No client usage data yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {usage.clientUsage
              .sort((a, b) => b.postersThisMonth - a.postersThisMonth)
              .map((client) => (
                <div key={client.clientId} className="bg-bg-surface border border-border-default rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Link href={`/studio/clients/${client.clientId}`} className="font-medium text-[13px] text-text-primary hover:text-info transition-colors">
                        {client.clientName}
                      </Link>
                      <p className="font-mono text-[11px] text-text-muted mt-0.5">${client.estimatedCostUsd.toFixed(2)} est. cost</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[13px] text-text-primary">{client.postersThisMonth}</p>
                      <p className="font-mono text-[10px] text-text-muted">/ {client.monthlyQuota} quota</p>
                    </div>
                  </div>
                  <div className="w-full bg-bg-elevated rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-info"
                      style={{ width: `${Math.min((client.postersThisMonth / client.monthlyQuota) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Cost insight */}
      <div className="mt-8 bg-bg-surface border border-border-default rounded-2xl p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Cost insight</p>
        <p className="text-[13px] text-text-secondary">
          Each poster costs approximately <span className="text-text-primary font-semibold">$0.055 in AI credits</span>.
          At {usage.postersUsedThisMonth} posters this month, your total AI cost is{" "}
          <span className="text-text-primary font-semibold">${usage.totalEstimatedCostUsd.toFixed(2)}</span>.
          Your Studio plan fee covers everything else.
        </p>
      </div>
    </div>
  );
}
