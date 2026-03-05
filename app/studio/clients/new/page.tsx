"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, X, Palette } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

const INDUSTRIES = [
  "Restaurant / Food", "Fashion / Clothing", "Beauty / Salon", "Real Estate",
  "Education", "Healthcare", "Retail / Shop", "Technology", "Finance",
  "Entertainment", "Travel / Tourism", "Fitness / Gym", "Other",
];

const KIT_PURPOSES = [
  { value: "main", label: "Main brand" },
  { value: "sub-brand", label: "Sub-brand" },
  { value: "campaign", label: "Campaign" },
  { value: "seasonal", label: "Seasonal" },
];

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    clientName: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    industry: "",
    location: "",
    monthlyQuota: 30,
    notes: "",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addBrandKit, setAddBrandKit] = useState(true);
  const [brandKit, setBrandKit] = useState({
    brandName: "",
    industry: "",
    kitPurpose: "main",
    primaryColor: "#E8FF47",
  });

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName.trim()) return;
    setLoading(true);
    setError("");

    try {
      const token = await getClientIdToken();
      const res = await fetch("/api/studio/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, tags }),
      });

      let data: { clientId?: string; error?: string; code?: string } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        setError("Invalid response from server. Please try again.");
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Failed to create client");
        return;
      }

      const clientId = data.clientId && String(data.clientId).trim();
      if (!clientId) {
        setError("Client was created but could not open the page. Go to Clients to find it.");
        return;
      }

      if (addBrandKit && (brandKit.brandName.trim() || form.clientName.trim())) {
        const kitPayload = {
          brandName: brandKit.brandName.trim() || form.clientName.trim(),
          industry: brandKit.industry || form.industry || "Other",
          kitPurpose: brandKit.kitPurpose,
          primaryColor: brandKit.primaryColor,
        };
        const kitRes = await fetch(`/api/studio/clients/${clientId}/brand-kits`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(kitPayload),
        });
        if (!kitRes.ok) {
          const kitData = await kitRes.json().catch(() => ({}));
          setError(kitData.error ?? "Client created but brand kit failed. You can add one from the client page.");
          return;
        }
      }

      router.push(`/studio/clients/${clientId}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <Link
        href="/studio/clients"
        className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors font-mono text-[12px] mb-6"
      >
        <ArrowLeft size={14} />
        Back to clients
      </Link>

      <h1 className="font-semibold text-[24px] text-text-primary tracking-tight mb-1">New client</h1>
      <p className="font-mono text-[13px] text-text-muted mb-8">Add a new client to manage their brand and posters.</p>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-[13px] text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Required fields */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Client info</p>

          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">
              Client / business name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mama's Kitchen, Femi Boutique"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              required
              autoFocus
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Industry</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary outline-none focus:border-info transition-colors"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Location</label>
              <input
                type="text"
                placeholder="e.g. Dar es Salaam, TZ"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Contact person</label>
              <input
                type="text"
                placeholder="e.g. Ahmed Hassan"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Email</label>
              <input
                type="email"
                placeholder="client@email.com"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Phone</label>
            <input
              type="tel"
              placeholder="+255 712 345 678"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
            />
          </div>
        </div>

        {/* Quota and tags */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Settings</p>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">
              Monthly poster quota
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={form.monthlyQuota}
              onChange={(e) => setForm({ ...form, monthlyQuota: parseInt(e.target.value) || 30 })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary outline-none focus:border-info transition-colors"
            />
            <p className="font-mono text-[10px] text-text-muted mt-1.5">
              How many posters to generate for this client per month.
            </p>
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Tags</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Add tag (e.g. restaurant, priority)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                className="flex-1 bg-bg-base border border-border-default rounded-xl px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
              />
              <button
                type="button"
                onClick={addTag}
                className="p-2.5 bg-bg-elevated border border-border-default rounded-xl text-text-muted hover:text-text-primary hover:border-border-strong transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 bg-bg-elevated border border-border-default rounded-lg px-2.5 py-1 font-mono text-[11px] text-text-secondary">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-text-muted hover:text-error transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">
              Internal notes
            </label>
            <textarea
              rows={3}
              placeholder="Notes about this client (not visible to client)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors resize-none"
            />
          </div>
        </div>

        {/* First brand kit (optional) */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">First brand kit</p>
            <button
              type="button"
              onClick={() => setAddBrandKit(!addBrandKit)}
              className={`w-11 h-6 rounded-full transition-colors relative ${addBrandKit ? "bg-info" : "bg-bg-elevated border border-border-default"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${addBrandKit ? "left-5.5" : "left-0.5"}`} />
            </button>
          </div>
          <p className="font-mono text-[11px] text-text-muted">
            Add a brand kit now so this client is ready for poster generation. You can add more or edit later.
          </p>
          {addBrandKit && (
            <div className="space-y-4 pt-2 border-t border-border-subtle">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Brand name</label>
                <input
                  type="text"
                  placeholder={form.clientName || "e.g. Mama's Kitchen"}
                  value={brandKit.brandName}
                  onChange={(e) => setBrandKit((k) => ({ ...k, brandName: e.target.value }))}
                  className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
                />
                {!brandKit.brandName && form.clientName && (
                  <p className="font-mono text-[10px] text-text-muted mt-1">Leave empty to use client name</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Industry</label>
                  <select
                    value={brandKit.industry}
                    onChange={(e) => setBrandKit((k) => ({ ...k, industry: e.target.value }))}
                    className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary outline-none focus:border-info transition-colors"
                  >
                    <option value="">Use client industry</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Purpose</label>
                  <select
                    value={brandKit.kitPurpose}
                    onChange={(e) => setBrandKit((k) => ({ ...k, kitPurpose: e.target.value }))}
                    className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary outline-none focus:border-info transition-colors"
                  >
                    {KIT_PURPOSES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">Primary color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandKit.primaryColor}
                    onChange={(e) => setBrandKit((k) => ({ ...k, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-border-default cursor-pointer bg-bg-base"
                  />
                  <input
                    type="text"
                    value={brandKit.primaryColor}
                    onChange={(e) => setBrandKit((k) => ({ ...k, primaryColor: e.target.value }))}
                    className="flex-1 bg-bg-base border border-border-default rounded-xl px-3 py-2.5 text-[12px] font-mono text-text-primary outline-none focus:border-info transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !form.clientName.trim()}
          className="w-full bg-info text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-info/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[52px]"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Create client"}
        </button>
      </form>
    </div>
  );
}
