"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  Images,
  UserPlus,
  ChevronRight,
  DollarSign,
  Zap,
  ArrowUpRight,
} from "lucide-react";
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

const CLIENT_COLORS = ["#e8ff47", "#4d9eff", "#3ddc84", "#f59e0b", "#ef4444"];

const EMPTY_USAGE: UsageData = {
  plan: "—",
  postersUsedThisMonth: 0,
  posterLimit: null,
  percentUsed: 0,
  activeClients: 0,
  totalEstimatedCostUsd: 0,
};

export default function StudioDashboardPage() {
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
          fetch("/api/studio/occasions?days=14", { headers }),
        ]);

        if (clientsRes.ok) {
          const d = await clientsRes.json();
          const list = (d.clients ?? []).slice(0, 6) as ClientSummary[];
          setClients(list);
        }
        if (usageRes.ok) {
          const u = await usageRes.json();
          setUsage({
            plan: u.plan ?? "—",
            postersUsedThisMonth: u.postersUsedThisMonth ?? 0,
            posterLimit: u.posterLimit ?? null,
            percentUsed: u.percentUsed ?? 0,
            activeClients: u.activeClients ?? 0,
            totalEstimatedCostUsd: u.totalEstimatedCostUsd ?? 0,
          });
        }
        if (occasionsRes.ok) {
          const d = await occasionsRes.json();
          setOccasions((d.alerts ?? []).slice(0, 5) as OccasionAlert[]);
        }
      } catch {
        // Leave state as initial (empty/empty usage)
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const displayClients = clients;
  const displayOccasions = occasions;
  const displayUsage = usage ?? EMPTY_USAGE;

  const quotaPercent = displayUsage.posterLimit
    ? Math.min((displayUsage.postersUsedThisMonth / displayUsage.posterLimit) * 100, 100)
    : 0;
  const isQuotaHigh = quotaPercent >= 80;

  const [quotaAnimated, setQuotaAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setQuotaAnimated(quotaPercent), 100);
    return () => clearTimeout(t);
  }, [quotaPercent]);

  return (
    <div className="max-w-[1100px] mx-auto space-y-8">

      {/* Page header */}
      <div className="studio-animate-fade-up" style={{ animationDelay: "0ms" }}>
        <h1
          className="text-[32px] font-bold tracking-tight"
          style={{ color: "var(--studio-text-primary)", letterSpacing: "-0.03em" }}
        >
          Overview
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--studio-text-muted)" }}>
          Clients · Posters · Usage
        </p>
      </div>

      {/* Stat cards */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 studio-animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        {[
          {
            label: "Active clients",
            value: String(displayUsage.activeClients),
            sub: "this month",
            icon: Users,
            accent: "#e8ff47",
            glow: "rgba(232,255,71,0.04)",
          },
          {
            label: "Posters",
            value: String(displayUsage.postersUsedThisMonth),
            sub: displayUsage.posterLimit ? `of ${displayUsage.posterLimit}` : "unlimited",
            icon: Images,
            accent: "#4d9eff",
            glow: "rgba(77,158,255,0.04)",
          },
          {
            label: "AI cost",
            value: `$${displayUsage.totalEstimatedCostUsd.toFixed(2)}`,
            sub: "this month",
            icon: DollarSign,
            accent: "#3ddc84",
            glow: "rgba(61,220,132,0.04)",
          },
          {
            label: "Plan",
            value: (displayUsage.plan || "pro").toUpperCase(),
            sub: "Upgrade",
            subHref: "/studio/billing",
            icon: Zap,
            accent: "#e8ff47",
            glow: "rgba(232,255,71,0.04)",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="studio-stat-card rounded-xl border p-5 transition-all duration-150"
              style={{
                background: "var(--studio-bg-surface)",
                borderColor: "var(--studio-border)",
                boxShadow: `inset 0 0 50px 0 ${card.glow}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium" style={{ color: "var(--studio-text-muted)" }}>
                  {card.label}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.accent}14`, border: `1px solid ${card.accent}30` }}
                >
                  <Icon size={13} style={{ color: card.accent }} />
                </div>
              </div>
              <p
                className="text-[28px] font-bold tracking-tight"
                style={{ color: "var(--studio-text-primary)", letterSpacing: "-0.03em" }}
              >
                {card.value}
              </p>
              {card.subHref ? (
                <Link
                  href={card.subHref}
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium mt-1 transition-opacity hover:opacity-80"
                  style={{ color: "var(--studio-accent)" }}
                >
                  {card.sub} <ArrowUpRight size={11} />
                </Link>
              ) : (
                <p className="text-[11px] mt-1" style={{ color: "var(--studio-text-muted)" }}>
                  {card.sub}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Quota bar */}
      {displayUsage.posterLimit != null && (
        <div
          className="rounded-xl border p-5 studio-animate-fade-up"
          style={{
            background: "var(--studio-bg-surface)",
            borderColor: "var(--studio-border)",
            animationDelay: "160ms",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium" style={{ color: "var(--studio-text-secondary)" }}>
              Poster quota
            </span>
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: isQuotaHigh ? "#ef4444" : "var(--studio-accent)" }}
            >
              {displayUsage.postersUsedThisMonth} / {displayUsage.posterLimit}
            </span>
          </div>
          <div
            className="h-[3px] rounded-full overflow-hidden"
            style={{ background: "var(--studio-track-bg)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-out"
              style={{
                width: `${quotaAnimated}%`,
                background: isQuotaHigh
                  ? "linear-gradient(90deg, #b91c1c, #ef4444)"
                  : "linear-gradient(90deg, #b8cc38, #e8ff47)",
                boxShadow: isQuotaHigh ? "0 0 8px rgba(239,68,68,0.4)" : "0 0 8px rgba(232,255,71,0.3)",
              }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Active clients table */}
        <div
          className="md:col-span-2 rounded-xl border overflow-hidden studio-animate-fade-up"
          style={{
            background: "var(--studio-bg-surface)",
            borderColor: "var(--studio-border)",
            animationDelay: "240ms",
          }}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--studio-border-subtle)" }}
          >
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--studio-text-primary)" }}>
              Active clients
            </h2>
            <div className="flex items-center gap-3">
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(232,255,71,0.08)",
                  color: "var(--studio-accent)",
                }}
              >
                {displayClients.length}
              </span>
              <Link
                href="/studio/clients"
                className="inline-flex items-center gap-0.5 text-[11px] font-medium transition-colors hover:text-white"
                style={{ color: "var(--studio-text-muted)" }}
              >
                View all <ArrowUpRight size={11} />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="divide-y" style={{ borderColor: "var(--studio-border-subtle)" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white/5 animate-pulse" />
                  <div className="flex-1 h-3 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : displayClients.length === 0 ? (
            <div
              className="px-6 py-12 text-center"
              style={{ color: "var(--studio-text-muted)" }}
            >
              <p className="text-[13px] font-medium">No clients yet</p>
              <p className="text-[11px] mt-1">Add your first client to start generating posters.</p>
              <Link
                href="/studio/clients/new"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-90"
                style={{ background: "var(--studio-accent)", color: "#080808" }}
              >
                <UserPlus size={14} />
                Add client
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--studio-border-subtle)" }}>
              {displayClients.map((client, i) => {
                const color = CLIENT_COLORS[i % CLIENT_COLORS.length];
                const pct = client.monthlyQuota
                  ? Math.min((client.postersThisMonth / client.monthlyQuota) * 100, 100)
                  : 0;
                return (
                  <Link
                    key={client.id}
                    href={`/studio/clients/${client.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 transition-colors duration-150 hover:bg-white/[0.02]"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{
                        background: `${color}14`,
                        border: `1px solid ${color}35`,
                        color,
                      }}
                    >
                      {client.clientName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium" style={{ color: "var(--studio-text-primary)" }}>
                        {client.clientName}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--studio-text-muted)" }}>
                        {client.industry || "—"}
                      </p>
                      <div
                        className="mt-2 h-[2px] rounded-full overflow-hidden max-w-[72px]"
                        style={{ background: "var(--studio-border)" }}
                      >
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-bold tabular-nums" style={{ color: "var(--studio-text-primary)" }}>
                        {client.postersThisMonth}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--studio-text-muted)" }}>
                        of {client.monthlyQuota}
                      </p>
                    </div>
                    <ChevronRight size={15} style={{ color: "var(--studio-text-muted)" }} />
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/studio/clients/new"
            className="flex items-center justify-center gap-2 py-4 border-t border-dashed text-[11px] font-medium transition-colors duration-150 hover:border-[var(--studio-accent)] hover:text-[var(--studio-accent)]"
            style={{ borderColor: "var(--studio-border)", color: "var(--studio-text-muted)" }}
          >
            <UserPlus size={13} />
            Add new client
          </Link>
        </div>

        {/* Right column: occasions + quick actions */}
        <div className="space-y-5">
          {/* Upcoming occasions */}
          <div
            className="rounded-xl border overflow-hidden studio-animate-fade-up"
            style={{
              background: "var(--studio-bg-surface)",
              borderColor: "var(--studio-border)",
              animationDelay: "280ms",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b"
              style={{ borderColor: "var(--studio-border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full studio-pulse-dot shrink-0"
                  style={{ background: "var(--studio-accent)" }}
                />
                <h2 className="text-[13px] font-semibold" style={{ color: "var(--studio-text-primary)" }}>
                  Upcoming occasions
                </h2>
              </div>
              <Link
                href="/studio/occasions"
                className="inline-flex items-center gap-0.5 text-[10px] font-medium transition-colors hover:text-white"
                style={{ color: "var(--studio-text-muted)" }}
              >
                All <ArrowUpRight size={10} />
              </Link>
            </div>

            <div className="divide-y" style={{ borderColor: "var(--studio-border-subtle)" }}>
              {displayOccasions.length === 0 ? (
                <div
                  className="px-5 py-6 text-center text-[11px]"
                  style={{ color: "var(--studio-text-muted)" }}
                >
                  No occasions in the next 14 days
                </div>
              ) : (
                displayOccasions.map((occ, i) => {
                  const urgencyRed = occ.daysUntil <= 5;
                  const urgencyAmber = occ.daysUntil <= 14 && !urgencyRed;
                  const badgeColor = urgencyRed ? "#ef4444" : urgencyAmber ? "#e8ff47" : "#3ddc84";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-white/[0.02]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium" style={{ color: "var(--studio-text-primary)" }}>
                          {occ.title}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--studio-text-muted)" }}>
                          {occ.clientName}
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 tabular-nums"
                        style={{
                          background: `${badgeColor}15`,
                          color: badgeColor,
                        }}
                      >
                        {occ.daysUntil === 0 ? "Today" : `${occ.daysUntil}d`}
                      </span>
                      <Link
                        href={`/studio/create?clientId=${occ.clientId}&occasion=${encodeURIComponent(occ.title)}`}
                        className="text-[10px] font-semibold shrink-0 transition-opacity hover:opacity-70"
                        style={{ color: "var(--studio-accent)" }}
                      >
                        →
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2 studio-animate-fade-up" style={{ animationDelay: "320ms" }}>
            {[
              { label: "Generate poster", sub: "Pick client & occasion", href: "/studio/create", icon: Sparkles, accent: "#e8ff47" },
              { label: "Add client", sub: "New brand to manage", href: "/studio/clients/new", icon: UserPlus, accent: "#4d9eff" },
              { label: "Invite team", sub: "Designers & reviewers", href: "/studio/team", icon: Users, accent: "#3ddc84" },
              { label: "View posters", sub: "Approve or request edits", href: "/studio/posters", icon: Images, accent: "#f59e0b" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-150 hover:border-white/10 hover:bg-white/[0.02]"
                  style={{
                    background: "var(--studio-bg-surface)",
                    borderColor: "var(--studio-border)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${action.accent}14`, border: `1px solid ${action.accent}30` }}
                  >
                    <Icon size={14} style={{ color: action.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: "var(--studio-text-primary)" }}>
                      {action.label}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--studio-text-muted)" }}>
                      {action.sub}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--studio-text-muted)" }} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly snapshot */}
      <div
        className="rounded-xl border p-6 studio-animate-fade-up"
        style={{
          background: "var(--studio-bg-surface)",
          borderColor: "var(--studio-border)",
          animationDelay: "360ms",
        }}
      >
        <p className="text-[11px] font-semibold tracking-widest mb-5" style={{ color: "var(--studio-text-muted)" }}>
          THIS MONTH
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Posters generated", value: String(displayUsage.postersUsedThisMonth) },
            { label: "Active clients", value: String(displayUsage.activeClients) },
            { label: "AI spend", value: `$${displayUsage.totalEstimatedCostUsd.toFixed(2)}` },
            { label: "Approvals pending", value: "—" },
          ].map((row) => (
            <div key={row.label}>
              <p
                className="text-[26px] font-bold tabular-nums"
                style={{ color: "var(--studio-text-primary)", letterSpacing: "-0.03em" }}
              >
                {row.value}
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--studio-text-muted)" }}>
                {row.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
