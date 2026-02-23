"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { getBrandKitsAction, type BrandKitItem } from "../brand-kits/actions";

export function CreatePosterForm({ brandKits: initialKits }: { brandKits: BrandKitItem[] }) {
  const [kits, setKits] = useState<BrandKitItem[]>(initialKits);
  const [kitsLoading, setKitsLoading] = useState(initialKits.length === 0);
  const [brandKitId, setBrandKitId] = useState(initialKits[0]?.id ?? "");
  const [theme, setTheme] = useState("");
  const [occasion, setOccasion] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialKits.length > 0) {
      setKits(initialKits);
      if (!brandKitId) setBrandKitId(initialKits[0].id);
      setKitsLoading(false);
      return;
    }
    setKitsLoading(true);
    (async () => {
      try {
        const token = await getClientIdToken();
        const list = await getBrandKitsAction(token ?? undefined);
        setKits(list);
        if (list.length > 0 && !brandKitId) setBrandKitId(list[0].id);
      } catch {
        setKits([]);
      } finally {
        setKitsLoading(false);
      }
    })();
  }, [initialKits.length]);

  const selectedKit = kits.find((k) => k.id === brandKitId);

  async function handleGenerate() {
    if (loading || kits.length === 0) return;
    setLoading(true);
    try {
      const token = await getClientIdToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          brandKitId,
          theme,
          occasion,
          customPrompt,
          posterSize: "1080x1080",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as { error?: string }).error || "Generation failed");
        return;
      }
      toast.success("Poster generated! High quality generation took 30–90 seconds.");
      setTheme("");
      setOccasion("");
      setCustomPrompt("");
      if (data.imageUrl) {
        window.open(data.imageUrl, "_blank");
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        toast.error("Generation timed out. Check My Posters in a minute.");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <h2 className="font-semibold text-sm text-text-primary mb-4">Brand kit</h2>
        {kitsLoading ? (
          <div className="py-8 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : kits.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-mono text-xs text-text-muted mb-4">No brand kits yet</p>
            <a href="/onboarding" className="text-accent font-mono text-xs hover:underline">
              Create a brand kit →
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {kits.map((kit) => (
              <button
                key={kit.id}
                type="button"
                onClick={() => setBrandKitId(kit.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  brandKitId === kit.id
                    ? "border-accent bg-accent/10"
                    : "border-border-default bg-bg-elevated hover:border-border-strong"
                }`}
              >
                <div className="flex gap-0.5">
                  {[kit.primaryColor, kit.secondaryColor, kit.accentColor].map((c, i) => (
                    <div key={i} className="w-3 h-3 rounded-full border border-white/10" style={{ background: c || "#333" }} />
                  ))}
                </div>
                <span className="font-medium text-sm text-text-primary">{kit.brandName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <h2 className="font-semibold text-sm text-text-primary mb-4">Content</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2">Theme or topic</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. New product launch, Black Friday sale"
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2">Occasion (optional)</label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            >
              <option value="">Select an occasion</option>
              <option value="monday">Monday motivation</option>
              <option value="flash">Flash sale</option>
              <option value="event">Event promo</option>
              <option value="tip">Tip of the day</option>
              <option value="milestone">Milestone / celebration</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2">Custom instructions (optional)</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add specific details, hashtags, or style preferences..."
              rows={3}
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <div className="aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-bg-elevated border border-border-default flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border-strong flex items-center justify-center mx-auto mb-3">
              <ImageIcon size={32} className="opacity-50 text-text-muted" />
            </div>
            <p className="font-mono text-[11px] text-text-muted">Preview will appear here</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || kits.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-accent text-black font-semibold text-sm py-4 rounded-xl hover:bg-accent-dim transition-colors disabled:opacity-50 min-h-[52px]"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Generating... (30–90s)
          </>
        ) : (
          "Generate poster"
        )}
      </button>
    </div>
  );
}
