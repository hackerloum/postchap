"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import Image from "next/image";

interface InviteInfo {
  valid: boolean;
  email?: string;
  role?: string;
  agencyName?: string;
  agencyId?: string;
  error?: string;
}

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    async function validate() {
      try {
        const res = await fetch(`/api/studio/invites?token=${token}`);
        if (res.ok) setInvite(await res.json());
      } catch {}
      finally { setLoading(false); }
    }
    validate();
  }, [token]);

  async function acceptInvite() {
    setAccepting(true);
    setError("");
    try {
      const authToken = await getClientIdToken();
      const res = await fetch("/api/studio/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to accept invite"); return; }
      setAccepted(true);
      setTimeout(() => router.push("/studio"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Image src="/artmasterwordmarklogo-03-03.webp" alt="ArtMaster" width={120} height={32} className="h-6 w-auto object-contain" />
          <span className="font-mono text-[11px] text-text-muted bg-bg-elevated border border-border-default rounded px-2 py-0.5">STUDIO</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-text-muted">
            <Loader2 size={20} className="animate-spin" />
            <span className="font-mono text-[13px]">Validating invite...</span>
          </div>
        ) : accepted ? (
          <div>
            <CheckCircle2 size={40} className="text-success mx-auto mb-4" />
            <h2 className="font-semibold text-[20px] text-text-primary mb-2">You're in!</h2>
            <p className="font-mono text-[13px] text-text-muted">Redirecting to Studio...</p>
          </div>
        ) : !token || !invite?.valid ? (
          <div>
            <AlertCircle size={36} className="text-error mx-auto mb-4" />
            <h2 className="font-semibold text-[18px] text-text-primary mb-2">Invalid invite</h2>
            <p className="font-mono text-[13px] text-text-muted">{invite?.error ?? "This invite link is invalid or has expired."}</p>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-default flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-info" />
            </div>
            <h2 className="font-semibold text-[20px] text-text-primary mb-2">You're invited!</h2>
            <p className="font-mono text-[13px] text-text-muted mb-1">
              Join <span className="text-text-primary font-semibold">{invite.agencyName}</span> as
            </p>
            <p className="font-mono text-[14px] text-info font-semibold mb-6 capitalize">{invite.role}</p>

            {error && (
              <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 mb-4">
                <p className="text-[13px] text-error">{error}</p>
              </div>
            )}

            <button
              onClick={acceptInvite}
              disabled={accepting}
              className="w-full bg-info text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-info/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[52px]"
            >
              {accepting ? <Loader2 size={16} className="animate-spin" /> : "Accept invite"}
            </button>

            <p className="font-mono text-[11px] text-text-muted mt-4">
              Make sure you're signed in to the right account before accepting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-base flex items-center justify-center"><Loader2 size={24} className="animate-spin text-text-muted" /></div>}>
      <JoinContent />
    </Suspense>
  );
}
