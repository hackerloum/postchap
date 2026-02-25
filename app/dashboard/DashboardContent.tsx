"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuthClient } from "@/lib/firebase/client";
import { getClientIdToken, refreshSessionCookie } from "@/lib/auth-client";
import { getBrandKitsAction, type BrandKitItem } from "./brand-kits/actions";
import { BrandAnalysisCard } from "./BrandAnalysisCard";
import { Sparkles, Image, Palette, CalendarClock, Check, Circle, Megaphone } from "lucide-react";

type Usage = {
  postersThisMonth: number;
  postersLimit: number | null;
  totalPosters: number;
  hasSchedule: boolean;
};

type Me = { plan: string; usage: Usage } | null;

type Props = { initialKits: BrandKitItem[] };

export function DashboardContent({ initialKits }: Props) {
  const pathname = usePathname();
  const router = useRouter();
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

  useEffect(() => {
    if (!hasBrandKits) return;
    let cancelled = false;
    (async () => {
      try {
        await refreshSessionCookie();
        const token = await getClientIdToken();
        const res = await fetch("/api/me", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.usage) setMe({ plan: data.plan ?? "free", usage: data.usage });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasBrandKits]);
  const usage = me?.usage;
  const plan = me?.plan ?? "free";
  const checklistCompleteProfile = hasBrandKits;
  const checklistFirstPoster = (usage?.totalPosters ?? 0) > 0;
  const checklistSchedule = usage?.hasSchedule ?? false;
  const checklistAllDone = checklistCompleteProfile && checklistFirstPoster && checklistSchedule;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Generate Poster", icon: <Sparkles size={18} />, href: "/dashboard/create", accent: true },
          { label: "My Posters", icon: <Image size={18} />, href: "/dashboard/posters", accent: false },
          { label: "Brand Kits", icon: <Palette size={18} />, href: "/dashboard/brand-kits", accent: false },
          { label: "Schedule", icon: <CalendarClock size={18} />, href: "/dashboard/schedule", accent: false },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            prefetch={false}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center transition-all duration-150 min-h-[88px] ${
              action.accent
                ? "bg-accent border-accent text-black hover:bg-accent-dim"
                : "bg-bg-surface border-border-default text-text-primary hover:border-border-strong"
            }`}
          >
            <span className="flex items-center justify-center">{action.icon}</span>
            <span className="font-medium text-xs leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasBrandKits ? (
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
      ) : (
        <>
          {usage && (
            <div className="bg-bg-surface border border-border-default rounded-2xl p-4 flex flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-text-primary">Posters this month</p>
                <p className="font-mono text-xs text-text-muted mt-0.5">
                  {usage.postersLimit == null
                    ? `${usage.postersThisMonth} created (unlimited)`
                    : `${usage.postersThisMonth} / ${usage.postersLimit} used`}
                </p>
              </div>
              {plan === "free" && usage.postersLimit != null && (
                <Link
                  href="/dashboard?plan=open"
                  className="font-mono text-xs font-medium text-accent hover:underline whitespace-nowrap"
                >
                  Upgrade →
                </Link>
              )}
            </div>
          )}

          {!checklistAllDone && (
            <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
              <h3 className="font-semibold text-sm text-text-primary mb-3 flex items-center gap-2">
                <Megaphone size={16} className="text-accent" />
                Get started
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 font-mono text-xs">
                  {checklistCompleteProfile ? (
                    <Check size={14} className="text-success shrink-0" />
                  ) : (
                    <Circle size={14} className="text-text-muted shrink-0" />
                  )}
                  <span className={checklistCompleteProfile ? "text-text-muted" : "text-text-primary"}>
                    Complete profile (brand kit)
                  </span>
                </li>
                <li className="flex items-center gap-2 font-mono text-xs">
                  {checklistFirstPoster ? (
                    <Check size={14} className="text-success shrink-0" />
                  ) : (
                    <Circle size={14} className="text-text-muted shrink-0" />
                  )}
                  <span className={checklistFirstPoster ? "text-text-muted" : "text-text-primary"}>
                    Create first poster
                  </span>
                  {!checklistFirstPoster && (
                    <Link href="/dashboard/create" className="text-accent hover:underline ml-1">
                      Do it →
                    </Link>
                  )}
                </li>
                <li className="flex items-center gap-2 font-mono text-xs">
                  {checklistSchedule ? (
                    <Check size={14} className="text-success shrink-0" />
                  ) : (
                    <Circle size={14} className="text-text-muted shrink-0" />
                  )}
                  <span className={checklistSchedule ? "text-text-muted" : "text-text-primary"}>
                    Set schedule
                  </span>
                  {!checklistSchedule && (
                    <Link href="/dashboard/schedule" className="text-accent hover:underline ml-1">
                      Set up →
                    </Link>
                  )}
                </li>
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base text-text-primary">Your brand kits</h2>
              <Link
                href="/dashboard/brand-kits"
                className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kits.map((kit) => (
                <div
                  key={kit.id}
                  className="bg-bg-surface border border-border-default rounded-2xl p-5 hover:border-border-strong transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[kit.primaryColor, kit.secondaryColor, kit.accentColor].map((c, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/10"
                            style={{ background: c || "#333" }}
                          />
                        ))}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-text-primary">{kit.brandName}</p>
                        <p className="font-mono text-[10px] text-text-muted">
                          {kit.industry} · {kit.brandLocation?.country || ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <BrandAnalysisCard kits={kits} />

          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-base text-text-primary">
                Ready to generate today&apos;s poster?
              </h3>
              <p className="mt-1 font-mono text-xs text-text-muted">
                ArtMaster will create a brand-perfect poster in seconds.
              </p>
            </div>
            <Link
              href="/dashboard/create"
              prefetch={false}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setTimeout(() => router.push("/dashboard/create"), 0);
              }}
              className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-accent-dim transition-colors whitespace-nowrap min-h-[44px]"
            >
              Generate now →
            </Link>
          </div>
        </>
      )}
    </>
  );
}
