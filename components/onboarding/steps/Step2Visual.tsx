"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { BrandKitPreviewCard } from "@/components/onboarding/BrandKitPreviewCard";
import type { WizardFormData } from "@/types";

const PRESETS = [
  { primary: "#1a1a2e", secondary: "#16213e", accent: "#E8FF47" },
  { primary: "#2C3E50", secondary: "#E74C3C", accent: "#F39C12" },
  { primary: "#004D40", secondary: "#00897B", accent: "#E8FF47" },
  { primary: "#1B2631", secondary: "#2874A6", accent: "#F4D03F" },
  { primary: "#17202A", secondary: "#1F618D", accent: "#AAB7B8" },
];

function ColorRow({
  label,
  field,
  value,
  updateForm,
}: {
  label: string;
  field: "primaryColor" | "secondaryColor" | "accentColor";
  value: string;
  updateForm: (f: Partial<WizardFormData>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-10 w-10 shrink-0 rounded-lg border border-border-default"
        style={{ backgroundColor: value }}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => updateForm({ [field]: e.target.value })}
        className="sr-only"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === "")
            updateForm({ [field]: v || "#000000" });
        }}
        className="w-32 rounded-lg border border-border-default bg-bg-elevated px-3 py-2 font-mono text-sm uppercase text-text-primary focus:border-border-strong focus:outline-none"
        maxLength={7}
      />
      <span className="font-mono text-[11px] text-text-muted">{label}</span>
    </div>
  );
}

export function Step2Visual({
  formData,
  updateForm,
  onBack,
  onNext,
}: {
  formData: WizardFormData;
  updateForm: (fields: Partial<WizardFormData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    updateForm({ logoFile: file, logoPreviewUrl: URL.createObjectURL(file) });
  }

  function clearLogo() {
    if (formData.logoPreviewUrl) URL.revokeObjectURL(formData.logoPreviewUrl);
    updateForm({ logoFile: null, logoPreviewUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && /^image\//.test(file.type) && file.size <= 5 * 1024 * 1024) {
      updateForm({ logoFile: file, logoPreviewUrl: URL.createObjectURL(file) });
    }
  }

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Define your visual identity
      </h2>
      <p className="mt-2 font-sans text-sm text-text-secondary">
        These colors and your logo will appear on every poster ArtMaster creates.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,280px]">
        <div className="space-y-6">
          <div className="space-y-4">
            <ColorRow label="Primary" field="primaryColor" value={formData.primaryColor} updateForm={updateForm} />
            <ColorRow label="Secondary" field="secondaryColor" value={formData.secondaryColor} updateForm={updateForm} />
            <ColorRow label="Accent" field="accentColor" value={formData.accentColor} updateForm={updateForm} />
          </div>
          <div>
            <p className="font-mono text-[11px] text-text-muted">Quick palettes</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    updateForm({
                      primaryColor: p.primary,
                      secondaryColor: p.secondary,
                      accentColor: p.accent,
                    })
                  }
                  className="flex items-center gap-1 rounded-full border border-border-default bg-bg-surface px-2 py-1.5 hover:border-border-strong"
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.primary }} />
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.secondary }} />
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.accent }} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-apple text-xs font-medium text-text-secondary">
              Brand logo (optional but recommended)
            </label>
            <p className="mt-0.5 font-mono text-[11px] text-text-muted">
              PNG or SVG with transparent background works best
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/jpg"
              className="sr-only"
              onChange={handleFile}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="mt-2 cursor-pointer rounded-xl border-2 border-dashed border-border-default p-8 text-center hover:border-border-strong hover:bg-bg-elevated/50"
            >
              {formData.logoPreviewUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={formData.logoPreviewUrl} alt="" className="max-h-16 max-w-32 object-contain" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearLogo();
                    }}
                    className="font-mono text-[11px] text-status-error hover:underline"
                  >
                    Remove logo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-text-muted" />
                  <p className="font-sans text-sm text-text-secondary">
                    Drop your logo here or click to upload
                  </p>
                  <p className="font-mono text-[11px] text-text-muted">PNG, SVG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="hidden lg:block">
          <BrandKitPreviewCard formData={formData} />
        </div>
      </div>
      <div className="mt-10 flex justify-between">
        <button type="button" onClick={onBack} className="rounded-lg border border-border-default bg-transparent px-4 py-2.5 font-apple text-sm font-medium text-text-primary hover:bg-bg-elevated">
          Back
        </button>
        <button type="button" onClick={onNext} className="rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black hover:opacity-90">
          Continue
        </button>
      </div>
    </div>
  );
}
