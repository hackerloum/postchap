"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Building2, X } from "lucide-react";
import { toast } from "sonner";
import { STUDIO_PLANS } from "@/lib/studio-plans";
import type { StudioPlanId } from "@/types/studio";

interface AgencyRow {
  id: string;
  ownerId: string;
  agencyName: string;
  plan: string;
  monthlyPosterLimit: number;
  postersUsedThisMonth: number;
  postersResetAt: number | null;
  createdAt: number | null;
  updatedAt: number | null;
}

interface AgencyDetail extends AgencyRow {
  clientCount?: number;
  portalBrandName?: string;
  portalLogoUrl?: string;
  portalAccentColor?: string;
  hidePoweredBy?: boolean;
  customSubdomain?: string;
}

const PLAN_COLORS: Record<string, string> = {
  trial: "bg-bg-elevated text-text-muted border border-border-default",
  starter: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
  pro: "bg-accent/10 text-accent border border-accent/30",
  agency: "bg-green-400/10 text-green-400 border border-green-400/30",
};

export default function AdminStudioPage() {
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AgencyDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ agencyName: "", plan: "trial" as StudioPlanId, monthlyPosterLimit: 0, postersUsedThisMonth: 0 });

  useEffect(() => {
    fetch("/api/admin/studio/agencies", { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((d) => d?.agencies && setAgencies(d.agencies))
      .catch(() => toast.error("Failed to load agencies"))
      .finally(() => setLoading(false));
  }, []);

  async function openEdit(agency: AgencyRow) {
    const res = await fetch(`/api/admin/studio/agencies/${agency.id}`, { credentials: "same-origin" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error ?? "Failed to load agency");
      return;
    }
    const detail = data.agency as AgencyDetail;
    setEditing(detail);
    setForm({
      agencyName: detail.agencyName ?? "",
      plan: (detail.plan as StudioPlanId) ?? "trial",
      monthlyPosterLimit: detail.monthlyPosterLimit ?? 0,
      postersUsedThisMonth: detail.postersUsedThisMonth ?? 0,
    });
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/studio/agencies/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          agencyName: form.agencyName.trim(),
          plan: form.plan,
          monthlyPosterLimit: form.monthlyPosterLimit,
          postersUsedThisMonth: form.postersUsedThisMonth,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Update failed");
        return;
      }
      toast.success("Agency updated");
      setEditing(null);
      setAgencies((prev) =>
        prev.map((a) =>
          a.id === editing.id
            ? {
                ...a,
                agencyName: form.agencyName.trim(),
                plan: form.plan,
                monthlyPosterLimit: form.monthlyPosterLimit,
                postersUsedThisMonth: form.postersUsedThisMonth,
              }
            : a
        )
      );
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center gap-2">
        <Building2 size={22} className="text-accent" />
        <div>
          <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">Studio</h1>
          <p className="font-mono text-[12px] text-text-muted mt-0.5">
            Manage Studio agencies: plan, poster limits, and info
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={18} className="text-accent animate-spin" />
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest">
                  Agency
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest">
                  Owner ID
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest">
                  Plan
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest">
                  Posters
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest hidden md:table-cell">
                  Created
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {agencies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-mono text-[12px] text-text-muted">
                    No Studio agencies yet
                  </td>
                </tr>
              )}
              {agencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[13px] text-text-primary">{agency.agencyName || "—"}</p>
                    <p className="font-mono text-[10px] text-text-muted">{agency.id}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-text-muted truncate max-w-[120px]">
                    {agency.ownerId}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                        PLAN_COLORS[agency.plan] ?? PLAN_COLORS.trial
                      }`}
                    >
                      {agency.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">
                    {agency.postersUsedThisMonth} / {agency.monthlyPosterLimit === -1 ? "∞" : agency.monthlyPosterLimit}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-[11px] text-text-muted">
                    {agency.createdAt
                      ? new Date(agency.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(agency)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                      title="Edit agency"
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => !saving && setEditing(null)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-base border border-border-default rounded-2xl shadow-xl z-50 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[16px] text-text-primary">Edit Studio agency</h2>
              <button
                type="button"
                onClick={() => !saving && setEditing(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {editing.clientCount != null && (
              <p className="font-mono text-[11px] text-text-muted mb-4">
                {editing.clientCount} client{editing.clientCount !== 1 ? "s" : ""}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">
                  Agency name
                </label>
                <input
                  type="text"
                  value={form.agencyName}
                  onChange={(e) => setForm((f) => ({ ...f, agencyName: e.target.value }))}
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-[14px] text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">
                  Plan
                </label>
                <select
                  value={form.plan}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      plan: e.target.value as StudioPlanId,
                      monthlyPosterLimit:
                        STUDIO_PLANS.find((p) => p.id === e.target.value)?.limits.maxPostersPerMonth ?? 0,
                    }))
                  }
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-[14px] text-text-primary outline-none focus:border-accent"
                >
                  {STUDIO_PLANS.filter((p) => p.id !== "trial" || true).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.priceLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">
                  Monthly poster limit (-1 = unlimited)
                </label>
                <input
                  type="number"
                  min={-1}
                  value={form.monthlyPosterLimit < 0 ? "" : form.monthlyPosterLimit}
                  onChange={(e) => {
                    const v = e.target.value;
                    const n = v === "" ? -1 : parseInt(v, 10);
                    setForm((f) => ({ ...f, monthlyPosterLimit: Number.isNaN(n) ? -1 : n < 0 ? -1 : n }));
                  }}
                  placeholder="-1 = unlimited"
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-[14px] text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">
                  Posters used this month (override)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.postersUsedThisMonth}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      postersUsedThisMonth: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-[14px] text-text-primary outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => !saving && setEditing(null)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-text-secondary font-medium text-[13px] hover:bg-bg-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.agencyName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-accent text-black font-semibold text-[13px] hover:bg-accent-dim transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
