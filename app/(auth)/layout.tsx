export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="px-6 h-14 flex items-center border-b border-border-subtle">
        <a href="/" className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-text-primary">
            ArtMaster
          </span>
          <span className="font-mono text-[9px] text-accent border border-accent/30 rounded px-1 py-0.5 tracking-widest">
            PLATFORM
          </span>
        </a>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
