export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base">
      <header className="h-14 border-b border-border-subtle flex items-center px-4 sm:px-6">
        <img
          src="/artmasterwordmarklogo-03-03.webp"
          alt="ArtMaster"
          className="h-7 object-contain object-left"
        />
      </header>
      <main className="px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
