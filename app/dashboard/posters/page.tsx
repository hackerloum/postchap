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
  Instagram,
  Pencil,
  X,
  RefreshCw,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Poster {
  id: string;
  imageUrl: string | null;
  backgroundImageUrl: string | null;
  originalImageUrl: string | null;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
  theme: string;
  topic?: string;
  status: string;
  version: number;
  postStatus?: string | null;
  scheduledFor?: number | null;
  postedAt?: number | null;
  instagramPostId?: string | null;
  createdAt: number | null;
  hasEditableLayout?: boolean;
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
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [postingToInstagram, setPostingToInstagram] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ headline: "", subheadline: "", body: "", cta: "", hashtags: "" });
  const [recompositing, setRecompositing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [fixInstruction, setFixInstruction] = useState("");
  const [fixing, setFixing] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [cancellingSchedule, setCancellingSchedule] = useState(false);
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
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((d) => d?.instagram?.connected && setInstagramConnected(true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setEditMode(false);
  }, [selected?.id]);

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

  function openEditMode(poster: Poster) {
    setEditForm({
      headline:    poster.headline ?? "",
      subheadline: poster.subheadline ?? "",
      body:        poster.body ?? "",
      cta:         poster.cta ?? "",
      hashtags:    poster.hashtags?.join(" ") ?? "",
    });
    setEditMode(true);
  }

  async function handleRecomposite() {
    if (!selected) return;
    const token = await getClientIdToken();
    if (!token) { toast.error("Please sign in"); return; }

    setRecompositing(true);
    try {
      const body = {
        headline:    editForm.headline.trim()    || undefined,
        subheadline: editForm.subheadline.trim() || undefined,
        body:        editForm.body.trim()        || undefined,
        cta:         editForm.cta.trim()         || undefined,
        hashtags:    editForm.hashtags.trim()
          ? editForm.hashtags.split(/\s+/).map(h => h.startsWith("#") ? h : `#${h}`).filter(Boolean)
          : undefined,
      };

      const res = await fetch(`/api/posters/${selected.id}/recomposite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Recomposite failed");
        return;
      }
      const updated: Poster = {
        ...selected,
        imageUrl:    data.imageUrl,
        version:     data.version,
        headline:    data.copy?.headline    ?? selected.headline,
        subheadline: data.copy?.subheadline ?? selected.subheadline,
        body:        data.copy?.body        ?? selected.body,
        cta:         data.copy?.cta         ?? selected.cta,
        hashtags:    data.copy?.hashtags    ?? selected.hashtags,
      };
      setSelected(updated);
      setPosters(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditMode(false);
      toast.success("Poster updated successfully");
    } catch {
      toast.error("Recomposite failed");
    } finally {
      setRecompositing(false);
    }
  }

  async function handleRegenerate() {
    if (!selected) return;
    const token = await getClientIdToken();
    if (!token) { toast.error("Please sign in"); return; }
    if (!confirm("Generate a new version of this poster with a different visual style? The original is kept.")) return;

    setRegenerating(true);
    try {
      const res = await fetch(`/api/posters/${selected.id}/regenerate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Regenerate failed");
        return;
      }
      toast.success("New version generated!");
      const listRes = await fetch("/api/posters", { headers: { Authorization: `Bearer ${token}` } });
      const listData = await listRes.json();
      const list = listData.posters ?? [];
      setPosters(list);
      const fresh = list.find((p: Poster) => p.id === data.posterId);
      if (fresh) setSelected(fresh);
    } catch {
      toast.error("Regenerate failed");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleFix() {
    if (!selected || !fixInstruction.trim()) return;
    const token = await getClientIdToken();
    if (!token) { toast.error("Please sign in"); return; }

    setFixing(true);
    try {
      const res = await fetch(`/api/posters/${selected.id}/fix`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ instruction: fixInstruction.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Fix failed");
        return;
      }

      setFixInstruction("");

      if (data.scope === "copy" && data.imageUrl) {
        // Update the current poster in-place
        const updated: Poster = {
          ...selected,
          imageUrl:    data.imageUrl,
          version:     data.version,
          headline:    data.copy?.headline    ?? selected.headline,
          subheadline: data.copy?.subheadline ?? selected.subheadline,
          body:        data.copy?.body        ?? selected.body,
          cta:         data.copy?.cta         ?? selected.cta,
        };
        setSelected(updated);
        setPosters(prev => prev.map(p => p.id === updated.id ? updated : p));
        toast.success("Fix applied");
      } else {
        // New poster was created — refresh list and navigate to it
        toast.success("New version created!");
        const listRes = await fetch("/api/posters", { headers: { Authorization: `Bearer ${token}` } });
        const listData = await listRes.json();
        const list = listData.posters ?? [];
        setPosters(list);
        if (data.posterId) {
          const fresh = list.find((p: Poster) => p.id === data.posterId);
          if (fresh) setSelected(fresh);
        }
      }
    } catch {
      toast.error("Fix failed");
    } finally {
      setFixing(false);
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

  async function handlePostToInstagram(poster: Poster) {
    if (!poster.imageUrl) {
      toast.error("No image found for this poster");
      return;
    }
    setPostingToInstagram(true);
    try {
      const caption = [
        poster.headline,
        poster.body,
        poster.hashtags?.join(" ") ?? "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/social/instagram/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          posterId: poster.id,
          imageUrl: poster.imageUrl,
          caption,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to post to Instagram");
        return;
      }
      toast.success(`Posted to @${data.username ?? "Instagram"} successfully!`);
      loadPosters();
    } catch {
      toast.error("Failed to post to Instagram");
    } finally {
      setPostingToInstagram(false);
    }
  }

  async function handleScheduleInstagram(poster: Poster) {
    if (!poster.imageUrl) {
      toast.error("No image found for this poster");
      return;
    }
    const token = await getClientIdToken();
    if (!token) { toast.error("Please sign in"); return; }

    const date = scheduleDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const scheduledFor = `${date}T${scheduleTime}:00.000Z`;

    setScheduling(true);
    try {
      const res = await fetch(`/api/posters/${poster.id}/schedule-instagram`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scheduledFor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to schedule");
        return;
      }
      toast.success("Post scheduled");
      setScheduleModalOpen(false);
      loadPosters();
    } catch {
      toast.error("Failed to schedule");
    } finally {
      setScheduling(false);
    }
  }

  async function handleCancelSchedule(poster: Poster) {
    const token = await getClientIdToken();
    if (!token) { toast.error("Please sign in"); return; }

    setCancellingSchedule(true);
    try {
      const res = await fetch(`/api/posters/${poster.id}/cancel-schedule`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to cancel");
        return;
      }
      toast.success("Schedule cancelled");
      loadPosters();
    } catch {
      toast.error("Failed to cancel");
    } finally {
      setCancellingSchedule(false);
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
    <div className="flex flex-col h-[calc(100vh-104px)] md:h-[calc(100vh-48px)] overflow-hidden bg-bg-base">
      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b border-border-subtle shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors border-b-2 ${
              mobileTab === tab
                ? "text-text-primary border-accent"
                : "text-text-muted border-transparent"
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
              <div className="h-12 border-b border-border-subtle flex items-center justify-between px-3 sm:px-5 shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-semibold text-[12px] sm:text-[13px] text-text-primary truncate">
                    {selected?.headline}
                  </span>
                  {selected?.theme && (
                    <span className="hidden sm:inline font-mono text-[10px] text-text-muted bg-bg-surface border border-border-default rounded-full px-2 py-0.5 shrink-0">
                      {selected.theme}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => selected && handleDuplicate(selected.id)}
                    disabled={!selected || duplicatingId === selected?.id}
                    className="flex items-center gap-1 bg-bg-surface border border-border-default text-text-secondary font-medium text-[12px] px-2 sm:px-3 py-1.5 rounded-lg hover:border-border-strong hover:text-text-primary transition-all min-h-[32px] disabled:opacity-50"
                    title="Duplicate"
                  >
                    {duplicatingId === selected?.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>
                  {selected?.hasEditableLayout && (
                    <Link
                      href={`/dashboard/posters/${selected.id}/edit`}
                      className="flex items-center gap-1 bg-[#e8ff47]/10 border border-[#e8ff47]/40 text-[#e8ff47] font-medium text-[12px] px-2 sm:px-3 py-1.5 rounded-lg hover:bg-[#e8ff47]/20 transition-all min-h-[32px]"
                      title="Open in editor"
                    >
                      <Pencil size={12} />
                      <span className="hidden sm:inline">Edit layers</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => selected && handleOpenInNewTab(selected.id)}
                    disabled={!selected}
                    className="flex items-center gap-1 bg-bg-surface border border-border-default text-text-secondary font-medium text-[12px] px-2 sm:px-3 py-1.5 rounded-lg hover:border-border-strong hover:text-text-primary transition-all min-h-[32px] disabled:opacity-50"
                    title="Open"
                  >
                    <ExternalLink size={12} />
                    <span className="hidden sm:inline">Open</span>
                  </button>
                  {instagramConnected && selected && (
                    <div className="flex items-center gap-1.5">
                      {selected.postStatus === "posted" ? (
                        <span className="hidden sm:flex font-mono text-[10px] text-text-muted items-center gap-1">
                          <CheckCircle size={10} className="text-success" />
                          Posted {selected.postedAt ? formatDate(selected.postedAt) : ""}
                        </span>
                      ) : selected.postStatus === "scheduled" && selected.scheduledFor ? (
                        <>
                          <span className="hidden sm:flex font-mono text-[10px] text-text-muted items-center gap-1">
                            <CalendarClock size={10} />
                            {formatDate(selected.scheduledFor)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCancelSchedule(selected)}
                            disabled={cancellingSchedule}
                            className="text-[11px] text-text-muted hover:text-text-secondary"
                          >
                            {cancellingSchedule ? "…" : "Cancel"}
                          </button>
                        </>
                      ) : selected.postStatus === "failed" ? (
                        <button
                          type="button"
                          onClick={() => handlePostToInstagram(selected)}
                          disabled={postingToInstagram}
                          className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent"
                        >
                          {postingToInstagram ? <Loader2 size={10} className="animate-spin" /> : null}
                          Retry
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => selected && handlePostToInstagram(selected)}
                            disabled={postingToInstagram}
                            className="flex items-center gap-1 bg-gradient-to-r from-[#f09433] to-[#bc1888] text-white font-semibold text-[12px] px-2 sm:px-3 py-1.5 rounded-lg hover:opacity-90 transition-all min-h-[32px] disabled:opacity-50"
                            title="Post to Instagram"
                          >
                            {postingToInstagram ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Instagram size={12} />
                            )}
                            <span className="hidden sm:inline">Post now</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
                              setScheduleTime("08:00");
                              setScheduleModalOpen(true);
                            }}
                            className="hidden sm:flex items-center gap-1.5 bg-bg-surface border border-border-default text-text-secondary font-medium text-[12px] px-2 sm:px-3 py-1.5 rounded-lg hover:border-border-strong transition-all min-h-[32px]"
                          >
                            <CalendarClock size={12} />
                            Schedule
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => selected && handleDownload(selected.id)}
                    disabled={!selected}
                    className="flex items-center gap-1 bg-accent text-black font-semibold text-[12px] px-2 sm:px-3 py-1.5 rounded-lg hover:bg-accent-dim transition-all min-h-[32px] disabled:opacity-50"
                    title="Download"
                  >
                    <Download size={12} />
                    <span className="hidden sm:inline">Download</span>
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

              {/* Schedule modal */}
              {scheduleModalOpen && selected && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                  onClick={() => !scheduling && setScheduleModalOpen(false)}
                >
                  <div
                    className="bg-bg-base border border-border-default rounded-xl p-5 w-full max-w-sm mx-4 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="font-semibold text-[14px] text-text-primary mb-3">Schedule for Instagram</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="font-mono text-[10px] uppercase text-text-muted block mb-1">Date</label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] uppercase text-text-muted block mb-1">Time</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[13px]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setScheduleModalOpen(false)}
                        disabled={scheduling}
                        className="flex-1 bg-bg-elevated border border-border-default text-text-secondary font-medium text-[12px] px-3 py-2.5 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScheduleInstagram(selected)}
                        disabled={scheduling}
                        className="flex-1 bg-accent text-black font-semibold text-[12px] px-3 py-2.5 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {scheduling ? <Loader2 size={12} className="animate-spin" /> : null}
                        {scheduling ? "Scheduling…" : "Schedule"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Fix bar */}
              {selected && (
                <div className="border-t border-border-subtle px-5 py-3 bg-bg-surface shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={fixInstruction}
                      onChange={e => setFixInstruction(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !fixing && fixInstruction.trim() && handleFix()}
                      placeholder="Tell us what to fix… e.g. Make the headline shorter"
                      className="flex-1 bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors min-h-[38px]"
                    />
                    <button
                      type="button"
                      onClick={handleFix}
                      disabled={!fixInstruction.trim() || fixing}
                      className="flex items-center gap-1.5 bg-accent text-black font-semibold text-[12px] px-3 py-2 rounded-xl hover:bg-accent-dim transition-colors disabled:opacity-50 min-h-[38px] shrink-0"
                    >
                      {fixing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {fixing ? "Fixing…" : "Fix"}
                    </button>
                  </div>
                </div>
              )}
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
          <div className="h-12 border-b border-border-subtle flex items-center justify-between px-4 shrink-0">
            {editMode ? (
              <>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent">
                  Edit copy
                </span>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-muted">
                  Copy details
                </span>
                <div className="flex items-center gap-1">
                  {selected?.backgroundImageUrl && (
                    <button
                      type="button"
                      onClick={() => selected && openEditMode(selected)}
                      className="flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-accent transition-colors px-1.5 py-1 rounded"
                      title="Edit copy text"
                    >
                      <Pencil size={10} />
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!selected || regenerating}
                    onClick={handleRegenerate}
                    className="flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-text-primary transition-colors px-1.5 py-1 rounded disabled:opacity-50"
                    title="Regenerate with same content brief"
                  >
                    {regenerating ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                    {regenerating ? "..." : "Regen"}
                  </button>
                </div>
              </>
            )}
          </div>

          {editMode && selected ? (
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
              <p className="font-mono text-[10px] text-text-muted leading-relaxed">
                Edit the text fields below. Click &quot;Apply changes&quot; to re-render the poster with new copy — no new image is generated.
              </p>

              <div className="space-y-2.5">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1">Headline</label>
                  <input
                    type="text"
                    value={editForm.headline}
                    onChange={e => setEditForm(f => ({ ...f, headline: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent transition-colors"
                    placeholder="Headline text"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1">Subheadline</label>
                  <input
                    type="text"
                    value={editForm.subheadline}
                    onChange={e => setEditForm(f => ({ ...f, subheadline: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent transition-colors"
                    placeholder="Subheadline text"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1">CTA</label>
                  <input
                    type="text"
                    value={editForm.cta}
                    onChange={e => setEditForm(f => ({ ...f, cta: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent transition-colors"
                    placeholder="Call to action"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1">Hashtags</label>
                  <input
                    type="text"
                    value={editForm.hashtags}
                    onChange={e => setEditForm(f => ({ ...f, hashtags: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent transition-colors"
                    placeholder="#tag1 #tag2 #tag3"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 bg-bg-elevated border border-border-default text-text-secondary font-medium text-[12px] px-3 py-2.5 rounded-lg hover:border-border-strong transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={recompositing}
                  onClick={handleRecomposite}
                  className="flex-1 bg-accent text-black font-semibold text-[12px] px-3 py-2.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {recompositing ? (
                    <><Loader2 size={12} className="animate-spin" /> Applying…</>
                  ) : (
                    <>Apply changes</>
                  )}
                </button>
              </div>
            </div>
          ) : (
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
                  { label: "Version", value: selected?.version ? `v${selected.version}` : undefined },
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
          )}
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
