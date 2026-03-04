"use client";

import { useEffect, useState } from "react";
import { getClientIdToken } from "@/lib/auth-client";
import { BarChart3, Loader2, Download, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  thisMonth: { postersGenerated: number; postersPosted: number; postersScheduled: number };
  lastMonth: { postersGenerated: number };
  successRate: number;
  platformBreakdown: { id: string; count: number; percent: number }[];
  categoryBreakdown: { name: string; count: number; percent: number }[];
  topPosters: { id: string; headline: string; imageUrl: string | null; downloadCount: number }[];
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram_square: "Square",
  instagram_portrait: "Portrait 4:5",
  instagram_story: "Story",
  whatsapp_status: "WhatsApp Status",
  facebook_post: "Facebook",
  twitter_post: "X/Twitter",
  linkedin_post: "LinkedIn",
  youtube_thumbnail: "YouTube",
  pinterest_pin: "Pinterest",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getClientIdToken();
        const res = await fetch("/api/analytics", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        if (!cancelled && res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  const tm = data?.thisMonth ?? { postersGenerated: 0, postersPosted: 0, postersScheduled: 0 };
  const lm = data?.lastMonth ?? { postersGenerated: 0 };
  const change =
    lm.postersGenerated > 0
      ? Math.round(((tm.postersGenerated - lm.postersGenerated) / lm.postersGenerated) * 100)
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">
          Analytics
        </h1>
        <p className="font-mono text-[12px] text-text-muted mt-1">
          Track your poster performance and usage
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-bg-surface border border-border-default rounded-xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
            This month
          </p>
          <p className="font-semibold text-[24px] text-text-primary">
            {tm.postersGenerated}
          </p>
          <p className="font-mono text-[11px] text-text-muted">
            posters generated · {tm.postersPosted} posted · {tm.postersScheduled} scheduled
          </p>
        </div>
        <div className="bg-bg-surface border border-border-default rounded-xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
            Last month
          </p>
          <p className="font-semibold text-[24px] text-text-primary">
            {lm.postersGenerated}
          </p>
          <p className="font-mono text-[11px] text-text-muted">
            {change != null
              ? (change >= 0 ? "+" : "") + change + "% vs this month"
              : "no prior data"}
          </p>
        </div>
        <div className="bg-bg-surface border border-border-default rounded-xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
            Success rate
          </p>
          <p className="font-semibold text-[24px] text-text-primary">
            {data?.successRate ?? 100}%
          </p>
          <p className="font-mono text-[11px] text-text-muted">
            generation success
          </p>
        </div>
        <div className="bg-bg-surface border border-border-default rounded-xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
            Reach
          </p>
          <p className="font-semibold text-[24px] text-text-muted">
            —
          </p>
          <p className="font-mono text-[11px] text-text-muted">
            Connect Instagram for insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-bg-surface border border-border-default rounded-xl p-5">
          <h2 className="font-semibold text-[15px] text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 size={16} />
            Top content categories
          </h2>
          <div className="space-y-3">
            {(data?.categoryBreakdown ?? []).slice(0, 6).map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="font-mono text-[12px] text-text-secondary w-24 truncate">
                  {c.name}
                </span>
                <div className="flex-1 h-6 rounded-full bg-bg-elevated overflow-hidden">
                  <div
                    className="h-full bg-accent/60 rounded-full"
                    style={{ width: `${Math.min(c.percent, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-text-muted w-10 text-right">
                  {c.percent}%
                </span>
              </div>
            ))}
            {(!data?.categoryBreakdown?.length) && (
              <p className="font-mono text-[12px] text-text-muted">No data yet</p>
            )}
          </div>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-xl p-5">
          <h2 className="font-semibold text-[15px] text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 size={16} />
            Most used format
          </h2>
          <div className="space-y-3">
            {(data?.platformBreakdown ?? []).slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="font-mono text-[12px] text-text-secondary w-28 truncate">
                  {PLATFORM_LABELS[p.id] ?? p.id}
                </span>
                <div className="flex-1 h-6 rounded-full bg-bg-elevated overflow-hidden">
                  <div
                    className="h-full bg-accent/40 rounded-full"
                    style={{ width: `${Math.min(p.percent, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-text-muted w-10 text-right">
                  {p.percent}%
                </span>
              </div>
            ))}
            {(!data?.platformBreakdown?.length) && (
              <p className="font-mono text-[12px] text-text-muted">No data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-xl p-5">
        <h2 className="font-semibold text-[15px] text-text-primary mb-4 flex items-center gap-2">
          <Download size={16} />
          Top performers (by downloads)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {(data?.topPosters ?? []).map((p) => (
            <Link
              key={p.id}
              href="/dashboard/posters"
              className="group block rounded-lg border border-border-default overflow-hidden hover:border-accent/40 transition-colors"
            >
              <div className="aspect-square bg-bg-elevated relative">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.headline}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={24} className="text-text-muted" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="font-mono text-[10px] text-text-muted truncate" title={p.headline}>
                  {p.headline || "Poster"}
                </p>
                <p className="font-mono text-[10px] text-accent">{p.downloadCount} downloads</p>
              </div>
            </Link>
          ))}
          {(!data?.topPosters?.length) && (
            <p className="font-mono text-[12px] text-text-muted col-span-full">No downloads yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
