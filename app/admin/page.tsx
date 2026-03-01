"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Sparkles, DollarSign, TrendingUp, Loader2, ArrowRight } from "lucide-react";

interface Stats {
  totalUsers: number;
  planBreakdown: { free: number; pro: number; business: number };
  postersThisMonth: number;
  postersToday: number;
  totalRevenueUSD: number;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">{label}</p>
        <span className={`${accent ? "text-accent" : "text-text-muted"}`}>{icon}</span>
      </div>
      <p className={`font-semibold text-[28px] leading-none mb-1 ${accent ? "text-accent" : "text-text-primary"}`}>
        {value}
      </p>
      {sub && <p className="font-mono text-[11px] text-text-muted">{sub}</p>}
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => setStats(d))
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="text-accent animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-text-muted font-mono text-[13px]">{error || "No data"}</div>
    );
  }

  const paidUsers = stats.planBreakdown.pro + stats.planBreakdown.business;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">Overview</h1>
        <p className="font-mono text-[12px] text-text-muted mt-1">Platform-wide analytics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total users"
          value={stats.totalUsers.toLocaleString()}
          sub={`${paidUsers} paid`}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Posters today"
          value={stats.postersToday.toLocaleString()}
          sub={`${stats.postersThisMonth.toLocaleString()} this month`}
          icon={<Sparkles size={16} />}
          accent
        />
        <StatCard
          label="Revenue (USD)"
          value={`$${stats.totalRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="card payments only"
          icon={<DollarSign size={16} />}
        />
        <StatCard
          label="Conversion"
          value={stats.totalUsers > 0 ? `${Math.round((paidUsers / stats.totalUsers) * 100)}%` : "0%"}
          sub="free → paid"
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* Plan breakdown */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-[14px] text-text-primary mb-4">Plan breakdown</h2>
        <div className="space-y-3">
          {(
            [
              { id: "free", label: "Free", color: "bg-text-muted" },
              { id: "pro", label: "Pro", color: "bg-accent" },
              { id: "business", label: "Business", color: "bg-green-400" },
            ] as const
          ).map(({ id, label, color }) => {
            const count = stats.planBreakdown[id];
            const pct = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
            return (
              <div key={id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[12px] text-text-secondary">{label}</span>
                  <span className="font-mono text-[12px] text-text-muted">
                    {count.toLocaleString()} ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Create a poster", href: "/admin/create", desc: "Generate for ArtMaster's Instagram" },
          { label: "Manage users", href: "/admin/users", desc: "View plans, usage, details" },
          { label: "All brand kits", href: "/admin/brand-kits", desc: "Browse kits across all users" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-bg-surface border border-border-default rounded-xl p-4 hover:border-border-strong transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-[13px] text-text-primary">{item.label}</p>
              <ArrowRight size={13} className="text-text-muted group-hover:text-text-primary transition-colors" />
            </div>
            <p className="font-mono text-[11px] text-text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
