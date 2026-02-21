"use client";

const COMPANIES = [
  "Meridian Co.",
  "Atlas Labs",
  "Northgate",
  "Stripe",
  "Vault",
  "Forge",
];

export function SocialProof() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <p className="mb-6 text-left font-apple text-sm text-text-secondary">
          Trusted by brand teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {COMPANIES.map((name, i) => (
            <span key={name} className="font-mono text-xs text-text-muted">
              {i > 0 && (
                <span className="mx-4 hidden text-border-default sm:inline">|</span>
              )}
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
