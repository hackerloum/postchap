"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
  Instagram,
  Lock,
  Package,
  ShoppingBag,
  BookOpen,
  Star,
  ChevronDown,
} from "lucide-react";
import type { Product, ProductIntent, ProductOverrides } from "@/types/generation";
import { toast } from "sonner";
import { getClientIdToken } from "@/lib/auth-client";
import { getAuthClient } from "@/lib/firebase/client";
import { PLATFORM_FORMATS } from "@/lib/generation/platformFormats";
import { IMAGE_PROVIDERS, DEFAULT_IMAGE_PROVIDER, isProviderLockedForPlan } from "@/lib/image-models";
import { LogoLoadingScreen } from "@/components/dashboard/LogoLoadingScreen";
import { PricingModal } from "@/components/PricingModal";
import { getPerPosterPriceForCountry } from "@/lib/pricing";
import type { PlanId } from "@/lib/plans";

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

type GenerateMode = "ai" | "template" | "inspiration" | "product";

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

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [generatedPoster, setGeneratedPoster] = useState<{ posterId: string; imageUrl: string } | null>(null);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [postingToInstagram, setPostingToInstagram] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateResults, setTemplateResults] = useState<{ id: number | string; title?: string; thumbnail?: string }[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingMoreTemplates, setLoadingMoreTemplates] = useState(false);
  const [templatePage, setTemplatePage] = useState(1);
  const [templateTotal, setTemplateTotal] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string | null>(null);
  const [platformFormatId, setPlatformFormatId] = useState<string>(PLATFORM_FORMATS[0].id);
  const [imageProviderId, setImageProviderId] = useState<string>(DEFAULT_IMAGE_PROVIDER);
  const [useImprovePrompt, setUseImprovePrompt] = useState(false);
  const [suggestedSearches, setSuggestedSearches] = useState<string[]>([]);
  const [loadingSuggestedSearches, setLoadingSuggestedSearches] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedFreepikTemplateTitle, setSelectedFreepikTemplateTitle] = useState<string>("");
  const [useInspiration, setUseInspiration] = useState(false);
  const [inspirationImageUrl, setInspirationImageUrl] = useState("");
  const [inspirationPreview, setInspirationPreview] = useState<string | null>(null);
  const [uploadingInspiration, setUploadingInspiration] = useState(false);
  // Product mode state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productIntent, setProductIntent] = useState<ProductIntent>("showcase");
  const [productOverrides, setProductOverrides] = useState<ProductOverrides>({ showPrice: true, showDiscount: true, urgency: "none" });
  const [plan, setPlan] = useState<PlanId>("free");
  const [trial, setTrial] = useState<{
    active: boolean;
    postsRemaining: 0 | 1;
    endsAt: number | null;
    modelLockedToSeedream: boolean;
    trialCompleted: boolean;
  }>({
    active: false,
    postsRemaining: 0,
    endsAt: null,
    modelLockedToSeedream: false,
    trialCompleted: false,
  });
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [profilePhoneNumber, setProfilePhoneNumber] = useState<string | null>(null);
  const [postersThisMonth, setPostersThisMonth] = useState(0);
  const [postersLimit, setPostersLimit] = useState<number | null>(null);
  const [posterCredits, setPosterCredits] = useState(0);
  const [buyingPoster, setBuyingPoster] = useState(false);

  // Wait for Firebase auth to fully initialise before loading data.
  // auth.currentUser is null for a brief moment after a fresh page load
  // (e.g. returning from the Snippe payment redirect), which caused getToken()
  // to see null and redirect to /login — signing the user out unintentionally.
  useEffect(() => {
    const auth = getAuthClient();
    let resolved = false;
    const unsub = auth.onAuthStateChanged((user) => {
      if (resolved) return;
      resolved = true;
      unsub();
      if (user) {
        loadBrandKits();
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?payment=poster return from payment. Poll until the Snippe webhook
  // has fired and posterCredits is incremented (webhook fires async, may take a few seconds).
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment !== "poster") return;

    toast.success("Payment received! Activating your poster credit…");

    let attempts = 0;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      attempts++;
      try {
        const token = await getClientIdToken();
        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};
        const r = await fetch("/api/me", { headers });
        if (r.ok) {
          const d = await r.json();
          const credits = (d?.posterCredits as number) ?? 0;
          if (credits > 0) {
            setPosterCredits(credits);
            toast.success("Poster credit ready — you can generate now!");
            return;
          }
        }
      } catch {}
      // Retry up to 8 times with growing delays (2s, 3s, 4s … 9s)
      if (attempts < 8) {
        setTimeout(poll, (attempts + 1) * 1000);
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [searchParams]);

  const limitReached =
    posterCredits === 0 &&
    ((trial.trialCompleted && plan === "free") ||
    (plan === "free" && postersLimit != null && postersLimit > 0 && postersThisMonth >= postersLimit));
  const hasOpenedLimitModal = useRef(false);
  // Don't auto-open the pricing modal when the user just returned from a payment
  // redirect — the webhook may not have fired yet so posterCredits could still
  // be 0 even though they paid. The polling effect above will update credits.
  const returningFromPayment = searchParams.get("payment") === "poster";

  useEffect(() => {
    if (selectedKit && !limitReached) {
      loadRecommendations(selectedKit.id);
    }
  }, [selectedKit?.id, limitReached]);

  useEffect(() => {
    if (limitReached && !hasOpenedLimitModal.current && !returningFromPayment) {
      hasOpenedLimitModal.current = true;
      setPricingModalOpen(true);
    }
  }, [limitReached, returningFromPayment]);

  useEffect(() => {
    if (selectedKit?.id) {
      loadSuggestedSearches(selectedKit.id);
    } else {
      setSuggestedSearches([]);
    }
  }, [selectedKit?.id]);

  // Load products when brand kit changes (used in Product mode)
  useEffect(() => {
    if (!selectedKit?.id) { setProducts([]); return; }
    let cancelled = false;
    setLoadingProducts(true);
    const paramProductId = searchParams.get("productId");
    getToken()
      .then(token => fetch(`/api/brand-kits/${selectedKit.id}/products`, { headers: { Authorization: `Bearer ${token}` } }))
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (!cancelled) {
          const list: Product[] = data.products ?? [];
          setProducts(list);
          if (paramProductId) {
            const match = list.find(p => p.id === paramProductId);
            if (match) setSelectedProduct(match);
          }
        }
      })
      .catch(() => { /* non-critical */ })
      .finally(() => { if (!cancelled) setLoadingProducts(false); });
    return () => { cancelled = true; };
  }, [selectedKit?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select product from URL params (e.g. from products page "Generate poster")
  useEffect(() => {
    const paramProductId  = searchParams.get("productId");
    const paramBrandKitId = searchParams.get("brandKitId");
    if (paramProductId && paramBrandKitId) {
      setMode("product");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If current plan doesn't allow the selected provider (e.g. downgraded from Business), reset to default.
  useEffect(() => {
    if (isProviderLockedForPlan(imageProviderId, plan)) {
      setImageProviderId(DEFAULT_IMAGE_PROVIDER);
    }
  }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // getClientIdToken returns from module-level cache (0 ms) when the token
    // has > 5 min left, so this is effectively free for most button clicks.
    const token = await getClientIdToken();
    if (!token) {
      // Token not in cache yet (cold start or auth not resolved).
      // Wait up to 3 s for Firebase to finish restoring auth from IndexedDB.
      const waited = await new Promise<string | null>((resolve) => {
        const auth = getAuthClient();
        if (auth.currentUser) {
          // Use cached token (forceRefresh=false) — network call only if expired.
          auth.currentUser.getIdToken(false).then(resolve).catch(() => resolve(null));
          return;
        }
        const timeout = setTimeout(() => resolve(null), 3000);
        const unsub = auth.onAuthStateChanged((user) => {
          clearTimeout(timeout);
          unsub();
          if (user) {
            user.getIdToken(false).then(resolve).catch(() => resolve(null));
          } else {
            resolve(null);
          }
        });
      });
      if (!waited) {
        router.push("/login");
        throw new Error("Not authenticated");
      }
      return waited;
    }
    return token;
  }

  async function loadBrandKits() {
    try {
      const token = await getToken();
      const [kitsRes, meRes] = await Promise.all([
        fetch("/api/brand-kits", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const data = await kitsRes.json();
      const kits = (data.kits || []) as BrandKit[];
      setBrandKits(kits);
      if (kits.length > 0) setSelectedKit(kits[0]);
      if (meRes.ok) {
        const meData = await meRes.json();
        setInstagramConnected(meData.instagram?.connected === true);
        setPlan((meData.plan as PlanId) ?? "free");
        setTrial(meData.trial ?? {
          active: false,
          postsRemaining: 0,
          endsAt: null,
          modelLockedToSeedream: false,
          trialCompleted: false,
        });
        setCountryCode(meData.countryCode ?? null);
        setProfilePhoneNumber(meData.phoneNumber ?? null);
        const usage = meData.usage ?? {};
        setPostersThisMonth(usage.postersThisMonth ?? 0);
        setPostersLimit(usage.postersLimit ?? null);
        setPosterCredits(meData.posterCredits ?? 0);
      }
    } catch {
      toast.error("Failed to load brand kits");
    } finally {
      setLoadingKits(false);
    }
  }

  async function handleBuyPoster() {
    setBuyingPoster(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: "poster",
          paymentMethod: "card",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Payment could not be started");
      if (data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      if (data.message) {
        toast.success(data.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBuyingPoster(false);
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
      const recs = (data.recommendations || []) as Recommendation[];
      setRecommendations(recs);
      // Auto-select first recommendation so users can generate immediately
      if (recs.length > 0) setSelectedRec(recs[0]);
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
    if (mode === "template") {
      if (selectedTemplateId == null) {
        toast.error("Select a template to continue");
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
    }
    if (mode === "product") {
      if (!selectedProduct) {
        toast.error("Select a product to generate a poster");
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
        imageProviderId: trial.modelLockedToSeedream ? "freepik:seedream" : imageProviderId,
        useImprovePrompt,
        recommendation: mode === "product" ? null : recommendationPayload,
        customTopic: mode === "product" ? null : (useCustom && customTopic.trim() ? customTopic : null),
        templateId: mode === "template" ? (selectedTemplateId ?? null) : null,
        templateName: mode === "template" ? (selectedFreepikTemplateTitle || null) : null,
        ...(inspirationImageUrlValue ? { inspirationImageUrl: inspirationImageUrlValue } : {}),
        ...(mode === "product" && selectedProduct ? {
          productId: selectedProduct.id,
          productIntent,
          productOverrides,
        } : {}),
      };

      setGenerationStep(
        mode === "inspiration" && (inspirationUrl.trim() || inspirationImageUrl.trim())
          ? "Analyzing style reference & writing copy..."
          : mode === "template"
            ? "Analyzing template & writing copy..."
            : mode === "product"
              ? "Building product poster..."
              : "Writing copy & generating image..."
      );
      // Minimal yield so React paints the step message before the blocking fetch.
      await new Promise((r) => setTimeout(r, 50));

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
        if (res.status === 403 && (err.code === "TRIAL_LIMIT_REACHED" || /trial/i.test(err.error ?? ""))) {
          setPricingModalOpen(true);
          toast.error("Upgrade to create more posters.");
        } else if (res.status === 403 && err.code === "PROVIDER_LOCKED") {
          setPricingModalOpen(true);
          toast.error("Nano Banana 2 and Pro require the Business plan.");
        } else {
          toast.error(err.error || "Generation failed");
        }
        return;
      }

      const data = (await res.json()) as { posterId?: string; imageUrl?: string };
      toast.success("Poster generated successfully!");
      if (trial.modelLockedToSeedream) {
        setTrial((prev) => ({ ...prev, active: false, postsRemaining: 0, modelLockedToSeedream: false, trialCompleted: true }));
      }
      if (instagramConnected && data.posterId && data.imageUrl) {
        setGeneratedPoster({ posterId: data.posterId, imageUrl: data.imageUrl });
      } else {
        router.push(`/dashboard/posters?new=${data.posterId ?? ""}`);
      }
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
    return <LogoLoadingScreen />;
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
      {/* Post to Instagram success overlay */}
      {generatedPoster && (
        <div className="fixed inset-0 bg-bg-base/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f09433] to-[#bc1888] flex items-center justify-center">
            <Instagram size={28} className="text-white" />
          </div>
          <div className="text-center space-y-2 max-w-sm">
            <p className="font-semibold text-[18px] text-text-primary">Poster ready!</p>
            <p className="font-mono text-[12px] text-text-muted leading-relaxed">
              Post it to Instagram now or view it in your posters library.
            </p>
          </div>
          {generatedPoster.imageUrl && (
            <img
              src={generatedPoster.imageUrl}
              alt="Generated poster"
              className="w-40 h-40 object-cover rounded-xl border border-border-default shadow-xl"
            />
          )}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              type="button"
              disabled={postingToInstagram}
              onClick={async () => {
                setPostingToInstagram(true);
                try {
                  const res = await fetch("/api/social/instagram/post", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({
                      posterId: generatedPoster.posterId,
                      imageUrl: generatedPoster.imageUrl,
                      caption: "",
                    }),
                  });
                  const d = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(d?.error ?? "Failed to post");
                  toast.success(`Posted to @${d.username ?? "Instagram"}!`);
                  router.push(`/dashboard/posters?new=${generatedPoster.posterId}`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to post to Instagram");
                } finally {
                  setPostingToInstagram(false);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#f09433] to-[#bc1888] text-white font-semibold text-[14px] py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 min-h-[52px]"
            >
              {postingToInstagram ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Instagram size={16} />
              )}
              Post to Instagram
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/posters?new=${generatedPoster.posterId}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-bg-elevated border border-border-default text-text-primary font-semibold text-[14px] py-3.5 rounded-xl hover:border-border-strong transition-all min-h-[52px]"
            >
              View poster
            </button>
          </div>
        </div>
      )}

      {generating && (
        <div className="fixed inset-0 bg-bg-base/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6">
          <Image
            src="/artmasterwordmarklogo-03-03.webp"
            alt="ArtMaster"
            width={140}
            height={40}
            className="h-8 w-auto object-contain animate-pulse"
            priority
          />
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

        {/* Poster credits badge — show when user has purchased credits */}
        {posterCredits > 0 && !limitReached && (
          <div className="mt-4 flex items-center gap-2 text-accent bg-accent/10 border border-accent/20 rounded-xl px-4 py-2.5 w-fit">
            <Sparkles size={13} />
            <span className="font-mono text-[12px] font-semibold">
              {posterCredits} purchased poster credit{posterCredits !== 1 ? "s" : ""} available
            </span>
          </div>
        )}

        {/* Limit reached: show upgrade gate and open pricing modal */}
        {limitReached && (
          <div className="mt-6 rounded-2xl border border-border-default bg-bg-surface p-6 text-center space-y-4">
            <div>
              <p className="font-semibold text-[16px] text-text-primary">
                You&apos;ve used your free posters
              </p>
              <p className="font-mono text-[12px] text-text-muted mt-1">
                Upgrade to keep creating — or buy a single poster if you&apos;re not ready to subscribe.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPricingModalOpen(true)}
                className="w-full sm:w-auto bg-accent text-black font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-accent-dim transition-colors"
              >
                Upgrade to Pro
              </button>
              <button
                type="button"
                onClick={() => setPricingModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-bg-elevated border border-border-default text-text-primary font-semibold text-[13px] px-5 py-3 rounded-xl hover:border-border-strong transition-colors"
              >
                Buy 1 poster · {getPerPosterPriceForCountry(countryCode).label}
              </button>
            </div>
            <p className="font-mono text-[10px] text-text-muted">
              Pro = {(() => {
                const proPrice = getPerPosterPriceForCountry(countryCode);
                return proPrice.currency === "TZS"
                  ? "30,000 TZS/mo for 50 posters (~600 TZS each)"
                  : "$12/mo for 50 posters (~$0.24 each)";
              })()}. Save {getPerPosterPriceForCountry(countryCode).currency === "TZS" ? "6x" : "6x"} with monthly.
            </p>
          </div>
        )}

        {/* Generation mode tabs — directly under header */}
        <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mt-6 mb-2">
          Generation mode
        </p>
        <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-xl p-1 w-full max-w-xl">
          {(
            [
              { id: "ai" as GenerateMode, label: "AI Pick", icon: <Sparkles size={13} /> },
              { id: "template" as GenerateMode, label: "Templates", icon: <LayoutTemplate size={13} /> },
              { id: "inspiration" as GenerateMode, label: "Inspiration", icon: <ImagePlus size={13} /> },
              { id: "product" as GenerateMode, label: "Product", icon: <Package size={13} /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-150 ${
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

          {/* Image provider selector */}
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-muted mb-4">
              Image provider
            </p>
            {trial.active && trial.modelLockedToSeedream ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-accent/30 bg-accent/5">
                <Lock size={16} className="text-accent shrink-0" />
                <div>
                  <p className="font-semibold text-[13px] text-text-primary">Premium model (Seedream)</p>
                  <p className="font-mono text-[11px] text-text-muted mt-0.5">Your free trial uses our best model.</p>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 gap-2">
              {IMAGE_PROVIDERS.map((p) => {
                const selected = imageProviderId === p.id;
                const providerLocked = isProviderLockedForPlan(p.id, plan);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (providerLocked) {
                        setPricingModalOpen(true);
                        return;
                      }
                      setImageProviderId(p.id);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                      providerLocked
                        ? "border-border-subtle bg-bg-elevated/50 opacity-80 hover:opacity-100 cursor-pointer"
                        : selected
                          ? "border-accent bg-accent/8 ring-1 ring-accent/20"
                          : "border-border-default bg-bg-elevated hover:border-border-strong"
                    }`}
                  >
                    <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${providerLocked ? "border-border-strong" : selected ? "border-accent" : "border-border-strong"}`}>
                      {providerLocked ? <Lock size={10} className="text-text-muted" /> : selected && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-[13px] ${providerLocked ? "text-text-muted" : selected ? "text-text-primary" : "text-text-secondary"}`}>
                          {p.label}
                        </span>
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full border ${
                          p.provider === "gemini"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                            : "border-border-default bg-bg-base text-text-muted"
                        }`}>
                          {p.badge}
                        </span>
                        {providerLocked && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Business
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-text-muted mt-0.5 leading-relaxed">
                        {providerLocked ? "Upgrade to Business to use this model." : p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            )}

            {/* Optional: Enhance prompt with Freepik (AI Pick mode) */}
            {mode === "ai" && (
              <label className="mt-4 flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={useImprovePrompt}
                  onChange={(e) => setUseImprovePrompt(e.target.checked)}
                  className="w-4 h-4 rounded border-border-default bg-bg-elevated text-accent focus:ring-accent/30"
                />
                <span className="font-mono text-[12px] text-text-secondary group-hover:text-text-primary">
                  Enhance prompt with Freepik (adds lighting, composition & style details)
                </span>
              </label>
            )}
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

          {/* Product mode */}
          {mode === "product" && (
            <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-accent" />
                  <span className="font-semibold text-[14px] text-text-primary">Select product</span>
                </div>
                <p className="font-mono text-[10px] text-text-muted mt-0.5">
                  Pick a product from your library. The AI will use it as the poster brief.
                </p>
              </div>

              <div className="p-4">
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={16} className="text-accent animate-spin" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={24} className="text-text-muted mx-auto mb-2" />
                    <p className="font-mono text-[12px] text-text-muted mb-3">No products yet</p>
                    <a href="/dashboard/products" className="font-mono text-[12px] text-accent hover:underline">
                      + Add your first product →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                          selectedProduct?.id === p.id
                            ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                            : "border-border-default bg-bg-elevated hover:border-border-strong"
                        }`}
                      >
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center shrink-0">
                            <Package size={16} className="text-text-muted" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[13px] text-text-primary truncate">{p.name}</p>
                          <p className="font-mono text-[10px] text-text-muted">
                            {p.priceLabel}
                            {p.discountPriceLabel && <span className="text-accent ml-1.5">→ {p.discountPriceLabel}</span>}
                            {p.category && <span className="ml-1.5">· {p.category}</span>}
                          </p>
                        </div>
                        {selectedProduct?.id === p.id && (
                          <CheckCircle size={16} className="text-accent shrink-0" />
                        )}
                      </button>
                    ))}
                    <a href="/dashboard/products" className="block text-center font-mono text-[11px] text-text-muted hover:text-accent pt-1 transition-colors">
                      Manage products →
                    </a>
                  </div>
                )}
              </div>

              {selectedProduct && (
                <div>
                  {/* Poster intent */}
                  <div className="px-5 py-4 border-t border-border-subtle">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted mb-3">Poster intent</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(([
                        { id: "showcase", label: "Showcase", icon: <ShoppingBag size={13} />, desc: "Feature the product & benefits" },
                        { id: "promote", label: "Promote / Sell", icon: <Zap size={13} />, desc: "Price front & center, hard CTA" },
                        { id: "educate", label: "Educate", icon: <BookOpen size={13} />, desc: "How it works, problem → solution" },
                        { id: "testimonial", label: "Testimonial", icon: <Star size={13} />, desc: "Quote + social proof" },
                      ]) as { id: ProductIntent; label: string; icon: React.ReactNode; desc: string }[]).map(intent => (
                        <button
                          key={intent.id}
                          type="button"
                          onClick={() => setProductIntent(intent.id)}
                          className={`flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all duration-150 ${
                            productIntent === intent.id
                              ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                              : "border-border-default bg-bg-elevated hover:border-border-strong"
                          }`}
                        >
                          <div className={`flex items-center gap-1.5 ${productIntent === intent.id ? "text-accent" : "text-text-muted"}`}>
                            {intent.icon}
                            <span className="font-semibold text-[12px] text-text-primary">{intent.label}</span>
                          </div>
                          <p className="font-mono text-[10px] text-text-muted leading-relaxed">{intent.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional overrides */}
                  <div className="px-5 py-4 border-t border-border-subtle">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted mb-3">
                      Options <span className="text-text-muted/60">(optional)</span>
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-text-secondary">Show price</span>
                        <button
                          type="button"
                          onClick={() => setProductOverrides(o => ({ ...o, showPrice: !o.showPrice }))}
                          className={`relative w-10 h-5 rounded-full transition-all duration-200 ${productOverrides.showPrice ? "bg-accent" : "bg-bg-elevated border border-border-strong"}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${productOverrides.showPrice ? "left-5 bg-black" : "left-0.5 bg-text-muted"}`} />
                        </button>
                      </div>
                      {selectedProduct.discountPrice != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] text-text-secondary">Show discount</span>
                          <button
                            type="button"
                            onClick={() => setProductOverrides(o => ({ ...o, showDiscount: !o.showDiscount }))}
                            className={`relative w-10 h-5 rounded-full transition-all duration-200 ${productOverrides.showDiscount ? "bg-accent" : "bg-bg-elevated border border-border-strong"}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${productOverrides.showDiscount ? "left-5 bg-black" : "left-0.5 bg-text-muted"}`} />
                          </button>
                        </div>
                      )}
                      <div>
                        <span className="text-[13px] text-text-secondary block mb-1.5">Urgency</span>
                        <div className="relative">
                          <select
                            value={productOverrides.urgency ?? "none"}
                            onChange={e => setProductOverrides(o => ({ ...o, urgency: e.target.value as ProductOverrides["urgency"] }))}
                            className="w-full appearance-none bg-bg-elevated border border-border-default rounded-xl px-3 py-2.5 pr-8 text-[13px] text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
                          >
                            <option value="none">None</option>
                            <option value="limited_stock">Limited stock</option>
                            <option value="ends_soon">Ends soon</option>
                            <option value="ends_today">Ends today</option>
                            <option value="ends_sunday">Ends Sunday</option>
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content recommendations + custom brief — on all tabs except Product (product IS the brief) */}
          <div className={`bg-bg-surface border border-border-default rounded-2xl overflow-hidden${mode === "product" ? " hidden" : ""}`}>
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
                onClick={() => {
                  if (limitReached) {
                    setPricingModalOpen(true);
                    return;
                  }
                  if (selectedKit) loadRecommendations(selectedKit.id);
                }}
                disabled={loadingRecs && !limitReached}
                className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-text-primary bg-bg-elevated border border-border-default rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
              >
                {limitReached ? (
                  <>Upgrade to use</>
                ) : (
                  <>
                    <RefreshCw size={11} className={loadingRecs ? "animate-spin" : ""} />
                    Refresh
                  </>
                )}
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
                {recommendations.map((rec, index) => {
                  const isLocked = limitReached || (plan === "free" && index >= 2);
                  const isSelected = !isLocked && selectedRec?.id === rec.id && !useCustom;
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
                        if (isLocked) {
                          setPricingModalOpen(true);
                          return;
                        }
                        setSelectedRec(rec);
                        setUseCustom(false);
                      }}
                      className={`
                        text-left rounded-xl border p-4 transition-all duration-150 space-y-2.5 relative
                        ${isLocked
                          ? "border-border-subtle bg-bg-elevated/50 opacity-75 hover:opacity-90 cursor-pointer"
                          : isSelected
                            ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                            : "border-border-default bg-bg-elevated hover:border-border-strong hover:bg-bg-elevated/80"}
                      `}
                    >
                      {isLocked && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 font-mono text-[9px] text-text-muted">
                          <Lock size={10} />
                          Upgrade to use
                        </div>
                      )}
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
            (mode === "inspiration" && (inspirationUrl.trim() || inspirationFile || inspirationImageUrl.trim()) && (selectedRec || (useCustom && customTopic))) ||
            (mode === "product" && selectedProduct) ? (
              <div className="bg-bg-surface border border-border-default rounded-2xl p-4 space-y-2 animate-fade-up">
                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  {mode === "ai" ? "Ready" : mode === "template" ? "Template + content" : mode === "inspiration" ? "Inspiration + content" : "Product poster"}
                </p>
                {mode === "product" && selectedProduct ? (
                  <>
                    <p className="font-semibold text-[13px] text-text-primary leading-tight">{selectedProduct.name}</p>
                    <p className="font-mono text-[11px] text-text-muted">{selectedProduct.priceLabel} · {productIntent}</p>
                  </>
                ) : (
                  <>
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
            {trial.active && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 px-3 py-2.5 space-y-0.5">
                <p className="font-mono text-[11px] text-text-secondary">
                  {trial.endsAt != null
                    ? `Trial ends in ${Math.max(0, Math.ceil((trial.endsAt - Date.now()) / (24 * 60 * 60 * 1000)))} days`
                    : "Free trial"}
                </p>
                <p className="font-semibold text-[12px] text-accent">
                  {trial.postsRemaining > 0 ? "1 free post remaining" : "Trial used"}
                </p>
              </div>
            )}
            {trial.trialCompleted && plan === "free" && (
              <div className="rounded-xl border border-border-default bg-bg-elevated px-3 py-2.5">
                <p className="font-mono text-[11px] text-text-muted">Trial used — upgrade to keep creating.</p>
                <button
                  type="button"
                  onClick={() => setPricingModalOpen(true)}
                  className="mt-2 font-semibold text-[12px] text-accent hover:underline"
                >
                  Upgrade
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={limitReached ? () => setPricingModalOpen(true) : handleGenerate}
              disabled={
                !limitReached &&
                (generating ||
                !selectedPlatform ||
                (mode === "ai" && !selectedRec && !(useCustom && customTopic.trim())) ||
                (mode === "template" && (selectedTemplateId == null || (!selectedRec && !(useCustom && customTopic.trim())))) ||
                (mode === "inspiration" && (!inspirationUrl.trim() && !inspirationImageUrl.trim() || (!selectedRec && !(useCustom && customTopic.trim())))) ||
                (mode === "product" && !selectedProduct))
              }
              className="w-full bg-accent text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-accent-dim transition-all duration-200 active:scale-[0.99] min-h-[52px] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="font-mono text-[12px]">{generationStep || "Generating..."}</span>
                </>
              ) : limitReached ? (
                <>
                  Upgrade to continue
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
              !(mode === "inspiration" && (inspirationUrl.trim() || inspirationImageUrl.trim()) && (selectedRec || (useCustom && customTopic))) &&
              !(mode === "product" && selectedProduct) && (
              <p className="font-mono text-[10px] text-text-muted text-center">
                {mode === "ai"
                  ? "Select a recommendation or write a brief"
                  : mode === "template"
                    ? "Select a template and choose content"
                    : mode === "product"
                      ? "Select a product above"
                      : "Set inspiration image and choose content"}
              </p>
            )}
            {((mode === "ai" && (selectedRec || (useCustom && customTopic))) ||
              (mode === "template" && selectedTemplateId != null && (selectedRec || (useCustom && customTopic))) ||
              (mode === "inspiration" && (inspirationUrl.trim() || inspirationImageUrl.trim()) && (selectedRec || (useCustom && customTopic))) ||
              (mode === "product" && selectedProduct)) && (
              <p className="font-mono text-[10px] text-text-muted text-center">Takes 30–60 seconds</p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: fixed bottom bar — sits above the bottom nav (≈56px) */}
      <div className="fixed left-0 right-0 px-4 pt-3 pb-4 bg-bg-base/95 backdrop-blur border-t border-border-subtle md:hidden z-40" style={{ bottom: "calc(56px + env(safe-area-inset-bottom, 0px))" }}>
        <button
          type="button"
          onClick={limitReached ? () => setPricingModalOpen(true) : handleGenerate}
          disabled={
            !limitReached &&
            (generating ||
            !selectedPlatform ||
            (mode === "ai" && !selectedRec && !(useCustom && customTopic.trim())) ||
            (mode === "template" && (selectedTemplateId == null || (!selectedRec && !(useCustom && customTopic.trim())))) ||
            (mode === "inspiration" && (!inspirationUrl.trim() && !inspirationImageUrl.trim() || (!selectedRec && !(useCustom && customTopic.trim())))) ||
            (mode === "product" && !selectedProduct))
          }
          className="w-full bg-accent text-black font-semibold text-[15px] py-4 rounded-xl hover:bg-accent-dim transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px]"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="font-mono text-[13px]">{generationStep || "Generating..."}</span>
            </>
          ) : limitReached ? (
            "Upgrade to continue"
          ) : (
            <>
              <Sparkles size={18} />
              Generate poster
            </>
          )}
        </button>
      </div>

      <PricingModal
        open={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        currentPlan={plan}
        countryCode={countryCode}
        profilePhoneNumber={profilePhoneNumber}
        onPlanSelected={() => {
          setPricingModalOpen(false);
          loadBrandKits();
        }}
      />
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-base flex items-center justify-center">
          <Loader2 size={18} className="animate-spin text-accent" />
        </div>
      }
    >
      <CreatePageContent />
    </Suspense>
  );
}
