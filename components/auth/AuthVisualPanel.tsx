"use client";

import { motion } from "framer-motion";

export function AuthVisualPanel() {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-bg-surface border-l border-border-default">
      {/* Layer 1 — SVG background */}
      <svg
        className="absolute inset-0 h-full w-full"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <pattern
            id="dot-grid"
            patternUnits="userSpaceOnUse"
            width="40"
            height="40"
          >
            <circle
              r="1.5"
              fill="var(--border-default)"
              opacity="0.6"
              cx="20"
              cy="20"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
        {/* Concentric rings — animated via class */}
        <circle
          className="ring-pulse"
          cx="75%"
          cy="30%"
          r="280"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="0.5"
          opacity="0.15"
          style={{
            transformOrigin: "center",
            animation: "ring-pulse 8s ease-in-out infinite",
          }}
        />
        <circle
          className="ring-pulse"
          cx="75%"
          cy="30%"
          r="180"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="0.5"
          opacity="0.20"
          style={{
            transformOrigin: "center",
            animation: "ring-pulse 12s ease-in-out infinite",
          }}
        />
        <circle
          className="ring-pulse"
          cx="75%"
          cy="30%"
          r="80"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          opacity="0.25"
          style={{
            transformOrigin: "center",
            animation: "ring-pulse 16s ease-in-out infinite",
          }}
        />
        {/* Floating diagonal lines */}
        <line
          x1="0"
          y1="20%"
          x2="100%"
          y2="25%"
          stroke="var(--border-strong)"
          strokeWidth="0.5"
          opacity="0.3"
          className="line-drift"
          style={{ animation: "line-drift 15s linear infinite alternate" }}
        />
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="45%"
          stroke="var(--border-strong)"
          strokeWidth="0.5"
          opacity="0.3"
          style={{ animation: "line-drift 18s linear infinite alternate" }}
        />
        <line
          x1="0"
          y1="70%"
          x2="100%"
          y2="75%"
          stroke="var(--border-strong)"
          strokeWidth="0.5"
          opacity="0.3"
          style={{ animation: "line-drift 22s linear infinite alternate" }}
        />
        <line
          x1="10%"
          y1="0"
          x2="90%"
          y2="100%"
          stroke="var(--border-strong)"
          strokeWidth="0.5"
          opacity="0.3"
          style={{ animation: "line-drift 25s linear infinite alternate" }}
        />
        {/* Accent cross — group at 85% 60%, then rotate */}
        <g
          transform="translate(85%, 60%)"
          style={{ animation: "cross-rotate 30s linear infinite" }}
        >
          <line
            x1="-20"
            y1="0"
            x2="20"
            y2="0"
            stroke="var(--accent)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="-20"
            x2="0"
            y2="20"
            stroke="var(--accent)"
            strokeWidth="1"
          />
        </g>
        {/* Scattered accent dots */}
        {[
          { cx: "25%", cy: "25%", d: 0 },
          { cx: "80%", cy: "70%", d: 1 },
          { cx: "15%", cy: "60%", d: 2 },
          { cx: "60%", cy: "15%", d: 3 },
          { cx: "45%", cy: "85%", d: 4 },
          { cx: "90%", cy: "40%", d: 5 },
        ].map(({ cx, cy, d }) => (
          <circle
            key={d}
            cx={cx}
            cy={cy}
            r="2"
            fill="var(--accent)"
            opacity="0.4"
            style={{
              animation: `dot-pulse 2s ease-in-out infinite`,
              animationDelay: `${d}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes ring-pulse {
            0%, 100% { opacity: 0.10; transform: scale(1); }
            50% { opacity: 0.25; transform: scale(1.03); }
          }
          @keyframes line-drift {
            0% { transform: translateY(0); }
            100% { transform: translateY(-20px); }
          }
          @keyframes cross-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes dot-pulse {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.5); }
          }
        `}</style>
      </svg>

      {/* Layer 2 — Content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center p-16">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-widest text-accent">
          ArtMaster Platform
        </p>
        <div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-display text-5xl font-semibold leading-[1.1] tracking-tight text-text-primary xl:text-6xl"
          >
            Your brand.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
            className="font-display text-5xl font-semibold leading-[1.1] tracking-tight text-text-primary xl:text-6xl"
          >
            Every morning.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            className="font-display text-5xl font-semibold leading-[1.1] tracking-tight text-accent xl:text-6xl"
          >
            Automated.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-10 flex flex-wrap gap-2"
        >
          {[
            "Daily automation",
            "Brand-aware AI",
            "One-click approve",
          ].map((label, i) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-elevated px-3 py-1.5 font-mono text-[11px] text-text-secondary"
            >
              <span className="text-accent">◆</span>
              {label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bottom testimonial */}
      <div className="absolute bottom-10 left-0 right-0 z-10 mx-auto max-w-xs text-center">
        <p className="font-display text-6xl leading-none text-accent/20">
          &ldquo;
        </p>
        <p className="font-apple text-sm font-normal leading-relaxed text-text-secondary mt-[-0.5em]">
          ArtMaster changed how we show up online. Our brand posts every day
          without us thinking about it.
        </p>
        <p className="mt-2 font-mono text-[11px] text-text-muted">
          — Marketing Lead, Vodacom Tanzania
        </p>
      </div>
    </div>
  );
}
