"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Sparkles, Loader2, Instagram, Download, RefreshCw } from "lucide-react";
import { PLATFORM_FORMATS } from "@/lib/generation/platformFormats";
import type { Recommendation } from "@/types/generation";

const THEMES = [
  { id: "promotion", label: "Promotion" },
  { id: "feature", label: "Feature highlight" },
  { id: "testimonial", label: "Social proof" },
  { id: "engagement", label: "Engagement" },
  { id: "brand", label: "Brand awareness" },
];

export default function AdminCreatePage() {
  const [platformFormatId, setPlatformFormatId] = useState("instagram_square");
  const [theme, setTheme] = useState("promotion");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [result, setResult] = useState<{ posterId: string; imageUrl: string } | null>(null);
  const [postingToInstagram, setPostingToInstagram] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    setGenerationStep("Generating copy...");

    const recommendation: Recommendation = {
      theme,
      topic: topic || theme,
      description: topic || `ArtMaster ${theme} poster`,
      suggestedHeadline: "",
      suggestedCta: "Try ArtMaster Free",
      visualMood: "modern, bold, professional",
    };

    try {
      setGenerationStep("Generating image...");
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ recommendation, platformFormatId, topic }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Generation failed");

      setResult({ posterId: data.posterId, imageUrl: data.imageUrl });
      toast.success("Poster generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
      setGenerationStep("");
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
        body: JSON.stringify({ imageUrl: result.imageUrl, caption: "" }),
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

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">Create Poster</h1>
        <p className="font-mono text-[12px] text-text-muted mt-1">
          Generate a poster for ArtMaster&apos;s own social media
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-5">
          {/* Platform format */}
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2 uppercase tracking-wide">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
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

          {/* Theme */}
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2 uppercase tracking-wide">
              Theme
            </label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
                    theme === t.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-default text-text-secondary hover:border-border-strong"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2 uppercase tracking-wide">
              Topic / angle (optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI poster generation, save time, free trial..."
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-[13px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-accent text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-accent-dim transition-colors disabled:opacity-50 min-h-[52px]"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {generationStep || "Generating..."}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Poster
              </>
            )}
          </button>
        </div>

        {/* Preview */}
        <div>
          {result ? (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-border-default">
                <img
                  src={result.imageUrl}
                  alt="Generated poster"
                  className="w-full object-cover"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePostToInstagram}
                  disabled={postingToInstagram}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#f09433] to-[#bc1888] text-white font-semibold text-[13px] py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {postingToInstagram ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Instagram size={14} />
                  )}
                  Post to Instagram
                </button>
                <a
                  href={result.imageUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-bg-elevated border border-border-default text-text-primary font-semibold text-[13px] px-4 py-3 rounded-xl hover:border-border-strong transition-all"
                >
                  <Download size={14} />
                  Download
                </a>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 bg-bg-elevated border border-border-default text-text-muted font-semibold text-[13px] px-4 py-3 rounded-xl hover:border-border-strong transition-all disabled:opacity-50"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-80 bg-bg-surface border border-border-default rounded-xl flex flex-col items-center justify-center gap-3 text-text-muted">
              {generating ? (
                <>
                  <Loader2 size={24} className="text-accent animate-spin" />
                  <p className="font-mono text-[12px]">{generationStep}</p>
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  <p className="font-mono text-[12px]">Your poster will appear here</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
