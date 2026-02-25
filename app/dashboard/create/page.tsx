"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle,
  Loader2,
  ArrowLeft,
  LayoutTemplate,
  ImagePlus,
  Upload,
  Link2,
  X,
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

type GenerateMode = "ai" | "template" | "inspiration";

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  aspectRatio: string;
  preview: { bg: string; accent: string; layout: string };
}

const TEMPLATES: TemplateItem[] = [
  { id: "promo-bold", name: "Bold Promotion", category: "Promotion", description: "High-contrast layout for sales and offers", aspectRatio: "1:1", preview: { bg: "#111", accent: "#E8FF47", layout: "bold" } },
  { id: "editorial", name: "Editorial", category: "Brand", description: "Clean typographic layout, minimal visuals", aspectRatio: "1:1", preview: { bg: "#1a1a1a", accent: "#ffffff", layout: "editorial" } },
  { id: "product-hero", name: "Product Hero", category: "Product", description: "Large visual with product-focused copy", aspectRatio: "1:1", preview: { bg: "#0d1117", accent: "#4D9EFF", layout: "hero" } },
  { id: "announcement", name: "Announcement", category: "Occasion", description: "Centered layout for events and launches", aspectRatio: "1:1", preview: { bg: "#14100a", accent: "#FF8C42", layout: "centered" } },
  { id: "minimal-quote", name: "Minimal Quote", category: "Engagement", description: "Text-forward, quote or statement layout", aspectRatio: "1:1", preview: { bg: "#0f0f0f", accent: "#9D4EDD", layout: "quote" } },
  { id: "story-vertical", name: "Story Format", category: "Brand", description: "Vertical layout for Stories and TikTok", aspectRatio: "9:16", preview: { bg: "#0a0a0a", accent: "#E8FF47", layout: "story" } },
];

function TemplateSelector({
  selectedTemplate,
  onSelect,
  brandKit,
}: {
  selectedTemplate: TemplateItem | null;
  onSelect: (t: TemplateItem) => void;
  brandKit: BrandKit | null;
}) {
  const categories = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`font-mono text-[11px] px-3 py-1.5 rounded-full border transition-all duration-150 ${
              activeCategory === cat ? "border-accent bg-accent/10 text-accent" : "border-border-default text-text-muted hover:border-border-strong"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={`text-left rounded-xl border overflow-hidden transition-all duration-150 group ${
                isSelected ? "border-accent ring-1 ring-accent/20" : "border-border-default hover:border-border-strong"
              }`}
            >
              <div className="aspect-square relative overflow-hidden" style={{ background: template.preview.bg }}>
                {template.preview.layout === "bold" && (
                  <div className="absolute inset-0 p-3 flex flex-col justify-end">
                    <div className="h-1 w-8 rounded mb-2" style={{ background: template.preview.accent }} />
                    <div className="h-5 w-full rounded mb-1.5 bg-white/80" />
                    <div className="h-3 w-3/4 rounded bg-white/40" />
                    <div className="mt-3 h-7 w-20 rounded-lg" style={{ background: template.preview.accent }} />
                  </div>
                )}
                {template.preview.layout === "editorial" && (
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="h-2 w-12 rounded bg-white/30" />
                    <div className="space-y-2">
                      <div className="h-6 w-4/5 rounded bg-white/80" />
                      <div className="h-6 w-3/5 rounded bg-white/50" />
                      <div className="h-3 w-full rounded bg-white/25 mt-3" />
                      <div className="h-3 w-4/5 rounded bg-white/25" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-6 rounded" style={{ background: template.preview.accent }} />
                      <div className="h-2 w-16 rounded bg-white/30" />
                    </div>
                  </div>
                )}
                {template.preview.layout === "hero" && (
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="h-4 w-3/4 rounded bg-white/90 mb-1.5" />
                      <div className="h-3 w-1/2 rounded bg-white/50" />
                    </div>
                  </div>
                )}
                {template.preview.layout === "centered" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                    <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: template.preview.accent }} />
                    <div className="h-4 w-3/4 rounded bg-white/80" />
                    <div className="h-3 w-1/2 rounded bg-white/40" />
                    <div className="h-6 w-20 rounded-full mt-2" style={{ background: template.preview.accent }} />
                  </div>
                )}
                {template.preview.layout === "quote" && (
                  <div className="absolute inset-0 flex flex-col justify-center p-5">
                    <div className="text-[32px] font-serif leading-none mb-2" style={{ color: template.preview.accent, opacity: 0.3 }}>&quot;</div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-full rounded bg-white/70" />
                      <div className="h-3 w-4/5 rounded bg-white/70" />
                      <div className="h-3 w-3/5 rounded bg-white/70" />
                    </div>
                    <div className="mt-4 h-2 w-12 rounded" style={{ background: template.preview.accent }} />
                  </div>
                )}
                {template.preview.layout === "story" && (
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <div className="h-2 w-16 rounded bg-white/30" />
                    <div className="space-y-2">
                      <div className="h-5 w-full rounded bg-white/80" />
                      <div className="h-5 w-3/4 rounded bg-white/50" />
                      <div className="h-6 w-24 rounded-lg mt-2" style={{ background: template.preview.accent }} />
                    </div>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      <CheckCircle size={16} className="text-black" />
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="font-mono text-[9px] text-white/60 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5">{template.aspectRatio}</span>
                </div>
              </div>
              <div className={`px-3 py-2.5 border-t ${isSelected ? "border-accent/20 bg-accent/5" : "border-border-subtle bg-bg-elevated"}`}>
                <div className="flex items-center justify-between gap-1">
                  <p className="font-semibold text-[12px] text-text-primary truncate">{template.name}</p>
                  <span className="font-mono text-[9px] text-text-muted bg-bg-base border border-border-default rounded-full px-1.5 py-0.5 shrink-0">{template.category}</span>
                </div>
                <p className="font-mono text-[10px] text-text-muted mt-0.5 leading-relaxed line-clamp-1">{template.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InspirationInput({
  value,
  onUrlChange,
  onFileChange,
  onSelect,
}: {
  value: string;
  onUrlChange: (v: string) => void;
  onFileChange: (f: File | null) => void;
  onSelect: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    onFileChange(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    onSelect();
  }

  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
        <p className="font-semibold text-[14px] text-text-primary mb-1">Match a visual style</p>
        <p className="font-mono text-[12px] text-text-muted leading-relaxed">
          Upload a poster or paste a link. We&apos;ll analyze the composition, color mood, and layout — then apply that style to your brand and today&apos;s content.
        </p>
      </div>
      <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Upload image</p>
        </div>
        <div className="p-5">
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-border-default">
              <img src={preview} alt="Inspiration" className="w-full max-h-64 object-contain bg-bg-elevated" />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  onFileChange(null);
                  onSelect();
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-bg-base/80 backdrop-blur border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={13} />
              </button>
              <div className="absolute bottom-2 left-2">
                <div className="bg-success/20 border border-success/30 rounded-full px-2.5 py-1 flex items-center gap-1.5">
                  <CheckCircle size={10} className="text-success" />
                  <span className="font-mono text-[10px] text-success">Style will be analyzed</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file?.type.startsWith("image/")) handleFile(file);
              }}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150 ${
                dragOver ? "border-accent bg-accent/5" : "border-border-default hover:border-border-strong hover:bg-bg-elevated"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${dragOver ? "border-accent" : "border-border-default"}`}>
                <Upload size={18} className={dragOver ? "text-accent" : "text-text-muted"} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[13px] text-text-primary">Drop image here</p>
                <p className="font-mono text-[11px] text-text-muted mt-1">or click to browse · PNG, JPG, WEBP</p>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </div>
      <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Or paste a URL</p>
        </div>
        <div className="p-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="url"
                value={value}
                onChange={(e) => {
                  onUrlChange(e.target.value);
                  if (e.target.value) onSelect();
                }}
                placeholder="https://example.com/poster.jpg"
                className="w-full bg-bg-elevated border border-border-default rounded-xl pl-9 pr-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors min-h-[44px]"
              />
            </div>
            {value && (
              <button
                type="button"
                onClick={() => onUrlChange("")}
                className="w-11 h-11 rounded-xl bg-bg-elevated border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <p className="font-mono text-[10px] text-text-muted mt-2">Direct link to a poster image you want to match</p>
        </div>
      </div>
      <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-3">What gets analyzed</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Color mood", desc: "Warm, cool, vibrant, muted" },
            { label: "Composition", desc: "Layout, hierarchy, spacing" },
            { label: "Visual style", desc: "Photo, illustration, minimal" },
            { label: "Typography feel", desc: "Bold, elegant, playful" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-[12px] text-text-primary">{item.label}</p>
                <p className="font-mono text-[10px] text-text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();

  const [mode, setMode] = useState<GenerateMode>("ai");
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [selectedKit, setSelectedKit] = useState<BrandKit | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [inspirationUrl, setInspirationUrl] = useState("");
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
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
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedFreepikTemplateTitle, setSelectedFreepikTemplateTitle] = useState<string>("");
  const [useInspiration, setUseInspiration] = useState(false);
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

  // When switching to template mode, clear static selection and run initial Freepik search if no results yet
  useEffect(() => {
    if (mode !== "template") return;
    setSelectedTemplate(null);
    if (templateResults.length > 0 || loadingTemplates) return;
    const term = templateSearch.trim() || "social media poster";
    let cancelled = false;
    setLoadingTemplates(true);
    getToken()
      .then((token) =>
        fetch(
          `/api/templates?term=${encodeURIComponent(term)}&limit=${TEMPLATE_PAGE_SIZE}&page=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Search failed"))))
      .then((data) => {
        if (!cancelled) {
          setTemplateResults(data.items ?? []);
          setTemplateTotal(data.total ?? null);
          setTemplatePage(1);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load templates");
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

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

  async function handleInspirationFile(file: File | null) {
    setInspirationFile(file);
    if (!file) {
      setInspirationImageUrl("");
      return;
    }
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
      const data = (await res.json()) as { url?: string };
      setInspirationImageUrl(data.url ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setInspirationFile(null);
    } finally {
      setUploadingInspiration(false);
    }
  }

  async function handleGenerate() {
    if (!selectedKit) {
      toast.error("Please select a brand kit");
      return;
    }
    if (mode === "ai") {
      if (!selectedRec && !(useCustom && customTopic.trim())) {
        toast.error("Select a recommendation or write a brief");
        return;
      }
    }
    if (mode === "template") {
      if (selectedTemplateId == null) {
        toast.error("Select a template to continue");
        return;
      }
      if (!selectedRec && !(useCustom && customTopic.trim())) {
        toast.error("Choose a content recommendation or write your own brief");
        return;
      }
    }
    if (mode === "inspiration") {
      const hasUrl = inspirationUrl.trim().length > 0;
      const hasUpload = inspirationImageUrl.trim().length > 0;
      if (!hasUrl && !hasUpload) {
        toast.error("Upload an image or paste a URL");
        return;
      }
      if (!selectedRec && !(useCustom && customTopic.trim())) {
        toast.error("Choose a content recommendation or write your own brief");
        return;
      }
    }

    setGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const token = await getToken();

      const recommendationPayload =
        useCustom && customTopic.trim()
          ? { theme: "Custom", topic: customTopic, description: customTopic, suggestedHeadline: "", suggestedCta: "", visualMood: "", hashtags: [] }
          : selectedRec ?? null;

      const inspirationImageUrlValue =
        mode === "inspiration" ? (inspirationUrl.trim() || inspirationImageUrl.trim() || null) : null;

      const payload = {
        brandKitId: selectedKit.id,
        mode,
        platformFormatId,
        recommendation: recommendationPayload,
        customTopic: useCustom && customTopic.trim() ? customTopic : null,
        templateId: mode === "template" ? (selectedTemplateId ?? null) : null,
        templateName: mode === "template" ? (selectedFreepikTemplateTitle || null) : null,
        ...(inspirationImageUrlValue ? { inspirationImageUrl: inspirationImageUrlValue } : {}),
      };

      setGenerationStep("Analyzing your brand...");
      await new Promise((r) => setTimeout(r, 800));

      setGenerationStep("Writing copy with AI...");
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep(
        mode === "inspiration" && (inspirationUrl.trim() || inspirationImageUrl.trim())
          ? "Using your image as style reference..."
          : mode === "template"
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-2">
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
        {/* Generation mode tabs — directly under header */}
        <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mt-6 mb-2">
          Generation mode
        </p>
        <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-xl p-1 w-full max-w-md">
          {(
            [
              { id: "ai" as GenerateMode, label: "AI Pick", icon: <Sparkles size={13} /> },
              { id: "template" as GenerateMode, label: "Templates", icon: <LayoutTemplate size={13} /> },
              { id: "inspiration" as GenerateMode, label: "Inspiration", icon: <ImagePlus size={13} /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                mode === tab.id ? "bg-bg-elevated text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <span className={mode === tab.id ? "text-accent" : "text-text-muted"}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {mode === "template" && (
            <div className="space-y-4">
              <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle">
                  <p className="font-semibold text-[14px] text-text-primary">Search templates</p>
                  <p className="font-mono text-[11px] text-text-muted mt-0.5">Find a poster style from Freepik to use as your base</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchTemplates()}
                        placeholder="e.g. social media poster, birthday, promo"
                        className="w-full bg-bg-elevated border border-border-default rounded-xl pl-4 pr-10 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors"
                      />
                      <button
                        type="button"
                        onClick={searchTemplates}
                        disabled={loadingTemplates}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
                        aria-label="Search"
                      >
                        <Sparkles size={16} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={searchTemplates}
                      disabled={loadingTemplates}
                      className="bg-accent text-black font-semibold text-[13px] px-4 py-3 rounded-xl hover:bg-accent-dim transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      {loadingTemplates ? "Searching…" : "Search"}
                    </button>
                  </div>
                  {suggestedSearches.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="font-mono text-[10px] text-text-muted self-center mr-1">Suggestions:</span>
                      {suggestedSearches.slice(0, 8).map((phrase) => (
                        <button
                          key={phrase}
                          type="button"
                          onClick={() => applySuggestedSearch(phrase)}
                          className="font-mono text-[11px] text-text-muted bg-bg-elevated border border-border-default rounded-full px-3 py-1.5 hover:border-accent/40 hover:text-accent transition-colors"
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {loadingTemplates && templateResults.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-bg-elevated rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {templateResults.map((item) => {
                      const isSelected = selectedTemplateId != null && String(item.id) === String(selectedTemplateId);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplateId(item.id);
                            setSelectedFreepikTemplateTitle(item.title ?? "");
                            setSelectedTemplate(null);
                            setUseTemplate(true);
                          }}
                          className={`text-left rounded-xl border overflow-hidden transition-all duration-150 group ${
                            isSelected ? "border-accent ring-2 ring-accent/20" : "border-border-default hover:border-border-strong"
                          }`}
                        >
                          <div className="aspect-square relative bg-bg-elevated">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.title ?? ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <LayoutTemplate size={32} className="text-text-muted" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
                                <CheckCircle size={24} className="text-accent drop-shadow" />
                              </div>
                            )}
                          </div>
                          {item.title && (
                            <div className="p-2.5 border-t border-border-subtle">
                              <p className="font-mono text-[11px] text-text-secondary line-clamp-2">{item.title}</p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {templateResults.length > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      {templateTotal != null && (
                        <p className="font-mono text-[11px] text-text-muted">
                          {templateResults.length} of {templateTotal} shown
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={loadMoreTemplates}
                        disabled={loadingMoreTemplates}
                        className="font-mono text-[12px] text-accent hover:underline disabled:opacity-50"
                      >
                        {loadingMoreTemplates ? "Loading…" : "Load more"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {mode === "inspiration" && (
            <InspirationInput
              value={inspirationUrl}
              onUrlChange={setInspirationUrl}
              onFileChange={handleInspirationFile}
              onSelect={() => {
                setUseInspiration(true);
              }}
            />
          )}

          {/* Content recommendations + custom brief — on all tabs so Template/Inspiration can choose content too */}
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
            {(mode === "ai" && (selectedRec || (useCustom && customTopic))) ||
            (mode === "template" && selectedTemplateId != null && (selectedRec || (useCustom && customTopic))) ||
            (mode === "inspiration" && (inspirationUrl.trim() || inspirationFile || inspirationImageUrl.trim()) && (selectedRec || (useCustom && customTopic))) ? (
              <div className="bg-bg-surface border border-border-default rounded-2xl p-4 space-y-2 animate-fade-up">
                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  {mode === "ai" ? "Ready" : mode === "template" ? "Template + content" : "Inspiration + content"}
                </p>
                {selectedRec && !useCustom && (
                  <>
                    <p className="font-semibold text-[13px] text-text-primary leading-tight">{selectedRec.theme}</p>
                    <p className="font-mono text-[11px] text-text-muted leading-relaxed line-clamp-2">{selectedRec.topic}</p>
                  </>
                )}
                {useCustom && customTopic && (
                  <>
                    <p className="font-semibold text-[13px] text-text-primary leading-tight">Custom brief</p>
                    <p className="font-mono text-[11px] text-text-muted leading-relaxed line-clamp-2">{customTopic}</p>
                  </>
                )}
                {mode === "template" && selectedTemplateId != null && (
                  <>
                    <p className="font-semibold text-[13px] text-text-primary leading-tight line-clamp-2 mt-1">
                      {selectedFreepikTemplateTitle || "Template selected"}
                    </p>
                    <p className="font-mono text-[11px] text-text-muted">Freepik style</p>
                  </>
                )}
                {mode === "inspiration" && (inspirationUrl.trim() || inspirationFile || inspirationImageUrl.trim()) && (
                  <>
                    <p className="font-semibold text-[13px] text-text-primary leading-tight mt-1">Style reference</p>
                    <p className="font-mono text-[11px] text-text-muted">
                      {inspirationFile ? inspirationFile.name : "URL provided"}
                    </p>
                  </>
                )}
                {selectedPlatform && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-border-subtle mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="font-mono text-[10px] text-text-muted">
                      {selectedPlatform.label.replace(/\s*\([^)]*\)/g, "").trim()} · {platformDisplaySub[selectedPlatform.id] ?? ""}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={
                generating ||
                !selectedPlatform ||
                (mode === "ai" && !selectedRec && !(useCustom && customTopic.trim())) ||
                (mode === "template" && (selectedTemplateId == null || (!selectedRec && !(useCustom && customTopic.trim())))) ||
                (mode === "inspiration" && (!inspirationUrl.trim() && !inspirationImageUrl.trim() || (!selectedRec && !(useCustom && customTopic.trim()))))
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
            {!(mode === "ai" && (selectedRec || (useCustom && customTopic))) &&
              !(mode === "template" && selectedTemplateId != null && (selectedRec || (useCustom && customTopic))) &&
              !(mode === "inspiration" && (inspirationUrl.trim() || inspirationImageUrl.trim()) && (selectedRec || (useCustom && customTopic))) && (
              <p className="font-mono text-[10px] text-text-muted text-center">
                {mode === "ai"
                  ? "Select a recommendation or write a brief"
                  : mode === "template"
                    ? "Select a template and choose content"
                    : "Set inspiration image and choose content"}
              </p>
            )}
            {((mode === "ai" && (selectedRec || (useCustom && customTopic))) ||
              (mode === "template" && selectedTemplateId != null && (selectedRec || (useCustom && customTopic))) ||
              (mode === "inspiration" && (inspirationUrl.trim() || inspirationImageUrl.trim()) && (selectedRec || (useCustom && customTopic)))) && (
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
            (mode === "ai" && !selectedRec && !(useCustom && customTopic.trim())) ||
            (mode === "template" && (selectedTemplateId == null || (!selectedRec && !(useCustom && customTopic.trim())))) ||
            (mode === "inspiration" && (!inspirationUrl.trim() && !inspirationImageUrl.trim() || (!selectedRec && !(useCustom && customTopic.trim()))))
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
