"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/WizardShell";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.hasOnboarded) router.replace("/dashboard");
      })
      .catch(() => {});
  }, [router]);

  return <WizardShell />;
}
