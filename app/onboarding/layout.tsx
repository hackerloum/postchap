export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base">
      <header className="h-14 border-b border-border-subtle flex items-center px-4 sm:px-6">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-text-primary">
            ArtMaster
          </span>
          <span className="font-mono text-[9px] text-accent border border-accent/30 rounded px-1 py-0.5 tracking-widest">
            PLATFORM
          </span>
        </div>
      </header>
      <main className="px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
