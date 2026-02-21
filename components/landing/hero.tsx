"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="font-display text-6xl font-semibold leading-[1.05] tracking-tight text-text-primary md:text-7xl"
          >
            Your brand posts itself. Every single day.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 font-apple text-sm font-normal leading-relaxed text-text-secondary"
          >
            One social poster per brand, generated every morning with your
            colors, tone, and copy. Review, edit, approve—then ship. No design
            bottleneck.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Button variant="primary" size="lg" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="#how-it-works">See how it works →</Link>
            </Button>
          </motion.div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <HeroMockup />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="mx-auto mt-12 flex max-w-6xl flex-wrap justify-center gap-6 px-6 md:px-8"
      >
        {STATS.map((stat) => (
          <span key={stat} className="font-mono text-xs text-text-muted">
            {stat}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
