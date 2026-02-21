import Link from "next/link";
import { OnboardingUserEmail } from "@/components/onboarding/OnboardingUserEmail";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-base font-semibold text-text-primary">
            ArtMaster
          </span>
          <span className="rounded border border-accent/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
            Platform
          </span>
        </Link>
        <OnboardingUserEmail />
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-12">{children}</div>
      </main>
    </div>
  );
}
