"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/WizardShell";

export default function OnboardingPage() {
  const router = useRouter();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
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
