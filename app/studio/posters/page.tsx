"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Images, Sparkles, CheckCircle2, Clock, AlertCircle, MessageCircle, Download } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { toast } from "sonner";

interface Poster {
  id: string;
  clientId: string;
  imageUrl: string;
  headline?: string;
  approvalStatus: string;
  platformFormatId?: string;
  createdAt: number | null;
}

interface Client {
  id: string;
  clientName: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-bg-elevated text-text-muted",
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  revision_requested: "bg-error/15 text-error",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Clock size={11} />,
  pending: <Clock size={11} />,
  approved: <CheckCircle2 size={11} />,
  revision_requested: <AlertCircle size={11} />,
};

function PostersContent() {
  const searchParams = useSearchParams();
  const clientIdFilter = searchParams.get("clientId") ?? "";

  const [posters, setPosters] = useState<Poster[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(clientIdFilter);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");

  async function loadPosters() {
    setLoading(true);
    try {
      const token = await getClientIdToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams();
      if (selectedClientId) params.set("clientId", selectedClientId);
      if (statusFilter !== "all") params.set("approvalStatus", statusFilter);
      params.set("limit", "50");
      params.set("_t", String(Date.now()));
      const res = await fetch(`/api/studio/posters?${params}`, { headers, cache: "no-store" });
      if (res.ok) setPosters((await res.json()).posters ?? []);
    } catch {}
    finally { setLoading(false); }
  }

  async function loadPostersAndClients() {
    const token = await getClientIdToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const params = new URLSearchParams();
    if (selectedClientId) params.set("clientId", selectedClientId);
    if (statusFilter !== "all") params.set("approvalStatus", statusFilter);
    params.set("limit", "50");
    params.set("_t", String(Date.now()));
    const [clientsRes, postersRes] = await Promise.all([
      fetch("/api/studio/clients?status=active", { headers, cache: "no-store" }),
      fetch(`/api/studio/posters?${params}`, { headers, cache: "no-store" }),
    ]);
    if (clientsRes.ok) setClients((await clientsRes.json()).clients ?? []);
    if (postersRes.ok) setPosters((await postersRes.json()).posters ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPostersAndClients()
      .then(() => { if (!cancelled) setLoading(false); })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedClientId, statusFilter]);

  // After "View poster" from create: refetch once so the newly generated poster appears (write may commit after first load)
  useEffect(() => {
    if (!selectedClientId) return;
    const t = setTimeout(() => {
      loadPostersAndClients();
    }, 800);
    return () => clearTimeout(t);
  }, [selectedClientId]);

  // Refetch when tab becomes visible again (debounced to avoid thrash on quick tab switches)
  useEffect(() => {
    let lastHiddenAt = 0;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const hiddenDuration = lastHiddenAt ? Date.now() - lastHiddenAt : 0;
        if (hiddenDuration > 1500) loadPostersAndClients();
      } else {
        lastHiddenAt = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [selectedClientId, statusFilter]);

  async function updateApproval(posterId: string, status: string, comment?: string) {
    setSubmittingApproval(true);
    try {
      const token = await getClientIdToken();
      const res = await fetch(`/api/studio/posters/${posterId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ approvalStatus: status, approvalComment: comment }),
      });
      if (res.ok) {
        toast.success(`Poster marked as ${status.replace("_", " ")}`);
        setSelectedPoster(null);
        setRevisionComment("");
        loadPosters();
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmittingApproval(false);
    }
  }

  async function downloadPoster(poster: Poster) {
    try {
      const a = document.createElement("a");
      a.href = poster.imageUrl;
      a.download = `poster-${poster.id}.jpg`;
      a.target = "_blank";
      a.click();
    } catch {
      toast.error("Download failed");
    }
  }

  const clientName = (clientId: string) => clients.find((c) => c.id === clientId)?.clientName ?? clientId;

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-semibold text-[24px] text-text-primary tracking-tight">Posters</h1>
          <p className="font-mono text-[13px] text-text-muted mt-1">{posters.length} total</p>
        </div>
        <Link href="/studio/create" className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[13px] px-4 py-2.5 rounded-xl hover:bg-info/90 transition-colors">
          <Sparkles size={14} />
          Generate
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="bg-bg-surface border border-border-default rounded-xl px-3 py-2 text-[13px] text-text-primary outline-none focus:border-info transition-colors"
        >
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.clientName}</option>)}
        </select>

        <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-xl p-1">
          {["all", "draft", "pending", "approved", "revision_requested"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors capitalize ${
                statusFilter === s ? "bg-bg-elevated text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {s === "revision_requested" ? "Revision" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Posters grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-square bg-bg-surface rounded-2xl animate-pulse" />)}
        </div>
      ) : posters.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-2xl p-12 text-center">
          <Images size={28} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-[15px] text-text-primary mb-1">No posters found</p>
          <p className="font-mono text-[12px] text-text-muted mb-5">Generate your first poster for a client.</p>
          <Link href="/studio/create" className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:bg-info/90 transition-colors">
            <Sparkles size={14} />
            Generate poster
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {posters.map((poster) => (
            <div
              key={poster.id}
              className="group bg-bg-surface border border-border-default rounded-2xl overflow-hidden cursor-pointer hover:border-border-strong transition-colors"
              onClick={() => setSelectedPoster(poster)}
            >
              <div className="aspect-square bg-bg-elevated">
                <img src={poster.imageUrl} alt={poster.headline ?? "Poster"} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="font-semibold text-[12px] text-text-primary truncate mb-1">{poster.headline ?? "No headline"}</p>
                <p className="font-mono text-[10px] text-text-muted truncate mb-1.5">{clientName(poster.clientId)}</p>
                <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded capitalize ${STATUS_COLORS[poster.approvalStatus] ?? ""}`}>
                  {STATUS_ICONS[poster.approvalStatus]}
                  {poster.approvalStatus?.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Poster detail modal */}
      {selectedPoster && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPoster(null)}>
          <div className="bg-bg-base border border-border-default rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-[15px] text-text-primary">{selectedPoster.headline ?? "No headline"}</p>
                  <p className="font-mono text-[11px] text-text-muted">{clientName(selectedPoster.clientId)}</p>
                </div>
                <button onClick={() => setSelectedPoster(null)} className="text-text-muted hover:text-text-primary transition-colors font-mono text-[20px] leading-none">×</button>
              </div>

              <div className="rounded-xl overflow-hidden mb-4">
                <img src={selectedPoster.imageUrl} alt="" className="w-full" />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded-full capitalize ${STATUS_COLORS[selectedPoster.approvalStatus] ?? ""}`}>
                  {STATUS_ICONS[selectedPoster.approvalStatus]}
                  {selectedPoster.approvalStatus?.replace("_", " ")}
                </span>
              </div>

              {/* Approval actions */}
              {selectedPoster.approvalStatus !== "approved" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateApproval(selectedPoster.id, "pending")}
                      disabled={submittingApproval}
                      className="flex-1 bg-warning/10 border border-warning/20 text-warning font-medium text-[13px] py-2.5 rounded-xl hover:bg-warning/15 transition-colors disabled:opacity-50"
                    >
                      Send for approval
                    </button>
                    <button
                      onClick={() => updateApproval(selectedPoster.id, "approved")}
                      disabled={submittingApproval}
                      className="flex-1 bg-success/10 border border-success/20 text-success font-medium text-[13px] py-2.5 rounded-xl hover:bg-success/15 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Revision comment..."
                      value={revisionComment}
                      onChange={(e) => setRevisionComment(e.target.value)}
                      className="flex-1 bg-bg-surface border border-border-default rounded-xl px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
                    />
                    <button
                      onClick={() => updateApproval(selectedPoster.id, "revision_requested", revisionComment)}
                      disabled={submittingApproval}
                      className="px-4 py-2 bg-error/10 border border-error/20 text-error font-medium text-[13px] rounded-xl hover:bg-error/15 transition-colors disabled:opacity-50"
                    >
                      Request revision
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => downloadPoster(selectedPoster)}
                  className="flex-1 flex items-center justify-center gap-2 bg-bg-surface border border-border-default text-text-secondary font-medium text-[13px] py-2.5 rounded-xl hover:border-border-strong transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
                <Link
                  href={`/studio/create?clientId=${selectedPoster.clientId}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-bg-surface border border-border-default text-text-secondary font-medium text-[13px] py-2.5 rounded-xl hover:border-border-strong transition-colors"
                >
                  <Sparkles size={14} />
                  Generate new
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudioPostersPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-5 py-8"><div className="h-8 w-48 bg-bg-surface rounded animate-pulse" /></div>}>
      <PostersContent />
    </Suspense>
  );
}
