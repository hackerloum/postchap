"use client";

import Link from "next/link";
import type { BrandKit, Poster, PosterActivity } from "@/types";

type Props = {
  brandKits: BrandKit[];
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

        {!hasPosters ? (
          <div className="mt-12 rounded-xl border border-border-default bg-bg-surface p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              ArtMaster is ready.
            </h2>
            <p className="mt-3 font-apple text-sm text-text-secondary">
              Create your first Brand Kit and enable your daily schedule to start
              generating posters automatically.
            </p>
            <Link
              href="/dashboard/brand-kits/new"
              className="mt-6 inline-block rounded-lg bg-accent px-4 py-3 font-apple text-sm font-semibold text-bg-base hover:opacity-90"
            >
              Create Brand Kit
            </Link>
          </div>
        ) : (
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
                    {kit.name}
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
