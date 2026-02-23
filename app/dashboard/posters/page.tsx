"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthClient } from "@/lib/firebase/client";
import { getClientIdToken } from "@/lib/auth-client";
import { Download, ExternalLink, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Poster {
  id: string;
  imageUrl: string | null;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
  theme: string;
  status: string;
  createdAt: number | null;
}

function PostersPageContent() {
  const searchParams = useSearchParams();
  const newPosterId = searchParams.get("new");

  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Poster | null>(null);
  const newRef = useRef<HTMLDivElement>(null);
  const noUserTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const auth = getAuthClient();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (noUserTimeoutRef.current) {
          clearTimeout(noUserTimeoutRef.current);
          noUserTimeoutRef.current = null;
        }
        loadPosters();
      } else {
        noUserTimeoutRef.current = setTimeout(() => {
          noUserTimeoutRef.current = null;
          setPosters([]);
          setSelected(null);
          setLoading(false);
        }, 500);
      }
    });
    return () => {
      unsubscribe();
      if (noUserTimeoutRef.current) clearTimeout(noUserTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (newPosterId && newRef.current) {
      setTimeout(() => {
        newRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500);
    }
  }, [newPosterId, posters]);

  async function loadPosters() {
    try {
      const auth = getAuthClient();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();

      const res = await fetch("/api/posters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = data.posters ?? [];
      setPosters(list);

      if (newPosterId) {
        const fresh = list.find((p: Poster) => p.id === newPosterId);
        if (fresh) setSelected(fresh);
        else if (list[0]) setSelected(list[0]);
      } else if (list[0]) {
        setSelected(list[0]);
      }
    } catch {
      toast.error("Failed to load posters");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(posterId: string) {
    const token = await getClientIdToken();
    if (!token) {
      toast.error("Please sign in to download");
      return;
    }
    try {
      const res = await fetch(`/api/posters/${posterId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Download failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `poster-${posterId}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch {
      toast.error("Download failed");
    }
  }

  async function handleOpenInNewTab(posterId: string) {
    const token = await getClientIdToken();
    if (!token) {
      toast.error("Please sign in to open");
      return;
    }
    try {
      const res = await fetch(`/api/posters/${posterId}/download?inline=1`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Failed to open");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      toast.error("Failed to open");
    }
  }

  function formatDate(ts: number | null): string {
    if (ts == null) return "";
    const date = new Date(ts);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 size={20} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-bg-base/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            ← Dashboard
          </Link>
          <span className="text-border-default">·</span>
          <h1 className="font-semibold text-sm text-text-primary">
            My Posters
          </h1>
          <span className="font-mono text-[11px] text-text-muted bg-bg-surface border border-border-default rounded-full px-2 py-0.5">
            {posters.length}
          </span>
        </div>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-1.5 bg-accent text-black font-semibold text-xs px-3 py-2 rounded-lg hover:bg-accent-dim transition-colors"
        >
          + Generate
        </Link>
      </header>

      {posters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-border-default flex items-center justify-center mb-4">
            <ImageIcon size={24} className="text-text-muted" />
          </div>
          <h2 className="font-semibold text-lg text-text-primary mb-2">
            No posters yet
          </h2>
          <p className="font-mono text-xs text-text-muted mb-6">
            Generate your first poster to get started
          </p>
          <Link
            href="/dashboard/create"
            className="bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors min-h-[44px] inline-flex items-center"
          >
            Generate first poster →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border-subtle overflow-y-auto lg:max-h-[calc(100vh-56px)]">
            {posters.map((poster) => (
              <div
                key={poster.id}
                ref={poster.id === newPosterId ? newRef : null}
                onClick={() => setSelected(poster)}
                className={`
                  flex items-center gap-3 p-4 cursor-pointer
                  border-b border-border-subtle
                  transition-colors duration-150
                  ${selected?.id === poster.id
                    ? "bg-bg-elevated border-l-2 border-l-accent"
                    : "hover:bg-bg-surface border-l-2 border-l-transparent"}
                `}
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-bg-elevated border border-border-default shrink-0 relative">
                  {poster.imageUrl ? (
                    <img
                      src={poster.imageUrl}
                      alt={poster.headline}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={16} className="text-text-muted" />
                    </div>
                  )}
                  {poster.id === newPosterId && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs text-text-primary truncate leading-tight">
                    {poster.headline}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted mt-0.5">
                    {poster.theme || "General"}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {formatDate(poster.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="flex-1 flex flex-col lg:max-h-[calc(100vh-56px)] overflow-y-auto">
              <div className="p-6 flex flex-col items-center">
                <div className="w-full max-w-md">
                  <div className="aspect-square w-full rounded-2xl overflow-hidden bg-bg-surface border border-border-default shadow-2xl">
                    {selected.imageUrl ? (
                      <img
                        src={selected.imageUrl}
                        alt={selected.headline}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <ImageIcon size={32} className="text-text-muted" />
                        <p className="font-mono text-xs text-text-muted">
                          Image not available
                        </p>
                      </div>
                    )}
                  </div>

                  {selected.imageUrl && (
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => handleDownload(selected.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-accent text-black font-semibold text-sm py-3 rounded-xl hover:bg-accent-dim transition-colors min-h-[48px]"
                      >
                        <Download size={16} />
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenInNewTab(selected.id)}
                        className="inline-flex items-center justify-center gap-2 bg-bg-surface border border-border-default text-text-primary text-sm font-medium px-4 py-3 rounded-xl hover:border-border-strong transition-colors min-h-[48px]"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-8 space-y-4 max-w-md mx-auto w-full">
                <div className="bg-bg-surface border border-border-default rounded-xl p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
                    Headline
                  </p>
                  <p className="font-semibold text-base text-text-primary">
                    {selected.headline}
                  </p>
                </div>

                {selected.subheadline && (
                  <div className="bg-bg-surface border border-border-default rounded-xl p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
                      Subheadline
                    </p>
                    <p className="text-sm text-text-secondary">
                      {selected.subheadline}
                    </p>
                  </div>
                )}

                {selected.body && (
                  <div className="bg-bg-surface border border-border-default rounded-xl p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
                      Body copy
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                      {selected.body}
                    </p>
                  </div>
                )}

                {selected.cta && (
                  <div className="bg-bg-surface border border-border-default rounded-xl p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
                      Call to action
                    </p>
                    <div className="inline-flex items-center bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5">
                      <span className="font-semibold text-sm text-accent">
                        {selected.cta}
                      </span>
                    </div>
                  </div>
                )}

                {selected.hashtags?.length > 0 && (
                  <div className="bg-bg-surface border border-border-default rounded-xl p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
                      Hashtags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[11px] text-accent bg-accent/5 border border-accent/20 rounded-full px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PostersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-base flex items-center justify-center">
          <Loader2 size={20} className="text-accent animate-spin" />
        </div>
      }
    >
      <PostersPageContent />
    </Suspense>
  );
}
