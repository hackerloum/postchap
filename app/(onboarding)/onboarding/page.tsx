"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const WizardShell = dynamic(
  () => import("@/components/onboarding/WizardShell").then((m) => m.WizardShell),
  {
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-border-default" />
      </div>
    ),
    ssr: false,
  }
);

export default function OnboardingPage() {
  const router = useRouter();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    fetch("/api/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hasOnboarded) {
          didRedirect.current = true;
          router.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  return <WizardShell />;
}
