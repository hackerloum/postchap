"use client";

import Link from "next/link";
import { trackBlogCtaClick } from "@/lib/blog/analytics";

const BASE_URL = "https://artmasterpro.com";

type CtaVariant = "top" | "mid" | "bottom";

interface BlogCTAProps {
  slug: string;
  variant: CtaVariant;
  topic?: string;
  className?: string;
}

const VARIANTS: Record<CtaVariant, { label: string; sub?: string }> = {
  top: {
    label: "Generate your first poster free",
    sub: "artmasterpro.com",
  },
  mid: {
    label: "Try it now",
    sub: undefined,
  },
  bottom: {
    label: "Start free today. No credit card. No designer needed.",
    sub: undefined,
  },
};

export function BlogCTA({ slug, variant, topic, className = "" }: BlogCTAProps) {
  const v = VARIANTS[variant];
  const href = `${BASE_URL}/signup?utm_source=blog&utm_medium=article&utm_campaign=${encodeURIComponent(slug)}`;
  const displayLabel = variant === "mid" && topic ? `Try it now — ${topic}` : v.label;

  const handleClick = () => {
    trackBlogCtaClick({ slug, position: variant });
  };

  return (
    <aside
      className={`rounded-xl border border-accent/30 bg-accent/10 p-6 text-center ${className}`}
    >
      <p className="text-text-primary font-medium mb-3">{displayLabel}</p>
      {v.sub && <p className="text-text-muted text-sm mb-3">{v.sub}</p>}
      <Link
        href={href}
        onClick={handleClick}
        className="inline-flex items-center justify-center bg-accent text-black font-semibold px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors"
      >
        Start free →
      </Link>
    </aside>
  );
}
