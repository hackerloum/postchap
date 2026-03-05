"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Globe2,
  Bell,
  Clock,
  Layers,
  Check,
  Users,
  Building2,
  GitBranch,
  Eye,
  Send,
  FileText,
  ChevronRight,
} from "lucide-react";
import { CookiePreferencesLink } from "@/components/CookiePreferencesLink";
import { TrustBarSection } from "@/app/TrustBarSection";
import { PLANS } from "@/lib/plans";
import { STUDIO_PLANS } from "@/lib/studio-plans";
import { useState } from "react";

export default function Home() {
  const [pricingProduct, setPricingProduct] = useState<"business" | "studio">("business");
  const studioPlansDisplay = STUDIO_PLANS.filter((p) => p.id !== "trial");
  return (
    <>
      {/* Nav */}
      <header className="sticky top-0 left-0 right-0 h-14 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-full">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/artmasterwordmarklogo-03-03.webp"
              alt="Art Master"
              width={200}
              height={52}
              className="h-6 w-auto sm:h-10 object-contain object-left"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors"
            >
              How it works
            </a>
            <a
              href="#studio"
              className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors"
            >
              For Agencies
            </a>
            <Link
              href="/pricing"
              className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors"
            >
              Pricing
            </Link>
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

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-24 px-4 bg-bg-base">
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
            background: `radial-gradient(ellipse 80% 50% at 50% 50%, transparent 40%, var(--color-bg-base, #0a0a0a) 100%)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 border border-border-default bg-bg-elevated rounded-full px-3 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] text-text-secondary tracking-widest">
              SOCIAL MEDIA ON AUTOPILOT
            </span>
          </div>

          <h1
            className="font-semibold tracking-tight text-center leading-[1.05] mb-6"
            style={{ hyphens: "none", wordBreak: "keep-all" }}
          >
            <span className="block text-[36px] sm:text-[52px] md:text-[68px] lg:text-[84px] text-text-primary">
              Your brand deserves
            </span>
            <span className="block text-[36px] sm:text-[52px] md:text-[68px] lg:text-[84px] text-text-primary">
              to show up{" "}
              <span className="relative inline-block">
                <span className="text-accent">every day.</span>
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-accent/30 rounded-full" />
              </span>
            </span>
          </h1>

          <p className="text-[16px] sm:text-[18px] text-text-secondary text-center max-w-lg mx-auto leading-relaxed mb-10">
            Professional, on-brand social media posters generated every morning.
            No designer. No effort. Just results.
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-bg-elevated text-text-primary font-medium text-[15px] px-8 py-4 rounded-xl border border-border-default hover:border-border-strong transition-all duration-200 min-h-[52px]"
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

          {/* Dashboard mockup */}
          <div className="relative mt-20 max-w-5xl mx-auto px-4 w-full">
            <div className="rounded-2xl border border-border-strong bg-bg-elevated overflow-hidden shadow-2xl shadow-black/30">
              <Image
                src="/herodashboard.png"
                alt="Art Master dashboard — overview, posters, brand kit, and quick actions"
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <TrustBarSection />

      {/* How it works */}
      <section id="how-it-works" className="bg-bg-base py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <p className="font-mono text-[11px] text-accent tracking-[0.2em] mb-4">
              THE PROCESS
            </p>
            <h2 className="font-semibold text-[36px] sm:text-[48px] text-text-primary tracking-tight leading-[1.05] max-w-lg">
              From brand kit
              <br />
              to published post
              <br />
              in minutes.
            </h2>
          </div>

          <div className="space-y-0">
            {[
              {
                number: "01",
                title: "Set up your brand kit",
                detail:
                  "Add your logo, colors, industry, and target audience. Tell us your brand voice and where you operate. Takes under 5 minutes.",
                metric: "< 5 min setup",
              },
              {
                number: "02",
                title: "Content generated daily",
                detail:
                  "Every morning, your poster is created automatically. Copy, visuals, and layout — all tailored to your brand and today's moment in your market.",
                metric: "Daily at your chosen time",
              },
              {
                number: "03",
                title: "Review, approve, publish",
                detail:
                  "Get notified the moment your poster is ready. Approve with one tap. Download and post directly to your social channels.",
                metric: "30–60 sec generation",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 py-12 border-t border-border-subtle/50 hover:border-border-default transition-colors duration-300"
              >
                <div className="md:col-span-2 flex items-start">
                  <span className="font-mono text-[64px] font-bold leading-none text-text-muted/10 group-hover:text-accent/20 transition-colors duration-500 select-none">
                    {step.number}
                  </span>
                </div>
                <div className="md:col-span-7 flex flex-col justify-center gap-3">
                  <h3 className="font-semibold text-[22px] sm:text-[26px] text-text-primary tracking-tight leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[15px] text-text-secondary leading-relaxed max-w-lg">
                    {step.detail}
                  </p>
                </div>
                <div className="md:col-span-3 flex items-center md:justify-end">
                  <div className="inline-flex items-center gap-2 bg-bg-elevated border border-border-default rounded-full px-4 py-2 group-hover:border-accent/30 group-hover:bg-accent/5 transition-all duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="font-mono text-[12px] text-text-muted group-hover:text-text-secondary transition-colors">
                      {step.metric}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-border-subtle/50" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-bg-surface py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] text-accent tracking-[0.2em] mb-3">
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
                body: "Schedule once. Posters are generated at exactly the right time, every day.",
              },
              {
                icon: <Layers size={18} />,
                title: "All platform sizes",
                body: "Instagram, Facebook, LinkedIn, TikTok. Every format, perfectly sized.",
              },
              {
                icon: <BarChart3 size={18} />,
                title: "Smart brand analysis",
                body: "Real-time recommendations on what to post based on your brand and market.",
              },
              {
                icon: <Bell size={18} />,
                title: "Instant notifications",
                body: "SMS or email the moment your poster is ready. Never miss a posting window.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-bg-elevated border border-border-default/50 rounded-2xl p-6"
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

      {/* ─── ArtMaster Studio Section ─── */}
      <section id="studio" className="relative bg-bg-base py-28 px-4 overflow-hidden">
        {/* Subtle accent glow top-right */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.04] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 100% 0%, var(--color-accent, #E8FF47) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
            <div>
              <div className="inline-flex items-center gap-2 border border-accent/30 bg-accent/5 rounded-full px-3 py-1.5 mb-6">
                <Building2 size={12} className="text-accent" />
                <span className="font-mono text-[11px] text-accent tracking-widest">
                  ARTMASTER STUDIO
                </span>
              </div>
              <h2 className="font-semibold text-[36px] sm:text-[52px] text-text-primary tracking-tight leading-[1.05] max-w-2xl">
                Built for agencies
                <br />
                managing{" "}
                <span className="text-accent">multiple clients.</span>
              </h2>
              <p className="mt-5 text-[16px] text-text-secondary max-w-xl leading-relaxed">
                ArtMaster Studio has its own login and signup — for agencies and
                designers only. Multi-client brand management, approval workflows,
                team roles, and a white-label client portal.
              </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              <Link
                href="/studio/login"
                className="inline-flex items-center gap-2 bg-bg-elevated border border-border-default text-text-primary font-semibold text-[14px] px-5 py-3.5 rounded-xl hover:border-border-strong transition-all duration-200"
              >
                Sign in to Studio
              </Link>
              <Link
                href="/studio/signup"
                className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[14px] px-6 py-3.5 rounded-xl hover:bg-accent-dim transition-all duration-200 active:scale-[0.98]"
              >
                Sign up for Studio
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Two-col layout: features left, flow right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
            {/* Studio feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <Users size={16} />,
                  title: "Multi-client workspace",
                  body: "Manage unlimited clients from one dashboard. Each client gets their own brand kits, poster history, and quota.",
                },
                {
                  icon: <GitBranch size={16} />,
                  title: "Approval workflow",
                  body: "Generate → agency reviews → client approves. Full status tracking and revision comments on every poster.",
                },
                {
                  icon: <Eye size={16} />,
                  title: "White-label client portal",
                  body: "Clients log in to a branded portal to view and approve their posters — no ArtMaster branding visible.",
                },
                {
                  icon: <Zap size={16} />,
                  title: "Bulk generation",
                  body: "Generate posters across multiple clients at once for the same occasion or campaign. One click, dozens of posters.",
                },
                {
                  icon: <Building2 size={16} />,
                  title: "Team & roles",
                  body: "Invite team members as owner, manager, designer, reviewer, or intern — with per-client access controls.",
                },
                {
                  icon: <Send size={16} />,
                  title: "Direct publishing",
                  body: "Connect each client's Instagram and publish approved posters directly from Studio. No manual downloads.",
                },
                {
                  icon: <Globe2 size={16} />,
                  title: "Occasion alerts per client",
                  body: "Each client gets tailored occasion reminders based on their industry, country, and audience.",
                },
                {
                  icon: <FileText size={16} />,
                  title: "Monthly client reports",
                  body: "One-click report per client: posters generated, platforms covered, approval rate, and AI cost breakdown.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="bg-bg-elevated border border-border-default/50 rounded-xl p-5 hover:border-accent/20 hover:bg-accent/[0.02] transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-3">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-[13px] text-text-primary mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Studio flow diagram */}
            <div className="flex flex-col justify-center gap-3">
              <p className="font-mono text-[11px] text-text-muted tracking-[0.15em] mb-2">
                STUDIO WORKFLOW
              </p>

              {[
                {
                  step: "01",
                  label: "Create agency",
                  sub: "Set up your Studio account with agency name and plan",
                  accent: false,
                },
                {
                  step: "02",
                  label: "Add clients & brand kits",
                  sub: "Each client has their own colors, logo, tone, and product catalog",
                  accent: false,
                },
                {
                  step: "03",
                  label: "Generate posters",
                  sub: "Single or bulk — pick client, kit, format, occasion — done in 60s",
                  accent: true,
                },
                {
                  step: "04",
                  label: "Review & approve",
                  sub: "Your team reviews first, then client approves via portal",
                  accent: false,
                },
                {
                  step: "05",
                  label: "Publish directly",
                  sub: "Post to client's Instagram or export. Usage tracked per client",
                  accent: false,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`relative flex gap-4 p-4 rounded-xl border transition-all duration-200 ${
                    item.accent
                      ? "border-accent/30 bg-accent/5"
                      : "border-border-default/50 bg-bg-elevated"
                  }`}
                >
                  {i < 4 && (
                    <div className="absolute left-[27px] top-[52px] w-px h-3 bg-border-subtle" />
                  )}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                      item.accent
                        ? "bg-accent text-black"
                        : "bg-bg-base border border-border-default text-text-muted"
                    }`}
                  >
                    {item.step}
                  </div>
                  <div>
                    <p
                      className={`font-semibold text-[13px] mb-0.5 ${item.accent ? "text-accent" : "text-text-primary"}`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[12px] text-text-secondary leading-relaxed">
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}

              <Link
                href="/studio/signup"
                className="mt-4 inline-flex items-center gap-2 text-accent font-mono text-[12px] hover:gap-3 transition-all duration-200"
              >
                Sign up for Studio
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Studio plans strip */}
          <div className="border border-border-default/50 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-default/50">
              {[
                {
                  name: "Starter",
                  price: "$29/mo",
                  clients: "5 clients",
                  posters: "100 posters/mo",
                  team: "1 seat",
                  highlight: false,
                },
                {
                  name: "Pro",
                  price: "$59/mo",
                  clients: "20 clients",
                  posters: "500 posters/mo",
                  team: "5 seats",
                  highlight: true,
                },
                {
                  name: "Agency",
                  price: "$129/mo",
                  clients: "Unlimited clients",
                  posters: "Unlimited posters",
                  team: "Unlimited seats",
                  highlight: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative p-6 ${plan.highlight ? "bg-accent/5" : "bg-bg-elevated"}`}
                >
                  {plan.highlight && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-accent text-black font-mono text-[10px] font-semibold tracking-widest">
                      POPULAR
                    </div>
                  )}
                  <p className="font-semibold text-[16px] text-text-primary mb-1">
                    {plan.name}
                  </p>
                  <p className="font-mono text-[22px] font-bold text-accent mb-4">
                    {plan.price}
                  </p>
                  <ul className="space-y-2">
                    {[plan.clients, plan.posters, plan.team].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-[13px] text-text-secondary"
                      >
                        <Check size={12} className="text-accent flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-border-default/50 bg-bg-elevated px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[13px] text-text-secondary">
                White-label portal, team roles, bulk generation, client reports, direct publishing — all plans.
              </p>
              <Link
                href="/studio/signup"
                className="flex-shrink-0 inline-flex items-center gap-1.5 bg-accent text-black font-semibold text-[13px] px-5 py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
              >
                Sign up for Studio
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing (ArtMaster) */}
      <section id="pricing" className="relative bg-bg-surface py-28 px-4 overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 0%, var(--color-accent, #E8FF47) 0%, transparent 50%)`,
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="font-mono text-[11px] text-accent tracking-[0.2em] uppercase mb-4">
              Pricing
            </p>
            <h2 className="font-semibold text-[28px] sm:text-[36px] md:text-[44px] text-text-primary tracking-tight leading-[1.1] max-w-2xl mx-auto">
              Choose the plan that fits what you create
            </h2>
            <p className="mt-4 text-[15px] text-text-secondary max-w-lg mx-auto">
              Transparent pricing. No hidden fees. Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Product toggle — switch between Business and Studio pricing on same page */}
          <div className="flex items-center justify-center gap-2 mb-16">
            <button
              type="button"
              onClick={() => setPricingProduct("business")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[11px] transition-all ${
                pricingProduct === "business"
                  ? "bg-accent/10 border border-accent/30 text-accent"
                  : "border border-border-default text-text-muted hover:border-border-strong hover:text-text-secondary"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${pricingProduct === "business" ? "bg-accent" : "bg-transparent"}`} />
              ArtMaster — for businesses
            </button>
            <button
              type="button"
              onClick={() => setPricingProduct("studio")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[11px] transition-all ${
                pricingProduct === "studio"
                  ? "bg-accent/10 border border-accent/30 text-accent"
                  : "border border-border-default text-text-muted hover:border-border-strong hover:text-text-secondary"
              }`}
            >
              <Building2 size={11} className="shrink-0" />
              Studio — for agencies
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {pricingProduct === "business" && PLANS.map((plan) => {
              const limits = plan.limits;
              const brandKitsLabel =
                limits.brandKits === -1 ? "Unlimited" : String(limits.brandKits);
              const postersLabel =
                limits.postersPerMonth === -1
                  ? "Unlimited"
                  : `${limits.postersPerMonth} / month`;
              const isPro = plan.id === "pro";
              const [priceMain, priceSub] =
                plan.priceMonthly === 0
                  ? ["Free", ""]
                  : plan.priceLabel.split("/");
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
                    isPro
                      ? "border-accent/60 bg-bg-elevated shadow-[0_0_0_1px_rgba(232,255,71,0.15),0_8px_32px_-8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_0_1px_rgba(232,255,71,0.25),0_12px_40px_-12px_rgba(0,0,0,0.5)] scale-[1.02] md:scale-100 md:-my-2 md:py-2"
                      : "border-border-default bg-bg-elevated shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_12px_32px_-12px_rgba(0,0,0,0.35)] hover:border-border-strong"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-black font-mono text-[10px] font-semibold tracking-widest uppercase">
                      Most popular
                    </div>
                  )}
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="font-semibold text-[20px] text-text-primary tracking-tight mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-[32px] font-semibold text-text-primary tracking-tight tabular-nums">
                        {priceMain}
                      </span>
                      {priceSub && (
                        <span className="text-[14px] font-medium text-text-muted">
                          /{priceSub}
                        </span>
                      )}
                    </div>
                    <div className="h-px bg-border-default mb-6" />
                    <ul className="space-y-4 mb-8 flex-1">
                      <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                          <Check size={12} className="text-accent" />
                        </span>
                        {brandKitsLabel} brand kit{limits.brandKits !== 1 ? "s" : ""}
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                          <Check size={12} className="text-accent" />
                        </span>
                        {postersLabel} posters
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${limits.scheduledGeneration ? "bg-accent/15" : "bg-bg-elevated"}`}
                        >
                          {limits.scheduledGeneration ? (
                            <Check size={12} className="text-accent" />
                          ) : (
                            <span className="w-2 h-0.5 bg-border-strong rounded" />
                          )}
                        </span>
                        Scheduled generation
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                          <Check size={12} className="text-accent" />
                        </span>
                        Recommendations{" "}
                        {limits.aiRecommendationsFull ? "(full)" : "(limited)"}
                      </li>
                    </ul>
                    <Link
                      href="/signup"
                      className={`inline-flex items-center justify-center gap-2 w-full font-semibold text-[14px] px-5 py-3.5 rounded-xl transition-all duration-200 ${
                        isPro
                          ? "bg-accent text-black hover:bg-accent-dim active:scale-[0.98]"
                          : "bg-bg-elevated text-text-primary border border-border-default hover:border-border-strong hover:bg-bg-base"
                      }`}
                    >
                      {plan.id === "free" ? "Get started free" : "Get started"}
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              );
            })}
            {pricingProduct === "studio" &&
              studioPlansDisplay.map((plan) => {
                const limits = plan.limits;
                const isPro = plan.id === "pro";
                const [priceMain, priceSub] =
                  plan.priceMonthly === 0 ? ["Free", ""] : plan.priceLabel.split("/");
                const clientsLabel =
                  limits.maxClients === -1 ? "Unlimited" : `${limits.maxClients} clients`;
                const postersLabel =
                  limits.maxPostersPerMonth === -1
                    ? "Unlimited"
                    : `${limits.maxPostersPerMonth} posters/mo`;
                const teamLabel =
                  limits.teamMembers === -1
                    ? "Unlimited team"
                    : limits.teamMembers === 0
                      ? "Solo"
                      : `${limits.teamMembers} team members`;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
                      isPro
                        ? "border-accent/60 bg-bg-elevated shadow-[0_0_0_1px_rgba(232,255,71,0.15),0_8px_32px_-8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_0_1px_rgba(232,255,71,0.25),0_12px_40px_-12px_rgba(0,0,0,0.5)] scale-[1.02] md:scale-100 md:-my-2 md:py-2"
                        : "border-border-default bg-bg-elevated shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_12px_32px_-12px_rgba(0,0,0,0.35)] hover:border-border-strong"
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-black font-mono text-[10px] font-semibold tracking-widest uppercase">
                        Most popular
                      </div>
                    )}
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="font-semibold text-[20px] text-text-primary tracking-tight mb-2">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-[32px] font-semibold text-text-primary tracking-tight tabular-nums">
                          {priceMain}
                        </span>
                        {priceSub && (
                          <span className="text-[14px] font-medium text-text-muted">/{priceSub}</span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-text-muted mb-4 -mt-2">{plan.tagline}</p>
                      <div className="h-px bg-border-default mb-6" />
                      <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                            <Check size={12} className="text-accent" />
                          </span>
                          {clientsLabel}
                        </li>
                        <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                            <Check size={12} className="text-accent" />
                          </span>
                          {postersLabel}
                        </li>
                        <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                            <Check size={12} className="text-accent" />
                          </span>
                          {teamLabel}
                        </li>
                        <li className="flex items-center gap-3 text-[14px] text-text-secondary">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${limits.clientPortal ? "bg-accent/15" : "bg-bg-elevated"}`}
                          >
                            {limits.clientPortal ? (
                              <Check size={12} className="text-accent" />
                            ) : (
                              <span className="w-2 h-0.5 bg-border-strong rounded" />
                            )}
                          </span>
                          Client portal
                        </li>
                      </ul>
                      <Link
                        href="/studio/signup"
                        className={`inline-flex items-center justify-center gap-2 w-full font-semibold text-[14px] px-5 py-3.5 rounded-xl transition-all duration-200 ${
                          isPro
                            ? "bg-accent text-black hover:bg-accent-dim active:scale-[0.98]"
                            : "bg-bg-elevated text-text-primary border border-border-default hover:border-border-strong hover:bg-bg-base"
                        }`}
                      >
                        Get started
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-bg-base py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-bg-elevated border border-border-default/50 rounded-2xl p-8 sm:p-12">
            <div className="font-serif text-[80px] leading-none text-accent/20 mb-4 select-none">
              "
            </div>
            <blockquote className="font-semibold text-[20px] sm:text-[24px] text-text-primary leading-snug tracking-tight mb-8">
              We went from spending hours every week on social media content to
              checking our phone once a day to approve what&apos;s ready. The
              quality is consistently on-brand.
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
                  Founder, Osei Retail
                </p>
                <p className="font-mono text-[11px] text-text-muted">
                  Accra, Ghana
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTA — ArtMaster + Studio */}
      <section className="bg-bg-base py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ArtMaster CTA */}
            <div className="relative rounded-2xl border border-border-default bg-bg-elevated p-8 sm:p-10 flex flex-col justify-between gap-8 overflow-hidden">
              <div
                className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.05] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 100% 100%, var(--color-accent, #E8FF47), transparent 70%)",
                }}
              />
              <div>
                <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-5">
                  <Zap size={11} className="text-accent" />
                  <span className="font-mono text-[10px] text-accent tracking-widest">FOR BUSINESSES</span>
                </div>
                <h3 className="font-semibold text-[26px] sm:text-[32px] text-text-primary tracking-tight leading-tight mb-3">
                  Start posting
                  <br />
                  <span className="text-text-muted">consistently.</span>
                </h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  One brand. Daily AI-generated posters. No designer needed.
                  Free to start.
                </p>
              </div>
              <div>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[14px] px-7 py-3.5 rounded-xl hover:bg-accent-dim transition-all active:scale-[0.98]"
                >
                  Create free account
                  <ArrowRight size={15} />
                </Link>
                <p className="mt-3 font-mono text-[11px] text-text-muted">
                  No credit card required
                </p>
              </div>
            </div>

            {/* Studio CTA */}
            <div className="relative rounded-2xl border border-accent/25 bg-accent/[0.03] p-8 sm:p-10 flex flex-col justify-between gap-8 overflow-hidden">
              <div
                className="absolute top-0 right-0 w-64 h-64 opacity-[0.06] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 100% 0%, var(--color-accent, #E8FF47), transparent 70%)",
                }}
              />
              <div>
                <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-3 py-1 mb-5">
                  <Building2 size={11} className="text-accent" />
                  <span className="font-mono text-[10px] text-accent tracking-widest">FOR AGENCIES</span>
                </div>
                <h3 className="font-semibold text-[26px] sm:text-[32px] text-text-primary tracking-tight leading-tight mb-3">
                  Scale your agency
                  <br />
                  <span className="text-accent">with Studio.</span>
                </h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  Manage all your clients from one workspace. Multi-brand kits,
                  approval workflows, white-label portal.
                </p>
              </div>
              <div>
                <Link
                  href="/studio/signup"
                  className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[14px] px-7 py-3.5 rounded-xl hover:bg-accent-dim transition-all active:scale-[0.98]"
                >
                  Sign up for Studio
                  <ArrowRight size={15} />
                </Link>
                <p className="mt-3 font-mono text-[11px] text-text-muted">
                  Own login · For agencies and designers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 py-16 border-b border-border-subtle/40">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <Image
                  src="/artmasterwordmarklogo-03-03.webp"
                  alt="Art Master Platform"
                  width={240}
                  height={63}
                  className="h-10 w-auto sm:h-20 object-contain object-left"
                />
              </div>
              <p className="text-[14px] text-text-secondary leading-relaxed max-w-xs mb-6">
                Automated social media poster generation for African businesses
                scaling globally.
              </p>
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 bg-bg-elevated border border-border-default/50 rounded-full px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="font-mono text-[11px] text-text-muted">
                    Built for Africa · Used worldwide
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-full px-3 py-1.5 w-fit">
                  <Building2 size={10} className="text-accent" />
                  <span className="font-mono text-[11px] text-accent">
                    ArtMaster Studio — now available
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] text-text-muted tracking-[0.15em] mb-5">
                PRODUCT
              </p>
              <ul className="space-y-3">
                {[
                  { label: "Features", href: "#features" },
                  { label: "How it works", href: "#how-it-works" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Sign up", href: "/signup" },
                  { label: "Sign in", href: "/login" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] text-text-muted tracking-[0.15em] mb-5">
                STUDIO
              </p>
              <ul className="space-y-3">
                {[
                  { label: "For agencies", href: "#studio" },
                  { label: "Studio dashboard", href: "/studio" },
                  { label: "Studio pricing", href: "/studio/billing" },
                  { label: "Client portal", href: "/studio" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <CookiePreferencesLink className="text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-200">
                    Cookie preferences
                  </CookiePreferencesLink>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6">
            <p className="font-mono text-[12px] text-text-muted">
              © {new Date().getFullYear()} ArtMaster Platform. All rights
              reserved.
            </p>
            <p className="font-mono text-[12px] text-text-muted">
              artmasterpro.com
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
