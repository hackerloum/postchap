"use client";

import { useState, useEffect } from "react";

const BRANDS = [
  { name: "KILIMO", sub: "AgriTech" },
  { name: "NEXUS", sub: "Finance" },
  { name: "URBANHAUS", sub: "Real Estate" },
  { name: "MERIDIAN", sub: "Healthcare" },
  { name: "APEX", sub: "Retail" },
  { name: "SOLARIS", sub: "Technology" },
  { name: "HARBOR", sub: "Logistics" },
  { name: "CREST", sub: "Education" },
];

export function TrustBarSection() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <section className="bg-bg-surface py-16 overflow-hidden trust-section-contain">
      <p className="font-mono text-[11px] text-text-muted text-center tracking-[0.2em] mb-10">
        TRUSTED BY BUSINESSES ACROSS AFRICA AND BEYOND
      </p>
      <div className="relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, var(--color-bg-surface, #080808), transparent)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, var(--color-bg-surface, #080808), transparent)",
          }}
        />
        {ready ? (
          <div className="flex gap-16 animate-marquee">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex items-center gap-16 shrink-0">
                {BRANDS.map((brand) => (
                  <div
                    key={`${setIndex}-${brand.name}`}
                    className="flex flex-col items-center gap-1 shrink-0 group"
                  >
                    <span className="font-bold text-[18px] tracking-[0.15em] text-text-muted/40 group-hover:text-text-muted/70 transition-colors duration-300 select-none">
                      {brand.name}
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.2em] text-text-muted/25 group-hover:text-text-muted/50 transition-colors duration-300">
                      {brand.sub}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-16 opacity-0 pointer-events-none min-h-[3rem]" aria-hidden>
            <div className="flex items-center gap-16 shrink-0">
              {BRANDS.map((b) => (
                <div key={b.name} className="flex flex-col items-center gap-1 shrink-0">
                  <span className="font-bold text-[18px]">{b.name}</span>
                  <span className="font-mono text-[9px]">{b.sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
