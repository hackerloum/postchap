"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { HeroMockup } from "./hero-mockup";

const STATS = [
  "1 poster/day · per brand",
  "Copy + image in one",
  "Approval before post",
  "Multi-brand ready",
];

export function Hero() {
  return (
    <section className="px-6 py-32 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-16">
        <div className="min-w-0 lg:max-w-xl">
          <div className="mb-8 animate-fade-up" style={{ animationDelay: "0ms" }}>
            <Logo variant="hero" link={true} />
          </div>
          <h1
            className="font-display text-6xl font-semibold leading-[1.05] tracking-tight text-text-primary md:text-7xl animate-fade-up"
            style={{ opacity: 0, animationDelay: "100ms" }}
          >
            Your brand posts itself. Every single day.
          </h1>
          <p
            className="mt-6 font-apple text-sm font-normal leading-relaxed text-text-secondary animate-fade-up"
            style={{ opacity: 0, animationDelay: "200ms" }}
          >
            ArtMaster generates a fresh, on-brand social media poster every
            morning — automatically. Built for businesses everywhere that take
            their brand seriously.
          </p>
          <div
            className="mt-8 flex flex-wrap gap-4 animate-fade-up"
            style={{ opacity: 0, animationDelay: "250ms" }}
          >
            <Button variant="primary" size="lg" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="#how-it-works">See how it works →</Link>
            </Button>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <HeroMockup />
        </div>
      </div>
      <div
        className="mx-auto mt-12 flex max-w-6xl flex-wrap justify-center gap-6 px-6 md:px-8 animate-fade-in"
        style={{ animationDelay: "500ms", opacity: 0 }}
      >
        {STATS.map((stat) => (
          <span key={stat} className="font-mono text-xs text-text-muted">
            {stat}
          </span>
        ))}
      </div>
    </section>
  );
}
