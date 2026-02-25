"use client";

import Link from "next/link";
import { Palette, ArrowRight } from "lucide-react";
import type { BrandKitItem } from "@/app/dashboard/brand-kits/actions";

export function BrandKitCard({ kit }: { kit: BrandKitItem | null }) {
  if (!kit) return null;

  return (
    <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-text-muted" />
          <span className="font-semibold text-[13px] text-text-primary">Brand kit</span>
        </div>
        <Link
          href="/dashboard/brand-kits"
          className="font-mono text-[11px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
        >
          Edit
          <ArrowRight size={10} />
        </Link>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-[15px] text-text-primary">{kit.brandName}</p>
          <div className="flex gap-1.5">
            {[kit.primaryColor, kit.secondaryColor, kit.accentColor]
              .filter(Boolean)
              .map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-white/10"
                  style={{ background: color }}
                  title={color}
                />
              ))}
          </div>
        </div>

        <div className="space-y-2">
          {[
            { label: "Industry", value: kit.industry },
            { label: "Location", value: kit.brandLocation?.country || "—" },
            { label: "Tone", value: kit.tone || "—" },
            { label: "Platforms", value: kit.platforms?.slice(0, 3).join(", ") || "—" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-text-muted">{row.label}</span>
              <span className="font-mono text-[11px] text-text-secondary capitalize">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-1.5 bg-success/5 border border-success/20 rounded-full px-3 py-1 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="font-mono text-[10px] text-success">Active</span>
        </div>
      </div>
    </div>
  );
}
