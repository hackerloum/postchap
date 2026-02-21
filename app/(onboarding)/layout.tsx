"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { OnboardingUserEmail } from "@/components/onboarding/OnboardingUserEmail";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showHeader = pathname?.startsWith("/onboarding") ?? true;
  const isFullScreen = pathname === "/welcome" || pathname === "/generating" || pathname === "/reveal";

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      {showHeader && (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-6">
          <Logo variant="auth" />
          <OnboardingUserEmail />
        </header>
      )}
      <main className="flex-1 overflow-y-auto">
        {isFullScreen ? (
          children
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-12">{children}</div>
        )}
      </main>
    </div>
  );
}
