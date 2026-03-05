"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Megaphone,
  Loader2,
  Sparkles,
  Zap,
  Copy,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import type { Recommendation } from "@/types/generation";

const URGENCY_STYLE: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  low: "text-text-muted bg-bg-elevated border-border-default",
};

export default function AdminAdsRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/recommendations/ads", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (res.ok) {
        setRecommendations(data.recommendations ?? []);
        setGeneratedAt(data.generatedAt ?? null);
      }
    } catch {
      toast.error("Failed to load ads recommendations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/recommendations/ads", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Generate failed");
        return;
      }
      setRecommendations(data.recommendations ?? []);
      setGeneratedAt(data.generatedAt ?? null);
      toast.success("Ads recommendations generated and saved");
    } catch {
      toast.error("Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success("Copied");
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Megaphone size={22} className="text-accent" />
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">
          Ads poster recommendations
        </h1>
      </div>
      <p className="font-mono text-[12px] text-text-muted mb-6 max-w-2xl">
        Conversion-focused poster concepts to turn free users into customers. Use these themes in
        campaigns, onboarding, or as suggested topics. Generate new ideas with the button below —
        they are saved and can be used to train or inspire in-app recommendations.
      </p>

      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:bg-accent-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate ads recommendations
            </>
          )}
        </button>
        {generatedAt && (
          <span className="font-mono text-[11px] text-text-muted">
            Last generated: {new Date(generatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-accent animate-spin" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-2xl border border-border-default bg-bg-surface p-12 text-center">
          <RefreshCw size={32} className="text-text-muted mx-auto mb-4" />
          <p className="font-medium text-text-primary mb-2">No ads recommendations yet</p>
          <p className="font-mono text-[12px] text-text-muted mb-6">
            Click &quot;Generate ads recommendations&quot; to create conversion-focused poster concepts.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:bg-accent-dim disabled:opacity-60"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate ads recommendations
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recommendations.map((rec, i) => (
            <div
              key={rec.id ?? i}
              className="rounded-2xl border border-border-default bg-bg-surface p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[14px] text-text-primary truncate">
                    {rec.theme}
                  </h3>
                  <p className="font-mono text-[11px] text-text-muted mt-0.5 line-clamp-2">
                    {rec.topic}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-full border ${URGENCY_STYLE[rec.urgency ?? "medium"]}`}
                >
                  {rec.urgency ?? "medium"}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    Headline
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(rec.suggestedHeadline, `headline-${i}`)
                    }
                    className="text-text-muted hover:text-accent transition-colors"
                  >
                    {copiedId === `headline-${i}` ? (
                      <CheckCircle size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
                <p className="text-[13px] text-text-primary font-medium">
                  {rec.suggestedHeadline}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  CTA
                </span>
                <p className="text-[12px] text-text-secondary">{rec.suggestedCta}</p>
              </div>

              {rec.visualMood && (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    Visual mood
                  </span>
                  <p className="text-[11px] text-text-muted line-clamp-2">
                    {rec.visualMood}
                  </p>
                </div>
              )}

              {rec.reason && (
                <p className="font-mono text-[10px] text-text-muted/80 italic border-t border-border-subtle pt-2 mt-1">
                  {rec.reason}
                </p>
              )}

              {rec.hashtags && rec.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rec.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] text-text-muted bg-bg-elevated px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
