"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-text-primary">
          Something went wrong
        </h1>
        <p className="mt-2 font-apple text-sm text-text-secondary">
          The dashboard couldn&apos;t load. This can happen if your session
          expired or there was a connection issue.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-border-default bg-bg-surface px-4 py-2.5 font-apple text-sm font-medium text-text-primary hover:bg-bg-elevated"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black hover:opacity-90"
          >
            Sign in again
          </Link>
        </div>
      </div>
    </div>
  );
}
