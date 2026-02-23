"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export const COOKIE_CONSENT_STORAGE_KEY = "cookie_consent";
const STORAGE_KEY = COOKIE_CONSENT_STORAGE_KEY;

type ConsentStatus = "pending" | "accepted" | "declined" | null;

export function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ConsentStatus | null;
      if (stored === "accepted" || stored === "declined") {
        setStatus(stored);
      } else {
        setStatus("pending");
      }
    } catch {
      setStatus("pending");
    }
    setMounted(true);
  }, []);

  const save = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      setStatus(value);
    } catch {
      setStatus(value);
    }
  };

  if (!mounted || status !== "pending") return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 animate-slide-up-in"
    >
      <div className="max-w-3xl mx-auto bg-bg-surface border border-border-default rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary leading-relaxed">
            We use cookies to keep you signed in, remember your preferences, and make ArtMaster work properly. 
            By continuing, you agree to our use of cookies.{" "}
            <Link
              href="/privacy"
              className="text-accent hover:underline font-medium"
            >
              Privacy & cookies
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => save("declined")}
            className="font-mono text-xs text-text-muted hover:text-text-primary px-4 py-2.5 rounded-lg border border-border-default hover:border-border-strong transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => save("accepted")}
            className="font-mono text-xs font-medium bg-accent text-black px-4 py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
