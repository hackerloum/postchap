"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrandKitsAction, type BrandKitItem } from "./brand-kits/actions";

type Props = { initialKits: BrandKitItem[] };

export function DashboardContent({ initialKits }: Props) {
  const [kits, setKits] = useState<BrandKitItem[]>(initialKits);
  const [loading, setLoading] = useState(true);

  const fetchKits = () => {
    setLoading(true);
    getBrandKitsAction()
      .then(setKits)
      .catch(() => setKits([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBrandKitsAction()
      .then((data) => {
        if (!cancelled) setKits(data);
      })
      .catch(() => {
        if (!cancelled) setKits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasBrandKits = kits.length > 0;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Generate Poster", icon: "✦", href: "/dashboard/create", accent: true },
          { label: "My Posters", icon: "🖼️", href: "/dashboard/posters", accent: false },
          { label: "Brand Kits", icon: "🎨", href: "/dashboard/brand-kits", accent: false },
          { label: "Schedule", icon: "⏰", href: "/dashboard/schedule", accent: false },
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
            <span className="text-xl">{action.icon}</span>
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
          <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border-default flex items-center justify-center mb-4">
            <span className="text-2xl">🎨</span>
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
