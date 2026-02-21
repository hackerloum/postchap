"use client";

import Link from "next/link";
import type { Poster, PosterActivity } from "@/types";

type SerializedBrandKit = {
  id: string;
  userId: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  language: string;
  styleNotes: string;
  sampleContent: string;
  logoUrl?: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type Props = {
  brandKits: SerializedBrandKit[];
  posters: (Omit<Poster, "createdAt" | "updatedAt"> & { createdAt: string | null; updatedAt: string | null })[];
  activity: (Omit<PosterActivity, "createdAt"> & { createdAt: string | null })[];
  postersThisWeek: number;
  approvalRate: number;
  activeBrandKits: number;
  lastGenerated: string | null;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardClient({
  brandKits,
  posters,
  activity,
  postersThisWeek,
  approvalRate,
  activeBrandKits,
  lastGenerated,
}: Props) {
  const hasPosters = posters.length > 0;

  return (
    <div className="min-h-screen bg-bg-base px-6 py-12 md:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          {getGreeting()}.
        </h1>
        <p className="mt-2 font-apple text-sm text-text-secondary">
          Here&apos;s what ArtMaster has been up to.
        </p>

        {brandKits.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border-default bg-bg-surface">
              <svg
                className="h-8 w-8 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-semibold text-text-primary">
              ArtMaster is ready for you.
            </h2>
            <p className="mt-2 max-w-md font-sans text-sm text-text-secondary">
              You haven&apos;t created a Brand Kit yet. Create one to start
              generating daily posters automatically.
            </p>
            <Link
              href="/onboarding"
              className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 font-apple text-sm font-semibold text-bg-base hover:opacity-90"
            >
              Create your first Brand Kit →
            </Link>
          </div>
        ) : !hasPosters ? (
          <div className="mt-12 rounded-xl border border-border-default bg-bg-surface p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              ArtMaster is ready.
            </h2>
            <p className="mt-3 font-apple text-sm text-text-secondary">
              Enable your daily schedule to start generating posters automatically.
            </p>
          </div>
        ) : null}
        {brandKits.length > 0 && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border-default bg-bg-surface p-6">
              <p className="font-mono text-xs text-text-muted">This week</p>
              <p className="mt-2 font-display text-2xl font-semibold text-text-primary">
                {postersThisWeek}
              </p>
              <p className="font-apple text-sm text-text-secondary">posters</p>
            </div>
            <div className="rounded-xl border border-border-default bg-bg-surface p-6">
              <p className="font-mono text-xs text-text-muted">Approval rate</p>
              <p className="mt-2 font-display text-2xl font-semibold text-text-primary">
                {approvalRate}%
              </p>
            </div>
            <div className="rounded-xl border border-border-default bg-bg-surface p-6">
              <p className="font-mono text-xs text-text-muted">Active brands</p>
              <p className="mt-2 font-display text-2xl font-semibold text-text-primary">
                {activeBrandKits}
              </p>
            </div>
            <div className="rounded-xl border border-border-default bg-bg-surface p-6">
              <p className="font-mono text-xs text-text-muted">Last generated</p>
              <p className="mt-2 font-apple text-sm text-text-primary">
                {lastGenerated
                  ? new Date(lastGenerated).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {brandKits.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Brand Kits
            </h2>
            <ul className="mt-4 space-y-2">
              {brandKits.map((kit) => (
                <li key={kit.id}>
                  <Link
                    href={`/dashboard/brand-kits/${kit.id}`}
                    className="block rounded-lg border border-border-default bg-bg-surface px-4 py-3 font-apple text-sm text-text-primary hover:border-border-strong"
                  >
                    {kit.brandName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
