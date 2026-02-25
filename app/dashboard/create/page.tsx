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
  Search,
  Image as ImageIcon,
  Upload,
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
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-accent" />
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Search poster style (optional)
            </p>
          </div>
          <p className="text-[12px] text-text-secondary mb-3">
            Search for a layout you like — we&apos;ll match the style and apply your brand and copy.
          </p>
          {selectedKit && (
            <div className="mb-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-2">
                Suggested for {selectedKit.brandName}
              </p>
              {loadingSuggestedSearches ? (
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Finding template ideas for your brand...</span>
                </div>
              ) : suggestedSearches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suggestedSearches.map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => applySuggestedSearch(phrase)}
                      disabled={loadingTemplates}
                      className="px-3 py-1.5 rounded-lg border border-border-default bg-bg-surface text-sm text-text-secondary hover:bg-bg-elevated hover:border-accent/50 hover:text-text-primary transition-colors disabled:opacity-50"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          <div className="flex gap-2 flex-wrap mb-3">
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchTemplates()}
              placeholder="e.g. birthday poster, sale promo, event..."
              className="flex-1 min-w-[200px] rounded-lg border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <button
              type="button"
              onClick={searchTemplates}
              disabled={loadingTemplates}
              className="px-4 py-2.5 rounded-lg border border-border-default bg-bg-surface text-sm font-medium text-text-primary hover:bg-bg-elevated disabled:opacity-50 flex items-center gap-2"
            >
              {loadingTemplates ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>
          {templateResults.length > 0 && (
            <>
              <p className="text-[12px] text-text-muted mb-2">
                Click any style to select it. First result not right? Scroll down and pick another, or load more.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {templateResults.map((t) => {
                  const isSelected = selectedTemplateId != null && String(t.id) === String(selectedTemplateId);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                      if (isSelected) setSelectedTemplateId(null);
                      else {
                        setSelectedTemplateId(t.id);
                        setInspirationImageUrl("");
                        setInspirationPreview(null);
                      }
                    }}
                      className={`
                        relative aspect-square rounded-xl border-2 overflow-hidden bg-bg-elevated
                        transition-all duration-150
                        ${isSelected
                          ? "border-accent ring-2 ring-accent/30"
                          : "border-border-default hover:border-border-strong"}
                      `}
                    >
                      {t.thumbnail ? (
                        <img
                          src={t.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={24} className="text-text-muted" />
                        </div>
                      )}
                      {isSelected && (
                        <>
                          <div className="absolute inset-0 bg-accent/25" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                            <CheckCircle size={32} className="text-accent drop-shadow-lg" strokeWidth={2.5} />
                            <span className="font-mono text-[10px] font-semibold text-white drop-shadow-lg uppercase tracking-wider">
                              Selected
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              {templateResults.length > 0 && (templateTotal == null || templateResults.length < templateTotal) && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMoreTemplates}
                    disabled={loadingMoreTemplates}
                    className="px-4 py-2 rounded-lg border border-border-default bg-bg-surface text-sm font-medium text-text-secondary hover:bg-bg-elevated hover:border-border-strong disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingMoreTemplates ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>Load more styles</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
          {selectedTemplateId != null && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3">
              <CheckCircle size={18} className="text-accent shrink-0" />
              <p className="text-sm font-medium text-text-primary">
                Template style selected — when you click &quot;Generate poster&quot;, we&apos;ll use this style with your brand and copy.
              </p>
              <button
                type="button"
                onClick={() => setSelectedTemplateId(null)}
                className="ml-auto font-mono text-[11px] text-text-muted hover:text-text-primary underline"
              >
                Clear selection
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border-subtle">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={14} className="text-accent" />
              <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
                Or use an image as inspiration
              </p>
            </div>
            <p className="text-[12px] text-text-secondary mb-3">
              Paste a link to a poster you like, or upload an image. We&apos;ll match its layout and style with your brand colors and copy.
            </p>
            <div className="flex flex-wrap gap-2 items-start">
              <input
                type="url"
                value={inspirationImageUrl}
                onChange={(e) => {
                  setInspirationImageUrl(e.target.value);
                  if (e.target.value.trim()) setInspirationPreview(e.target.value.trim());
                  else setInspirationPreview(null);
                  if (e.target.value.trim()) setSelectedTemplateId(null);
                }}
                placeholder="https://example.com/poster-image.jpg"
                className="flex-1 min-w-[200px] rounded-lg border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <label className="px-4 py-2.5 rounded-lg border border-border-default bg-bg-surface text-sm font-medium text-text-primary hover:bg-bg-elevated cursor-pointer flex items-center gap-2 disabled:opacity-50">
                <Upload size={14} />
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setUploadingInspiration(true);
                    try {
                      const token = await getToken();
                      const form = new FormData();
                      form.append("file", file);
                      const res = await fetch("/api/upload/inspiration", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: form,
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error((err as { error?: string }).error || "Upload failed");
                      }
                      const data = await res.json() as { url?: string };
                      const url = data?.url ?? "";
                      setInspirationImageUrl(url);
                      setInspirationPreview(url);
                      setSelectedTemplateId(null);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Upload failed");
                    } finally {
                      setUploadingInspiration(false);
                    }
                  }}
                />
              </label>
            </div>
            {uploadingInspiration && (
              <p className="mt-2 text-[12px] text-text-muted flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Uploading...
              </p>
            )}
            {inspirationImageUrl.trim() && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3">
                {inspirationPreview && (
                  <img
                    src={inspirationPreview}
                    alt="Inspiration"
                    className="w-16 h-16 rounded-lg object-cover border border-border-default"
                    onError={() => setInspirationPreview(null)}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    Inspiration image set — we&apos;ll use its layout and style with your brand and copy.
                  </p>
                  <p className="font-mono text-[11px] text-text-muted truncate mt-0.5">
                    {inspirationImageUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInspirationImageUrl("");
                    setInspirationPreview(null);
                  }}
                  className="font-mono text-[11px] text-text-muted hover:text-text-primary underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-2">
            Where will you share?
          </p>
          <p className="text-[12px] text-text-secondary mb-3">
            Pick a platform to get the right size for that feed.
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_FORMATS.map((f) => {
              const isSelected = platformFormatId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPlatformFormatId(f.id)}
                  className={`
                    px-3 py-2 rounded-lg border text-left transition-all duration-150
                    ${isSelected
                      ? "border-accent bg-accent/10 text-text-primary"
                      : "border-border-default bg-bg-surface text-text-secondary hover:border-border-strong"}
                  `}
                >
                  <span className="block font-medium text-sm">{f.label}</span>
                  <span className="font-mono text-[10px] text-text-muted">{f.width} × {f.height}</span>
                </button>
              );
            })}
          </div>
        </div>

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
              {selectedTemplateId != null && (
                <div className="flex items-center gap-2">
                  <ChevronRight size={12} className="text-text-muted" />
                  <span className="font-mono text-xs text-text-secondary">
                    Style: template selected (from search)
                  </span>
                </div>
              )}
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
          Professional quality · Ready in seconds
        </p>
      </main>
    </div>
  );
}
