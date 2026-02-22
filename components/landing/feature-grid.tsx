"use client";

import {
  Calendar,
  Palette,
  ImagePlus,
  CheckCircle2,
  History,
  Layers,
} from "lucide-react";

const FEATURES = [
  {
    icon: Calendar,
    title: "Daily Automation",
    description:
      "One poster generated per brand, every morning. Set your timezone and preferred time—we handle the rest.",
  },
  {
    icon: Palette,
    title: "Brand Kit Engine",
    description:
      "Colors, logo, tone, and language baked into every output. One source of truth for how your brand looks and sounds.",
  },
  {
    icon: ImagePlus,
    title: "Copy + Image in One",
    description:
      "Headline, body, CTA, hashtags, and artwork in seconds. No jumping between tools or waiting on design.",
  },
  {
    icon: CheckCircle2,
    title: "Approval Workflow",
    description:
      "Review, edit, approve before anything goes out. No surprise posts—you stay in control.",
  },
  {
    icon: History,
    title: "Version History",
    description:
      "Every regeneration saved. Roll back to a previous version anytime. Full audit trail for your team.",
  },
  {
    icon: Layers,
    title: "Multi-Brand Support",
    description:
      "Run multiple brand kits from one workspace. Switch context in one click.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl animate-fade-up">
          Everything your brand needs. Built into ArtMaster.
        </h2>
        <p className="mt-2 font-apple text-sm font-normal leading-relaxed text-text-secondary animate-fade-up">
          Six ways we keep your social presence consistent without the busywork.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="rounded-xl border border-border-default bg-bg-surface p-6 transition-colors duration-200 hover:border-border-strong animate-fade-up"
              style={{
                opacity: 0,
                animationDelay: `${i * 80}ms`,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border-default text-text-muted">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-apple text-base font-semibold tracking-tight text-text-primary">
                {f.title}
              </h3>
              <p className="mt-2 font-apple text-sm font-normal leading-relaxed text-text-secondary">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
