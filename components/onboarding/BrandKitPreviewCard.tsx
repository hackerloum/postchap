"use client";

import type { WizardFormData } from "@/types";

export function BrandKitPreviewCard({ formData }: { formData: WizardFormData }) {
  return (
    <div className="sticky top-6 overflow-hidden rounded-2xl border border-border-default bg-bg-surface">
      <div
        className="relative flex aspect-square w-full flex-col justify-between p-6"
        style={{ backgroundColor: formData.primaryColor }}
      >
        {formData.logoPreviewUrl ? (
          <img
            src={formData.logoPreviewUrl}
            alt=""
            className="h-8 w-auto object-contain self-start"
          />
        ) : (
          <div
            className="font-display text-lg font-semibold"
            style={{ color: formData.secondaryColor }}
          >
            {formData.brandName || "Your Brand"}
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center gap-2 py-6">
          <div
            className="h-3 w-3/4 rounded-full opacity-60"
            style={{ backgroundColor: formData.secondaryColor }}
          />
          <div
            className="h-2 w-full rounded-full opacity-40"
            style={{ backgroundColor: formData.secondaryColor }}
          />
          <div
            className="h-2 w-5/6 rounded-full opacity-40"
            style={{ backgroundColor: formData.secondaryColor }}
          />
          <div
            className="h-2 w-4/6 rounded-full opacity-40"
            style={{ backgroundColor: formData.secondaryColor }}
          />
        </div>

        <div
          className="self-start rounded-full px-4 py-2 text-xs font-semibold"
          style={{
            backgroundColor: formData.accentColor,
            color: formData.primaryColor,
          }}
        >
          {formData.tagline || "Learn More →"}
        </div>
      </div>

      <div className="border-t border-border-default p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-sm font-semibold text-text-primary">
              {formData.brandName || "Your Brand Kit"}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-text-muted">
              {formData.industry || "Industry not set"}
            </p>
          </div>
          <div className="flex gap-1">
            {[
              formData.primaryColor,
              formData.secondaryColor,
              formData.accentColor,
            ].map((c, i) => (
              <div
                key={i}
                className="h-4 w-4 rounded-full border border-border-default"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
