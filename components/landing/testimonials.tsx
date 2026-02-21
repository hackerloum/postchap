"use client";

import { motion } from "framer-motion";

const QUOTES = [
  {
    quote:
      "We went from scrambling for weekly content to having a draft ready every morning. Game changer for a small team.",
    name: "Jordan Lee",
    role: "Head of Marketing, Retail Co.",
  },
  {
    quote:
      "Finally, one place for our brand voice and visuals. The approval step keeps us in control without slowing things down.",
    name: "Sam Chen",
    role: "Brand Lead, Atlas Labs",
  },
  {
    quote:
      "Multi-brand support is exactly what we needed. One login, multiple clients, same workflow.",
    name: "Riley Park",
    role: "Creative Director, Studio North",
  },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-mono text-xs font-medium text-black">
      {initials}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl"
        >
          What teams are saying
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {QUOTES.map((q) => (
            <div
              key={q.name}
              className="rounded-xl border border-border-default bg-bg-surface p-6 transition-colors duration-200 hover:border-border-strong"
            >
              <p className="font-apple text-sm font-normal leading-relaxed text-text-primary">
                &ldquo;{q.quote}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-4">
                <Avatar name={q.name} />
                <div>
                  <p className="font-apple text-sm font-medium text-text-primary">
                    {q.name}
                  </p>
                  <p className="font-mono text-xs text-text-muted">{q.role}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
