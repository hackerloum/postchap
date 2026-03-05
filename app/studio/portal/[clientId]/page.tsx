"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageCircle, Clock, Download, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Poster {
  id: string;
  imageUrl: string;
  headline?: string;
  approvalStatus: string;
  approvalComment?: string;
  createdAt: number | null;
}

interface Agency {
  name: string;
  logoUrl?: string | null;
  accentColor: string;
  hidePoweredBy: boolean;
}

function PortalContent({ clientId }: { clientId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [posters, setPosters] = useState<Poster[]>([]);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    async function load() {
      setLoading(true);
      try {
        const headers = { "X-Portal-Token": token };
        const [postersRes, agencyRes] = await Promise.all([
          fetch("/api/studio/portal/posters", { headers }),
          fetch("/api/studio/portal/agency", { headers }),
        ]);
        if (postersRes.ok) setPosters((await postersRes.json()).posters ?? []);
        if (agencyRes.ok) {
          const d = await agencyRes.json();
          setAgency({
            name: d.name ?? "Client Portal",
            logoUrl: d.logoUrl ?? null,
            accentColor: d.accentColor ?? "#4D9EFF",
            hidePoweredBy: d.hidePoweredBy ?? false,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function submitApproval(posterId: string, status: "approved" | "revision_requested") {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/studio/portal/posters/${posterId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Portal-Token": token,
        },
        body: JSON.stringify({ approvalStatus: status, comment }),
      });
      if (res.ok) {
        toast.success(status === "approved" ? "Approved!" : "Revision requested");
        setSelectedPoster(null);
        setComment("");
        setPosters((prev) => prev.map((p) =>
          p.id === posterId ? { ...p, approvalStatus: status, approvalComment: comment } : p
        ));
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const accentColor = agency?.accentColor ?? "#4D9EFF";

  if (!token) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle size={32} className="text-error mx-auto mb-3" />
          <p className="text-[15px] text-text-primary font-semibold mb-1">Invalid portal link</p>
          <p className="font-mono text-[12px] text-text-muted">Please use the link sent by your designer.</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "text-text-muted",
    pending: "text-warning",
    approved: "text-success",
    revision_requested: "text-error",
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="h-14 border-b border-border-subtle bg-bg-base px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {agency?.logoUrl ? (
            <img src={agency.logoUrl} alt="" className="h-7 w-auto" />
          ) : (
            <span className="font-semibold text-[16px] text-text-primary">{agency?.name ?? "Client Portal"}</span>
          )}
        </div>
        {!agency?.hidePoweredBy && (
          <span className="font-mono text-[10px] text-text-muted">Powered by ArtMaster</span>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="font-semibold text-[20px] text-text-primary">Your posters</h1>
          <p className="font-mono text-[12px] text-text-muted mt-1">Review and approve your content.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-square bg-bg-surface rounded-2xl animate-pulse" />)}
          </div>
        ) : posters.length === 0 ? (
          <div className="bg-bg-surface border border-border-default rounded-2xl p-12 text-center">
            <Clock size={28} className="text-text-muted mx-auto mb-3" />
            <p className="font-semibold text-[15px] text-text-primary mb-1">No posters yet</p>
            <p className="font-mono text-[12px] text-text-muted">Your designer will share posters here for your approval.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {posters.map((poster) => (
              <div
                key={poster.id}
                className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden cursor-pointer hover:border-border-strong transition-colors"
                onClick={() => setSelectedPoster(poster)}
              >
                <div className="aspect-square bg-bg-elevated">
                  <img src={poster.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-[12px] text-text-primary truncate mb-1">{poster.headline ?? "Poster"}</p>
                  <span className={`font-mono text-[10px] capitalize ${statusColors[poster.approvalStatus] ?? ""}`}>
                    {poster.approvalStatus?.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Poster modal */}
      {selectedPoster && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPoster(null)}>
          <div className="bg-bg-base border border-border-default rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="font-semibold text-[15px] text-text-primary">{selectedPoster.headline ?? "Poster"}</p>
                <button onClick={() => setSelectedPoster(null)} className="text-text-muted hover:text-text-primary transition-colors font-mono text-[20px] leading-none">×</button>
              </div>

              <div className="rounded-xl overflow-hidden mb-4">
                <img src={selectedPoster.imageUrl} alt="" className="w-full" />
              </div>

              {selectedPoster.approvalComment && (
                <div className="bg-bg-surface border border-border-default rounded-xl p-3 mb-4">
                  <p className="font-mono text-[10px] text-text-muted mb-1">Comment</p>
                  <p className="text-[13px] text-text-secondary">{selectedPoster.approvalComment}</p>
                </div>
              )}

              {selectedPoster.approvalStatus !== "approved" && (
                <div className="space-y-3">
                  <textarea
                    rows={2}
                    placeholder="Leave a comment (optional for approval, required for revision request)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => submitApproval(selectedPoster.id, "approved")}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 bg-success text-black font-semibold text-[13px] py-3 rounded-xl hover:bg-success/90 transition-colors disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Approve</>}
                    </button>
                    <button
                      onClick={() => submitApproval(selectedPoster.id, "revision_requested")}
                      disabled={submitting || !comment.trim()}
                      className="flex-1 flex items-center justify-center gap-2 bg-error/10 border border-error/20 text-error font-medium text-[13px] py-3 rounded-xl hover:bg-error/15 transition-colors disabled:opacity-50"
                    >
                      <MessageCircle size={14} /> Request revision
                    </button>
                  </div>
                </div>
              )}

              {selectedPoster.approvalStatus === "approved" && (
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl">
                  <CheckCircle2 size={15} className="text-success" />
                  <span className="text-[13px] text-success font-medium">This poster is approved.</span>
                </div>
              )}

              <button
                onClick={() => { const a = document.createElement("a"); a.href = selectedPoster.imageUrl; a.download = `poster.jpg`; a.target = "_blank"; a.click(); }}
                className="w-full flex items-center justify-center gap-2 mt-3 bg-bg-surface border border-border-default text-text-secondary font-medium text-[13px] py-2.5 rounded-xl hover:border-border-strong transition-colors"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientPortalPage({ params }: { params: { clientId: string } }) {
  const { clientId } = params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-base flex items-center justify-center"><Loader2 size={24} className="animate-spin text-text-muted" /></div>}>
      <PortalContent clientId={clientId} />
    </Suspense>
  );
}
