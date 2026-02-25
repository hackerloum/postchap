"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAuthClient } from "@/lib/firebase/client";
import { getClientIdToken, refreshSessionCookie } from "@/lib/auth-client";
import { getBrandKitsAction, type BrandKitItem } from "./brand-kits/actions";
import { BrandIntelligenceSection } from "./BrandIntelligenceSection";
import { RecentPosters } from "@/components/dashboard/RecentPosters";
import { BrandKitCard } from "@/components/dashboard/BrandKitCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Sparkles, Zap, Palette } from "lucide-react";

type Usage = {
  postersThisMonth: number;
  postersLimit: number | null;
  totalPosters: number;
  hasSchedule: boolean;
  lastGeneratedAt?: number | null;
  nextScheduledAt?: number | null;
};

type Me = { uid: string; displayName: string; plan: string; usage: Usage } | null;

type Props = { initialKits: BrandKitItem[] };

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatLastGenerated(ts: number | null | undefined): string {
  if (ts == null) return "Never";
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function formatNextScheduled(ts: number | null | undefined): string {
  if (ts == null) return "Not configured";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function DashboardContent({ initialKits }: Props) {
  const pathname = usePathname();
  const [kits, setKits] = useState<BrandKitItem[]>(initialKits);
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialKits.length > 0) {
      setKits(initialKits);
      setLoading(false);
    }
  }, [initialKits]);

  const fetchKits = useCallback(async () => {
    setLoading(true);
    try {
      await refreshSessionCookie();
      const token = await getClientIdToken();
      const data = await getBrandKitsAction(token ?? undefined);
      setKits(data);
    } catch {
      setKits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    if (initialKits.length > 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const run = async (isRetry = false) => {
      if (isRetry) setLoading(true);
      try {
        await refreshSessionCookie();
        const token = await getClientIdToken();
        const data = await getBrandKitsAction(token ?? undefined);
        if (cancelled) return;
        setKits(data);
        if (data.length === 0 && !isRetry) {
          retryTimeoutRef.current = setTimeout(() => run(true), 800);
        }
      } catch {
        if (!cancelled) setKits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const auth = getAuthClient();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (cancelled) return;
      if (user) run();
      else {
        setKits([]);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [pathname, initialKits.length]);

  const hasBrandKits = kits.length > 0;
  const primaryKit = kits[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshSessionCookie();
        const token = await getClientIdToken();
        const res = await fetch("/api/me", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!cancelled && res.ok) {
          const data = await res.json();
          const usage = data.usage ?? {};
          setMe({
            uid: data.uid ?? "",
            displayName: data.displayName ?? data.email?.split("@")[0] ?? "there",
            plan: data.plan ?? "free",
            usage: {
              postersThisMonth: usage.postersThisMonth ?? 0,
              postersLimit: usage.postersLimit ?? null,
              totalPosters: usage.totalPosters ?? 0,
              hasSchedule: usage.hasSchedule ?? false,
              lastGeneratedAt: usage.lastGeneratedAt ?? null,
              nextScheduledAt: usage.nextScheduledAt ?? null,
            },
          });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const usage = me?.usage;
  const postersUsed = usage?.postersThisMonth ?? 0;
  const postersLimitRaw = usage?.postersLimit ?? 5;
  const postersLimit = postersLimitRaw === null ? null : postersLimitRaw;
  const scheduleEnabled = usage?.hasSchedule ?? false;
  const nextScheduledTime = formatNextScheduled(usage?.nextScheduledAt);
  const lastGenerated = formatLastGenerated(usage?.lastGeneratedAt);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  const firstName = me?.displayName?.trim().split(/\s+/)[0] || "there";

  if (loading && !hasBrandKits) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasBrandKits) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border-default flex items-center justify-center mb-4 text-text-muted">
          <Palette size={32} />
        </div>
        <h2 className="font-semibold text-lg text-text-primary">No brand kits yet</h2>
        <p className="mt-2 font-mono text-xs text-text-muted max-w-xs">
          Something went wrong during setup. Let&apos;s create your brand kit to get started.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={fetchKits}
            className="inline-flex items-center gap-2 bg-bg-elevated border border-border-default text-text-primary font-medium text-sm px-5 py-2.5 rounded-lg hover:border-border-strong transition-colors min-h-[44px]"
          >
            Retry
          </button>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors min-h-[48px]"
          >
            Set up brand kit →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="font-mono text-[12px] text-text-muted mt-1">
            {today} · {timezone}
          </p>
        </div>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[13px] px-4 py-2.5 rounded-lg hover:bg-accent-dim transition-colors min-h-[40px]"
        >
          <Sparkles size={14} />
          Generate poster
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Posters this month",
            value: `${postersUsed}`,
            sub: postersLimit == null ? "unlimited" : `of ${postersLimit} used`,
            accent: postersLimit != null && postersUsed >= postersLimit,
          },
          {
            label: "Brand kits",
            value: `${kits.length}`,
            sub: "active",
          },
          {
            label: "Last generated",
            value: lastGenerated,
            sub: "most recent",
            small: true,
          },
          {
            label: "Schedule",
            value: scheduleEnabled ? "Active" : "Off",
            sub: scheduleEnabled ? nextScheduledTime : "Not configured",
            green: scheduleEnabled,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-bg-surface border border-border-default rounded-xl p-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
              {stat.label}
            </p>
            <p
              className={`font-semibold leading-tight mb-0.5 ${
                (stat as { small?: boolean }).small ? "text-[16px]" : "text-[24px]"
              } ${stat.accent ? "text-error" : ""} ${stat.green ? "text-success" : "text-text-primary"}`}
            >
              {stat.value}
            </p>
            <p className="font-mono text-[11px] text-text-muted">{stat.sub}</p>
          </div>
        ))}
      </div>

      {postersLimit != null && postersUsed >= postersLimit && (
        <div className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-accent" />
            <div>
              <p className="font-semibold text-[13px] text-text-primary">Monthly limit reached</p>
              <p className="font-mono text-[11px] text-text-muted">
                Upgrade to generate unlimited posters
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/upgrade"
            className="bg-accent text-black font-semibold text-[12px] px-4 py-2 rounded-lg hover:bg-accent-dim transition-colors whitespace-nowrap"
          >
            Upgrade →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentPosters uid={me?.uid ?? ""} />
        </div>
        <div className="space-y-4">
          <BrandKitCard kit={primaryKit} />
          <QuickActions />
        </div>
      </div>

      <BrandIntelligenceSection kit={primaryKit} />
    </>
  );
}
