"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  Zap,
  ChevronRight,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getClientIdToken } from "@/lib/auth-client";

interface Recommendation {
  id: string;
  theme: string;
  topic: string;
  description: string;
  suggestedHeadline: string;
  suggestedCta: string;
  visualMood: string;
  urgency: "high" | "medium" | "low";
  reason: string;
  hashtags: string[];
  category: string;
}

interface BrandKit {
  id: string;
  brandName: string;
  industry: string;
  tone?: string;
  brandLocation?: { country?: string; city?: string; continent?: string };
}

export default function CreatePage() {
  const router = useRouter();

  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [selectedKit, setSelectedKit] = useState<BrandKit | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loadingKits, setLoadingKits] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");

  useEffect(() => {
    loadBrandKits();
  }, []);

  useEffect(() => {
    if (selectedKit) {
      loadRecommendations(selectedKit.id);
    }
  }, [selectedKit?.id]);

  async function getToken(): Promise<string> {
    const token = await getClientIdToken();
    if (!token) {
      router.push("/login");
      throw new Error("Not authenticated");
    }
    return token;
  }

  async function loadBrandKits() {
    try {
      const token = await getToken();
      const res = await fetch("/api/brand-kits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const kits = (data.kits || []) as BrandKit[];
      setBrandKits(kits);
      if (kits.length > 0) setSelectedKit(kits[0]);
    } catch {
      toast.error("Failed to load brand kits");
    } finally {
      setLoadingKits(false);
    }
  }

  async function loadRecommendations(brandKitId: string) {
    setLoadingRecs(true);
    setRecommendations([]);
    setSelectedRec(null);

    try {
      const token = await getToken();
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandKitId }),
      });

      if (!res.ok) throw new Error("Failed to fetch recommendations");

      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch {
      toast.error("Failed to load recommendations");
    } finally {
      setLoadingRecs(false);
    }
  }

  async function handleGenerate() {
    if (!selectedKit) {
      toast.error("Please select a brand kit");
      return;
    }
    if (!useCustom && !selectedRec) {
      toast.error("Please select a content theme or write your own");
      return;
    }
    if (useCustom && !customTopic.trim()) {
      toast.error("Please describe what you want to create");
      return;
    }

    setGenerating(true);

    try {
      const token = await getToken();

      const payload = {
        brandKitId: selectedKit.id,
        posterSize: "1080x1080",
        recommendation: useCustom
          ? {
              theme: "Custom",
              topic: customTopic,
              description: customTopic,
              suggestedHeadline: "",
              suggestedCta: "",
              visualMood: "",
              hashtags: [],
            }
          : selectedRec,
      };

      setGenerationStep("Analyzing your brand...");
      await new Promise((r) => setTimeout(r, 800));

      setGenerationStep("Writing copy with AI...");
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep("Generating background image...");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setGenerationStep("Compositing final poster...");

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Generation failed");
      }

      const data = (await res.json()) as { posterId?: string };
      toast.success("Poster generated successfully!");
      router.push(`/dashboard/posters?new=${data.posterId ?? ""}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Generation failed"
      );
    } finally {
      setGenerating(false);
      setGenerationStep("");
    }
  }

  const urgencyColor: Record<string, string> = {
    high: "text-error bg-error/10 border-error/20",
    medium: "text-warning bg-warning/10 border-warning/20",
    low: "text-success bg-success/10 border-success/20",
  };

  const categoryLabel: Record<string, string> = {
    promotion: "Promotion",
    occasion: "Occasion",
    engagement: "Engagement",
    brand: "Brand",
    product: "Product",
    seasonal: "Seasonal",
  };

  if (loadingKits) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 size={20} className="text-accent animate-spin" />
      </div>
    );
  }

  if (brandKits.length === 0) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 text-center">
        <h2 className="font-semibold text-lg text-text-primary mb-2">
          No brand kits found
        </h2>
        <p className="font-mono text-xs text-text-muted mb-6">
          Create a brand kit first to generate posters
        </p>
        <button
          onClick={() => router.push("/onboarding")}
          className="bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg min-h-[44px]"
        >
          Create brand kit →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="h-14 border-b border-border-subtle flex items-center px-4 sm:px-6 sticky top-0 bg-bg-base/95 backdrop-blur z-10">
        <button
          onClick={() => router.push("/dashboard")}
          className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors mr-4"
        >
          ← Dashboard
        </button>
        <h1 className="font-semibold text-sm text-text-primary">
          Generate Poster
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        {brandKits.length > 1 && (
          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-3">
              Brand Kit
            </p>
            <div className="flex gap-2 flex-wrap">
              {brandKits.map((kit) => (
                <button
                  key={kit.id}
                  onClick={() => setSelectedKit(kit)}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium
                    transition-all duration-150
                    ${selectedKit?.id === kit.id
                      ? "border-accent bg-accent/10 text-text-primary"
                      : "border-border-default bg-bg-surface text-text-secondary hover:border-border-strong"}
                  `}
                >
                  {kit.brandName}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-accent" />
                <p className="font-semibold text-base text-text-primary">
                  AI Content Recommendations
                </p>
              </div>
              <p className="font-mono text-[11px] text-text-muted">
                Tailored for {selectedKit?.brandName} ·{" "}
                {selectedKit?.brandLocation?.country ?? "Today"} · Today
              </p>
            </div>

            <button
              onClick={() =>
                selectedKit && loadRecommendations(selectedKit.id)
              }
              disabled={loadingRecs}
              className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={loadingRecs ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {loadingRecs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-bg-surface border border-border-default rounded-2xl p-4 space-y-3 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-bg-elevated rounded" />
                    <div className="h-4 w-12 bg-bg-elevated rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-bg-elevated rounded" />
                  <div className="h-3 w-full bg-bg-elevated rounded" />
                  <div className="h-3 w-5/6 bg-bg-elevated rounded" />
                  <div className="h-3 w-2/3 bg-bg-elevated rounded" />
                </div>
              ))}
            </div>
          )}

          {!loadingRecs && recommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendations.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => {
                    setSelectedRec(rec);
                    setUseCustom(false);
                  }}
                  className={`
                    text-left rounded-2xl border p-4
                    transition-all duration-200 space-y-3
                    ${selectedRec?.id === rec.id && !useCustom
                      ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                      : "border-border-default bg-bg-surface hover:border-border-strong hover:bg-bg-elevated"}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                        {categoryLabel[rec.category] ?? rec.category}
                      </span>
                      <span
                        className={`
                        font-mono text-[9px] px-1.5 py-0.5 rounded-full
                        border uppercase tracking-wider
                        ${urgencyColor[rec.urgency] ?? ""}
                      `}
                      >
                        {rec.urgency}
                      </span>
                    </div>

                    {selectedRec?.id === rec.id && !useCustom && (
                      <CheckCircle
                        size={14}
                        className="text-accent shrink-0 mt-0.5"
                      />
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-[14px] text-text-primary leading-tight">
                      {rec.theme}
                    </p>
                    <p className="font-mono text-[11px] text-text-muted mt-0.5 leading-relaxed">
                      {rec.topic}
                    </p>
                  </div>

                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {rec.description}
                  </p>

                  <div className="bg-bg-base rounded-lg px-3 py-2 border border-border-subtle">
                    <p className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-1">
                      Suggested headline
                    </p>
                    <p className="font-semibold text-[12px] text-text-primary">
                      &quot;{rec.suggestedHeadline}&quot;
                    </p>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <Clock size={10} className="text-accent mt-0.5 shrink-0" />
                    <p className="font-mono text-[10px] text-text-muted leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(rec.hashtags ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[9px] text-accent/70 bg-accent/5 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="font-mono text-[11px] text-text-muted">
            or write your own
          </span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        <div
          onClick={() => setUseCustom(true)}
          className={`
            rounded-2xl border p-4 mb-8 cursor-text
            transition-all duration-200
            ${useCustom
              ? "border-accent bg-accent/5 ring-1 ring-accent/30"
              : "border-border-default bg-bg-surface hover:border-border-strong"}
          `}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-accent" />
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Custom topic
            </p>
          </div>
          <textarea
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value);
              setUseCustom(true);
              if (e.target.value) setSelectedRec(null);
            }}
            placeholder={`Describe what you want to create for ${selectedKit?.brandName ?? "your brand"}...

e.g. "A weekend promotion offering 20% off all products"
e.g. "Announce our new branch opening in Westlands"
e.g. "Motivational Monday post for our followers"`}
            rows={4}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none resize-none leading-relaxed"
          />
        </div>

        {(selectedRec || (useCustom && customTopic)) && (
          <div className="bg-bg-surface border border-border-default rounded-2xl p-4 mb-6 animate-fade-up">
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent mb-3">
              Ready to generate
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ChevronRight size={12} className="text-text-muted" />
                <span className="font-mono text-xs text-text-secondary">
                  Brand: {selectedKit?.brandName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight size={12} className="text-text-muted" />
                <span className="font-mono text-xs text-text-secondary">
                  Theme: {useCustom ? "Custom" : selectedRec?.theme}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight size={12} className="text-text-muted" />
                <span className="font-mono text-xs text-text-secondary">
                  Topic:{" "}
                  {useCustom
                    ? customTopic.slice(0, 60) +
                      (customTopic.length > 60 ? "..." : "")
                    : selectedRec?.topic}
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={
            generating ||
            (!selectedRec && !(useCustom && customTopic.trim()))
          }
          className="w-full bg-accent text-black font-semibold text-[15px] py-4 rounded-xl hover:bg-accent-dim transition-all duration-200 active:scale-[0.99] min-h-[56px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="font-mono text-sm">
                {generationStep || "Generating..."}
              </span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate poster
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="mt-3 text-center font-mono text-[11px] text-text-muted">
          Takes 30–60 seconds · Powered by our AI
        </p>
      </main>
    </div>
  );
}
