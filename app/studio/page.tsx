"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Sparkles, Images, AlertCircle, ArrowRight, TrendingUp, Clock, CheckCircle2, Bell } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

interface ClientSummary {
  id: string;
  clientName: string;
  industry?: string;
  status: string;
  postersThisMonth: number;
  monthlyQuota: number;
}

interface UsageData {
  plan: string;
  postersUsedThisMonth: number;
  posterLimit: number | null;
  postersRemaining: number | null;
  percentUsed: number;
  activeClients: number;
  totalEstimatedCostUsd: number;
}

interface OccasionAlert {
  clientId: string;
  clientName: string;
  type: string;
  title: string;
  daysUntil: number;
  date: string;
}

export default function StudioHomePage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [occasions, setOccasions] = useState<OccasionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getClientIdToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const [clientsRes, usageRes, occasionsRes] = await Promise.all([
          fetch("/api/studio/clients?status=active", { headers }),
          fetch("/api/studio/usage", { headers }),
          fetch("/api/studio/occasions?days=7", { headers }),
        ]);

        if (clientsRes.ok) {
          const d = await clientsRes.json();
          setClients((d.clients ?? []).slice(0, 6));
        }
        if (usageRes.ok) setUsage(await usageRes.json());
        if (occasionsRes.ok) {
          const d = await occasionsRes.json();
          setOccasions((d.alerts ?? []).slice(0, 5));
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  const planColor = usage?.plan === "agency" ? "text-accent" : usage?.plan === "pro" ? "text-info" : "text-text-muted";

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-semibold text-[24px] text-text-primary tracking-tight">Studio</h1>
          <p className="font-mono text-[13px] text-text-muted mt-1">
            Manage clients, generate posters, track approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/studio/clients/new"
            className="hidden sm:inline-flex items-center gap-2 bg-bg-surface border border-border-default text-text-secondary text-[13px] font-medium px-4 py-2 rounded-xl hover:border-border-strong hover:text-text-primary transition-colors"
          >
            <Users size={14} />
            Add client
          </Link>
          <Link
            href="/studio/create"
            className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[13px] px-4 py-2 rounded-xl hover:bg-info/90 transition-colors"
          >
            <Sparkles size={14} />
            Generate
          </Link>
        </div>
      </div>

      {/* Stats */}
      {usage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Active clients</p>
            <p className="font-semibold text-[28px] text-text-primary">{usage.activeClients}</p>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Posters this month</p>
            <p className="font-semibold text-[28px] text-text-primary">{usage.postersUsedThisMonth}</p>
            {usage.posterLimit && (
              <p className="font-mono text-[10px] text-text-muted mt-0.5">of {usage.posterLimit}</p>
            )}
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Est. AI cost</p>
            <p className="font-semibold text-[28px] text-text-primary">${usage.totalEstimatedCostUsd.toFixed(2)}</p>
            <p className="font-mono text-[10px] text-text-muted mt-0.5">this month</p>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Plan</p>
            <p className={`font-semibold text-[28px] capitalize ${planColor}`}>{usage.plan}</p>
            <Link href="/studio/billing" className="font-mono text-[10px] text-text-muted mt-0.5 hover:text-info transition-colors">
              Upgrade →
            </Link>
          </div>
        </div>
      )}

      {/* Usage bar */}
      {usage && usage.posterLimit && (
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[11px] text-text-muted">Poster quota</p>
            <p className="font-mono text-[11px] text-text-secondary">
              {usage.postersUsedThisMonth} / {usage.posterLimit}
            </p>
          </div>
          <div className="w-full bg-bg-elevated rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                usage.percentUsed >= 90 ? "bg-error" : usage.percentUsed >= 70 ? "bg-warning" : "bg-info"
              }`}
              style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
            />
          </div>
          {usage.percentUsed >= 80 && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle size={12} className="text-warning" />
              <p className="font-mono text-[11px] text-warning">
                {usage.posterLimit - usage.postersUsedThisMonth} posters remaining.{" "}
                <Link href="/studio/billing" className="underline">Upgrade</Link>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active clients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[15px] text-text-primary">Active clients</h2>
            <Link href="/studio/clients" className="font-mono text-[11px] text-text-muted hover:text-info transition-colors">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-2xl p-8 text-center">
              <Users size={24} className="text-text-muted mx-auto mb-3" />
              <p className="font-semibold text-[14px] text-text-primary mb-1">No clients yet</p>
              <p className="font-mono text-[12px] text-text-muted mb-4">Add your first client to get started</p>
              <Link
                href="/studio/clients/new"
                className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[13px] px-4 py-2 rounded-xl hover:bg-info/90 transition-colors"
              >
                Add client
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/studio/clients/${client.id}`}
                  className="block bg-bg-surface border border-border-default rounded-xl p-3.5 hover:border-border-strong transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[13px] text-text-primary">{client.clientName}</p>
                      <p className="font-mono text-[11px] text-text-muted">{client.industry || "No industry set"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[13px] text-text-primary">{client.postersThisMonth}</p>
                      <p className="font-mono text-[10px] text-text-muted">/ {client.monthlyQuota} posters</p>
                    </div>
                  </div>
                </Link>
              ))}
              <Link
                href="/studio/clients"
                className="block bg-bg-surface border border-dashed border-border-default rounded-xl p-3.5 text-center text-text-muted hover:border-border-strong hover:text-text-secondary transition-colors"
              >
                <span className="font-mono text-[12px]">View all clients →</span>
              </Link>
            </div>
          )}
        </div>

        {/* Occasion alerts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[15px] text-text-primary flex items-center gap-2">
              <Bell size={15} className="text-warning" />
              Upcoming occasions
            </h2>
            <Link href="/studio/occasions" className="font-mono text-[11px] text-text-muted hover:text-info transition-colors">
              View all →
            </Link>
          </div>
          {occasions.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-2xl p-6 text-center">
              <p className="font-mono text-[12px] text-text-muted">No upcoming occasions in the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {occasions.map((alert, i) => (
                <div
                  key={i}
                  className="bg-bg-surface border border-border-default rounded-xl p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[13px] text-text-primary">{alert.title}</p>
                      <p className="font-mono text-[11px] text-text-muted">{alert.clientName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full ${
                        alert.daysUntil === 0
                          ? "bg-error/15 text-error"
                          : alert.daysUntil <= 2
                          ? "bg-warning/15 text-warning"
                          : "bg-info/15 text-info"
                      }`}>
                        {alert.daysUntil === 0 ? "Today" : `${alert.daysUntil}d`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Link
                      href={`/studio/create?clientId=${alert.clientId}&occasion=${encodeURIComponent(alert.title)}`}
                      className="font-mono text-[11px] text-info hover:underline"
                    >
                      Generate poster →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
