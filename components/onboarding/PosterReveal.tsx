"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  Maximize2,
  ThumbsUp,
  Pencil,
  RefreshCw,
  X,
  CalendarClock,
  Bell,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/lib/firebase/auth";
import { getAspectRatio, downloadImage } from "@/lib/utils/poster";
import { toast } from "sonner";

type PosterData = {
  id: string;
  brandKitId: string;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
  imageUrl: string;
  posterSize?: string;
  status: string;
};

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PosterReveal({ brandKitName }: { brandKitName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const posterId = searchParams.get("posterId");
  const [poster, setPoster] = useState<PosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const user = auth?.currentUser ?? null;

  const fetchPoster = useCallback(async () => {
    if (!posterId || !user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/posters/${posterId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load poster");
      const data = (await res.json()) as PosterData;
      setPoster(data);
    } catch {
      toast.error("Failed to load poster");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [posterId, user, router]);

  useEffect(() => {
    if (!posterId) {
      router.replace("/dashboard");
      return;
    }
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchPoster();
  }, [posterId, user, router, fetchPoster]);

  const handleDownload = () => {
    if (!poster?.imageUrl) return;
    downloadImage(
      poster.imageUrl,
      `artmaster-poster-${poster.id}-${new Date().toISOString().slice(0, 10)}.png`
    );
  };

  const handleApprove = async () => {
    if (!posterId || !user) return;
    setApproving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/posters/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ posterId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Approve failed");
      toast.success("Poster approved ✓");
      setTimeout(() => {
        router.push("/dashboard?firstTime=true");
      }, 1500);
    } catch {
      toast.error("Failed to approve");
      setApproving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!poster?.brandKitId || !user) return;
    setRegenerating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandKitId: poster.brandKitId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Generate failed");
      const data = (await res.json()) as { posterId: string };
      router.push(`/generating?posterId=${data.posterId}&regenerating=true`);
    } catch {
      toast.error("Generation failed. Please try again.");
      setRegenerating(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    },
    []
  );
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (loading || !poster) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border-default border-t-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[55%_45%]">
          {/* Left — Poster */}
          <div>
            <div className="relative animate-reveal">
              <div className="relative overflow-hidden rounded-2xl border border-border-default shadow-2xl">
                <img
                  src={poster.imageUrl}
                  alt="Your generated poster"
                  className="w-full object-cover cursor-pointer"
                  style={{ aspectRatio: getAspectRatio(poster.posterSize ?? "1080x1080") }}
                  onClick={() => setZoomed(true)}
                />
              </div>
              <div
                className="absolute -right-3 -top-3 rounded-full bg-accent px-3 py-1.5 font-mono text-[11px] font-semibold text-black shadow-lg animate-fade-up"
                style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}
              >
                ✦ First poster
              </div>
            </div>
            <div className="mt-4 flex gap-2 animate-fade-in" style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg border border-border-default bg-transparent px-3 py-2 font-mono text-xs text-text-primary hover:bg-bg-surface"
              >
                <Download size={14} />
                Download
              </button>
              <button
                type="button"
                onClick={() => setZoomed(true)}
                className="flex items-center gap-2 rounded-lg border border-border-default bg-transparent px-3 py-2 font-mono text-xs text-text-primary hover:bg-bg-surface"
              >
                <Maximize2 size={14} />
                Full size
              </button>
            </div>
          </div>

          {/* Right — Content + Actions */}
          <div>
            <div className="animate-fade-up" style={{ animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-accent">
                Your first ArtMaster poster
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
                Here&apos;s what we made for {brandKitName}.
              </h2>
              <p className="mt-2 font-sans text-sm text-text-secondary">
                Review the content below. You can edit anything before approving. A new poster like
                this will be generated every day automatically.
              </p>
            </div>

            <div className="mt-6 space-y-3 animate-fade-in" style={{ animationDelay: "0.25s", opacity: 0, animationFillMode: "forwards" }}>
              <div className="rounded-xl border border-border-default bg-bg-surface p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Headline
                </p>
                <p className="font-sans text-sm font-semibold text-text-primary">{poster.headline}</p>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-surface p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Subheadline
                </p>
                <p className="font-sans text-sm text-text-secondary">{poster.subheadline}</p>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-surface p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Body Copy
                </p>
                <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-text-secondary">
                  {poster.body}
                </p>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-surface p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Call to Action
                </p>
                <p className="font-sans text-sm font-medium text-text-primary">{poster.cta}</p>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-surface p-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Hashtags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(poster.hashtags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "0.35s", opacity: 0, animationFillMode: "forwards" }}>
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-apple text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
              >
                {approving ? <Spinner size={16} /> : <ThumbsUp size={16} />}
                {approving ? "Approving..." : "Looks great — Approve poster"}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/posters/${posterId}`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-default bg-transparent px-4 py-3 font-apple text-sm text-text-primary hover:bg-bg-surface"
              >
                <Pencil size={14} />
                Edit content first
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex w-full items-center justify-center gap-2 py-2 font-mono text-xs text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50"
              >
                {regenerating ? <Spinner size={12} /> : <RefreshCw size={12} />}
                {regenerating ? "Regenerating..." : "Generate a different version"}
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-border-default bg-bg-surface p-4 animate-fade-in" style={{ animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                What happens next
              </p>
              <div className="space-y-2">
                {[
                  {
                    icon: CalendarClock,
                    text: "A new poster generates every morning at 8:00 AM",
                  },
                  {
                    icon: Bell,
                    text: "You'll review and approve each one from your dashboard",
                  },
                  {
                    icon: TrendingUp,
                    text: "Your brand shows up consistently, every single day",
                  },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Icon size={12} className="mt-0.5 shrink-0 text-accent" />
                    <p className="font-sans text-xs text-text-secondary">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          <img
            src={poster.imageUrl}
            alt="Poster full size"
            className="max-h-screen max-w-screen object-contain animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
