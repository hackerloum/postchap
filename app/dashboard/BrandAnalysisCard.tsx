"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

export type BrandKitItem = {
  id: string;
  brandName?: string;
  industry?: string;
  brandLocation?: { country?: string };
};

type Analysis = {
  score: number;
  strengths?: string[];
  suggestions?: string[];
  contentIdeas?: { title: string; description: string; urgency: string; occasion: string | null }[];
  bestTimeToPost?: string;
  audienceInsight?: string;
};

interface Props {
  kits: BrandKitItem[];
}

export function BrandAnalysisCard({ kits }: Props) {
  const [selectedId, setSelectedId] = useState<string>(kits[0]?.id ?? "");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStoredAnalysis = useCallback(async (brandKitId: string) => {
    if (!brandKitId) {
      setAnalysis(null);
      setAnalyzedAt(null);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const token = await getClientIdToken();
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
      setAnalyzedAt(data.analyzedAt ?? null);
    } catch (err) {
      setAnalysis(null);
      setAnalyzedAt(null);
      setFetchError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedId((prev) => (kits.some((k) => k.id === prev) ? prev : kits[0]?.id ?? ""));
  }, [kits]);

  useEffect(() => {
    if (selectedId) fetchStoredAnalysis(selectedId);
    else {
      setAnalysis(null);
      setAnalyzedAt(null);
    }
  }, [selectedId, fetchStoredAnalysis]);

  const runAnalysis = async () => {
    if (!selectedId) return;
    setAnalyzing(true);
    setFetchError(null);
    try {
      const token = await getClientIdToken();
      if (!token) throw new Error("Not signed in");
      const res = await fetch(`/api/brand-kits/${selectedId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data.analysis ?? null);
      setAnalyzedAt(data.analyzedAt ?? Date.now());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  if (kits.length === 0) return null;

  const selectedKit = kits.find((k) => k.id === selectedId);

  return (
    <div className="bg-bg-surface border border-border-default rounded-2xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <span className="font-semibold text-sm text-text-primary">AI Brand Analysis</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-[11px] text-text-muted uppercase tracking-widest">
            Brand
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-bg-elevated border border-border-default rounded-lg px-3 py-2 font-mono text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 min-w-[140px]"
          >
            {kits.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.brandName || kit.id}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={analyzing || !selectedId}
            className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-xs px-4 py-2 rounded-lg hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
          >
            {analyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analyzing…
              </>
            ) : (
              "Analyze brand"
            )}
          </button>
        </div>
      </div>

      {fetchError && (
        <p className="font-mono text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
          {fetchError}
        </p>
      )}

      {loading && !analysis && (
        <div className="flex items-center gap-2 text-text-muted font-mono text-xs">
          <span className="w-4 h-4 border-2 border-border-default border-t-accent rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {!loading && !analysis && !fetchError && !analyzing && (
        <div className="rounded-xl border border-border-default bg-bg-elevated/50 p-6 text-center">
          <p className="font-mono text-xs text-text-muted">
            No analysis yet for {selectedKit?.brandName || "this brand"}.
          </p>
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            Click &quot;Analyze brand&quot; to get AI insights and recommendations.
          </p>
        </div>
      )}

      {analysis && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="w-24 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(100, analysis.score)}%` }}
              />
            </div>
            <span className="font-mono text-xs text-accent">{analysis.score}/100</span>
            {analyzedAt && (
              <span className="font-mono text-[10px] text-text-muted">
                Analyzed {new Date(analyzedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {analysis.strengths && analysis.strengths.length > 0 && (
            <div>
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

          {analysis.contentIdeas && analysis.contentIdeas.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-3">
                Poster ideas
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
        </>
      )}
    </div>
  );
}
