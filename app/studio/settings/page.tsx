"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { toast } from "sonner";

interface Agency {
  id: string;
  agencyName: string;
  plan: string;
  portalBrandName?: string;
  portalLogoUrl?: string;
  portalAccentColor?: string;
  hidePoweredBy?: boolean;
  customSubdomain?: string;
}

export default function StudioSettingsPage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [form, setForm] = useState({
    agencyName: "",
    portalBrandName: "",
    portalLogoUrl: "",
    portalAccentColor: "#4D9EFF",
    hidePoweredBy: false,
    customSubdomain: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token = await getClientIdToken();
        const res = await fetch("/api/studio/agency", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const { agency: a } = await res.json();
          if (a) {
            setAgency(a);
            setForm({
              agencyName: a.agencyName ?? "",
              portalBrandName: a.portalBrandName ?? "",
              portalLogoUrl: a.portalLogoUrl ?? "",
              portalAccentColor: a.portalAccentColor ?? "#4D9EFF",
              hidePoweredBy: a.hidePoweredBy ?? false,
              customSubdomain: a.customSubdomain ?? "",
            });
          }
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getClientIdToken();
      const res = await fetch("/api/studio/agency", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (res.ok) toast.success("Settings saved");
      else {
        const d = await res.json();
        toast.error(d.error ?? "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const isAgencyPlan = agency?.plan === "agency";

  if (loading) return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="font-semibold text-[24px] text-text-primary tracking-tight">Studio settings</h1>
        <p className="font-mono text-[13px] text-text-muted mt-1">Agency name, portal branding, and more.</p>
        <p className="text-[12px] mt-3 p-3 rounded-xl border" style={{ color: "var(--studio-text-secondary)", borderColor: "var(--studio-border)", background: "var(--studio-bg-surface)" }}>
          One account is used for both Studio and My Brand (dashboard). Name and email are shared — edit them in{" "}
          <a href="/dashboard/profile" className="underline hover:opacity-90" style={{ color: "var(--studio-accent)" }}>Profile</a> on the dashboard.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Agency */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Agency</p>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Agency / studio name</label>
            <input
              type="text"
              value={form.agencyName}
              onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
              required
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
            />
          </div>
          <div>
            <p className="font-mono text-[11px] text-text-muted">
              Plan: <span className="text-text-primary font-semibold capitalize">{agency?.plan ?? "starter"}</span>
              {" · "}
              <a href="/studio/billing" className="text-info hover:underline">Upgrade</a>
            </p>
          </div>
        </div>

        {/* Portal branding */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Client portal branding</p>
            {!isAgencyPlan && (
              <span className="font-mono text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full">Agency plan only</span>
            )}
          </div>
          <div className={!isAgencyPlan ? "opacity-50 pointer-events-none" : ""}>
            <div className="space-y-3">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Portal brand name</label>
                <input type="text" value={form.portalBrandName} onChange={(e) => setForm({ ...form, portalBrandName: e.target.value })}
                  placeholder="Your agency name as shown to clients"
                  className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
              </div>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Portal logo URL</label>
                <input type="url" value={form.portalLogoUrl} onChange={(e) => setForm({ ...form, portalLogoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
              </div>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Portal accent color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.portalAccentColor} onChange={(e) => setForm({ ...form, portalAccentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-border-default cursor-pointer bg-bg-base" />
                  <input type="text" value={form.portalAccentColor} onChange={(e) => setForm({ ...form, portalAccentColor: e.target.value })}
                    className="flex-1 bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] font-mono text-text-primary outline-none focus:border-info transition-colors" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-text-primary font-medium">Hide "Powered by ArtMaster"</p>
                  <p className="font-mono text-[11px] text-text-muted">Your branding only — ArtMaster invisible</p>
                </div>
                <button type="button" onClick={() => setForm({ ...form, hidePoweredBy: !form.hidePoweredBy })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.hidePoweredBy ? "bg-info" : "bg-bg-elevated border border-border-default"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.hidePoweredBy ? "left-5.5" : "left-0.5"}`} />
                </button>
              </div>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Custom subdomain</label>
                <div className="flex items-center bg-bg-base border border-border-default rounded-xl overflow-hidden">
                  <input type="text" value={form.customSubdomain} onChange={(e) => setForm({ ...form, customSubdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="clients"
                    className="flex-1 px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none bg-transparent" />
                  <span className="px-3 font-mono text-[12px] text-text-muted bg-bg-elevated h-full flex items-center border-l border-border-default">.artmasterpro.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-info text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-info/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[52px]">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save settings</>}
        </button>
      </form>
    </div>
  );
}
