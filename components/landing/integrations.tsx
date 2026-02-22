"use client";

const PARTNERS = [
  { name: "Firebase", line: "Database, auth, and storage" },
  { name: "Vercel", line: "Hosting and cron" },
  { name: "OpenAI", line: "Text and image generation" },
  { name: "Your Brand", line: "Custom brand kits" },
];

export function Integrations() {
  return (
    <section className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl animate-fade-up">
          ArtMaster runs on world-class infrastructure.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up">
          {PARTNERS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center rounded-xl border border-border-default bg-bg-surface p-6 text-center transition-colors duration-200 hover:border-border-strong"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border-default font-mono text-xs text-text-muted">
                {p.name.slice(0, 2)}
              </div>
              <p className="mt-4 font-apple text-base font-semibold tracking-tight text-text-primary">
                {p.name}
              </p>
              <p className="mt-2 font-mono text-xs text-text-muted">
                {p.line}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
