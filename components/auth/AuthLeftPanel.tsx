export function AuthLeftPanel() {
  return (
    <div
      className="hidden lg:flex w-[45%] relative bg-bg-surface border-r border-border-subtle flex-col overflow-hidden shrink-0"
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, #2a2a2a 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Gradient vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, #141414 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-[5px] flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-black rounded-[3px]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px] text-text-primary tracking-tight">
              ArtMaster
            </span>
            <span className="font-mono text-[10px] text-text-muted tracking-widest">
              PLATFORM
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          {/* Main statement */}
          <div>
            <p className="font-mono text-[11px] text-accent tracking-[0.2em] mb-4">
              SOCIAL MEDIA ON AUTOPILOT
            </p>
            <h2 className="font-semibold text-[32px] text-text-primary tracking-tight leading-[1.1]">
              Your brand posts
              <br />
              <span className="text-text-muted">every day. Automatically.</span>
            </h2>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              "Brand-perfect posters generated daily",
              "Occasion-aware content for your market",
              "All platforms. One dashboard.",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span className="font-mono text-[13px] text-text-secondary">
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Poster mockup stack */}
          <div className="relative h-48">
            {/* Back card */}
            <div className="absolute left-6 top-4 w-36 h-36 rounded-xl bg-bg-elevated border border-border-default -rotate-6 opacity-40" />

            {/* Middle card */}
            <div className="absolute left-4 top-2 w-36 h-36 rounded-xl bg-bg-elevated border border-border-default rotate-2 opacity-60" />

            {/* Front card — poster preview */}
            <div className="absolute left-0 top-0 w-40 h-40 rounded-xl overflow-hidden border border-border-strong shadow-2xl">
              <div
                className="w-full h-full relative"
                style={{
                  background: "linear-gradient(135deg, #0d1117, #1a2332)",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 70% 30%, rgba(232,255,71,0.15), transparent 60%)`,
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  <div className="h-1 w-8 rounded bg-accent" />
                  <div className="h-3 w-full rounded bg-white/70" />
                  <div className="h-2 w-3/4 rounded bg-white/40" />
                  <div
                    className="h-6 w-20 rounded-full mt-2"
                    style={{ background: "#E8FF47" }}
                  />
                </div>
              </div>
            </div>

            {/* Stats floating card */}
            <div className="absolute right-0 top-8 bg-bg-elevated border border-border-default rounded-xl p-3 shadow-xl">
              <p className="font-mono text-[9px] text-text-muted mb-1">
                GENERATED TODAY
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="font-semibold text-[18px] text-text-primary tabular-nums">
                  247
                </span>
              </div>
              <p className="font-mono text-[9px] text-text-muted mt-1">
                posters across Africa
              </p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-bg-elevated/50 border border-border-default/50 rounded-2xl p-5">
          <p className="font-semibold text-[14px] text-text-primary leading-snug mb-3">
            &quot;We went from spending hours every week to checking our phone
            once a day.&quot;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-semibold text-[12px] text-accent">
              A
            </div>
            <div>
              <p className="font-semibold text-[12px] text-text-primary">
                Amara Osei
              </p>
              <p className="font-mono text-[10px] text-text-muted">
                Founder, Osei Retail · Accra, Ghana
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
