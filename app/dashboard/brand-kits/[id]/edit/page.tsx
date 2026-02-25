"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getClientIdToken } from "@/lib/auth-client";
import { BrandCoachPanel } from "../../BrandCoachPanel";
import type { CoachPayload } from "@/app/api/brand-kits/coach/route";

type Industry =
  | "retail"
  | "finance"
  | "telecom"
  | "hospitality"
  | "healthcare"
  | "education"
  | "food_beverage"
  | "fashion"
  | "technology"
  | "real_estate"
  | "media"
  | "other";

type Tone =
  | "professional"
  | "bold"
  | "friendly"
  | "minimal"
  | "luxury"
  | "energetic";

type Platform =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "whatsapp";

interface EditFormData {
  brandName: string;
  industry: Industry | "";
  tagline: string;
  website: string;
  phoneNumber: string;
  contactLocation: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  brandLocation: {
    country?: string;
    countryCode?: string;
    city?: string;
    continent?: string;
    timezone?: string;
    currency?: string;
    languages?: string[];
  };
  targetAudience: string;
  ageRange: string;
  platforms: Platform[];
  language: string;
  tone: Tone | "";
  styleNotes: string;
  sampleContent: string;
}

const defaultForm: EditFormData = {
  brandName: "",
  industry: "",
  tagline: "",
  website: "",
  phoneNumber: "",
  contactLocation: "",
  primaryColor: "#E8FF47",
  secondaryColor: "#080808",
  accentColor: "#FFFFFF",
  logoUrl: "",
  brandLocation: {},
  targetAudience: "",
  ageRange: "",
  platforms: [],
  language: "en",
  tone: "",
  styleNotes: "",
  sampleContent: "",
};

export default function EditBrandKitPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const [form, setForm] = useState<EditFormData>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await getClientIdToken();
      const res = await fetch(`/api/brand-kits/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (cancelled) return;
      if (!res.ok) {
        if (res.status === 404) router.replace("/dashboard/brand-kits");
        else toast.error("Failed to load brand kit");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setForm({
        brandName: data.brandName ?? "",
        industry: data.industry ?? "",
        tagline: data.tagline ?? "",
        website: data.website ?? "",
        phoneNumber: data.phoneNumber ?? "",
        contactLocation: data.contactLocation ?? "",
        primaryColor: data.primaryColor ?? "#E8FF47",
        secondaryColor: data.secondaryColor ?? "#080808",
        accentColor: data.accentColor ?? "#FFFFFF",
        logoUrl: data.logoUrl ?? "",
        brandLocation: data.brandLocation ?? {},
        targetAudience: data.targetAudience ?? "",
        ageRange: data.ageRange ?? "",
        platforms: Array.isArray(data.platforms) ? data.platforms : [],
        language: data.language ?? "en",
        tone: data.tone ?? "",
        styleNotes: data.styleNotes ?? "",
        sampleContent: data.sampleContent ?? "",
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const update = (partial: Partial<EditFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const coachPayload: CoachPayload = {
    brandName: form.brandName,
    industry: form.industry,
    tagline: form.tagline,
    website: form.website,
    phoneNumber: form.phoneNumber,
    contactLocation: form.contactLocation,
    primaryColor: form.primaryColor,
    secondaryColor: form.secondaryColor,
    accentColor: form.accentColor,
    logoUrl: form.logoUrl || undefined,
    brandLocation: form.brandLocation,
    targetAudience: form.targetAudience,
    platforms: form.platforms,
    language: form.language,
    tone: form.tone,
    styleNotes: form.styleNotes,
    sampleContent: form.sampleContent,
    step: "edit",
  };

  const handleApplySuggestion = (field: string, value: string) => {
    const key = field as keyof EditFormData;
    if (key in form) {
      update({ [key]: value } as Partial<EditFormData>);
      return;
    }
    const locKeys = ["country", "city", "continent", "currency"];
    if (locKeys.includes(field)) {
      update({
        brandLocation: { ...form.brandLocation, [field]: value },
      });
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const token = await getClientIdToken();
      const res = await fetch(`/api/brand-kits/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          brandName: form.brandName,
          industry: form.industry,
          tagline: form.tagline,
          website: form.website,
          phoneNumber: form.phoneNumber,
          contactLocation: form.contactLocation,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          accentColor: form.accentColor,
          logoUrl: form.logoUrl,
          brandLocation: form.brandLocation,
          targetAudience: form.targetAudience,
          ageRange: form.ageRange,
          platforms: form.platforms,
          language: form.language,
          tone: form.tone,
          styleNotes: form.styleNotes,
          sampleContent: form.sampleContent,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to save");
      }
      toast.success("Brand kit updated");
      router.push("/dashboard/brand-kits");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-5xl mx-auto flex items-center justify-center min-h-[40vh]">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!id) {
    return (
      <div className="px-4 py-8 max-w-5xl mx-auto">
        <Link href="/dashboard/brand-kits" className="text-sm text-text-muted hover:text-text-primary">
          ← Back to brand kits
        </Link>
      </div>
    );
  }

  const industries: { value: Industry; label: string }[] = [
    { value: "retail", label: "Retail" },
    { value: "food_beverage", label: "Food & Drink" },
    { value: "fashion", label: "Fashion" },
    { value: "technology", label: "Technology" },
    { value: "finance", label: "Finance" },
    { value: "healthcare", label: "Healthcare" },
    { value: "education", label: "Education" },
    { value: "hospitality", label: "Hospitality" },
    { value: "real_estate", label: "Real Estate" },
    { value: "telecom", label: "Telecom" },
    { value: "media", label: "Media" },
    { value: "other", label: "Other" },
  ];

  const tones: { value: Tone; label: string }[] = [
    { value: "professional", label: "Professional" },
    { value: "bold", label: "Bold" },
    { value: "friendly", label: "Friendly" },
    { value: "minimal", label: "Minimal" },
    { value: "luxury", label: "Luxury" },
    { value: "energetic", label: "Energetic" },
  ];

  const platforms: { value: Platform; label: string }[] = [
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "twitter", label: "Twitter/X" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "tiktok", label: "TikTok" },
    { value: "whatsapp", label: "WhatsApp" },
  ];

  return (
    <div className="px-4 py-8 sm:px-6 max-w-5xl mx-auto">
      <Link
        href="/dashboard/brand-kits"
        className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={12} />
        Back to brand kits
      </Link>
      <h1 className="font-semibold text-2xl text-text-primary tracking-tight mb-2">
        Edit brand kit
      </h1>
      <p className="font-mono text-xs text-text-muted mb-8">
        Update your brand details. The AI coach will give real-time recommendations and questions to define your brand better.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-bg-surface border border-border-default rounded-2xl p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-4">
              Brand
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Brand name</label>
                <input
                  type="text"
                  value={form.brandName}
                  onChange={(e) => update({ brandName: e.target.value })}
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-2">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind) => (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => update({ industry: ind.value })}
                      className={`px-3 py-1.5 rounded-lg border text-xs ${
                        form.industry === ind.value
                          ? "border-accent bg-accent/10 text-text-primary"
                          : "border-border-default bg-bg-elevated text-text-secondary hover:border-border-strong"
                      }`}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => update({ tagline: e.target.value })}
                  placeholder="e.g. Fresh from the farm to your table"
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => update({ website: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong"
                />
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] text-text-muted mb-2">Contact on posters (optional)</p>
            <p className="text-[12px] text-text-secondary mb-3">If set, these appear at the bottom of generated posters.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Phone number</label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => update({ phoneNumber: e.target.value })}
                  placeholder="e.g. 012 3456 7890"
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Location / address</label>
                <input
                  type="text"
                  value={form.contactLocation}
                  onChange={(e) => update({ contactLocation: e.target.value })}
                  placeholder="e.g. Dar es Salaam, or full address"
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong"
                />
              </div>
            </div>
          </section>

          <section className="bg-bg-surface border border-border-default rounded-2xl p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-4">
              Colors & logo
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { key: "primaryColor" as const, label: "Primary" },
                { key: "secondaryColor" as const, label: "Secondary" },
                { key: "accentColor" as const, label: "Accent" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block font-mono text-[11px] text-text-muted mb-1">{label}</label>
                  <div className="flex items-center gap-2 bg-bg-elevated border border-border-default rounded-lg px-2 py-1.5">
                    <input
                      type="color"
                      value={form[key]}
                      onChange={(e) => update({ [key]: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => {
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) || e.target.value === "")
                          update({ [key]: e.target.value });
                      }}
                      className="flex-1 bg-transparent text-xs font-mono text-text-primary outline-none uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}
            </div>
            {form.logoUrl && (
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Logo</label>
                <img src={form.logoUrl} alt="Logo" className="h-12 object-contain rounded-lg bg-bg-elevated" />
              </div>
            )}
          </section>

          <section className="bg-bg-surface border border-border-default rounded-2xl p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-4">
              Audience & location
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Country</label>
                <input
                  type="text"
                  value={form.brandLocation?.country ?? ""}
                  onChange={(e) =>
                    update({
                      brandLocation: { ...form.brandLocation, country: e.target.value },
                    })
                  }
                  placeholder="e.g. Nigeria, Kenya"
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">City</label>
                <input
                  type="text"
                  value={form.brandLocation?.city ?? ""}
                  onChange={(e) =>
                    update({
                      brandLocation: { ...form.brandLocation, city: e.target.value },
                    })
                  }
                  placeholder="e.g. Lagos, Nairobi"
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Target audience</label>
                <textarea
                  value={form.targetAudience}
                  onChange={(e) => update({ targetAudience: e.target.value })}
                  rows={2}
                  placeholder="e.g. Young professionals 25–40"
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong resize-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        const next = form.platforms.includes(p.value)
                          ? form.platforms.filter((x) => x !== p.value)
                          : [...form.platforms, p.value];
                        update({ platforms: next });
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs ${
                        form.platforms.includes(p.value)
                          ? "border-accent bg-accent/10 text-text-primary"
                          : "border-border-default bg-bg-elevated text-text-secondary hover:border-border-strong"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-bg-surface border border-border-default rounded-2xl p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-4">
              Voice & content
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-2">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {tones.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => update({ tone: t.value })}
                      className={`px-3 py-1.5 rounded-lg border text-xs ${
                        form.tone === t.value
                          ? "border-accent bg-accent/10 text-text-primary"
                          : "border-border-default bg-bg-elevated text-text-secondary hover:border-border-strong"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Style notes</label>
                <textarea
                  value={form.styleNotes}
                  onChange={(e) => update({ styleNotes: e.target.value })}
                  rows={2}
                  placeholder="e.g. Always use 'we'. Avoid jargon."
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong resize-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-text-muted mb-1">Sample content</label>
                <textarea
                  value={form.sampleContent}
                  onChange={(e) => update({ sampleContent: e.target.value })}
                  rows={3}
                  placeholder="Paste an example of content you like"
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-border-strong resize-none"
                />
              </div>
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/brand-kits")}
              className="px-4 py-2.5 rounded-lg border border-border-default text-text-secondary text-sm font-medium hover:border-border-strong"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-accent text-black font-semibold text-sm py-2.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <BrandCoachPanel
              payload={coachPayload}
              step="edit"
              onApplySuggestion={handleApplySuggestion}
              getToken={getClientIdToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
