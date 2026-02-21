"use client";

const ROW1_BRANDS = [
  "Safaricom",
  "CRDB Bank",
  "Vodacom",
  "Azam Media",
  "NMB Bank",
  "Tanzania Breweries",
  "Jubilee Insurance",
  "DStv Tanzania",
];

const ROW2_BRANDS = [
  "Maxcom",
  "Precision Air",
  "Multichoice",
  "KCB Tanzania",
];

function LogoItem({
  name,
  i,
  padding,
}: {
  name: string;
  i: number;
  padding: string;
}) {
  return (
    <div
      className={`flex flex-shrink-0 items-center gap-2 ${padding} opacity-50 transition-opacity duration-300 hover:opacity-100`}
    >
      <span className="text-xs text-accent">◆</span>
      <span className="font-display text-base font-semibold text-text-primary md:text-lg">
        {name}
      </span>
    </div>
  );
}

export function LogoMarquee() {
  const row1Logos = [...ROW1_BRANDS, ...ROW1_BRANDS];
  const row2Logos = [...ROW2_BRANDS, ...ROW2_BRANDS];

  return (
    <section className="border-t border-b border-border-subtle bg-bg-base py-16">
      <p className="text-center font-mono text-[11px] uppercase tracking-widest text-text-muted">
        Trusted by brand teams at
      </p>
      <div className="mt-6 overflow-hidden">
        <div className="marquee-container mb-8">
          <div className="marquee-track flex w-fit">
            {row1Logos.map((name, i) => (
              <LogoItem
                key={`r1-${i}-${name}`}
                name={name}
                i={i}
                padding="px-6 md:px-10"
              />
            ))}
          </div>
        </div>
        <div className="marquee-container">
          <div className="marquee-track-reverse flex w-fit">
            {row2Logos.map((name, i) => (
              <LogoItem
                key={`r2-${i}-${name}`}
                name={name}
                i={i}
                padding="px-6 md:px-10"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
