"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Instagram, Link2, Link2Off, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface InstagramConnection {
  connected: boolean;
  username?: string;
  connectedAt?: number;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [instagram, setInstagram] = useState<InstagramConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const status = searchParams.get("instagram");
    if (status === "connected") toast.success("Instagram connected successfully!");
    if (status === "error") toast.error("Failed to connect Instagram. Please try again.");
    if (status === "cancelled") toast.error("Instagram connection was cancelled.");
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data?.instagram) {
          setInstagram(data.instagram as InstagramConnection);
        } else {
          setInstagram({ connected: false });
        }
      })
      .catch(() => setInstagram({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  async function handleDisconnect() {
    if (!confirm("Disconnect your Instagram account? Auto-posting will stop.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/social/instagram/disconnect", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      setInstagram({ connected: false });
      toast.success("Instagram disconnected.");
    } catch {
      toast.error("Failed to disconnect. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-semibold text-[20px] text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="text-[13px] text-text-muted mt-1">
          Manage your connected accounts and preferences.
        </p>
      </div>

      {/* Connected Accounts */}
      <section>
        <h2 className="font-semibold text-[14px] text-text-primary mb-4">
          Connected accounts
        </h2>

        <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
          {/* Instagram row */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] flex items-center justify-center shrink-0">
                <Instagram size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-[14px] text-text-primary">
                  Instagram
                </p>
                {loading ? (
                  <p className="font-mono text-[11px] text-text-muted mt-0.5">
                    Loading...
                  </p>
                ) : instagram?.connected && instagram.username ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle size={11} className="text-green-400" />
                    <p className="font-mono text-[11px] text-green-400">
                      @{instagram.username}
                    </p>
                  </div>
                ) : (
                  <p className="font-mono text-[11px] text-text-muted mt-0.5">
                    Auto-post generated posters to Instagram
                  </p>
                )}
              </div>
            </div>

            <div>
              {loading ? (
                <Loader2 size={16} className="text-text-muted animate-spin" />
              ) : instagram?.connected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex items-center gap-1.5 bg-bg-elevated border border-border-default text-text-muted font-semibold text-[12px] px-3 py-2 rounded-xl hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-50"
                >
                  {disconnecting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Link2Off size={12} />
                  )}
                  Disconnect
                </button>
              ) : (
                <a
                  href="/api/social/connect/instagram"
                  className="flex items-center gap-1.5 bg-accent text-black font-semibold text-[12px] px-3 py-2 rounded-xl hover:bg-accent-dim transition-all"
                >
                  <Link2 size={12} />
                  Connect
                </a>
              )}
            </div>
          </div>

          {/* Info banner when connected */}
          {instagram?.connected && (
            <div className="px-5 pb-5">
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle size={13} className="text-accent mt-0.5 shrink-0" />
                <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                  Connected. After generating a poster, you&apos;ll see a{" "}
                  <span className="text-text-secondary">&quot;Post to Instagram&quot;</span>{" "}
                  button on your posters. Scheduled posters will also auto-post at your chosen time.
                </p>
              </div>
            </div>
          )}

          {/* Info banner when not connected */}
              {!loading && !instagram?.connected && (
            <div className="px-5 pb-5">
              <div className="bg-bg-elevated border border-border-subtle rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle size={13} className="text-text-muted mt-0.5 shrink-0" />
                <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                  Connect your Instagram Business account to auto-post your generated posters.
                  You need an Instagram{" "}
                  <span className="text-text-secondary">Business or Creator</span>{" "}
                  account.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Legal */}
      <section className="mt-10">
        <h2 className="font-semibold text-[14px] text-text-primary mb-4">
          Legal
        </h2>
        <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden divide-y divide-border-subtle">
          {[
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Data Deletion", href: "/data-deletion" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-bg-elevated transition-colors"
            >
              <span className="font-mono text-[13px] text-text-secondary">{item.label}</span>
              <span className="font-mono text-[11px] text-text-muted">→</span>
            </a>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={20} className="text-accent animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
