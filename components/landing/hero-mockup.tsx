"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DEMO_BRAND = {
  name: "Acme Studio",
  primaryColor: "#E8FF47",
  posterHeadline: "Create what matters.",
  posterSubheadline: "One poster, every morning.",
  status: "generated" as const,
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    generated:
      "bg-[#1A1A0A] text-status-warning border border-status-warning/30",
    approved:
      "bg-[#0A1A0F] text-status-success border border-status-success/30",
    posted:
      "bg-[#0A0F1A] text-status-info border border-status-info/30",
    failed:
      "bg-[#1A0A0A] text-status-error border border-status-error/30",
  };
  return (
    <span
      className={cn(
        "badge font-mono rounded-full px-2 py-0.5 text-[11px] uppercase tracking-widest",
        styles[status] ?? styles.generated
      )}
    >
      {status}
    </span>
  );
}

export function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="relative"
    >
      <div className="rounded-xl border border-border-default bg-bg-surface p-6 transition-colors duration-200 hover:border-border-strong">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded"
              style={{ backgroundColor: DEMO_BRAND.primaryColor }}
            />
            <span className="font-mono text-xs text-text-muted">
              {DEMO_BRAND.name}
            </span>
          </div>
          <StatusBadge status={DEMO_BRAND.status} />
        </div>
        <div
          className="flex aspect-[4/5] flex-col justify-end rounded-md border border-border-default p-6"
          style={{
            background: `linear-gradient(180deg, ${DEMO_BRAND.primaryColor}15 0%, var(--bg-surface) 60%)`,
          }}
        >
          <p className="font-display text-3xl text-text-primary">
            {DEMO_BRAND.posterHeadline}
          </p>
          <p className="mt-2 font-apple text-sm text-text-secondary">
            {DEMO_BRAND.posterSubheadline}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-2 flex-1 rounded bg-border-default" />
          <div className="h-2 flex-1 rounded bg-border-default" />
          <div className="h-2 w-8 rounded bg-accent" />
        </div>
      </div>
    </motion.div>
  );
}
