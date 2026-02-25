"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import type { BrandKitItem } from "./brand-kits/actions";

type Analysis = {
  score: number;
  strengths?: string[];
  suggestions?: string[];
  contentIdeas?: { title: string; description: string; urgency: string; occasion: string | null }[];
  bestTimeToPost?: string;
  audienceInsight?: string;
};

export function BrandIntelligenceSection({ kit }: { kit: BrandKitItem | null }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStoredAnalysis = useCallback(async (brandKitId: string) => {
    if (!brandKitId) {
      setAnalysis(null);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const token = await getClientIdToken(false);
      if (!token) {
        setAnalysis(null);
        return;
      }
      const res = await fetch(`/api/brand-kits/${brandKitId}/analyze`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setAnalysis(data.analysis ?? null);
    } catch (err) {
      setAnalysis(null);
      setFetchError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (kit?.id) fetchStoredAnalysis(kit.id);
    else setAnalysis(null);
  }, [kit?.id, fetchStoredAnalysis]);

  const handleAnalyze = async () => {
    if (!kit?.id) return;
    setAnalyzing(true);
    setFetchError(null);
    try {
      const token = await getClientIdToken();
      if (!token) throw new Error("Not signed in");
      const res = await fetch(`/api/brand-kits/${kit.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data.analysis ?? null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!kit) return null;

  return (
    <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden mt-4">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="font-semibold text-[13px] text-text-primary">Brand intelligence</span>
          <span className="font-mono text-[10px] text-text-muted bg-bg-elevated border border-border-default rounded-full px-2 py-0.5 ml-1">
            {kit.brandName}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="inline-flex items-center gap-1.5 bg-accent text-black font-semibold text-[12px] px-3 py-1.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50 min-h-[32px]"
        >
          {analyzing ? (
            <>
              <Loader2 size={11} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </button>
      </div>

      {fetchError && (
        <div className="px-5 py-3">
          <p className="font-mono text-[11px] text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
            {fetchError}
          </p>
        </div>
      )}

      {!analysis && !loading && !fetchError && (
        <div className="px-5 py-10 text-center">
          <p className="font-mono text-[12px] text-text-muted">
            Click analyze to get brand insights and content recommendations for today.
          </p>
        </div>
      )}

      {loading && !analysis && (
        <div className="px-5 py-10 flex items-center justify-center gap-2 text-text-muted font-mono text-xs">
          <span className="w-4 h-4 border-2 border-border-default border-t-accent rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {analysis && (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-2">
              Score
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, analysis.score)}%` }}
                />
              </div>
              <span className="font-mono text-xs text-accent">{analysis.score}/100</span>
            </div>
          </div>
          {analysis.contentIdeas && analysis.contentIdeas.length > 0 && (
            <div className="sm:col-span-2">
              <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-2">
                Poster ideas
              </p>
              <div className="space-y-2">
                {analysis.contentIdeas.slice(0, 3).map((idea, i) => (
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
            <div className="sm:col-span-3">
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
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="sm:col-span-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-2">
                Strengths
              </p>
              <ul className="space-y-1">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="font-mono text-[11px] text-text-secondary flex items-start gap-2">
                    <ArrowRight size={12} className="text-success mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.bestTimeToPost && (
            <div className="sm:col-span-3 bg-accent/5 border border-accent/20 rounded-xl p-3">
              <p className="font-mono text-[10px] text-accent uppercase tracking-widest mb-1">
                Best time to post
              </p>
              <p className="font-mono text-xs text-text-primary">{analysis.bestTimeToPost}</p>
            </div>
          )}
          {analysis.audienceInsight && (
            <div className="sm:col-span-3">
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Audience insight
              </p>
              <p className="font-mono text-xs text-text-secondary">{analysis.audienceInsight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
