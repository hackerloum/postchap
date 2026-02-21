"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Landmark,
  Smartphone,
  Building2,
  HeartPulse,
  GraduationCap,
  Tv,
  Home,
  UtensilsCrossed,
  Shirt,
  Monitor,
  Zap,
} from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import type { WizardFormData } from "@/types";
import type { Industry } from "@/types";

const INDUSTRIES: { value: Industry; label: string; Icon: React.ElementType }[] = [
  { value: "retail", label: "Retail", Icon: ShoppingBag },
  { value: "finance", label: "Finance", Icon: Landmark },
  { value: "telecom", label: "Telecom", Icon: Smartphone },
  { value: "hospitality", label: "Hospitality", Icon: Building2 },
  { value: "healthcare", label: "Healthcare", Icon: HeartPulse },
  { value: "education", label: "Education", Icon: GraduationCap },
  { value: "media", label: "Media", Icon: Tv },
  { value: "real_estate", label: "Real Estate", Icon: Home },
  { value: "food_beverage", label: "Food & Beverage", Icon: UtensilsCrossed },
  { value: "fashion", label: "Fashion", Icon: Shirt },
  { value: "technology", label: "Technology", Icon: Monitor },
  { value: "other", label: "Other", Icon: Zap },
];

export function Step1Brand({
  formData,
  updateForm,
  onNext,
}: {
  formData: WizardFormData;
  updateForm: (fields: Partial<WizardFormData>) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<{ brandName?: string; industry?: string }>({});

  function handleNext() {
    const brandName = formData.brandName.trim();
    const industry = formData.industry;
    const nextErrors: typeof errors = {};
    if (brandName.length < 2) nextErrors.brandName = "Brand name must be at least 2 characters";
    if (!industry) nextErrors.industry = "Please select an industry";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onNext();
  }

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Tell us about your brand
      </h2>
      <p className="mt-2 font-sans text-sm text-text-secondary">
        This helps ArtMaster generate content that truly represents you.
      </p>

      <div className="mt-8 space-y-6">
        <AuthInput
          label="Brand name"
          type="text"
          value={formData.brandName}
          onChange={(e) => updateForm({ brandName: e.target.value })}
          placeholder="e.g. Vodacom Tanzania"
          error={errors.brandName}
        />

        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">
            Industry (required)
          </label>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {INDUSTRIES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateForm({ industry: value })}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors hover:border-border-strong ${
                  formData.industry === value
                    ? "border-accent bg-accent/5"
                    : "border-border-default bg-bg-surface"
                }`}
              >
                <Icon
                  size={20}
                  className={formData.industry === value ? "text-accent" : "text-text-muted"}
                />
                <span
                  className={`text-center font-mono text-[11px] ${
                    formData.industry === value ? "text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
          {errors.industry && (
            <p className="mt-1.5 font-mono text-[11px] text-status-error">{errors.industry}</p>
          )}
        </div>

        <div>
          <AuthInput
            label="Brand tagline (optional)"
            type="text"
            value={formData.tagline}
            onChange={(e) => updateForm({ tagline: e.target.value })}
            placeholder="e.g. The future is now"
          />
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            A short phrase that captures your brand&apos;s essence
          </p>
        </div>

        <AuthInput
          label="Website (optional)"
          type="url"
          value={formData.website}
          onChange={(e) => updateForm({ website: e.target.value })}
          placeholder="https://yourbrand.com"
        />
      </div>

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
