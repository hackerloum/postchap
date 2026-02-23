"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Zap,
  BarChart3,
  Globe2,
  Bell,
  Clock,
  Layers,
} from "lucide-react";

export default function Home() {
  return (
    <>
      {/* Section 1 — Nav */}
      <header className="sticky top-0 left-0 right-0 h-14 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-accent rounded-[4px] flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-[2px]" />
              </div>
              <span className="font-semibold text-[15px] text-text-primary tracking-tight">
                ArtMaster
              </span>
            </div>
            <div className="h-4 w-px bg-border-default hidden sm:block" />
            <span className="font-mono text-[10px] text-text-muted tracking-widest hidden sm:block">
              PLATFORM
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {["Features", "How it works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 bg-accent text-black font-semibold text-[13px] px-4 py-2 rounded-lg hover:bg-accent-dim transition-colors"
            >
              Get started
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Section 2 — Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-24 px-4">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `radial-gradient(circle, #2a2a2a 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 50%, transparent 40%, #0a0a0a 100%)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 border border-border-default bg-bg-surface rounded-full px-3 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] text-text-secondary tracking-widest">
              AI-POWERED BRAND AUTOMATION
            </span>
          </div>

          <h1 className="font-semibold tracking-tight text-center leading-[1.05] mb-6">
            <span className="block text-[42px] sm:text-[56px] md:text-[72px] lg:text-[84px] text-text-primary">
              Your brand deserves
            </span>
            <span className="block text-[42px] sm:text-[56px] md:text-[72px] lg:text-[84px] text-text-primary">
              to show up{" "}
              <span className="relative inline-block">
                <span className="text-accent">every day.</span>
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-accent/30 rounded-full" />
              </span>
            </span>
          </h1>

          <p className="text-[16px] sm:text-[18px] text-text-secondary text-center max-w-lg mx-auto leading-relaxed mb-10">
            ArtMaster generates a professional, brand-perfect social media poster
            every single morning — automatically. No designer. No effort. Just
            results.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-black font-semibold text-[15px] px-8 py-4 rounded-xl hover:bg-accent-dim transition-all duration-200 active:scale-[0.98] min-h-[52px]"
            >
              Start automating free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-bg-surface text-text-primary font-medium text-[15px] px-8 py-4 rounded-xl border border-border-default hover:border-border-strong transition-all duration-200 min-h-[52px]"
            >
              Sign in to dashboard
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {[
              { value: "500+", label: "African businesses" },
              { value: "12K+", label: "Posters generated" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="font-semibold text-[20px] text-text-primary tabular-nums">
                  {stat.value}
                </span>
                <span className="font-mono text-[11px] text-text-muted">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Poster mockup */}
          <div className="relative mt-20 max-w-3xl mx-auto px-4 w-full">
            <div className="absolute left-4 right-4 top-4 rounded-2xl border border-border-default bg-bg-surface h-64 sm:h-80 -rotate-2 opacity-40" />
            <div className="absolute left-4 right-4 top-2 rounded-2xl border border-border-default bg-bg-surface h-64 sm:h-80 rotate-1 opacity-60" />
            <div className="relative rounded-2xl border border-border-strong bg-bg-surface overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="font-mono text-[11px] text-text-muted">
                    Generated today · 08:00 AM EAT
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-5 px-2 rounded-full bg-accent/10 border border-accent/20 flex items-center">
                    <span className="font-mono text-[9px] text-accent">
                      APPROVED
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="aspect-[16/7] relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
                }}
              >
                <div
                  className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
                  style={{
                    background:
                      "radial-gradient(circle, #E8FF47, transparent)",
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5 translate-y-1/2 -translate-x-1/4"
                  style={{
                    background:
                      "radial-gradient(circle, #4D9EFF, transparent)",
                  }}
                />
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                      <div className="w-4 h-4 bg-black rounded-[3px]" />
                    </div>
                    <div className="h-2 w-24 rounded-full bg-white/20" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-7 w-2/3 rounded-lg bg-white/70" />
                    <div className="h-3 w-4/5 rounded bg-white/30" />
                    <div className="h-3 w-3/5 rounded bg-white/30" />
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-9 w-32 rounded-full bg-accent flex items-center justify-center">
                        <div className="h-2 w-16 rounded bg-black/50" />
                      </div>
                      <div className="h-9 w-24 rounded-full border border-white/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Trust bar */}
      <section className="py-12 border-y border-border-subtle bg-bg-surface">
        <p className="font-mono text-[11px] text-text-muted text-center tracking-widest mb-8">
          TRUSTED ACROSS AFRICA
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 max-w-4xl mx-auto px-4">
          {[
            "Retail",
            "Finance",
            "Healthcare",
            "Technology",
            "Hospitality",
            "Education",
          ].map((industry) => (
            <span
              key={industry}
              className="font-semibold text-[15px] text-text-muted/40 tracking-tight hover:text-text-muted/70 transition-colors"
            >
              {industry}
            </span>
          ))}
        </div>
      </section>

      {/* Section 4 — How it works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] text-accent tracking-widest mb-3">
              HOW IT WORKS
            </p>
            <h2 className="font-semibold text-[32px] sm:text-[40px] text-text-primary tracking-tight leading-tight">
              Set up once.{" "}
              <span className="text-text-muted">Post forever.</span>
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-border-default" />
            {[
              {
                step: "01",
                title: "Build your brand kit",
                body: "Set your colors, logo, tone, and target audience. Takes 3 minutes.",
                icon: <Layers size={20} />,
              },
              {
                step: "02",
                title: "AI generates daily",
                body: "Every morning, ArtMaster creates a poster tailored to your brand and today's occasion.",
                icon: <Zap size={20} />,
              },
              {
                step: "03",
                title: "Review and publish",
                body: "One tap to approve. Ready to post across all your social channels.",
                icon: <CheckCircle size={20} />,
              },
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-start">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border-default flex items-center justify-center text-accent relative z-10">
                    {step.icon}
                  </div>
                  <span className="font-mono text-[11px] text-text-muted">
                    STEP {step.step}
                  </span>
                </div>
                <h3 className="font-semibold text-[18px] text-text-primary mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Features */}
      <section id="features" className="py-24 px-4 bg-bg-surface border-y border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] text-accent tracking-widest mb-3">
              FEATURES
            </p>
            <h2 className="font-semibold text-[32px] sm:text-[40px] text-text-primary tracking-tight">
              Everything your brand needs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <Zap size={18} />,
                title: "Brand-aware generation",
                body: "Every poster uses your exact colors, tone, and visual identity. Never generic.",
              },
              {
                icon: <Globe2 size={18} />,
                title: "Occasion intelligence",
                body: "Detects holidays and cultural moments specific to your country automatically.",
              },
              {
                icon: <Clock size={18} />,
                title: "Daily automation",
                body: "Schedule once. ArtMaster generates at exactly the right time, every day.",
              },
              {
                icon: <Layers size={18} />,
                title: "All platform sizes",
                body: "Instagram, Facebook, LinkedIn, TikTok — every format, perfectly sized.",
              },
              {
                icon: <BarChart3 size={18} />,
                title: "AI brand analysis",
                body: "Get real-time recommendations on what to post based on your brand and market.",
              },
              {
                icon: <Bell size={18} />,
                title: "Instant notifications",
                body: "SMS or email the moment your poster is ready. Never miss a posting window.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-bg-base border border-border-default rounded-2xl p-6 hover:border-border-strong transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[15px] text-text-primary mb-2">
                  {f.title}
                </h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 — Testimonial */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-8 sm:p-12">
            <div className="font-serif text-[80px] leading-none text-accent/20 mb-4 select-none">
              "
            </div>
            <blockquote className="font-semibold text-[20px] sm:text-[24px] text-text-primary leading-snug tracking-tight mb-8">
              We used to spend 3 hours every week designing posts. ArtMaster does
              it automatically and the quality is better than what we were
              producing manually.
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-semibold text-sm text-accent">
                A
              </div>
              <div className="text-left">
                <p className="font-semibold text-[13px] text-text-primary">
                  Amara Osei
                </p>
                <p className="font-mono text-[11px] text-text-muted">
                  Founder, Osei Retail — Accra, Ghana
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7 — Final CTA */}
      <section className="py-24 px-4 bg-bg-base text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-12 h-1 bg-accent rounded-full mx-auto mb-8" />
          <h2 className="font-semibold text-[32px] sm:text-[48px] text-text-primary tracking-tight leading-tight mb-6">
            Start posting consistently
            <br />
            <span className="text-text-muted">starting tomorrow.</span>
          </h2>
          <p className="text-[15px] text-text-secondary max-w-md mx-auto mb-10 leading-relaxed">
            Join hundreds of African businesses that never miss a day of posting.
            Set up in under 5 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[15px] px-10 py-4 rounded-xl hover:bg-accent-dim transition-all duration-200 active:scale-[0.98] min-h-[52px]"
          >
            Create free account
            <ArrowRight size={16} />
          </Link>
          <p className="mt-4 font-mono text-[11px] text-text-muted">
            No credit card required · Free to start
          </p>
        </div>
      </section>

      {/* Section 8 — Footer */}
      <footer className="bg-bg-surface border-t border-border-subtle py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-accent rounded-[3px] flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-black rounded-[1.5px]" />
            </div>
            <span className="font-semibold text-[13px] text-text-primary">
              ArtMaster Platform
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a
                key={link}
                href={`/${link.toLowerCase()}`}
                className="font-mono text-[11px] text-text-muted hover:text-text-secondary transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <p className="font-mono text-[11px] text-text-muted">
            © {new Date().getFullYear()} ArtMaster Platform
          </p>
        </div>
      </footer>
    </>
  );
}
