import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Section 1 — Nav */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-bg-base/90 backdrop-blur border-b border-border-subtle">
        <nav className="h-full px-4 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="flex items-center">
            <span className="font-semibold text-base text-text-primary">
              ArtMaster
            </span>
            <span className="ml-1.5 font-mono text-[9px] text-accent border border-accent/30 rounded px-1 py-0.5 tracking-widest">
              PLATFORM
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-accent text-black rounded-lg hover:bg-accent-dim transition-colors min-h-[40px]"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Section 2 — Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[11px] text-accent tracking-widest">
            AI-POWERED BRAND AUTOMATION
          </span>
        </div>

        <h1 className="font-semibold tracking-tight text-center leading-[1.1]">
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text-primary">
            Your brand.
          </span>
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text-primary">
            Every morning.
          </span>
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-accent">
            Automated.
          </span>
        </h1>

        <p className="mt-6 font-sans text-base sm:text-lg text-text-secondary text-center max-w-md mx-auto leading-relaxed">
          ArtMaster generates a professional, brand-aware social media poster for
          your business every single day — automatically.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors min-h-[48px]"
          >
            Start for free
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-text-primary font-medium text-sm px-6 py-3 rounded-lg border border-border-default hover:border-border-strong transition-colors min-h-[48px]"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-6 font-mono text-[11px] text-text-muted text-center">
          Trusted by 500+ African businesses
        </p>

        <div className="mt-14 mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md">
          <div className="relative bg-bg-surface border border-border-default rounded-3xl p-4 shadow-2xl">
            <div
              className="aspect-square w-full rounded-2xl overflow-hidden relative"
              style={{
                background:
                  "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                style={{
                  background:
                    "radial-gradient(circle, #E8FF47, transparent)",
                }}
              />
              <div
                className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
                style={{
                  background:
                    "radial-gradient(circle, #4D9EFF, transparent)",
                }}
              />
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-sm bg-accent" />
                  </div>
                  <div className="h-2.5 w-20 rounded bg-white/20" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-3/4 rounded bg-white/80" />
                  <div className="h-3 w-full rounded bg-white/40" />
                  <div className="h-3 w-5/6 rounded bg-white/40" />
                  <div className="h-3 w-4/6 rounded bg-white/40" />
                  <div className="mt-4 inline-flex">
                    <div className="h-8 w-28 rounded-full bg-accent flex items-center justify-center">
                      <div className="h-2 w-16 rounded bg-black/60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="font-mono text-[10px] text-text-muted">
                  Generated today · 08:00 AM
                </span>
              </div>
              <span className="font-mono text-[10px] text-accent">
                Approved
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — How it works */}
      <section className="bg-bg-surface py-20 px-4">
        <h2 className="font-semibold text-2xl sm:text-3xl text-text-primary text-center tracking-tight">
          How ArtMaster works
        </h2>
        <p className="mt-3 font-mono text-xs text-text-muted text-center">
          Three steps. Zero daily effort.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-bg-base border border-border-default rounded-2xl p-6">
            <p className="font-mono text-4xl text-accent/20 font-bold">01</p>
            <h3 className="mt-2 text-base font-semibold text-text-primary">
              Set up your brand
            </h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Tell ArtMaster your colors, logo, tone, and audience. Takes 3
              minutes.
            </p>
          </div>
          <div className="bg-bg-base border border-border-default rounded-2xl p-6">
            <p className="font-mono text-4xl text-accent/20 font-bold">02</p>
            <h3 className="mt-2 text-base font-semibold text-text-primary">
              AI generates daily
            </h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Every morning, ArtMaster creates a poster tailored to your brand
              and today&apos;s occasion.
            </p>
          </div>
          <div className="bg-bg-base border border-border-default rounded-2xl p-6">
            <p className="font-mono text-4xl text-accent/20 font-bold">03</p>
            <h3 className="mt-2 text-base font-semibold text-text-primary">
              Review and approve
            </h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              One tap to approve. Your poster is ready to post across all your
              social channels.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — Features */}
      <section className="bg-bg-base py-20 px-4">
        <h2 className="font-semibold text-2xl sm:text-3xl text-text-primary text-center tracking-tight">
          Everything your brand needs
        </h2>
        <div className="mt-12 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <span className="text-2xl mb-3 block">🎨</span>
            <h3 className="font-semibold text-sm text-text-primary">
              Brand-aware design
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Every poster matches your exact colors, fonts, and visual identity.
            </p>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <span className="text-2xl mb-3 block">🌍</span>
            <h3 className="font-semibold text-sm text-text-primary">
              Occasion intelligence
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Detects holidays, events, and cultural moments in your country
              automatically.
            </p>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <span className="text-2xl mb-3 block">⏰</span>
            <h3 className="font-semibold text-sm text-text-primary">
              Daily automation
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Set your schedule once. ArtMaster generates on time, every day.
            </p>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <span className="text-2xl mb-3 block">📐</span>
            <h3 className="font-semibold text-sm text-text-primary">
              Multi-platform sizes
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Instagram, Facebook, Twitter, LinkedIn, TikTok — all formats.
            </p>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <span className="text-2xl mb-3 block">🌐</span>
            <h3 className="font-semibold text-sm text-text-primary">
              Africa-first, global-ready
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Built for African markets with local holidays, languages, and
              culture.
            </p>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <span className="text-2xl mb-3 block">🔔</span>
            <h3 className="font-semibold text-sm text-text-primary">
              Instant notifications
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Get SMS or email the moment your poster is ready to review.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 — CTA Banner */}
      <section className="bg-accent py-16 px-4 text-center">
        <h2 className="font-semibold text-2xl sm:text-3xl text-black tracking-tight">
          Ready to automate your brand?
        </h2>
        <p className="mt-3 text-sm text-black/70 max-w-sm mx-auto">
          Join hundreds of African businesses posting consistently without the
          daily effort.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center gap-2 bg-black text-accent font-semibold text-sm px-6 py-3 rounded-lg hover:bg-black/80 transition-colors min-h-[48px]"
        >
          Get started free →
        </Link>
      </section>

      {/* Section 6 — Footer */}
      <footer className="bg-bg-base border-t border-border-subtle py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-text-primary">
              ArtMaster
            </span>
            <span className="font-mono text-[9px] text-accent border border-accent/30 rounded px-1 py-0.5 tracking-widest">
              PLATFORM
            </span>
            <span className="text-text-muted text-sm hidden sm:inline">
              — AI-powered brand automation
            </span>
          </div>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="font-mono text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-mono text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="font-mono text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
        <p className="mt-6 font-mono text-[11px] text-text-muted text-center">
          © 2025 ArtMaster Platform · artmasterpro.com
        </p>
      </footer>
    </>
  );
}
