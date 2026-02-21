"use client";

import { useState } from "react";
import {
  Briefcase,
  Zap,
  Smile,
  Minus,
  Crown,
  Flame,
} from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import type { WizardFormData, Tone } from "@/types";

const TONES: {
  value: Tone;
  label: string;
  description: string;
  Icon: React.ElementType;
}[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Clear, credible, and trustworthy",
    Icon: Briefcase,
  },
  {
    value: "bold",
    label: "Bold",
    description: "Direct, confident, makes a statement",
    Icon: Zap,
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm, approachable, conversational",
    Icon: Smile,
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Clean, simple, let the work speak",
    Icon: Minus,
  },
  {
    value: "luxury",
    label: "Luxury",
    description: "Premium, refined, aspirational",
    Icon: Crown,
  },
  {
    value: "energetic",
    label: "Energetic",
    description: "High energy, exciting, youth-driven",
    Icon: Flame,
  },
];

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function Step4Content({
  formData,
  updateForm,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  formData: WizardFormData;
  updateForm: (fields: Partial<WizardFormData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!formData.tone) {
      setError("Please select a brand tone");
      return;
    }
    setError("");
    onSubmit();
  }

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        How should your brand sound?
      </h2>
      <p className="mt-2 font-sans text-sm text-text-secondary">
        This is what makes your content uniquely yours.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">
            Brand tone (required)
          </label>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TONES.map(({ value, label, description, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateForm({ tone: value })}
                className={`flex flex-col items-start gap-1 rounded-xl border p-5 text-left transition-colors ${
                  formData.tone === value
                    ? "border-accent bg-accent/5"
                    : "border-border-default bg-bg-surface hover:border-border-strong"
                }`}
              >
                <Icon
                  size={20}
                  className={formData.tone === value ? "text-accent" : "text-text-muted"}
                />
                <span className="font-sans text-sm font-semibold text-text-primary">
                  {label}
                </span>
                <span className="font-mono text-[11px] text-text-muted">
                  {description}
                </span>
              </button>
            ))}
          </div>
          {error && (
            <p className="mt-1 font-mono text-[11px] text-status-error">{error}</p>
          )}
        </div>

        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">
            Additional style notes (optional)
          </label>
          <textarea
            value={formData.styleNotes}
            onChange={(e) => updateForm({ styleNotes: e.target.value })}
            placeholder="e.g. Always end posts with a question. Use short punchy sentences. Never use jargon. Reference local culture when relevant."
            rows={3}
            maxLength={500}
            className="mt-1.5 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 font-apple text-sm text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
          />
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            {formData.styleNotes.length}/500
          </p>
        </div>

        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">
            Paste a sample of your best content (optional)
          </label>
          <textarea
            value={formData.sampleContent}
            onChange={(e) => updateForm({ sampleContent: e.target.value })}
            placeholder="Paste an example post, caption, or ad copy that represents your brand voice perfectly. ArtMaster will use this as a reference, never copy it."
            rows={4}
            maxLength={1000}
            className="mt-1.5 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 font-apple text-sm text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
          />
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            {formData.sampleContent.length}/1000 — This helps ArtMaster match your exact voice. Never used as-is.
          </p>
        </div>

        <AuthInput
          label="Main competitors (optional)"
          type="text"
          value={formData.competitors}
          onChange={(e) => updateForm({ competitors: e.target.value })}
          placeholder="e.g. Competitor brands in your market"
        />
      </div>

      <div className="mt-8 rounded-xl border border-border-default bg-bg-surface p-6">
        <h3 className="font-display text-lg text-text-primary">
          Review your Brand Kit
        </h3>
        <p className="mt-0.5 font-mono text-xs text-text-muted">
          Here&apos;s what ArtMaster knows about your brand
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] text-text-muted">Brand</p>
            <p className="font-sans text-sm text-text-primary">{formData.brandName || "—"}</p>
          </div>
          <div>
            <p className="font-mono text-[11px] text-text-muted">Industry</p>
            <p className="font-sans text-sm text-text-primary capitalize">
              {formData.industry || "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] text-text-muted">Language</p>
            <p className="font-sans text-sm text-text-primary uppercase">
              {formData.language}
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] text-text-muted">Tone</p>
            <p className="font-sans text-sm text-text-primary capitalize">
              {formData.tone || "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] text-text-muted">Platforms</p>
            <p className="font-sans text-sm text-text-primary">
              {formData.platforms.length
                ? formData.platforms.join(", ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] text-text-muted">Location</p>
            <p className="font-sans text-sm text-text-primary">
              {formData.selectedCountry
                ? (formData.city ? `${formData.city}, ` : "") + formData.selectedCountry.name
                : "—"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-mono text-[11px] text-text-muted">Audience</p>
            <p className="font-sans text-sm text-text-primary">
              {formData.targetAudience
                ? formData.targetAudience.slice(0, 80) +
                  (formData.targetAudience.length > 80 ? "…" : "")
                : "—"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {[
            formData.primaryColor,
            formData.secondaryColor,
            formData.accentColor,
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="h-4 w-4 rounded-full border border-border-default"
                style={{ backgroundColor: c }}
              />
              <span className="font-mono text-[10px] text-text-muted">{c}</span>
            </div>
          ))}
        </div>
        {formData.logoPreviewUrl && (
          <div className="mt-3">
            <p className="font-mono text-[11px] text-text-muted">Logo</p>
            <img
              src={formData.logoPreviewUrl}
              alt=""
              className="mt-1 h-8 w-auto object-contain"
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border-default bg-transparent px-4 py-2.5 font-apple text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-accent px-8 py-2.5 font-apple text-sm font-semibold text-black transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Creating your Brand Kit...
            </>
          ) : (
            "Launch ArtMaster →"
          )}
        </button>
      </div>
    </div>
  );
}
