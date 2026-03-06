"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Images,
  DollarSign,
  Zap,
  UserPlus,
  Sparkles,
  Calendar,
} from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { Button, Badge, Card, Skeleton, EmptyState } from "@/components/studio/ui";
import { ClientCard, OccasionRow } from "@/components/studio/shared";

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

const EMPTY_USAGE: UsageData = {
  plan: "—",
  postersUsedThisMonth: 0,
  posterLimit: null,
  percentUsed: 0,
  activeClients: 0,
  totalEstimatedCostUsd: 0,
};

export default function StudioOverviewPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [occasions, setOccasions] = useState<OccasionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState("");

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
          setClients((d.clients ?? []).slice(0, 6) as ClientSummary[]);
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
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  const filteredClients = clientSearch.trim()
    ? clients.filter(
        (c) =>
          c.clientName.toLowerCase().includes(clientSearch.toLowerCase()) ||
          (c.industry ?? "").toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#fafafa] tracking-tight">
            Studio
          </h1>
          <p className="text-[14px] text-[#71717a] mt-0.5">
            Manage clients, generate posters, track approvals
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/studio/clients/new">
            <Button variant="secondary" size="md">
              <UserPlus size={14} className="mr-2" />
              Add client
            </Button>
          </Link>
          <Link href="/studio/create">
            <Button variant="primary" size="md">
              <Sparkles size={14} className="mr-2" />
              Generate
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "ACTIVE CLIENTS",
            value: loading ? "—" : String(displayUsage.activeClients),
            sub: "this month",
            icon: Users,
            iconBg: "bg-[#E8FF4710]",
            iconBorder: "border-[#E8FF4725]",
            iconColor: "#E8FF47",
          },
          {
            label: "POSTERS THIS MONTH",
            value: loading ? "—" : String(displayUsage.postersUsedThisMonth),
            sub: displayUsage.posterLimit ? `of ${displayUsage.posterLimit}` : "unlimited",
            icon: Images,
            iconBg: "bg-[#818cf810]",
            iconBorder: "border-[#818cf825]",
            iconColor: "#818cf8",
          },
          {
            label: "AI COST",
            value: loading ? "—" : `$${displayUsage.totalEstimatedCostUsd.toFixed(2)}`,
            sub: "this month",
            icon: DollarSign,
            iconBg: "bg-[#4ade8010]",
            iconBorder: "border-[#4ade8025]",
            iconColor: "#4ade80",
          },
          {
            label: "PLAN",
            value: (displayUsage.plan || "—").toUpperCase(),
            sub: "Upgrade →",
            subHref: "/studio/billing",
            icon: Zap,
            iconBg: "bg-[#E8FF4710]",
            iconBorder: "border-[#E8FF4725]",
            iconColor: "#E8FF47",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a]">
                  {stat.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${stat.iconBg} ${stat.iconBorder}`}
                  style={{ color: stat.iconColor }}
                >
                  <Icon size={16} />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-24 mb-2" />
              ) : (
                <p className="text-[32px] font-bold text-[#fafafa] leading-none tracking-tight">
                  {stat.value}
                </p>
              )}
              {stat.subHref ? (
                <Link
                  href={stat.subHref}
                  className="text-[12px] font-medium text-[#E8FF47] hover:underline mt-1 inline-block"
                >
                  {stat.sub}
                </Link>
              ) : (
                <p className="text-[12px] text-[#71717a] mt-1">{stat.sub}</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quota bar */}
      {displayUsage.posterLimit != null && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a]">
              POSTER QUOTA
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={isQuotaHigh ? "danger" : "accent"}>
                {Math.round(quotaPercent)}%
              </Badge>
              <span className="text-[12px] text-[#71717a] tabular-nums">
                {displayUsage.postersUsedThisMonth} / {displayUsage.posterLimit}
              </span>
            </div>
          </div>
          <div className="h-1 rounded-full bg-[#ffffff08] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-[800ms] ease-out"
              style={{
                width: `${quotaAnimated}%`,
                backgroundColor: isQuotaHigh ? "#ef4444" : "#E8FF47",
                boxShadow: isQuotaHigh ? "0 0 8px rgba(239,68,68,0.4)" : "0 0 8px rgba(232,255,71,0.4)",
              }}
            />
          </div>
        </Card>
      )}

      {/* Two column: 60/40 */}
      <div className="grid lg:grid-cols-[1fr_0.65fr] gap-6">
        {/* Active clients */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#ffffff08]">
            <h2 className="text-[16px] font-semibold text-[#fafafa]">
              Active clients
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="accent">{filteredClients.length}</Badge>
              <Link
                href="/studio/clients"
                className="text-[12px] text-[#71717a] hover:text-[#E8FF47] transition-colors"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-4">
            <input
              type="search"
              placeholder="Search clients..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-[13px] text-[#fafafa] placeholder:text-[#71717a] bg-[#080808] border border-[#ffffff0f] focus:outline-none focus:border-[#E8FF4740] mb-3"
            />
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-[#ffffff06]">
                    <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </>
            ) : filteredClients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No clients yet"
                description="Add your first client to get started"
                actionLabel="Add client"
                onAction={() => window.location.assign("/studio/clients/new")}
              />
            ) : (
              filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  id={client.id}
                  name={client.clientName}
                  industry={client.industry}
                  status={client.status}
                  postersThisMonth={client.postersThisMonth}
                  monthlyQuota={client.monthlyQuota}
                  variant="row"
                />
              ))
            )}
          </div>
          <Link
            href="/studio/clients/new"
            className="flex items-center justify-center gap-2 py-4 mx-4 mb-4 border border-dashed border-[#ffffff12] rounded-lg text-[13px] font-medium text-[#71717a] hover:border-[#E8FF4730] hover:text-[#E8FF47] transition-colors"
          >
            <UserPlus size={14} />
            Add new client
          </Link>
        </Card>

        {/* Right: occasions + quick stats */}
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#ffffff08]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF47] animate-pulse" />
                <h2 className="text-[14px] font-semibold text-[#fafafa]">
                  Upcoming occasions
                </h2>
              </div>
              <Link
                href="/studio/occasions"
                className="text-[12px] text-[#71717a] hover:text-[#E8FF47] transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : occasions.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming occasions"
                  description="Occasions are auto-detected for your clients"
                />
              ) : (
                occasions.map((occ, i) => (
                  <OccasionRow
                    key={i}
                    clientId={occ.clientId}
                    clientName={occ.clientName}
                    title={occ.title}
                    type={occ.type}
                    date={occ.date}
                    daysUntil={occ.daysUntil}
                  />
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-[#E8FF4705] to-transparent border-[#E8FF4718]">
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#71717a] mb-4">
              THIS MONTH
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Posters", value: String(displayUsage.postersUsedThisMonth) },
                { label: "Clients", value: String(displayUsage.activeClients) },
                { label: "AI spend", value: `$${displayUsage.totalEstimatedCostUsd.toFixed(2)}` },
                { label: "Quota", value: displayUsage.posterLimit ? `${displayUsage.posterLimit} max` : "∞" },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-[22px] font-bold text-[#fafafa] tabular-nums">
                    {row.value}
                  </p>
                  <p className="text-[9px] uppercase text-[#71717a]">{row.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
