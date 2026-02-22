"use client";

import { Shield, Lock, EyeOff, KeyRound } from "lucide-react";

const ITEMS = [
  {
    icon: Shield,
    label: "Row-level security",
    description: "Data is scoped to your account. No cross-tenant access.",
  },
  {
    icon: Lock,
    label: "Encrypted storage",
    description: "Assets and data at rest use industry-standard encryption.",
  },
  {
    icon: EyeOff,
    label: "No training on your content",
    description: "Your copy and images are not used to train models.",
  },
  {
    icon: KeyRound,
    label: "API keys never exposed to client",
    description: "OpenAI and other keys stay on the server only.",
  },
];

export function Security() {
  return (
    <section className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl animate-fade-up">
          ArtMaster is built on infrastructure you can trust.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 animate-fade-up">
          {ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex gap-4 rounded-xl border border-border-default bg-bg-surface p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border-default text-text-muted">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-apple text-base font-semibold tracking-tight text-text-primary">
                  {item.label}
                </h3>
                <p className="mt-2 font-apple text-sm font-normal leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
