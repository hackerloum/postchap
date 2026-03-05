"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  Images,
  UserPlus,
  Bell,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Zap,
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

const MOCK_CLIENTS: ClientSummary[] = [
  { id: "1", clientName: "Maison Rémy", industry: "Fashion", status: "active", postersThisMonth: 12, monthlyQuota: 30 },
  { id: "2", clientName: "Café Noir", industry: "F&B", status: "active", postersThisMonth: 8, monthlyQuota: 20 },
  { id: "3", clientName: "Atelier Blanc", industry: "Interior", status: "active", postersThisMonth: 15, monthlyQuota: 40 },
  { id: "4", clientName: "Villa Soleil", industry: "Real estate", status: "active", postersThisMonth: 5, monthlyQuota: 15 },
  { id: "5", clientName: "Studio 7", industry: "Photography", status: "active", postersThisMonth: 7, monthlyQuota: 25 },
];

const CLIENT_COLORS = ["#c8873a", "#6b8cae", "#7a9e82", "#b8866b", "#8b7355"];

const MOCK_OCCASIONS: OccasionAlert[] = [
  { clientId: "1", clientName: "Maison Rémy", type: "seasonal", title: "Spring Collection Launch", daysUntil: 3, date: "2025-03-08" },
  { clientId: "2", clientName: "Café Noir", type: "global", title: "International Coffee Day", daysUntil: 7, date: "2025-03-12" },
  { clientId: "3", clientName: "Atelier Blanc", type: "national", title: "Design Week", daysUntil: 12, date: "2025-03-17" },
  { clientId: "4", clientName: "Villa Soleil", type: "promo", title: "Open House Weekend", daysUntil: 14, date: "2025-03-19" },
];

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
          if (list.length) setClients(list);
        }
        if (usageRes.ok) {
          const u = await usageRes.json();
          if (u) setUsage(u);
        }
        if (occasionsRes.ok) {
          const d = await occasionsRes.json();
          const list = (d.alerts ?? []).slice(0, 5) as OccasionAlert[];
          if (list.length) setOccasions(list);
        }
      } catch {
        // use mock
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const displayClients = clients.length ? clients : MOCK_CLIENTS.slice(0, 5);
  const displayOccasions = occasions.length ? occasions : MOCK_OCCASIONS;
  const displayUsage = usage || {
    plan: "pro",
    postersUsedThisMonth: 47,
    posterLimit: 500,
    percentUsed: 9.4,
    activeClients: 8,
    totalEstimatedCostUsd: 2.59,
  };

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
    <div className="max-w-6xl mx-auto space-y-9">
      {/* Page header */}
      <div
        className="studio-animate-fade-up flex items-baseline gap-2"
        style={{ animationDelay: "0ms" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
          style={{
            background: "var(--studio-accent)",
            boxShadow: "0 0 12px var(--studio-accent-glow)",
          }}
        />
        <div>
          <h1
            className="studio-font-display text-[38px] font-bold tracking-tight"
            style={{ color: "var(--studio-text-primary)", letterSpacing: "-0.02em" }}
          >
            Studio
          </h1>
          <p
            className="studio-font-ui text-[11px] mt-1"
            style={{ color: "var(--studio-text-muted)", letterSpacing: "0.02em" }}
          >
            Manage clients · Generate posters · Track approvals
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-3.5 studio-animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        {[
          {
            label: "ACTIVE CLIENTS",
            value: String(displayUsage.activeClients),
            sub: "this month",
            icon: Users,
            accent: "var(--studio-accent)",
            glow: "var(--studio-card-glow-brass)",
          },
          {
            label: "POSTERS THIS MONTH",
            value: String(displayUsage.postersUsedThisMonth),
            sub: displayUsage.posterLimit ? `of ${displayUsage.posterLimit}` : "unlimited",
            icon: Images,
            accent: "#6b8cae",
            glow: "var(--studio-card-glow-blue)",
          },
          {
            label: "EST. AI COST",
            value: `$${displayUsage.totalEstimatedCostUsd.toFixed(2)}`,
            sub: "this month",
            icon: DollarSign,
            accent: "#7a9e82",
            glow: "var(--studio-card-glow-green)",
          },
          {
            label: "PLAN",
            value: (displayUsage.plan || "pro").toUpperCase(),
            sub: "Upgrade →",
            subHref: "/studio/billing",
            icon: Zap,
            accent: "var(--studio-accent)",
            glow: "var(--studio-card-glow-brass)",
          },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="studio-stat-card rounded-xl border p-5 transition-all duration-150"
              style={{
                background: "var(--studio-bg-surface)",
                borderColor: "var(--studio-border)",
                boxShadow: `inset 0 0 60px 0 ${card.glow}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="studio-font-ui text-[8px] tracking-[0.18em]"
                  style={{ color: "var(--studio-text-muted)" }}
                >
                  {card.label}
                </span>
                <div
                  className="w-[26px] h-[26px] rounded-lg flex items-center justify-center"
                  style={{ background: `${card.accent}20`, border: `1px solid ${card.accent}40` }}
                >
                  <Icon size={12} style={{ color: card.accent }} />
                </div>
              </div>
              <p
                className="studio-font-display text-[32px] font-bold tracking-tight"
                style={{ color: "var(--studio-text-primary)", letterSpacing: "-0.02em" }}
              >
                {card.value}
              </p>
              {card.subHref ? (
                <Link
                  href={card.subHref}
                  className="studio-font-ui text-[9px] mt-0.5 transition-colors hover:opacity-90"
                  style={{ color: "var(--studio-accent)" }}
                >
                  {card.sub}
                </Link>
              ) : (
                <p
                  className="studio-font-ui text-[9px] mt-0.5"
                  style={{ color: "var(--studio-text-muted)" }}
                >
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
            animationDelay: "200ms",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="studio-font-ui text-[8px] tracking-[0.18em]"
              style={{ color: "var(--studio-text-muted)" }}
            >
              POSTER QUOTA
            </span>
            <span
              className={`studio-font-ui text-[9px] px-2 py-0.5 rounded-full ${
                isQuotaHigh ? "text-red-400" : ""
              }`}
              style={{
                color: isQuotaHigh ? undefined : "var(--studio-accent)",
                background: isQuotaHigh ? "rgba(239,68,68,0.15)" : "var(--studio-card-glow-brass)",
              }}
            >
              {quotaPercent.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between studio-font-ui text-[10px] mb-2" style={{ color: "var(--studio-text-secondary)" }}>
            <span />
            <span>
              {displayUsage.postersUsedThisMonth} / {displayUsage.posterLimit}
            </span>
          </div>
          <div
            className="h-1 rounded overflow-hidden"
            style={{ background: "var(--studio-track-bg)" }}
          >
            <div
              className="h-full rounded transition-[width] duration-1000 ease-out"
              style={{
                width: `${quotaAnimated}%`,
                background: isQuotaHigh
                  ? "linear-gradient(90deg, #b91c1c, #ef4444)"
                  : "linear-gradient(90deg, #a66b2a, var(--studio-accent))",
                boxShadow: isQuotaHigh ? "0 0 12px rgba(239,68,68,0.3)" : "0 0 12px var(--studio-accent-glow)",
              }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Active clients */}
        <div
          className="md:col-span-2 rounded-xl border overflow-hidden studio-animate-fade-up"
          style={{
            background: "var(--studio-bg-surface)",
            borderColor: "var(--studio-border)",
            animationDelay: "300ms",
          }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--studio-border-subtle)" }}>
            <h2 className="studio-font-display text-[16px] font-semibold" style={{ color: "var(--studio-text-primary)" }}>
              Active clients
            </h2>
            <div className="flex items-center gap-2">
              <span
                className="studio-font-ui text-[9px] px-2 py-0.5 rounded-full"
                style={{ background: "var(--studio-card-glow-brass)", color: "var(--studio-accent)" }}
              >
                {displayClients.length}
              </span>
              <Link
                href="/studio/clients"
                className="studio-font-ui text-[9px] tracking-wide"
                style={{ color: "var(--studio-text-muted)" }}
              >
                VIEW ALL →
              </Link>
            </div>
          </div>
          {loading ? (
            <div className="divide-y" style={{ borderColor: "var(--studio-border-subtle)" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white/5 animate-pulse" />
                  <div className="flex-1 h-4 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#141008" }}>
              {displayClients.map((client, i) => {
                const color = CLIENT_COLORS[i % CLIENT_COLORS.length];
                const pct = client.monthlyQuota ? Math.min((client.postersThisMonth / client.monthlyQuota) * 100, 100) : 0;
                return (
                  <Link
                    key={client.id}
                    href={`/studio/clients/${client.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 transition-colors duration-150 hover:bg-[var(--studio-row-hover)]"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 studio-font-display text-sm font-semibold"
                      style={{
                        background: `${color}20`,
                        border: `1px solid ${color}50`,
                        color,
                      }}
                    >
                      {client.clientName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium" style={{ color: "var(--studio-text-secondary)" }}>
                        {client.clientName}
                      </p>
                      <p className="studio-font-ui text-[8px] mt-0.5" style={{ color: "var(--studio-text-muted)" }}>
                        {client.industry || "—"}
                      </p>
                      <div className="mt-1.5 h-0.5 rounded-full overflow-hidden max-w-[80px]" style={{ background: "var(--studio-border-subtle)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="studio-font-display text-[14px] font-semibold" style={{ color: "var(--studio-text-primary)" }}>
                        {client.postersThisMonth}
                      </p>
                      <p className="studio-font-ui text-[8px]" style={{ color: "var(--studio-text-muted)" }}>
                        of {client.monthlyQuota}
                      </p>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--studio-text-muted)" }} />
                  </Link>
                );
              })}
            </div>
          )}
          <Link
            href="/studio/clients/new"
            className="flex items-center justify-center gap-2 py-4 border-t border-dashed transition-colors duration-150 hover:border-[var(--studio-accent)] hover:text-[var(--studio-accent)] studio-font-ui text-[11px]"
            style={{ borderColor: "var(--studio-border)" }}
          >
            ADD NEW CLIENT
          </Link>
        </div>

        {/* Upcoming occasions + Quick actions */}
        <div className="space-y-6">
          <div
            className="rounded-xl border overflow-hidden studio-animate-fade-up"
            style={{
              background: "var(--studio-bg-surface)",
              borderColor: "var(--studio-border)",
              animationDelay: "350ms",
            }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--studio-border-subtle)" }}>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full studio-pulse-dot shrink-0"
                  style={{ background: "var(--studio-accent)" }}
                />
                <h2 className="studio-font-display text-[15px] font-semibold" style={{ color: "var(--studio-text-primary)" }}>
                  Upcoming occasions
                </h2>
              </div>
              <Link href="/studio/occasions" className="studio-font-ui text-[9px]" style={{ color: "var(--studio-text-muted)" }}>
                VIEW ALL →
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--studio-border-subtle)" }}>
              {displayOccasions.length === 0 ? (
                <div className="px-5 py-6 text-center studio-font-ui text-[10px]" style={{ color: "var(--studio-text-muted)" }}>
                  No occasions in the next 14 days
                </div>
              ) : (
                displayOccasions.map((occ, i) => {
                  const urgencyRed = occ.daysUntil <= 5;
                  const urgencyAmber = occ.daysUntil <= 14 && !urgencyRed;
                  const badgeColor = urgencyRed ? "#dc2626" : urgencyAmber ? "var(--studio-accent)" : "#7a9e82";
                  const icon = occ.type === "global" ? "◐" : occ.type === "national" ? "⚑" : occ.type === "religious" ? "☽" : "◆";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-[var(--studio-row-hover)]"
                    >
                      <span className="text-sm opacity-80" style={{ color: badgeColor }}>
                        {icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium" style={{ color: "var(--studio-text-secondary)" }}>
                          {occ.title}
                        </p>
                        <p className="studio-font-ui text-[9px]" style={{ color: "var(--studio-text-muted)" }}>
                          {occ.clientName}
                        </p>
                      </div>
                      <span
                        className="studio-font-ui text-[9px] px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: `${badgeColor}20`,
                          color: badgeColor,
                        }}
                      >
                        {occ.daysUntil === 0 ? "Today" : `${occ.daysUntil}d`}
                      </span>
                      <Link
                        href={`/studio/create?clientId=${occ.clientId}&occasion=${encodeURIComponent(occ.title)}`}
                        className="studio-font-ui text-[8px] shrink-0"
                        style={{ color: "var(--studio-accent)" }}
                      >
                        GENERATE →
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2 studio-animate-fade-up" style={{ animationDelay: "400ms" }}>
            {[
              { label: "Generate poster", sub: "Pick client & occasion", href: "/studio/create", icon: Sparkles, accent: "var(--studio-accent)" },
              { label: "Add client", sub: "New brand to manage", href: "/studio/clients/new", icon: UserPlus, accent: "#6b8cae" },
              { label: "Invite team", sub: "Designers & reviewers", href: "/studio/team", icon: Users, accent: "#7a9e82" },
              { label: "View posters", sub: "Approve or request edits", href: "/studio/posters", icon: Images, accent: "#b8866b" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 hover:border-opacity-80"
                  style={{
                    background: "#0a0806",
                    borderColor: "#1a1610",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${action.accent}20`, border: `1px solid ${action.accent}40` }}
                  >
                    <Icon size={14} style={{ color: action.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium" style={{ color: "var(--studio-text-secondary)" }}>
                      {action.label}
                    </p>
                    <p className="studio-font-ui text-[8px]" style={{ color: "var(--studio-text-muted)" }}>
                      {action.sub}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--studio-text-muted)" }} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* This month snapshot */}
      <div
        className="rounded-xl border p-6 studio-animate-fade-up"
        style={{
          background: "linear-gradient(135deg, rgba(26,19,8,0.13) 0%, var(--studio-bg-base) 100%)",
          borderColor: "rgba(200,135,58,0.2)",
          animationDelay: "450ms",
        }}
      >
        <h3 className="studio-font-ui text-[8px] tracking-[0.18em] mb-4" style={{ color: "var(--studio-text-muted)" }}>
          THIS MONTH SNAPSHOT
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Posters", value: String(displayUsage.postersUsedThisMonth) },
            { label: "Clients", value: String(displayUsage.activeClients) },
            { label: "AI cost", value: `$${displayUsage.totalEstimatedCostUsd.toFixed(2)}` },
            { label: "Margin", value: "—" },
          ].map((row) => (
            <div key={row.label}>
              <p className="studio-font-display text-[22px] font-semibold" style={{ color: "var(--studio-text-primary)" }}>
                {row.value}
              </p>
              <p className="studio-font-ui text-[8px] mt-0.5" style={{ color: "var(--studio-text-muted)" }}>
                {row.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
