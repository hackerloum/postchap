"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { getClientIdToken } from "@/lib/auth-client";
import { PLATFORM_FORMATS } from "@/lib/generation/platformFormats";

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
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
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
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateResults, setTemplateResults] = useState<{ id: number | string; title?: string; thumbnail?: string }[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingMoreTemplates, setLoadingMoreTemplates] = useState(false);
  const [templatePage, setTemplatePage] = useState(1);
  const [templateTotal, setTemplateTotal] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string | null>(null);
  const [platformFormatId, setPlatformFormatId] = useState<string>(PLATFORM_FORMATS[0].id);
  const [suggestedSearches, setSuggestedSearches] = useState<string[]>([]);
  const [loadingSuggestedSearches, setLoadingSuggestedSearches] = useState(false);
  const [inspirationImageUrl, setInspirationImageUrl] = useState("");
  const [inspirationPreview, setInspirationPreview] = useState<string | null>(null);
  const [uploadingInspiration, setUploadingInspiration] = useState(false);

  useEffect(() => {
    loadBrandKits();
  }, []);

  useEffect(() => {
    if (selectedKit) {
      loadRecommendations(selectedKit.id);
    }
  }, [selectedKit?.id]);

  useEffect(() => {
    if (selectedKit?.id) {
      loadSuggestedSearches(selectedKit.id);
    } else {
      setSuggestedSearches([]);
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

  const TEMPLATE_PAGE_SIZE = 24;

  async function searchTemplates() {
    const term = templateSearch.trim() || "social media poster";
    setLoadingTemplates(true);
    setTemplateResults([]);
    setTemplatePage(1);
    setTemplateTotal(null);
    try {
      const token = await getToken();
      const res = await fetch(
        `/api/templates?term=${encodeURIComponent(term)}&limit=${TEMPLATE_PAGE_SIZE}&page=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setTemplateResults(data.items ?? []);
      setTemplateTotal(data.total ?? null);
    } catch {
      toast.error("Could not search templates");
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function loadSuggestedSearches(brandKitId: string) {
    setLoadingSuggestedSearches(true);
    setSuggestedSearches([]);
    try {
      const token = await getToken();
      const res = await fetch("/api/templates/suggest-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandKitId }),
      });
      if (!res.ok) throw new Error("Suggestions failed");
      const data = await res.json();
      setSuggestedSearches(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setSuggestedSearches([]);
    } finally {
      setLoadingSuggestedSearches(false);
    }
  }

  function applySuggestedSearch(phrase: string) {
    setTemplateSearch(phrase);
    setTemplateResults([]);
    setTemplatePage(1);
    setTemplateTotal(null);
    const run = async () => {
      setLoadingTemplates(true);
      try {
        const token = await getToken();
        const res = await fetch(
          `/api/templates?term=${encodeURIComponent(phrase)}&limit=24&page=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setTemplateResults(data.items ?? []);
        setTemplateTotal(data.total ?? null);
      } catch {
        toast.error("Could not search templates");
      } finally {
        setLoadingTemplates(false);
      }
    };
    run();
  }

  async function loadMoreTemplates() {
    const term = templateSearch.trim() || "social media poster";
    const nextPage = templatePage + 1;
    setLoadingMoreTemplates(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `/api/templates?term=${encodeURIComponent(term)}&limit=${TEMPLATE_PAGE_SIZE}&page=${nextPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Load more failed");
      const data = await res.json();
      const newItems = data.items ?? [];
      setTemplateResults((prev) => [...prev, ...newItems]);
      setTemplatePage(nextPage);
      setTemplateTotal(data.total ?? null);
      if (newItems.length === 0) toast.info("No more templates for this search.");
    } catch {
      toast.error("Could not load more templates");
    } finally {
      setLoadingMoreTemplates(false);
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
    // Yield so React can paint loading state before generation work runs
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const token = await getToken();

      const payload = {
        brandKitId: selectedKit.id,
        platformFormatId,
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
        ...(selectedTemplateId != null ? { templateId: selectedTemplateId } : {}),
        ...(inspirationImageUrl.trim() ? { inspirationImageUrl: inspirationImageUrl.trim() } : {}),
      };

      setGenerationStep("Analyzing your brand...");
      await new Promise((r) => setTimeout(r, 800));

      setGenerationStep("Writing copy with AI...");
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep(
        inspirationImageUrl.trim()
          ? "Using your image as style reference..."
          : selectedTemplateId != null
            ? "Using your chosen style..."
            : "Generating background image..."
      );

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

  const selectedPlatform = PLATFORM_FORMATS.find((f) => f.id === platformFormatId) ?? PLATFORM_FORMATS[0];
  const platformDisplaySub: Record<string, string> = {};
  PLATFORM_FORMATS.forEach((f) => {
    if (f.width === f.height) platformDisplaySub[f.id] = "1:1";
    else if (f.width > f.height) platformDisplaySub[f.id] = Math.abs(f.width / f.height - 16 / 9) < 0.1 ? "16:9" : "1.91:1";
    else platformDisplaySub[f.id] = f.height === 1920 ? "9:16" : f.height === 1500 ? "2:3" : "4:5";
  });

  return (
    <div className="min-h-screen bg-bg-base">
      {generating && (
        <div className="fixed inset-0 bg-bg-base/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 bg-black rounded-lg" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-semibold text-[16px] text-text-primary">
              {generationStep || "Generating your poster..."}
            </p>
            <p className="font-mono text-[12px] text-text-muted">
              This takes 30–60 seconds
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="font-mono text-[11px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1 mb-1"
            >
              <ArrowLeft size={11} />
              Dashboard
            </button>
            <h1 className="font-semibold text-[20px] text-text-primary tracking-tight">
              Generate poster
            </h1>
            <p className="font-mono text-[11px] text-text-muted mt-0.5">
              Choose a theme and format for your next post
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Platform selector */}
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-muted mb-4">
              Platform format
            </p>
            <div className="flex gap-2 flex-wrap">
              {PLATFORM_FORMATS.map((f) => {
                const isSelected = platformFormatId === f.id;
                const sub = platformDisplaySub[f.id] ?? `${f.width}×${f.height}`;
                const shortLabel = f.label.replace(/\s*\([^)]*\)/g, "").trim();
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPlatformFormatId(f.id)}
                    className={`
                      flex flex-col items-start px-3 py-2.5 rounded-xl border text-left
                      transition-all duration-150 min-w-[90px]
                      ${isSelected
                        ? "border-accent bg-accent/8 ring-1 ring-accent/20"
                        : "border-border-default bg-bg-elevated hover:border-border-strong"}
                    `}
                  >
                    <span className={`font-semibold text-[12px] leading-tight ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>
                      {shortLabel}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted mt-0.5">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. AI Recommendations */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-accent" />
                  <span className="font-semibold text-[14px] text-text-primary">
                    Content recommendations
                  </span>
                </div>
                <p className="font-mono text-[10px] text-text-muted mt-0.5">
                  Tailored for {selectedKit?.brandName} · {selectedKit?.brandLocation?.country ?? "—"} · Today
                </p>
              </div>
              <button
                type="button"
                onClick={() => selectedKit && loadRecommendations(selectedKit.id)}
                disabled={loadingRecs}
                className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-text-primary bg-bg-elevated border border-border-default rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={11} className={loadingRecs ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {loadingRecs && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[120px] bg-bg-elevated rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!loadingRecs && recommendations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                {recommendations.map((rec) => {
                  const isSelected = selectedRec?.id === rec.id && !useCustom;
                  const urgencyStyle: Record<string, string> = {
                    high: "text-error bg-error/10 border-error/20",
                    medium: "text-warning bg-warning/10 border-warning/20",
                    low: "text-success bg-success/10 border-success/20",
                  };
                  const s = urgencyStyle[rec.urgency] ?? "";
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        setSelectedRec(rec);
                        setUseCustom(false);
                      }}
                      className={`
                        text-left rounded-xl border p-4 transition-all duration-150 space-y-2.5
                        ${isSelected
                          ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                          : "border-border-default bg-bg-elevated hover:border-border-strong hover:bg-bg-elevated/80"}
                      `}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">
                            {categoryLabel[rec.category] ?? rec.category}
                          </span>
                          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${s}`}>
                            {rec.urgency}
                          </span>
                        </div>
                        {isSelected && <CheckCircle size={13} className="text-accent shrink-0" />}
                      </div>
                      <p className="font-semibold text-[14px] text-text-primary leading-tight">
                        {rec.theme}
                      </p>
                      <p className="font-mono text-[11px] text-text-muted truncate leading-tight">
                        {rec.topic}
                      </p>
                      <div className={`rounded-lg px-2.5 py-1.5 border ${isSelected ? "bg-accent/10 border-accent/20" : "bg-bg-base border-border-subtle"}`}>
                        <p className={`font-semibold text-[12px] leading-tight ${isSelected ? "text-accent" : "text-text-secondary"}`}>
                          &quot;{rec.suggestedHeadline}&quot;
                        </p>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {(rec.hashtags ?? []).slice(0, 3).map((tag) => (
                          <span key={tag} className="font-mono text-[9px] text-text-muted/60 bg-bg-base px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Custom topic */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border-subtle">
              <Zap size={13} className="text-text-muted" />
              <span className="font-semibold text-[14px] text-text-primary">
                Write your own brief
              </span>
            </div>
            <div className="p-4">
              <textarea
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setUseCustom(true);
                  if (e.target.value) setSelectedRec(null);
                }}
                onFocus={() => setUseCustom(true)}
                placeholder={`Describe what you want to create for ${selectedKit?.brandName ?? "your brand"}...`}
                rows={3}
                className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-border-strong transition-colors resize-none overflow-hidden leading-relaxed"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <p className="font-mono text-[10px] text-text-muted w-full mb-1">Examples:</p>
                {[
                  `Weekend promo for ${selectedKit?.brandName ?? "your brand"}`,
                  "New product announcement",
                  "Customer appreciation post",
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setCustomTopic(example);
                      setUseCustom(true);
                      setSelectedRec(null);
                    }}
                    className="font-mono text-[10px] text-text-muted bg-bg-elevated border border-border-default rounded-full px-3 py-1 hover:border-border-strong hover:text-text-secondary transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Brand context card */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
                Generating for
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[14px] text-text-primary">
                  {selectedKit?.brandName}
                </p>
                <div className="flex gap-1">
                  {[selectedKit?.primaryColor, selectedKit?.secondaryColor, selectedKit?.accentColor]
                    .filter(Boolean)
                    .map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />
                    ))}
                </div>
              </div>
              {[
                { label: "Industry", value: selectedKit?.industry },
                { label: "Country", value: selectedKit?.brandLocation?.country },
                { label: "Tone", value: selectedKit?.tone },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-text-muted">{row.label}</span>
                  <span className="font-mono text-[10px] text-text-secondary capitalize">{row.value ?? "—"}</span>
                </div>
              ))}
              {brandKits.length > 1 && (
                <div className="pt-2 border-t border-border-subtle">
                  <p className="font-mono text-[10px] text-text-muted mb-2">Switch brand kit:</p>
                  <div className="space-y-1">
                    {brandKits.map((kit) => (
                      <button
                        key={kit.id}
                        type="button"
                        onClick={() => setSelectedKit(kit)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg font-mono text-[11px] transition-colors ${
                          selectedKit?.id === kit.id
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
                        }`}
                      >
                        {kit.brandName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: selection summary + generate button */}
          <div className="hidden lg:block sticky top-6 space-y-3">
            {(selectedRec || (useCustom && customTopic)) && (
              <div className="bg-bg-surface border border-border-default rounded-2xl p-4 space-y-2 animate-fade-up">
                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Selected</p>
                <p className="font-semibold text-[13px] text-text-primary leading-tight">
                  {useCustom ? "Custom brief" : selectedRec?.theme}
                </p>
                <p className="font-mono text-[11px] text-text-muted leading-relaxed line-clamp-2">
                  {useCustom ? customTopic : selectedRec?.topic}
                </p>
                {selectedPlatform && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="font-mono text-[10px] text-text-muted">
                      {selectedPlatform.label.replace(/\s*\([^)]*\)/g, "").trim()} · {platformDisplaySub[selectedPlatform.id] ?? ""}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={
                generating ||
                !selectedPlatform ||
                (!selectedRec && !(useCustom && customTopic.trim()))
              }
              className="w-full bg-accent text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-accent-dim transition-all duration-200 active:scale-[0.99] min-h-[52px] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="font-mono text-[12px]">{generationStep || "Generating..."}</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate poster
                </>
              )}
            </button>
            {!selectedRec && !(useCustom && customTopic) && (
              <p className="font-mono text-[10px] text-text-muted text-center">Select a recommendation or write a brief</p>
            )}
            {(selectedRec || (useCustom && customTopic)) && (
              <p className="font-mono text-[10px] text-text-muted text-center">Takes 30–60 seconds</p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-base/95 backdrop-blur border-t border-border-subtle lg:hidden pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={
            generating ||
            !selectedPlatform ||
            (!selectedRec && !(useCustom && customTopic.trim()))
          }
          className="w-full bg-accent text-black font-semibold text-[15px] py-4 rounded-xl hover:bg-accent-dim transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px]"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="font-mono text-[13px]">{generationStep || "Generating..."}</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate poster
            </>
          )}
        </button>
      </div>
    </div>
  );
}
