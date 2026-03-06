"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, ChevronDown, Users, Palette } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

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
}

/** Recommendation from API for content suggestions. */
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
  { id: "1080x1080", label: "Square (1:1)", desc: "Instagram, Facebook" },
  { id: "1080x1350", label: "Portrait (4:5)", desc: "Instagram Feed" },
  { id: "1080x1920", label: "Story (9:16)", desc: "Stories, Reels" },
];

function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") ?? "";
  const preselectedOccasion = searchParams.get("occasion") ?? "";

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId);
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState("");
  const [platformFormatId, setPlatformFormatId] = useState("1080x1080");
  const [occasion, setOccasion] = useState(preselectedOccasion);
  const [useEditableLayout, setUseEditableLayout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<{ posterId: string; imageUrl: string } | null>(null);
  const [recommendations, setRecommendations] = useState<StudioRecommendation[] | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<StudioRecommendation | null>(null);

  const clientsLoadedRef = useRef(false);

  useEffect(() => {
    async function load() {
      const token = await getClientIdToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      if (!clientsLoadedRef.current) {
        clientsLoadedRef.current = true;
        const fetches: Promise<Response>[] = [fetch("/api/studio/clients?status=active", { headers })];
        if (preselectedClientId) {
          fetches.push(fetch(`/api/studio/clients/${preselectedClientId}/brand-kits`, { headers }));
        }
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
        const res = await fetch(`/api/studio/clients/${selectedClientId}/brand-kits`, { headers });
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
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ clientId: selectedClientId, brandKitId: selectedKitId }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.error ?? "Could not load suggestions");
      }
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
            suggestedHeadline: selectedRecommendation.suggestedHeadline ?? "",
            suggestedCta: selectedRecommendation.suggestedCta ?? "",
            visualMood: selectedRecommendation.visualMood ?? "",
            hashtags: selectedRecommendation.hashtags,
          }
        : occasion
          ? { theme: occasion, topic: occasion, visualMood: "" }
          : null;

      const token = await getClientIdToken();
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          brandKitId: selectedKitId,
          platformFormatId,
          useEditableLayout,
          recommendation: recommendationPayload,
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

  if (generated) {
    return (
      <div className="max-w-lg mx-auto px-5 py-8 text-center">
        <div className="mb-6">
          <CheckCircle2 size={40} className="text-success mx-auto mb-4" />
          <h2 className="font-semibold text-[20px] text-text-primary mb-2">Poster generated!</h2>
          <p className="font-mono text-[12px] text-text-muted">Ready for review and approval.</p>
        </div>
        <div className="mb-6 rounded-2xl overflow-hidden border border-border-default">
          <img src={generated.imageUrl} alt="Generated poster" className="w-full" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setGenerated(null); }}
            className="flex-1 bg-bg-surface border border-border-default text-text-secondary font-medium text-[14px] py-3 rounded-xl hover:border-border-strong transition-colors"
          >
            Generate another
          </button>
          <Link
            href={`/studio/posters?clientId=${selectedClientId}`}
            className="flex-1 bg-info text-black font-semibold text-[14px] py-3 rounded-xl hover:bg-info/90 transition-colors text-center"
          >
            View poster
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <Link href="/studio" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors font-mono text-[12px] mb-6">
        <ArrowLeft size={14} />
        Back to Studio
      </Link>

      <h1 className="font-semibold text-[24px] text-text-primary tracking-tight mb-1">Generate poster</h1>
      <p className="font-mono text-[13px] text-text-muted mb-8">Select a client and brand kit, then generate.</p>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-[13px] text-error">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Client selector */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Client</p>
          {clients.length === 0 ? (
            <div className="text-center py-6">
              <Users size={20} className="text-text-muted mx-auto mb-2" />
              <p className="font-mono text-[12px] text-text-muted mb-3">No active clients yet.</p>
              <Link href="/studio/clients/new" className="font-mono text-[12px] text-info hover:underline">Add a client →</Link>
            </div>
          ) : (
            <div className="grid gap-2">
              {clients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    selectedClientId === client.id
                      ? "bg-info/10 border-info/20"
                      : "bg-bg-base border-border-default hover:border-border-strong"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center font-semibold text-[12px] text-text-primary shrink-0">
                    {client.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-medium text-[13px] ${selectedClientId === client.id ? "text-info" : "text-text-primary"}`}>
                      {client.clientName}
                    </p>
                    {client.industry && <p className="font-mono text-[11px] text-text-muted">{client.industry}</p>}
                  </div>
                  {selectedClientId === client.id && <CheckCircle2 size={15} className="ml-auto text-info" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Brand kit selector — always show when a client is selected */}
        {selectedClientId && (
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Brand kit</p>
            {kits.length === 0 ? (
              <div className="text-center py-6">
                <Palette size={22} className="text-text-muted mx-auto mb-2" />
                <p className="font-mono text-[12px] text-text-muted mb-2">This client has no brand kit yet.</p>
                <p className="font-mono text-[11px] text-text-muted mb-4">Add a brand kit (colors, logo, voice) to enable the Generate button.</p>
                <Link
                  href={`/studio/clients/${selectedClientId}/brand-kits/new`}
                  className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[12px] px-4 py-2.5 rounded-xl hover:bg-info/90 transition-colors"
                >
                  <Palette size={14} />
                  Add brand kit
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-2 mb-3">
                  {kits.map((kit) => (
                    <button
                      key={kit.id}
                      type="button"
                      onClick={() => setSelectedKitId(kit.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        selectedKitId === kit.id
                          ? "bg-info/10 border-info/20"
                          : "bg-bg-base border-border-default hover:border-border-strong"
                      }`}
                    >
                      {kit.primaryColor && (
                        <div className="w-6 h-6 rounded-full border border-border-default shrink-0" style={{ backgroundColor: kit.primaryColor }} />
                      )}
                      <div>
                        <p className={`font-medium text-[13px] ${selectedKitId === kit.id ? "text-info" : "text-text-primary"}`}>
                          {kit.brandName || "Unnamed kit"}
                        </p>
                        <p className="font-mono text-[11px] text-text-muted capitalize">{kit.kitPurpose}</p>
                      </div>
                      {kit.isDefault && <span className="ml-auto font-mono text-[10px] bg-bg-elevated px-1.5 py-0.5 rounded text-text-muted">Default</span>}
                      {selectedKitId === kit.id && <CheckCircle2 size={15} className="text-info" />}
                    </button>
                  ))}
                </div>
                <p className="font-mono text-[10px] text-text-muted">
                  To edit colors, logo & voice:{" "}
                  <Link href={`/studio/clients/${selectedClientId}`} className="text-info hover:underline">
                    Clients → {clients.find((c) => c.id === selectedClientId)?.clientName ?? "this client"}
                  </Link>
                  {" "}→ Brand kits → select a kit.
                </p>
              </>
            )}
          </div>
        )}

        {/* Platform format */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Format</p>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORM_FORMATS.map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setPlatformFormatId(fmt.id)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  platformFormatId === fmt.id
                    ? "bg-info/10 border-info/20"
                    : "bg-bg-base border-border-default hover:border-border-strong"
                }`}
              >
                <p className={`font-medium text-[12px] ${platformFormatId === fmt.id ? "text-info" : "text-text-primary"}`}>{fmt.label}</p>
                <p className="font-mono text-[10px] text-text-muted">{fmt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Occasion / theme + content suggestions */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Occasion / theme (optional)</p>
          <p className="font-mono text-[11px] text-text-muted mb-3">
            Get AI suggestions based on this client&apos;s industry and brand kit, or type your own.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={fetchRecommendations}
              disabled={recommendationLoading || !selectedClientId || !selectedKitId}
              className="inline-flex items-center gap-2 bg-bg-elevated border border-border-default hover:border-border-strong text-text-secondary font-medium text-[12px] px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {recommendationLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Suggest content
            </button>
          </div>
          {recommendations && recommendations.length > 0 && (
            <div className="mb-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">Pick a suggestion</p>
              <div className="flex flex-wrap gap-2">
                {recommendations.map((rec, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedRecommendation(rec);
                      setOccasion(rec.theme);
                    }}
                    className={`px-3 py-2 rounded-xl border text-left font-mono text-[11px] transition-colors ${
                      selectedRecommendation === rec
                        ? "bg-info/15 border-info/30 text-info"
                        : "bg-bg-base border-border-default hover:border-border-strong text-text-secondary"
                    }`}
                  >
                    {rec.theme}
                  </button>
                ))}
              </div>
            </div>
          )}
          <input
            type="text"
            placeholder="e.g. Eid Mubarak, New Year Sale, Grand Opening"
            value={occasion}
            onChange={(e) => {
              setOccasion(e.target.value);
              if (selectedRecommendation) setSelectedRecommendation(null);
            }}
            className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
          />
        </div>

        {/* Options */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Options</p>
          <button
            type="button"
            onClick={() => setUseEditableLayout(!useEditableLayout)}
            className="flex items-center justify-between w-full"
          >
            <div>
              <p className="font-medium text-[13px] text-text-primary">Editable layout</p>
              <p className="font-mono text-[11px] text-text-muted">Generate with editable text layers (Fabric.js)</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${useEditableLayout ? "bg-info" : "bg-bg-elevated border border-border-default"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${useEditableLayout ? "left-5.5" : "left-0.5"}`} />
            </div>
          </button>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !selectedClientId || !selectedKitId}
          className="w-full bg-info text-black font-semibold text-[15px] py-4 rounded-xl hover:bg-info/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[56px]"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate poster
            </>
          )}
        </button>

        {loading && (
          <p className="font-mono text-[11px] text-text-muted text-center">
            This usually takes 20–40 seconds...
          </p>
        )}
      </div>
    </div>
  );
}

export default function StudioCreatePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-5 py-8"><div className="h-8 w-48 bg-bg-surface rounded animate-pulse" /></div>}>
      <CreateForm />
    </Suspense>
  );
}
