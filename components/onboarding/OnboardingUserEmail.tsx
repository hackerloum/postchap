"use client";

import { useEffect, useState } from "react";

export function OnboardingUserEmail() {
  const [email, setEmail] = useState("");
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.email && setEmail(d.email))
      .catch(() => {});
  }, []);
  if (!email) return null;
  return (
    <span className="font-mono text-xs text-text-muted">{email}</span>
  );
}
