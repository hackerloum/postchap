"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Instagram,
  Download,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Star,
} from "lucide-react";
import { PLATFORM_FORMATS } from "@/lib/generation/platformFormats";
import type { Recommendation } from "@/types/generation";

const URGENCY_COLOR: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/30",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  low: "text-text-muted bg-bg-elevated border-border-default",
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  promotion: <Zap size={12} />,
  feature: <Star size={12} />,
  social_proof: <CheckCircle size={12} />,
  engagement: <TrendingUp size={12} />,
  brand: <Sparkles size={12} />,
  comparison: <ArrowRight size={12} />,
};

const GENERATION_STEPS = [
  "Crafting enterprise copy...",
  "Building visual concept...",
  "Generating background image...",
  "Compositing final poster...",
  "Uploading...",
];

export default function AdminCreatePage() {
  const [platformFormatId, setPlatformFormatId] = useState("instagram_square");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationStepIdx, setGenerationStepIdx] = useState(0);
  const [result, setResult] = useState<{ posterId: string; imageUrl: string; copy?: Record<string, unknown> } | null>(null);
  const [postingToInstagram, setPostingToInstagram] = useState(false);
  const [caption, setCaption] = useState("");

  async function handleGetRecommendations() {
    setLoadingRecs(true);
    setSelected(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed");
      setRecommendations(data.recommendations ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get recommendations");
    } finally {
      setLoadingRecs(false);
    }
  }

  async function handleGenerate(rec: Recommendation) {
    setGenerating(true);
    setResult(null);
    setGenerationStepIdx(0);

    // Cycle through steps for visual feedback
    const stepInterval = setInterval(() => {
      setGenerationStepIdx((i) => Math.min(i + 1, GENERATION_STEPS.length - 1));
    }, 8000);

    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ recommendation: rec, platformFormatId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Generation failed");
      setResult({ posterId: data.posterId, imageUrl: data.imageUrl, copy: data.copy });
      // Pre-fill caption with hashtags
      if (data.copy?.hashtags?.length) {
        setCaption((data.copy.hashtags as string[]).join(" "));
      } else if (rec.hashtags?.length) {
        setCaption(rec.hashtags.join(" "));
      }
      toast.success("Enterprise poster generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      clearInterval(stepInterval);
      setGenerating(false);
    }
  }

  async function handlePostToInstagram() {
    if (!result) return;
    setPostingToInstagram(true);
    try {
      const res = await fetch("/api/social/instagram/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ imageUrl: result.imageUrl, caption }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? "Failed to post");
      toast.success(`Posted to @${d.username ?? "Instagram"}!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setPostingToInstagram(false);
    }
  }

  const currentStep = GENERATION_STEPS[generationStepIdx] ?? GENERATION_STEPS[0];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">
          Create Poster
        </h1>
        <p className="font-mono text-[12px] text-text-muted mt-1">
          AI-powered enterprise marketing for ArtMaster
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8">
        {/* Left: recommendations + controls */}
        <div className="space-y-6">

          {/* Step 1: Format */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">
              Step 1 — Format
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLATFORM_FORMATS.slice(0, 4).map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setPlatformFormatId(fmt.id)}
                  className={`px-3 py-2.5 rounded-lg border text-[12px] font-medium text-left transition-colors ${
                    platformFormatId === fmt.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-default text-text-secondary hover:border-border-strong"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: AI Recommendations */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Step 2 — AI Recommendations
              </p>
              <button
                type="button"
                onClick={handleGetRecommendations}
                disabled={loadingRecs}
                className="flex items-center gap-1.5 bg-accent text-black font-semibold text-[12px] px-3 py-1.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
              >
                {loadingRecs ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                {recommendations.length > 0 ? "Refresh" : "Get AI Recommendations"}
              </button>
            </div>

            {loadingRecs && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 size={20} className="text-accent animate-spin" />
                <p className="font-mono text-[12px] text-text-muted">
                  Analyzing ArtMaster brand and generating marketing angles...
                </p>
              </div>
            )}

            {!loadingRecs && recommendations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-text-muted">
                <Sparkles size={28} />
                <p className="font-mono text-[12px]">
                  Click &ldquo;Get AI Recommendations&rdquo; to generate 6 tailored marketing angles
                </p>
              </div>
            )}

            {!loadingRecs && recommendations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.map((rec, i) => {
                  const isSelected = selected?.id === rec.id || selected?.topic === rec.topic;
                  return (
                    <button
                      key={rec.id ?? i}
                      type="button"
                      onClick={() => setSelected(rec)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                          : "border-border-default hover:border-border-strong bg-bg-elevated"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-text-muted">
                            {CATEGORY_ICON[rec.category ?? "brand"] ?? <Sparkles size={12} />}
                          </span>
                          <span className="font-semibold text-[12px] text-text-primary">
                            {rec.theme}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold border capitalize ${
                            URGENCY_COLOR[rec.urgency ?? "low"]
                          }`}
                        >
                          {rec.urgency}
                        </span>
                      </div>

                      {/* Headline */}
                      <p className="font-semibold text-[13px] text-text-primary leading-snug mb-1">
                        &ldquo;{rec.suggestedHeadline}&rdquo;
                      </p>

                      {/* Description */}
                      <p className="font-mono text-[11px] text-text-muted leading-relaxed mb-2 line-clamp-2">
                        {rec.description}
                      </p>

                      {/* Visual mood */}
                      <p className="font-mono text-[10px] text-text-muted/70 italic line-clamp-1">
                        {rec.visualMood}
                      </p>

                      {/* Reason */}
                      {rec.reason && (
                        <div className="mt-2 pt-2 border-t border-border-subtle">
                          <p className="font-mono text-[10px] text-accent/80">{rec.reason}</p>
                        </div>
                      )}

                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-accent">
                          <CheckCircle size={11} />
                          <span className="font-mono text-[10px] font-semibold">Selected</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Generate */}
          {selected && (
            <div className="bg-bg-surface border border-border-default rounded-xl p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-4">
                Step 3 — Generate
              </p>
              <div className="flex items-start gap-4 mb-4 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[13px] text-text-primary">
                    {selected.theme}
                  </p>
                  <p className="font-mono text-[12px] text-text-muted mt-0.5">
                    {selected.suggestedHeadline} · CTA: {selected.suggestedCta}
                  </p>
                  <p className="font-mono text-[11px] text-text-muted/70 mt-1 italic">
                    {selected.visualMood}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleGenerate(selected)}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-accent text-black font-semibold text-[14px] py-4 rounded-xl hover:bg-accent-dim transition-colors disabled:opacity-50 min-h-[56px]"
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {currentStep}
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Enterprise Poster
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="bg-bg-surface border border-border-default rounded-xl p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">
              Preview
            </p>

            {result ? (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-border-default">
                  <img
                    src={result.imageUrl}
                    alt="Generated poster"
                    className="w-full object-cover"
                  />
                </div>

                {/* Copy preview */}
                {result.copy && (
                  <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3 space-y-1">
                    {(result.copy.headline as string) && (
                      <p className="font-semibold text-[12px] text-text-primary">
                        {result.copy.headline as string}
                      </p>
                    )}
                    {(result.copy.subheadline as string) && (
                      <p className="font-mono text-[11px] text-text-secondary">
                        {result.copy.subheadline as string}
                      </p>
                    )}
                    {(result.copy.cta as string) && (
                      <p className="font-mono text-[11px] text-accent">
                        CTA: {result.copy.cta as string}
                      </p>
                    )}
                  </div>
                )}

                {/* Caption editor */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
                    Instagram caption
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    placeholder="Add a caption with hashtags..."
                    className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[12px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePostToInstagram}
                    disabled={postingToInstagram}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#f09433] to-[#bc1888] text-white font-semibold text-[13px] py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {postingToInstagram ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Instagram size={13} />
                    )}
                    Post to Instagram
                  </button>
                  <a
                    href={result.imageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-bg-elevated border border-border-default text-text-primary font-semibold text-[13px] px-3 py-3 rounded-xl hover:border-border-strong transition-all"
                  >
                    <Download size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => selected && handleGenerate(selected)}
                    disabled={generating}
                    title="Regenerate"
                    className="flex items-center justify-center gap-1.5 bg-bg-elevated border border-border-default text-text-muted font-semibold text-[13px] px-3 py-3 rounded-xl hover:border-border-strong transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center gap-3 text-text-muted">
                {generating ? (
                  <>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Sparkles size={20} className="text-accent" />
                      </div>
                      <div className="absolute -inset-1 rounded-xl border-2 border-accent/30 animate-ping" />
                    </div>
                    <p className="font-mono text-[12px] text-accent">{currentStep}</p>
                    <p className="font-mono text-[10px] text-text-muted">
                      This takes 30–60 seconds for enterprise quality
                    </p>
                  </>
                ) : (
                  <>
                    <Sparkles size={28} />
                    <p className="font-mono text-[12px]">
                      {recommendations.length === 0
                        ? "Get recommendations, then generate"
                        : selected
                        ? "Click Generate to create your poster"
                        : "Pick a recommendation to continue"}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
