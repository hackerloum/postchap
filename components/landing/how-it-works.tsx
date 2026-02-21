"use client";

import { motion } from "framer-motion";
import { Settings2, Clock, CheckSquare } from "lucide-react";

const STEPS = [
  {
    title: "Create a Brand Kit",
    description:
      "Add your name, colors, logo, tone, and sample copy. One setup per brand—we use it for every poster.",
    visual: "wizard",
    icon: Settings2,
  },
  {
    title: "Enable your daily schedule",
    description:
      "Turn on the poster job, pick a size and time. We'll generate one poster per brand at that time every day.",
    visual: "schedule",
    icon: Clock,
  },
  {
    title: "Review & approve each morning",
    description:
      "Open the draft, edit copy if needed, then approve. Only approved posters are ready to post.",
    visual: "approval",
    icon: CheckSquare,
  },
];

function StepVisual({ type }: { type: string }) {
  if (type === "wizard") {
    return (
      <div className="rounded-xl border border-border-default bg-bg-surface p-6">
        <div className="flex gap-2">
          <div className="h-2 w-8 rounded-full bg-accent" />
          <div className="h-2 flex-1 rounded-full bg-border-default" />
          <div className="h-2 flex-1 rounded-full bg-border-default" />
          <div className="h-2 flex-1 rounded-full bg-border-default" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-8 w-full rounded bg-border-default" />
          <div className="h-8 w-2/3 rounded bg-border-default" />
        </div>
      </div>
    );
  }
  if (type === "schedule") {
    return (
      <div className="rounded-xl border border-border-default bg-bg-surface p-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-text-muted">Poster job</span>
          <div className="h-5 w-10 rounded-full bg-accent" />
        </div>
        <div className="mt-4 flex gap-4">
          <div className="h-16 w-16 rounded bg-border-default" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded bg-border-default" />
            <div className="mt-2 h-3 w-full rounded bg-border-default" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border-default bg-bg-surface p-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded border border-border-default" />
        <div className="h-4 w-32 rounded bg-border-default" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-9 flex-1 rounded border border-border-default" />
        <div className="h-9 w-24 rounded bg-accent" />
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl"
        >
          How ArtMaster works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-2 font-apple text-sm font-normal leading-relaxed text-text-secondary"
        >
          Three steps from setup to daily posts.
        </motion.p>
        <div className="mt-16 space-y-24">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="grid gap-12 md:grid-cols-2 md:items-center"
              style={i % 2 === 1 ? { direction: "rtl" } : undefined}
            >
              <div style={i % 2 === 1 ? { direction: "ltr" } : undefined}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-accent">
                    Step {i + 1}
                  </span>
                  <step.icon className="h-4 w-4 text-text-muted" />
                </div>
                <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-3 font-apple text-sm font-normal leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>
              <div style={i % 2 === 1 ? { direction: "ltr" } : undefined}>
                <StepVisual type={step.visual} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
