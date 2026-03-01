"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Instagram, CheckCircle } from "lucide-react";
import Link from "next/link";

interface UserDetail {
  uid: string;
  email: string;
  displayName: string;
  plan: "free" | "pro" | "business";
  hasOnboarded: boolean;
  createdAt: number | null;
  country: string | null;
  countryCode: string | null;
  instagram: { connected: boolean; username?: string } | null;
  brandKits: { id: string; brandName: string; industry: string; createdAt: number | null }[];
  usage: { postersThisMonth: number; totalPosters: number };
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-bg-elevated text-text-muted border border-border-default",
  pro: "bg-accent/10 text-accent border border-accent/30",
  business: "bg-green-400/10 text-green-400 border border-green-400/30",
};

const PLANS = ["free", "pro", "business"] as const;

export default function UserDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  useEffect(() => {
    fetch(`/api/admin/users/${uid}`, { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((d) => {
        if (d) {
          setUser(d);
          setSelectedPlan(d.plan);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  async function handlePlanChange() {
    if (!user || selectedPlan === user.plan) return;
    setChangingPlan(true);
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ plan: selectedPlan }),
      });
      if (!res.ok) throw new Error("Failed to update plan");
      setUser((prev) => prev ? { ...prev, plan: selectedPlan as UserDetail["plan"] } : prev);
      toast.success(`Plan updated to ${selectedPlan}`);
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setChangingPlan(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={18} className="text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-text-muted font-mono text-[13px]">User not found.</div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary font-mono text-[12px] mb-6 transition-colors"
      >
        <ArrowLeft size={13} />
        Back to users
      </Link>

      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">
            {user.displayName || user.email}
          </h1>
          <p className="font-mono text-[12px] text-text-muted mt-1">{user.email}</p>
        </div>
        <span
          className={`inline-block px-3 py-1 rounded-lg text-[12px] font-semibold capitalize ${PLAN_COLORS[user.plan] ?? PLAN_COLORS.free}`}
        >
          {user.plan}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Posters this month", value: String(user.usage.postersThisMonth) },
          { label: "Total posters", value: String(user.usage.totalPosters) },
          { label: "Brand kits", value: String(user.brandKits.length) },
          {
            label: "Joined",
            value: user.createdAt
              ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : "—",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-surface border border-border-default rounded-xl p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">
              {stat.label}
            </p>
            <p className="font-semibold text-[20px] text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Change plan */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-5 mb-5">
        <h2 className="font-semibold text-[14px] text-text-primary mb-4">Change plan</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {PLANS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPlan(p)}
              className={`px-4 py-2 rounded-lg border text-[13px] font-medium capitalize transition-colors ${
                selectedPlan === p
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border-default text-text-secondary hover:border-border-strong"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handlePlanChange}
          disabled={changingPlan || selectedPlan === user.plan}
          className="flex items-center gap-2 bg-accent text-black font-semibold text-[13px] px-4 py-2.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-40"
        >
          {changingPlan ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
          Save plan change
        </button>
      </div>

      {/* Instagram */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-5 mb-5">
        <h2 className="font-semibold text-[14px] text-text-primary mb-3">Instagram</h2>
        {user.instagram?.connected ? (
          <div className="flex items-center gap-2">
            <Instagram size={14} className="text-[#bc1888]" />
            <span className="font-mono text-[12px] text-text-secondary">
              @{user.instagram.username ?? "connected"}
            </span>
            <CheckCircle size={12} className="text-green-400" />
          </div>
        ) : (
          <p className="font-mono text-[12px] text-text-muted">Not connected</p>
        )}
      </div>

      {/* Brand kits */}
      {user.brandKits.length > 0 && (
        <div className="bg-bg-surface border border-border-default rounded-xl p-5">
          <h2 className="font-semibold text-[14px] text-text-primary mb-3">Brand kits</h2>
          <div className="space-y-2">
            {user.brandKits.map((kit) => (
              <div
                key={kit.id}
                className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
              >
                <div>
                  <p className="font-medium text-[13px] text-text-primary">{kit.brandName}</p>
                  <p className="font-mono text-[11px] text-text-muted">{kit.industry}</p>
                </div>
                {kit.createdAt && (
                  <span className="font-mono text-[11px] text-text-muted">
                    {new Date(kit.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
