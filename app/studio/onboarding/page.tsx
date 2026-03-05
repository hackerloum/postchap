"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import Image from "next/image";

export default function StudioOnboardingPage() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!agencyName.trim()) return;
    setLoading(true);
    setError("");

    try {
      const token = await getClientIdToken();
      const res = await fetch("/api/studio/agency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ agencyName: agencyName.trim(), plan: "starter" }),
      });

      const data = await res.json();
      if (!res.ok && res.status !== 409) {
        setError(data.error ?? "Failed to create agency");
        return;
      }

      router.push("/studio");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Image
              src="/artmasterwordmarklogo-03-03.webp"
              alt="ArtMaster"
              width={120}
              height={32}
              className="h-6 w-auto object-contain"
            />
            <span className="font-mono text-[11px] text-text-muted bg-bg-elevated border border-border-default rounded px-2 py-0.5">
              STUDIO
            </span>
          </div>
          <h1 className="font-semibold text-[28px] text-text-primary tracking-tight mb-2">
            Set up your Studio
          </h1>
          <p className="font-mono text-[13px] text-text-muted">
            Manage multiple client brands and generate posters for all of them from one place.
          </p>
        </div>

        {/* What you get */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-4">
            What you get with Studio
          </p>
          <div className="space-y-3">
            {[
              "Manage up to 5 clients (Starter plan)",
              "Multiple brand kits per client",
              "Client approval workflow",
              "Usage tracking per client",
              "Upgrade anytime for more clients + features",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 size={15} className="text-success shrink-0" />
                <span className="text-[13px] text-text-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3">
              <p className="text-[13px] text-error">{error}</p>
            </div>
          )}

          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">
              Agency / studio name
            </label>
            <input
              type="text"
              placeholder="e.g. Creative Co, My Design Studio"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
              autoFocus
              className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors min-h-[48px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !agencyName.trim()}
            className="w-full bg-info text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-info/90 transition-all active:scale-[0.99] min-h-[52px] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Launch Studio
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-center font-mono text-[11px] text-text-muted mt-6">
          Already use ArtMaster for your own brand?{" "}
          <a href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
            Switch to My Brand
          </a>
        </p>
      </div>
    </div>
  );
}
