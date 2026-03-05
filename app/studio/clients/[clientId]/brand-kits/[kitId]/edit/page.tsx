"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

interface BrandKit {
  id: string;
  brandName?: string;
  industry?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  tone?: string;
  styleNotes?: string;
  website?: string;
  kitPurpose: string;
  isDefault: boolean;
}

const KIT_PURPOSES = [
  { value: "main", label: "Main brand" },
  { value: "sub-brand", label: "Sub-brand" },
  { value: "campaign", label: "Campaign" },
  { value: "seasonal", label: "Seasonal" },
];

const TONES = ["professional", "casual", "luxury", "playful", "bold", "minimalist"];

export default function EditClientBrandKitPage({
  params,
}: {
  params: Promise<{ clientId: string; kitId: string }>;
}) {
  const { clientId, kitId } = use(params);
  const router = useRouter();
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = await getClientIdToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/studio/clients/${clientId}/brand-kits/${kitId}`, { headers });
        if (res.ok) setKit((await res.json()).kit);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [clientId, kitId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!kit) return;
    setSaving(true);
    setError("");
    try {
      const token = await getClientIdToken();
      const res = await fetch(`/api/studio/clients/${clientId}/brand-kits/${kitId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(kit),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      router.push(`/studio/clients/${clientId}`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-5 py-8"><div className="h-8 w-48 bg-bg-surface rounded animate-pulse" /></div>;
  if (!kit) return <div className="max-w-2xl mx-auto px-5 py-8"><p className="text-text-muted font-mono text-[13px]">Brand kit not found.</p></div>;

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <Link href={`/studio/clients/${clientId}`} className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors font-mono text-[12px] mb-6">
        <ArrowLeft size={14} />
        Back to client
      </Link>

      <h1 className="font-semibold text-[24px] text-text-primary tracking-tight mb-1">Edit brand kit</h1>
      <p className="font-mono text-[13px] text-text-muted mb-8">{kit.brandName || "Unnamed kit"}</p>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-[13px] text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Kit metadata */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Kit settings</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Kit purpose</label>
              <select value={kit.kitPurpose} onChange={(e) => setKit({ ...kit, kitPurpose: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary outline-none focus:border-info transition-colors">
                {KIT_PURPOSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => setKit({ ...kit, isDefault: !kit.isDefault })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors text-[13px] font-medium ${
                  kit.isDefault
                    ? "bg-accent/10 border-accent/20 text-accent"
                    : "bg-bg-base border-border-default text-text-muted hover:border-border-strong"
                }`}
              >
                <Star size={14} />
                {kit.isDefault ? "Default kit" : "Set as default"}
              </button>
            </div>
          </div>
        </div>

        {/* Brand info */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Brand</p>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Brand name</label>
            <input type="text" value={kit.brandName ?? ""} onChange={(e) => setKit({ ...kit, brandName: e.target.value })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Industry</label>
              <input type="text" value={kit.industry ?? ""} onChange={(e) => setKit({ ...kit, industry: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Website</label>
              <input type="url" value={kit.website ?? ""} onChange={(e) => setKit({ ...kit, website: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
            </div>
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Tagline</label>
            <input type="text" value={kit.tagline ?? ""} onChange={(e) => setKit({ ...kit, tagline: e.target.value })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
          </div>
        </div>

        {/* Colors */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Colors</p>
          <div className="grid grid-cols-3 gap-3">
            {(["primaryColor", "secondaryColor", "accentColor"] as const).map((field) => (
              <div key={field}>
                <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2 capitalize">
                  {field.replace("Color", "")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={kit[field] ?? "#111111"}
                    onChange={(e) => setKit({ ...kit, [field]: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-border-default cursor-pointer bg-bg-base"
                  />
                  <input
                    type="text"
                    value={kit[field] ?? ""}
                    onChange={(e) => setKit({ ...kit, [field]: e.target.value })}
                    className="flex-1 bg-bg-base border border-border-default rounded-xl px-3 py-2.5 text-[12px] font-mono text-text-primary outline-none focus:border-info transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tone & style */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Voice & style</p>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setKit({ ...kit, tone })}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] capitalize transition-colors border ${
                    kit.tone === tone
                      ? "bg-info/10 border-info/20 text-info"
                      : "bg-bg-base border-border-default text-text-muted hover:border-border-strong"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Style notes</label>
            <textarea rows={3} value={kit.styleNotes ?? ""} onChange={(e) => setKit({ ...kit, styleNotes: e.target.value })}
              placeholder="e.g. Always use bold headlines. Never use stock people photos."
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors resize-none" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 bg-info text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-info/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[52px]">
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Save changes"}
          </button>
          <Link href={`/studio/clients/${clientId}`}
            className="px-6 py-3.5 bg-bg-surface border border-border-default text-text-secondary font-medium text-[14px] rounded-xl hover:border-border-strong transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
