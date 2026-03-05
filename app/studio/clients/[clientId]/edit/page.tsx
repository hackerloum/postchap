"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, X, Copy } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

const INDUSTRIES = [
  "Restaurant / Food", "Fashion / Clothing", "Beauty / Salon", "Real Estate",
  "Education", "Healthcare", "Retail / Shop", "Technology", "Finance",
  "Entertainment", "Travel / Tourism", "Fitness / Gym", "Other",
];

export default function EditClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const router = useRouter();
  const [form, setForm] = useState({
    clientName: "", contactPerson: "", contactEmail: "", contactPhone: "",
    industry: "", location: "", monthlyQuota: 30, notes: "",
    status: "active", portalAccessEnabled: false,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = await getClientIdToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/studio/clients/${clientId}`, { headers });
        if (res.ok) {
          const { client } = await res.json();
          setForm({
            clientName: client.clientName ?? "",
            contactPerson: client.contactPerson ?? "",
            contactEmail: client.contactEmail ?? "",
            contactPhone: client.contactPhone ?? "",
            industry: client.industry ?? "",
            location: client.location ?? "",
            monthlyQuota: client.monthlyQuota ?? 30,
            notes: client.notes ?? "",
            status: client.status ?? "active",
            portalAccessEnabled: client.portalAccessEnabled ?? false,
          });
          setTags(client.tags ?? []);
          setPortalToken(client.portalToken ?? null);
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [clientId]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const token = await getClientIdToken();
      const res = await fetch(`/api/studio/clients/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, tags }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      // If portal was enabled and we got back the client with token, stay on page so user can copy the link
      if (data.client?.portalToken) {
        setPortalToken(data.client.portalToken);
        setForm((f) => ({ ...f, portalAccessEnabled: data.client.portalAccessEnabled ?? f.portalAccessEnabled }));
      } else {
        router.push(`/studio/clients/${clientId}`);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const portalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/studio/portal/${clientId}?token=${portalToken}`
    : "";

  if (loading) {
    return <div className="max-w-2xl mx-auto px-5 py-8"><div className="h-8 w-48 bg-bg-surface rounded animate-pulse" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <Link href={`/studio/clients/${clientId}`} className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors font-mono text-[12px] mb-6">
        <ArrowLeft size={14} />
        Back to client
      </Link>

      <h1 className="font-semibold text-[24px] text-text-primary tracking-tight mb-1">Edit client</h1>
      <p className="font-mono text-[13px] text-text-muted mb-8">{form.clientName}</p>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-[13px] text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Client info</p>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Business name *</label>
            <input type="text" required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-info transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Industry</label>
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary outline-none focus:border-info transition-colors">
                <option value="">Select</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
            </div>
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary outline-none focus:border-info transition-colors">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Contact person</label>
              <input type="text" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
            </div>
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Phone</label>
            <input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
          </div>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Settings</p>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Monthly poster quota</label>
            <input type="number" min={1} max={500} value={form.monthlyQuota} onChange={(e) => setForm({ ...form, monthlyQuota: parseInt(e.target.value) || 30 })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary outline-none focus:border-info transition-colors" />
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Tags</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="text" placeholder="Add tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                className="flex-1 bg-bg-base border border-border-default rounded-xl px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors" />
              <button type="button" onClick={addTag} className="p-2.5 bg-bg-elevated border border-border-default rounded-xl text-text-muted hover:text-text-primary hover:border-border-strong transition-colors">
                <Plus size={14} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 bg-bg-elevated border border-border-default rounded-lg px-2.5 py-1 font-mono text-[11px] text-text-secondary">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-text-muted hover:text-error transition-colors"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Internal notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors resize-none" />
          </div>
        </div>

        {/* Portal settings */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Client portal</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-text-primary font-medium">Enable portal access</p>
              <p className="font-mono text-[11px] text-text-muted">Client can view and approve posters</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, portalAccessEnabled: !form.portalAccessEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.portalAccessEnabled ? "bg-info" : "bg-bg-elevated border border-border-default"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.portalAccessEnabled ? "left-5.5" : "left-0.5"}`} />
            </button>
          </div>
          {form.portalAccessEnabled && portalToken && (
            <div>
              <p className="font-mono text-[11px] text-text-muted mb-2">Portal link (share with client)</p>
              <div className="flex items-center gap-2 bg-bg-base border border-border-default rounded-xl px-3 py-2.5">
                <span className="flex-1 font-mono text-[11px] text-text-secondary truncate">{portalUrl}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(portalUrl)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          )}
          {form.portalAccessEnabled && !portalToken && (
            <p className="font-mono text-[11px] text-text-muted">Save to generate the portal link.</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 bg-info text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-info/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[52px]">
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Save changes"}
          </button>
          <Link href={`/studio/clients/${clientId}`}
            className="px-6 py-3.5 bg-bg-surface border border-border-default text-text-secondary font-medium text-[14px] rounded-xl hover:border-border-strong transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
