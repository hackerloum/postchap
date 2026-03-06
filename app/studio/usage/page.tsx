"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Zap, AlertCircle } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { Button, Card, Skeleton } from "@/components/studio/ui";

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
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/studio/usage", { headers });
        if (res.ok) setUsage(await res.json());
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[10px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-[#71717a]">Failed to load usage data.</p>
      </div>
    );
  }

  const isQuotaHigh = usage.percentUsed >= 80;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#fafafa] tracking-tight">Usage</h1>
          <p className="text-[14px] text-[#71717a] mt-0.5">Track poster usage and costs per client.</p>
        </div>
        <Link href="/studio/billing">
          <Button variant="primary" size="md">
            <Zap size={14} className="mr-2" />
            Upgrade
          </Button>
        </Link>
      </div>

      <Card className="p-5 bg-gradient-to-br from-[#E8FF4706] to-transparent border-[#E8FF4718]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold text-[#fafafa] capitalize">{usage.plan} plan</h2>
            <p className="text-[13px] text-[#a1a1aa] mt-1">Features and quota</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[32px] font-bold text-[#fafafa]">
                {usage.postersUsedThisMonth}
                {usage.posterLimit != null && ` / ${usage.posterLimit}`}
              </p>
              <p className="text-[12px] text-[#71717a]">Posters this month</p>
            </div>
            <Link href="/studio/billing">
              <Button variant="secondary" size="md">Manage subscription</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-1">Posters used</p>
          <p className="text-[26px] font-bold text-[#fafafa]">{usage.postersUsedThisMonth}</p>
          {usage.posterLimit && <p className="text-[12px] text-[#71717a]">of {usage.posterLimit}</p>}
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-1">Remaining</p>
          <p className="text-[26px] font-bold text-[#fafafa]">{usage.postersRemaining ?? "∞"}</p>
          <p className="text-[12px] text-[#71717a]">this month</p>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-1">Est. AI cost</p>
          <p className="text-[26px] font-bold text-[#fafafa]">${usage.totalEstimatedCostUsd.toFixed(2)}</p>
          <p className="text-[12px] text-[#71717a]">this month</p>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-1">Active clients</p>
          <p className="text-[26px] font-bold text-[#fafafa]">{usage.activeClients}</p>
        </Card>
      </div>

      {usage.posterLimit != null && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a]">Monthly poster quota</p>
            <p className="text-[12px] text-[#a1a1aa] font-medium capitalize">{usage.plan} plan</p>
          </div>
          <div className="h-2 w-full rounded-full bg-[#ffffff08] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isQuotaHigh ? "bg-[#ef4444]" : "bg-[#E8FF47]"
              }`}
              style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
            />
          </div>
          <p className="text-[12px] text-[#71717a] mt-2">{usage.percentUsed}% used</p>
          {isQuotaHigh && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-[#fbbf2412] border border-[#fbbf2425]">
              <AlertCircle size={16} className="text-[#fbbf24]" />
              <p className="text-[12px] text-[#fbbf24]">
                Running low. <Link href="/studio/billing" className="underline">Upgrade →</Link>
              </p>
            </div>
          )}
        </Card>
      )}

      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-3">Usage by client</p>
        {usage.clientUsage.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-[13px] text-[#71717a]">No client usage data yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {usage.clientUsage
              .sort((a, b) => b.postersThisMonth - a.postersThisMonth)
              .map((client) => {
                const pct = client.monthlyQuota
                  ? Math.min((client.postersThisMonth / client.monthlyQuota) * 100, 100)
                  : 0;
                return (
                  <Card key={client.clientId} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Link
                          href={`/studio/clients/${client.clientId}`}
                          className="text-[13px] font-medium text-[#fafafa] hover:text-[#E8FF47] transition-colors"
                        >
                          {client.clientName}
                        </Link>
                        <p className="text-[11px] text-[#71717a]">${client.estimatedCostUsd.toFixed(2)} est. cost</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-[#fafafa]">{client.postersThisMonth}</p>
                        <p className="text-[10px] text-[#71717a]">/ {client.monthlyQuota} quota</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#ffffff08] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#E8FF47]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      <Card className="p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-2">Cost insight</p>
        <p className="text-[13px] text-[#a1a1aa]">
          Each poster costs approximately <span className="text-[#fafafa] font-semibold">$0.055 in AI credits</span>.
          At {usage.postersUsedThisMonth} posters this month, total AI cost is{" "}
          <span className="text-[#fafafa] font-semibold">${usage.totalEstimatedCostUsd.toFixed(2)}</span>.
        </p>
      </Card>
    </div>
  );
}
