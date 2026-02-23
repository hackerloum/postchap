"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

interface Props {
  brandKitId: string;
}

export function BrandAnalysisCard({ brandKitId }: Props) {
  const [analysis, setAnalysis] = useState<{
    score: number;
    strengths?: string[];
    suggestions?: string[];
    contentIdeas?: { title: string; description: string; urgency: string; occasion: string | null }[];
    bestTimeToPost?: string;
    audienceInsight?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getClientIdToken();
        if (!token) return;
        const res = await fetch(`/api/brand-kits/${brandKitId}/analyze`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        const data = await res.json();
        setAnalysis(data.analysis ?? null);
      } catch (err) {
        if (!cancelled) setAnalysis(null);
        console.error("[BrandAnalysis]", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandKitId]);

  if (loading) {
    return (
      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-xs text-accent">AI analyzing your brand...</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-bg-elevated animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-bg-elevated animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-bg-elevated animate-pulse" />
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-bg-surface border border-border-default rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <span className="font-semibold text-sm text-text-primary">AI Brand Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-accent transition-all"
              style={{ width: `${Math.min(100, analysis.score)}%` }}
            />
          </div>
          <span className="font-mono text-xs text-accent">{analysis.score}/100</span>
        </div>
      </div>

      {analysis.contentIdeas && analysis.contentIdeas.length > 0 && (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-3">
            Poster ideas for today
          </p>
          <div className="space-y-2">
            {analysis.contentIdeas.map((idea, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-bg-elevated border border-border-default rounded-xl p-3"
              >
                <div
                  className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    idea.urgency === "high"
                      ? "bg-error"
                      : idea.urgency === "medium"
                        ? "bg-warning"
                        : "bg-success"
                  }`}
                />
                <div>
                  <p className="font-medium text-xs text-text-primary">{idea.title}</p>
                  <p className="font-mono text-[11px] text-text-muted mt-0.5">{idea.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-2">
            Recommendations
          </p>
          <div className="space-y-1.5">
            {analysis.suggestions.map((s, i) => (
              <p key={i} className="font-mono text-[11px] text-text-secondary flex items-start gap-2">
                <ArrowRight size={12} className="text-accent mt-0.5 shrink-0" />
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {analysis.bestTimeToPost && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-3">
          <p className="font-mono text-[10px] text-accent uppercase tracking-widest mb-1">
            Best time to post
          </p>
          <p className="font-mono text-xs text-text-primary">{analysis.bestTimeToPost}</p>
        </div>
      )}

      {analysis.audienceInsight && (
        <div>
          <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1">
            Audience insight
          </p>
          <p className="font-mono text-xs text-text-secondary">{analysis.audienceInsight}</p>
        </div>
      )}
    </div>
  );
}
