"use client";

import { useState } from "react";
import { Instagram, Facebook, Twitter, Linkedin, Music, MessageCircle } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import type { WizardFormData, Platform } from "@/types";

const AGE_OPTIONS = ["18–24", "25–34", "35–44", "45–54", "55+", "All ages"];

const PLATFORMS: { value: Platform; label: string; size: string; Icon: React.ElementType }[] = [
  { value: "instagram", label: "Instagram", size: "1080×1080 · 1080×1350", Icon: Instagram },
  { value: "facebook", label: "Facebook", size: "1080×1080", Icon: Facebook },
  { value: "twitter", label: "Twitter / X", size: "1600×900", Icon: Twitter },
  { value: "linkedin", label: "LinkedIn", size: "1200×627", Icon: Linkedin },
  { value: "tiktok", label: "TikTok", size: "1080×1920", Icon: Music },
  { value: "whatsapp", label: "WhatsApp", size: "1080×1080", Icon: MessageCircle },
];

const LANGUAGES: { value: WizardFormData["language"]; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "sw", label: "Swahili", flag: "🇹🇿" },
  { value: "both", label: "Bilingual", flag: "⚡" },
];

export function Step3Audience({ formData, updateForm, onBack, onNext }: {
  formData: WizardFormData;
  updateForm: (fields: Partial<WizardFormData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [error, setError] = useState("");
  function handleNext() {
    if (formData.targetAudience.trim().length < 10) {
      setError("Please describe your target audience (at least 10 characters)");
      return;
    }
    setError("");
    onNext();
  }
  function togglePlatform(p: Platform) {
    const next = formData.platforms.includes(p) ? formData.platforms.filter((x) => x !== p) : [...formData.platforms, p];
    updateForm({ platforms: next });
  }
  return (
    <div>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">Who are you talking to?</h2>
      <p className="mt-2 font-sans text-sm text-text-secondary">ArtMaster crafts content that speaks directly to your audience.</p>
      <div className="mt-8 space-y-6">
        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">Describe your target audience (required)</label>
          <textarea value={formData.targetAudience} onChange={(e) => updateForm({ targetAudience: e.target.value })} placeholder="e.g. Young professionals aged 25-35 in Dar es Salaam who are interested in digital banking and financial independence" rows={3} maxLength={300} className="mt-1.5 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 font-apple text-sm text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none" />
          <p className="mt-1 font-mono text-[11px] text-text-muted">{formData.targetAudience.length}/300</p>
          {error && <p className="mt-1 font-mono text-[11px] text-status-error">{error}</p>}
        </div>
        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">Age range</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {AGE_OPTIONS.map((opt) => (
              <button key={opt} type="button" onClick={() => updateForm({ ageRange: opt })} className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${formData.ageRange === opt ? "border-accent bg-accent/10 text-text-primary" : "border-border-default bg-bg-elevated hover:border-border-strong"}`}>{opt}</button>
            ))}
          </div>
        </div>
        <AuthInput label="Primary location" type="text" value={formData.location} onChange={(e) => updateForm({ location: e.target.value })} placeholder="e.g. Dar es Salaam, Tanzania" />
        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">Which platforms do you post on?</label>
          <p className="mt-0.5 font-mono text-[11px] text-text-muted">ArtMaster will optimize poster sizes for these platforms</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PLATFORMS.map(({ value, label, size, Icon }) => (
              <button key={value} type="button" onClick={() => togglePlatform(value)} className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${formData.platforms.includes(value) ? "border-accent bg-accent/5" : "border-border-default bg-bg-surface hover:border-border-strong"}`}>
                <Icon size={24} className="text-text-muted" />
                <span className="font-sans text-sm font-medium text-text-primary">{label}</span>
                <span className="font-mono text-[10px] text-text-muted">{size}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">Content language</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {LANGUAGES.map(({ value, label, flag }) => (
              <button key={value} type="button" onClick={() => updateForm({ language: value })} className={`flex flex-col items-center gap-1 rounded-xl border p-4 transition-colors ${formData.language === value ? "border-accent bg-accent/5" : "border-border-default bg-bg-surface hover:border-border-strong"}`}>
                <span className="text-lg">{flag}</span>
                <span className="font-sans text-sm font-medium text-text-primary">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10 flex justify-between">
        <button type="button" onClick={onBack} className="rounded-lg border border-border-default bg-transparent px-4 py-2.5 font-apple text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated">← Back</button>
        <button type="button" onClick={handleNext} className="rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black transition-all duration-150 hover:opacity-90 active:scale-[0.98]">Continue →</button>
      </div>
    </div>
  );
}
