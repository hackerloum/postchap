"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Search,
  Palette,
  Lock,
  Download,
  RefreshCw,
} from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { IMAGE_PROVIDERS, DEFAULT_IMAGE_PROVIDER, isProviderLockedForPlan } from "@/lib/image-models";
import { Button } from "@/components/studio/ui";
import CreateLoading from "./loading";
import "./create-page.css";

interface Client {
  id: string;
  clientName: string;
  industry?: string;
  status: string;
}

interface BrandKit {
  id: string;
  brandName?: string;
  kitPurpose: string;
  isDefault: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
}

interface StudioRecommendation {
  theme: string;
  topic: string;
  description?: string;
  suggestedHeadline?: string;
  suggestedCta?: string;
  visualMood?: string;
  hashtags?: string[];
}

const PLATFORM_FORMATS = [
  { id: "1080x1080", label: "Square", dimensions: "1080 × 1080", desc: "Instagram · Facebook", ratio: 1, w: 52, h: 52 },
  { id: "1080x1350", label: "Portrait", dimensions: "1080 × 1350", desc: "Instagram Feed", ratio: 4/5, w: 42, h: 52 },
  { id: "1080x1920", label: "Story", dimensions: "1080 × 1920", desc: "Stories · Reels", ratio: 9/16, w: 29, h: 52 },
  { id: "1920x1080", label: "Landscape", dimensions: "1920 × 1080", desc: "Cover · Banner", ratio: 16/9, w: 64, h: 36 },
];

const CLIENT_AVATAR_COLORS = ["#E8FF47", "#818cf8", "#4ade80", "#f472b6", "#67e8f9", "#fbbf24"];

const TONE_OPTIONS = ["Professional", "Friendly", "Bold", "Elegant", "Playful"];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "sw", label: "Swahili" },
  { value: "fr", label: "French" },
  { value: "ha", label: "Hausa" },
  { value: "yo", label: "Yoruba" },
  { value: "ar", label: "Arabic" },
];

const LOADING_MESSAGES = [
  "Analyzing brand kit...",
  "Composing layout...",
  "Applying brand colors...",
  "Adding finishing touches...",
];

function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") ?? "";
  const preselectedOccasion = searchParams.get("occasion") ?? "";

  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId);
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState("");
  const [platformFormatId, setPlatformFormatId] = useState("1080x1080");
  const [occasion, setOccasion] = useState(preselectedOccasion);
  const [tone, setTone] = useState("Professional");
  const [useEditableLayout, setUseEditableLayout] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [headlineOverride, setHeadlineOverride] = useState("");
  const [ctaOverride, setCtaOverride] = useState("");
  const [posterLanguage, setPosterLanguage] = useState("en");
  const [imageProviderId, setImageProviderId] = useState(DEFAULT_IMAGE_PROVIDER);
  const [studioPlan, setStudioPlan] = useState("starter");
  const [usage, setUsage] = useState<{ used: number; limit: number | null }>({ used: 0, limit: null });
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<{ posterId: string; imageUrl: string } | null>(null);
  const [recommendations, setRecommendations] = useState<StudioRecommendation[] | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<StudioRecommendation | null>(null);
  const [previewTab, setPreviewTab] = useState<"instagram" | "facebook" | "whatsapp">("instagram");

  const clientsLoadedRef = useRef(false);

  useEffect(() => {
    const tokenP = getClientIdToken();
    tokenP.then((token) => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      Promise.all([
        fetch("/api/studio/agency", { headers, cache: "no-store" }),
        fetch("/api/studio/usage", { headers, cache: "no-store" }),
      ]).then(([agencyRes, usageRes]) => {
        if (agencyRes.ok) agencyRes.json().then((d) => d?.agency?.plan && setStudioPlan(d.agency.plan));
        if (usageRes.ok) usageRes.json().then((u) => setUsage({ used: u.postersUsedThisMonth ?? 0, limit: u.posterLimit ?? null }));
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (loading) {
      const t = setInterval(() => {
        if (cancelled) return;
        setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 2500);
      return () => { cancelled = true; clearInterval(t); };
    }
  }, [loading]);

  useEffect(() => {
    async function load() {
      const token = await getClientIdToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      if (!clientsLoadedRef.current) {
        clientsLoadedRef.current = true;
        const fetches: Promise<Response>[] = [fetch("/api/studio/clients?status=active", { headers, cache: "no-store" })];
        if (preselectedClientId) fetches.push(fetch(`/api/studio/clients/${preselectedClientId}/brand-kits`, { headers, cache: "no-store" }));
        const results = await Promise.all(fetches);
        const clientsRes = results[0];
        const kitsRes = preselectedClientId ? results[1] : null;
        if (clientsRes.ok) {
          const d = await clientsRes.json();
          const list = (d.clients ?? []) as Client[];
          setClients(list);
          if (preselectedClientId && list.some((c) => c.id === preselectedClientId) && kitsRes?.ok) {
            const kitData = await kitsRes.json();
            const kitList: BrandKit[] = kitData.kits ?? [];
            setKits(kitList);
            const def = kitList.find((k) => k.isDefault) ?? kitList[0];
            if (def) setSelectedKitId(def.id);
          }
        }
        return;
      }
      if (!selectedClientId) {
        setKits([]);
        setSelectedKitId("");
        return;
      }
      try {
        const res = await fetch(`/api/studio/clients/${selectedClientId}/brand-kits`, { headers, cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const kitList: BrandKit[] = data.kits ?? [];
          setKits(kitList);
          const def = kitList.find((k) => k.isDefault) ?? kitList[0];
          if (def) setSelectedKitId(def.id);
        }
      } catch {}
    }
    load();
  }, [preselectedClientId, selectedClientId]);

  async function fetchRecommendations() {
    if (!selectedClientId || !selectedKitId) return;
    setRecommendationLoading(true);
    setError("");
    setRecommendations(null);
    setSelectedRecommendation(null);
    try {
      const token = await getClientIdToken();
      const res = await fetch("/api/studio/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ clientId: selectedClientId, brandKitId: selectedKitId }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.recommendations)) setRecommendations(data.recommendations);
      else setError(data.error ?? "Could not load suggestions");
    } catch {
      setError("Failed to load suggestions");
    } finally {
      setRecommendationLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedClientId || !selectedKitId) return;
    setLoading(true);
    setError("");
    try {
      const recommendationPayload = selectedRecommendation
        ? {
            theme: selectedRecommendation.theme,
            topic: selectedRecommendation.topic,
            description: selectedRecommendation.description ?? "",
            suggestedHeadline: (headlineOverride.trim() || selectedRecommendation.suggestedHeadline) ?? "",
            suggestedCta: (ctaOverride.trim() || selectedRecommendation.suggestedCta) ?? "",
            visualMood: selectedRecommendation.visualMood ?? "",
            hashtags: selectedRecommendation.hashtags,
          }
        : occasion
          ? { theme: occasion, topic: occasion, visualMood: "", suggestedHeadline: headlineOverride.trim() || "", suggestedCta: ctaOverride.trim() || "" }
          : { theme: "", topic: "", visualMood: "", suggestedHeadline: headlineOverride.trim() || "", suggestedCta: ctaOverride.trim() || "" };

      const token = await getClientIdToken();
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          clientId: selectedClientId,
          brandKitId: selectedKitId,
          platformFormatId,
          useEditableLayout,
          recommendation: recommendationPayload,
          imageProviderId: imageProviderId || undefined,
          posterLanguage: posterLanguage || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setGenerated({ posterId: data.posterId, imageUrl: data.imageUrl });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedKit = kits.find((k) => k.id === selectedKitId);
  const filteredClients = clients.filter(
    (c) =>
      c.clientName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.industry ?? "").toLowerCase().includes(clientSearch.toLowerCase())
  );

  const step1Complete = !!selectedClientId;
  const step2Complete = !!selectedKitId && kits.length > 0;
  const step3Complete = true;
  const stepsComplete = step1Complete && step2Complete;
  const currentStep = !step1Complete ? 1 : !step2Complete ? 2 : 3;

  const format = PLATFORM_FORMATS.find((f) => f.id === platformFormatId) ?? PLATFORM_FORMATS[0];
  const aspectRatio = format.ratio;

  if (generated) {
    return (
      <div className="studio-create-root max-w-none -mx-4 md:-mx-8 w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] min-h-[calc(100vh-140px)] studio-create-body flex flex-col md:flex-row">
        <div className="studio-create-left">
          <div className="studio-create-left-scroll pb-6">
            <div className="max-w-md mx-auto text-center pt-12">
              <CheckCircle2 size={48} className="text-[#E8FF47] mb-4" />
              <h2 className="text-[20px] font-semibold text-[#fafafa] mb-2">Poster generated</h2>
              <p className="text-[13px] text-[#71717a] mb-6">Ready for review and approval.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="secondary" size="md" onClick={() => setGenerated(null)}>
                  Generate another
                </Button>
                <Link
                  href={`/studio/posters?clientId=${selectedClientId}`}
                  className="inline-flex items-center justify-center font-medium rounded-lg h-[38px] px-4 text-[13px] bg-[#E8FF47] text-[#080808] font-semibold hover:bg-[#B8CC38] hover:-translate-y-px"
                >
                  View poster
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="studio-create-right">
          <div className="studio-create-preview-inner">
            <div className="studio-create-canvas-wrap max-w-full max-h-full">
              <div className="studio-create-canvas-inner aspect-square w-80">
                <img src={generated.imageUrl} alt="Generated poster" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <a
                href={generated.imageUrl}
                download="poster.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center font-medium rounded-lg h-8 px-3 text-[13px] bg-[#111111] border border-[#ffffff0f] text-[#fafafa] hover:bg-[#181818] hover:border-[#ffffff18] transition-all"
              >
                <Download size={14} className="mr-1" /> Download
              </a>
              <Link
                href={`/studio/posters?clientId=${selectedClientId}`}
                className="inline-flex items-center justify-center font-medium rounded-lg h-8 px-3 text-[13px] min-h-[32px] bg-[#E8FF47] text-[#080808] font-semibold hover:bg-[#B8CC38] rounded-lg"
              >
                Approve
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setGenerated(null)}>
                <RefreshCw size={14} className="mr-1" /> Regenerate
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-create-root max-w-none -mx-4 md:-mx-8 w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] min-h-[calc(100vh-140px)] studio-create-body flex flex-col md:flex-row">
      {/* Left panel */}
      <div className="studio-create-left">
        <div className="studio-create-left-scroll" style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? "none" : "auto" }}>
          {error && (
            <div style={{ marginBottom: 16, padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 13, color: "#ef4444" }}>
              {error}
            </div>
          )}

          {/* Step 1 — Client */}
          <div className="studio-create-step">
            <div className={`studio-create-step-num ${step1Complete ? "complete" : currentStep === 1 ? "active" : ""}`}>
              {step1Complete ? <CheckCircle2 size={14} /> : "1"}
            </div>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 6 }}>01  CLIENT</p>
            <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>Select a client</h3>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search clients..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  paddingLeft: 36,
                  paddingRight: 12,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>
            {clients.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>No active clients yet.</p>
                <Link href="/studio/clients/new" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>Add a client →</Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {filteredClients.map((client, idx) => {
                  const isSelected = selectedClientId === client.id;
                  const color = CLIENT_AVATAR_COLORS[idx % CLIENT_AVATAR_COLORS.length];
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      style={{
                        padding: "14px 16px",
                        background: isSelected ? "rgba(232,255,71,0.05)" : "var(--bg-surface)",
                        border: `1px solid ${isSelected ? "rgba(232,255,71,0.25)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 10,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: `${color}26`,
                          border: `1px solid ${color}40`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "var(--font-display)",
                          color: color,
                        }}
                      >
                        {client.clientName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.clientName}</p>
                        {client.industry && <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.industry}</p>}
                      </div>
                      {isSelected && <CheckCircle2 size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2 — Brand kit */}
          {selectedClientId && (
            <div className="studio-create-step">
              <div className={`studio-create-step-num ${step2Complete ? "complete" : currentStep === 2 ? "active" : ""}`}>
                {step2Complete ? <CheckCircle2 size={14} /> : "2"}
              </div>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 6 }}>02  BRAND KIT</p>
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>Choose a brand kit</h3>
              {kits.length === 0 ? (
                <div style={{ padding: 24, background: "var(--bg-surface)", border: "1px dashed var(--border)", borderRadius: 10, textAlign: "center" }}>
                  <Palette size={24} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>This client has no brand kit yet.</p>
                  <Link
                    href={`/studio/clients/${selectedClientId}/brand-kits/new`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "var(--accent)", color: "#080808", borderRadius: 8, fontSize: 12, fontWeight: 600 }}
                  >
                    <Palette size={14} /> Add brand kit
                  </Link>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    {kits.map((kit) => {
                      const isSelectedKit = selectedKitId === kit.id;
                      const colors = [kit.primaryColor, kit.secondaryColor, kit.accentColor].filter(Boolean) as string[];
                      return (
                        <button
                          key={kit.id}
                          type="button"
                          onClick={() => setSelectedKitId(kit.id)}
                          style={{
                            width: 160,
                            padding: 14,
                            background: isSelectedKit ? "rgba(232,255,71,0.05)" : "var(--bg-surface)",
                            border: `1px solid ${isSelectedKit ? "rgba(232,255,71,0.25)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: 10,
                            textAlign: "left",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", gap: -4, marginBottom: 10 }}>
                            {(colors.length ? colors : ["#333"]).slice(0, 4).map((c, i) => (
                              <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: "2px solid var(--bg-surface)", marginLeft: i === 0 ? 0 : -4 }} />
                            ))}
                          </div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{kit.brandName || "Unnamed kit"}</p>
                          {kit.isDefault ? (
                            <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(232,255,71,0.08)", border: "1px solid rgba(232,255,71,0.2)", color: "var(--accent)", borderRadius: 4 }}>Default</span>
                          ) : (
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Secondary</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedKit && (
                    <div style={{ padding: "14px 16px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.14em", color: "var(--text-muted)" }}>BRAND PREVIEW</span>
                        <Link href={`/studio/clients/${selectedClientId}/brand-kits/${selectedKit.id}/edit`} style={{ fontSize: 10, color: "var(--text-muted)" }}>Edit kit →</Link>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        {[selectedKit.primaryColor, selectedKit.secondaryColor, selectedKit.accentColor].filter(Boolean).slice(0, 3).map((c, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: c! }} />
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{c}</span>
                          </div>
                        ))}
                      </div>
                      {selectedKit.logoUrl && (
                        <div style={{ marginTop: 8 }}>
                          <img src={selectedKit.logoUrl} alt="" style={{ height: 32, width: "auto", objectFit: "contain" }} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3 — Format */}
          <div className="studio-create-step">
            <div className={`studio-create-step-num ${stepsComplete ? "complete" : currentStep === 3 ? "active" : ""}`}>
              {stepsComplete ? <CheckCircle2 size={14} /> : "3"}
            </div>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 6 }}>03  FORMAT</p>
            <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>Choose format</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {PLATFORM_FORMATS.map((fmt) => {
                const isSelected = platformFormatId === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setPlatformFormatId(fmt.id)}
                    style={{
                      padding: 16,
                      background: isSelected ? "rgba(232,255,71,0.05)" : "var(--bg-surface)",
                      border: `1px solid ${isSelected ? "rgba(232,255,71,0.3)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 10,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: fmt.w,
                        height: fmt.h,
                        maxHeight: 64,
                        background: isSelected ? "rgba(232,255,71,0.08)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isSelected ? "rgba(232,255,71,0.25)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 4,
                      }}
                    />
                    <p style={{ fontSize: 12, fontWeight: 500, color: isSelected ? "var(--accent)" : "var(--text-primary)" }}>{fmt.label}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{fmt.dimensions}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{fmt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4 — Occasion / Theme */}
          <div className="studio-create-step">
            <div className="studio-create-step-num">4</div>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 6 }}>04  OCCASION / THEME</p>
            <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>Content & tone</h3>
            <button
              type="button"
              onClick={fetchRecommendations}
              disabled={recommendationLoading || !selectedClientId || !selectedKitId}
              style={{
                height: 36,
                paddingLeft: 16,
                paddingRight: 16,
                background: "transparent",
                border: "1px solid rgba(232,255,71,0.2)",
                color: "var(--accent)",
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {recommendationLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Suggest content
            </button>
            {recommendations && recommendations.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {recommendations.map((rec, i) => {
                  const isSelected = selectedRecommendation === rec;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSelectedRecommendation(rec); setOccasion(rec.theme); }}
                      className="studio-create-chip"
                      style={{
                        animationDelay: `${i * 50}ms`,
                        padding: "6px 12px",
                        fontSize: 11,
                        background: isSelected ? "rgba(232,255,71,0.08)" : "var(--bg-surface)",
                        border: `1px solid ${isSelected ? "rgba(232,255,71,0.2)" : "var(--border-hover)"}`,
                        borderRadius: 6,
                        color: isSelected ? "var(--accent)" : "var(--text-secondary)",
                      }}
                    >
                      {rec.theme}
                    </button>
                  );
                })}
              </div>
            )}
            <textarea
              placeholder="Describe your poster theme..."
              value={occasion}
              onChange={(e) => { setOccasion(e.target.value); if (selectedRecommendation) setSelectedRecommendation(null); }}
              maxLength={200}
              style={{
                width: "100%",
                minHeight: 80,
                padding: "14px 16px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-hover)",
                borderRadius: 10,
                fontSize: 13,
                color: "var(--text-primary)",
                outline: "none",
                resize: "vertical",
                marginBottom: 8,
              }}
            />
            <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right", marginBottom: 16 }}>{occasion.length} / 200</p>
            <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8 }}>TONE</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 11,
                    background: tone === t ? "var(--accent)" : "var(--bg-surface)",
                    color: tone === t ? "#080808" : "var(--text-secondary)",
                    border: tone === t ? "none" : "1px solid var(--border-hover)",
                    fontWeight: tone === t ? 600 : 400,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Step 5 — Options (collapsible) */}
          <div className="studio-create-step">
            <div className="studio-create-step-num">5</div>
            <button
              type="button"
              onClick={() => setOptionsExpanded(!optionsExpanded)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: optionsExpanded ? 16 : 0 }}
            >
              <div>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 6 }}>05  OPTIONS</p>
                <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>Advanced options</h3>
              </div>
              <ChevronRight size={18} style={{ color: "var(--text-muted)", transform: optionsExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {optionsExpanded && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "var(--text-primary)" }}>Editable layout</span>
                  <button
                    type="button"
                    role="switch"
                    onClick={() => setUseEditableLayout(!useEditableLayout)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: useEditableLayout ? "var(--accent)" : "rgba(255,255,255,0.08)",
                      border: "none",
                      position: "relative",
                    }}
                  >
                    <span style={{ position: "absolute", top: 2, left: useEditableLayout ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Optional headline override..."
                  value={headlineOverride}
                  onChange={(e) => setHeadlineOverride(e.target.value)}
                  style={{ width: "100%", height: 38, padding: "0 12px", marginBottom: 12, background: "var(--bg-surface)", border: "1px solid var(--border-hover)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)" }}
                />
                <input
                  type="text"
                  placeholder="e.g. Shop Now, Call Us, Visit Us"
                  value={ctaOverride}
                  onChange={(e) => setCtaOverride(e.target.value)}
                  style={{ width: "100%", height: 38, padding: "0 12px", marginBottom: 12, background: "var(--bg-surface)", border: "1px solid var(--border-hover)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)" }}
                />
                <select
                  value={posterLanguage}
                  onChange={(e) => setPosterLanguage(e.target.value)}
                  style={{ width: "100%", height: 38, padding: "0 12px", background: "var(--bg-surface)", border: "1px solid var(--border-hover)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <p style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8 }}>IMAGE MODEL</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {IMAGE_PROVIDERS.map((p) => {
                    const mappedPlan = studioPlan === "agency" ? "business" : studioPlan === "pro" ? "pro" : "free";
                    const locked = isProviderLockedForPlan(p.id, mappedPlan as "free" | "pro" | "business");
                    const selected = imageProviderId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { if (!locked) setImageProviderId(p.id); }}
                        style={{
                          padding: "10px 12px",
                          background: selected ? "rgba(232,255,71,0.06)" : "var(--bg-surface)",
                          border: `1px solid ${selected ? "rgba(232,255,71,0.2)" : "var(--border)"}`,
                          borderRadius: 8,
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          opacity: locked ? 0.7 : 1,
                        }}
                      >
                        {locked ? <Lock size={12} style={{ color: "var(--text-muted)" }} /> : null}
                        <span style={{ fontSize: 12, fontWeight: 500, color: selected ? "var(--accent)" : "var(--text-primary)" }}>{p.label}</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate button footer */}
        <div className="studio-create-generate-footer">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !stepsComplete}
            className="studio-create-generate-btn"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} /> GENERATE POSTER
              </>
            )}
          </button>
          {!stepsComplete && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>Complete steps 1–3 to generate</p>
          )}
        </div>
      </div>

      {/* Right panel — Preview */}
      <div className="studio-create-right">
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", color: "var(--text-muted)" }}>PREVIEW</span>
          <div style={{ display: "flex", gap: 16 }}>
            {(["instagram", "facebook", "whatsapp"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewTab(tab)}
                style={{
                  fontSize: 10,
                  color: previewTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottom: previewTab === tab ? "1px solid var(--accent)" : "none",
                  paddingBottom: 4,
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className={`studio-create-preview-inner studio-create-preview-dots ${loading ? "" : ""}`}>
          {loading ? (
            <>
              <div style={{ position: "relative", width: "100%", maxWidth: 320, aspectRatio: 1, background: "var(--bg-elevated)", borderRadius: 16, overflow: "hidden" }}>
                <div className="studio-create-scan-line" />
              </div>
              <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>Creating your poster</p>
              <span style={{ display: "inline-flex", gap: 4, marginTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "studio-create-pulse-dot 1s ease-in-out infinite" }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "studio-create-pulse-dot 1s ease-in-out infinite 0.2s" }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "studio-create-pulse-dot 1s ease-in-out infinite 0.4s" }} />
              </span>
              <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>{LOADING_MESSAGES[loadingMessageIndex]}</p>
            </>
          ) : !selectedClientId ? (
            <>
              <div style={{ fontSize: 80, color: "var(--accent)", opacity: 0.08, marginBottom: 16 }}>✦</div>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Select a client to begin</p>
            </>
          ) : selectedClient && selectedKit ? (
            <div className="studio-create-canvas-wrap" style={{ maxWidth: "100%", width: 280 }}>
              <div
                className="studio-create-canvas-inner"
                style={{
                  aspectRatio: aspectRatio,
                  background: selectedKit.primaryColor
                    ? `linear-gradient(135deg, ${selectedKit.primaryColor}22 0%, ${selectedKit.secondaryColor || selectedKit.primaryColor}18 50%, ${selectedKit.accentColor || selectedKit.primaryColor}12 100%)`
                    : "rgba(255,255,255,0.04)",
                }}
              >
                {selectedKit.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedKit.logoUrl} alt="" width={80} height={80} style={{ objectFit: "contain" }} />
                ) : (
                  <p className="font-display" style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>{selectedClient.clientName}</p>
                )}
              </div>
              <p style={{ marginTop: 12, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em" }}>{format.label.toUpperCase()} · {format.dimensions}</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 80, color: "var(--accent)", opacity: 0.08, marginBottom: 16 }}>✦</div>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Select a brand kit</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudioCreatePage() {
  return (
    <Suspense fallback={<CreateLoading />}>
      <CreateForm />
    </Suspense>
  );
}
