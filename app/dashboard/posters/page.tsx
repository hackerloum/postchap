"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthClient } from "@/lib/firebase/client";
import { getClientIdToken } from "@/lib/auth-client";
import {
  Download,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Copy,
  Plus,
  CheckCircle,
  Sparkles,
} from "lucide-react";
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
  topic?: string;
  status: string;
  createdAt: number | null;
}

function CopyRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value?: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  function handleCopy() {
    navigator.clipboard.writeText(value!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group py-3 border-b border-border-subtle/50">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] text-text-muted hover:text-accent flex items-center gap-1"
        >
          {copied ? (
            <>
              <CheckCircle size={9} className="text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy size={9} /> Copy
            </>
          )}
        </button>
      </div>
      <p
        className={`text-[13px] text-text-primary leading-relaxed ${multiline ? "whitespace-pre-line" : "truncate"}`}
      >
        {value}
      </p>
    </div>
  );
}

function PostersPageContent() {
  const searchParams = useSearchParams();
  const newPosterId = searchParams.get("new");

  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Poster | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"List" | "Preview" | "Copy">("List");
  const newRef = useRef<HTMLButtonElement>(null);
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

  async function handleDuplicate(posterId: string) {
    const token = await getClientIdToken();
    if (!token) {
      toast.error("Please sign in to duplicate");
      return;
    }
    setDuplicatingId(posterId);
    try {
      const res = await fetch(`/api/posters/${posterId}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Duplicate failed");
        return;
      }
      const newId = data.posterId;
      toast.success("Poster duplicated");
      const listRes = await fetch("/api/posters", { headers: { Authorization: `Bearer ${token}` } });
      const listData = await listRes.json();
      const list = listData.posters ?? [];
      setPosters(list);
      const added = list.find((p: Poster) => p.id === newId);
      if (added) setSelected(added);
    } catch {
      toast.error("Duplicate failed");
    } finally {
      setDuplicatingId(null);
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 size={20} className="text-accent animate-spin" />
      </div>
    );
  }

  const tabs = ["List", "Preview", "Copy"] as const;

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden bg-bg-base">
      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b border-border-subtle shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              mobileTab === tab
                ? "text-text-primary border-b-2 border-accent"
                : "text-text-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — poster list */}
        <aside
          className={`
            w-[240px] shrink-0 bg-bg-surface border-r border-border-subtle
            flex flex-col overflow-hidden
            ${mobileTab !== "List" ? "hidden lg:flex" : ""}
          `}
        >
          <div className="flex items-center justify-between px-4 h-12 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[13px] text-text-primary">
                Posters
              </span>
              <span className="font-mono text-[10px] text-text-muted bg-bg-elevated border border-border-default rounded-full px-2 py-0.5">
                {posters.length}
              </span>
            </div>
            <Link
              href="/dashboard/create"
              className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center hover:bg-accent-dim transition-colors"
            >
              <Plus size={14} className="text-black" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {posters.map((poster) => (
              <button
                key={poster.id}
                ref={poster.id === newPosterId ? newRef : null}
                type="button"
                onClick={() => {
                  setSelected(poster);
                  setMobileTab("Preview");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-elevated transition-colors border-b border-border-subtle/40 text-left border-l-2 ${
                  selected?.id === poster.id
                    ? "bg-bg-elevated border-l-accent"
                    : "border-l-transparent"
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg-elevated shrink-0 relative">
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
                      <ImageIcon size={14} className="text-text-muted" />
                    </div>
                  )}
                  {poster.id === newPosterId && (
                    <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[12px] text-text-primary truncate leading-tight">
                    {poster.headline}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted truncate mt-0.5">
                    {poster.theme || "General"}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted/60 mt-0.5">
                    {formatDate(poster.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER — preview */}
        <section
          className={`
            flex-1 flex flex-col overflow-hidden bg-bg-base
            ${mobileTab !== "Preview" ? "hidden lg:flex" : ""}
          `}
        >
          {posters.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-border-default flex items-center justify-center">
                <ImageIcon size={20} className="text-text-muted" />
              </div>
              <div>
                <p className="font-semibold text-[15px] text-text-primary mb-1">
                  No posters yet
                </p>
                <p className="font-mono text-[12px] text-text-muted mb-5">
                  Generate your first poster to see it here
                </p>
                <Link
                  href="/dashboard/create"
                  className="bg-accent text-black font-semibold text-[13px] px-5 py-2.5 rounded-lg hover:bg-accent-dim transition-colors inline-flex items-center gap-2"
                >
                  <Sparkles size={14} />
                  Generate poster
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="h-12 border-b border-border-subtle flex items-center justify-between px-5 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-[13px] text-text-primary truncate max-w-xs">
                    {selected?.headline}
                  </span>
                  {selected?.theme && (
                    <span className="font-mono text-[10px] text-text-muted bg-bg-surface border border-border-default rounded-full px-2 py-0.5 shrink-0">
                      {selected.theme}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => selected && handleDuplicate(selected.id)}
                    disabled={!selected || duplicatingId === selected?.id}
                    className="flex items-center gap-1.5 bg-bg-surface border border-border-default text-text-secondary font-medium text-[12px] px-3 py-1.5 rounded-lg hover:border-border-strong hover:text-text-primary transition-all min-h-[32px] disabled:opacity-50"
                  >
                    {duplicatingId === selected?.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Copy size={12} />
                    )}
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => selected && handleOpenInNewTab(selected.id)}
                    disabled={!selected}
                    className="flex items-center gap-1.5 bg-bg-surface border border-border-default text-text-secondary font-medium text-[12px] px-3 py-1.5 rounded-lg hover:border-border-strong hover:text-text-primary transition-all min-h-[32px] disabled:opacity-50"
                  >
                    <ExternalLink size={12} />
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => selected && handleDownload(selected.id)}
                    disabled={!selected}
                    className="flex items-center gap-1.5 bg-accent text-black font-semibold text-[12px] px-3 py-1.5 rounded-lg hover:bg-accent-dim transition-all min-h-[32px] disabled:opacity-50"
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              </div>
              <div
                className="flex-1 overflow-auto scrollbar-hide flex items-center justify-center p-8"
                style={{
                  backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                {selected?.imageUrl ? (
                  <div className="relative shadow-2xl rounded-xl overflow-hidden max-w-sm w-full">
                    <img
                      src={selected.imageUrl}
                      alt={selected.headline}
                      className="w-full h-auto block"
                    />
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10">
                        <span className="font-mono text-[9px] text-white/70">
                          1080 × 1080
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <ImageIcon size={32} className="text-text-muted" />
                    <p className="font-mono text-[12px] text-text-muted">
                      Select a poster to preview
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* RIGHT — copy details */}
        <aside
          className={`
            w-80 shrink-0 bg-bg-surface border-l border-border-subtle
            flex flex-col overflow-hidden
            ${mobileTab !== "Copy" ? "hidden lg:flex" : ""}
          `}
        >
          <div className="h-12 border-b border-border-subtle flex items-center px-4 shrink-0">
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-muted">
              Copy details
            </span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-1">
            <CopyRow label="Headline" value={selected?.headline} />
            <CopyRow label="Subheadline" value={selected?.subheadline} />
            <CopyRow label="Body" value={selected?.body} multiline />

            {selected?.cta && (
              <div className="pt-2">
                <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">
                  Call to action
                </p>
                <div className="inline-flex items-center bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5">
                  <span className="font-semibold text-[13px] text-accent">
                    {selected.cta}
                  </span>
                </div>
              </div>
            )}

            {selected?.hashtags && selected.hashtags.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    Hashtags
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selected.hashtags.join(" "))}
                    className="font-mono text-[10px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
                  >
                    <Copy size={9} />
                    Copy all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.hashtags.map((tag) => (
                    <span
                      key={tag}
                      role="button"
                      tabIndex={0}
                      onClick={() => copyToClipboard(tag)}
                      onKeyDown={(e) => e.key === "Enter" && copyToClipboard(tag)}
                      className="font-mono text-[10px] text-text-muted bg-bg-elevated border border-border-default rounded-full px-2 py-0.5 hover:border-border-strong transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-border-subtle space-y-2">
              {[
                { label: "Theme", value: selected?.theme },
                { label: "Topic", value: selected?.topic },
                { label: "Created", value: formatDate(selected?.createdAt ?? null) },
                { label: "Status", value: selected?.status },
              ]
                .filter((r) => r.value)
                .map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="font-mono text-[10px] text-text-muted shrink-0">
                      {row.label}
                    </span>
                    <span className="font-mono text-[10px] text-text-secondary text-right leading-relaxed">
                      {row.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>
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
