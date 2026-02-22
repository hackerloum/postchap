"use client";

const BRAND = { name: "Acme", color: "#E8FF47" };
const POSTERS = [
  { date: "Today", status: "generated" },
  { date: "Yesterday", status: "approved" },
  { date: "Feb 18", status: "posted" },
];

export function ProductMockup() {
  return (
    <div className="rounded-xl border border-border-default bg-bg-surface p-6 transition-colors duration-200 hover:border-border-strong animate-fade-up">
      <div className="grid gap-6 md:grid-cols-[200px_1fr_280px]">
        <div className="rounded-xl border border-border-default p-6">
          <p className="badge font-mono text-[11px] uppercase tracking-widest text-text-muted">
            Brand Kit
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div
              className="h-8 w-8 rounded"
              style={{ backgroundColor: BRAND.color }}
            />
            <span className="font-apple text-base font-semibold tracking-tight text-text-primary">
              {BRAND.name}
            </span>
          </div>
          <div className="mt-4 h-2 w-full rounded bg-border-default" />
          <div className="mt-2 h-2 w-2/3 rounded bg-border-default" />
        </div>
        <div>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-text-muted">
            Poster History
          </p>
          <div className="grid grid-cols-3 gap-4">
            {POSTERS.map((p) => (
              <div
                key={p.date}
                className="aspect-[4/5] rounded-md border border-border-default bg-bg-base p-2"
              >
                <div className="h-full rounded bg-border-default" />
                <p className="mt-2 font-mono text-xs text-text-muted">
                  {p.date}
                </p>
                <span
                  className={
                    p.status === "generated"
                      ? "text-status-warning"
                      : p.status === "approved"
                        ? "text-status-success"
                        : "text-status-info"
                  }
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border-default p-6">
          <p className="badge font-mono text-[11px] uppercase tracking-widest text-text-muted">
            Poster Detail
          </p>
          <div className="mt-4 space-y-2">
            <div className="h-8 w-full rounded bg-border-default" />
            <div className="h-8 w-full rounded bg-border-default" />
            <div className="h-20 w-full rounded bg-border-default" />
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded bg-border-default" />
              <div className="h-8 flex-1 rounded bg-accent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
