"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBrandKit } from "@/hooks/useBrandKits";

type Tab = "overview" | "posters" | "settings";

export default function BrandKitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const { user, loading: authLoading } = useAuth();
  const { brandKit, loading } = useBrandKit(user?.uid ?? null, id ?? null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (!user || !id) return null;
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-48 animate-pulse rounded bg-bg-elevated" />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" />
            <div className="h-64 animate-pulse rounded-2xl bg-bg-surface lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }
  if (!brandKit) {
    return (
      <div className="min-h-screen bg-bg-base px-6 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-sans text-text-secondary">Brand kit not found.</p>
          <Link href="/dashboard/brand-kits" className="mt-4 inline-block text-accent hover:underline">
            ← Back to Brand Kits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base px-6 py-12 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">
              {brandKit.brandName}
            </h1>
            <p className="mt-0.5 font-mono text-xs capitalize text-text-muted">
              {brandKit.industry}
            </p>
          </div>
          <Link
            href="/dashboard/brand-kits"
            className="font-mono text-xs text-text-muted hover:text-text-secondary"
          >
            ← All Brand Kits
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,340px]">
          <div>
            <div className="border-b border-border-default">
              <nav className="flex gap-6">
                {(["overview", "posters", "settings"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`border-b-2 py-3 font-mono text-xs uppercase tracking-widest ${
                      tab === t
                        ? "border-accent text-text-primary"
                        : "border-transparent text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </nav>
            </div>

            {tab === "overview" && (
              <div className="mt-6 space-y-6 rounded-2xl border border-border-default bg-bg-surface p-6">
                <section>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">
                    Identity
                  </h3>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="font-mono text-[11px] text-text-muted">Brand name</dt>
                      <dd className="font-sans text-sm text-text-primary">{brandKit.brandName}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] text-text-muted">Industry</dt>
                      <dd className="font-sans text-sm capitalize text-text-primary">{brandKit.industry}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] text-text-muted">Tagline</dt>
                      <dd className="font-sans text-sm text-text-primary">{brandKit.tagline || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] text-text-muted">Website</dt>
                      <dd className="font-sans text-sm text-text-primary">{brandKit.website || "—"}</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">
                    Visual
                  </h3>
                  <div className="mt-2 flex items-center gap-3">
                    {[brandKit.primaryColor, brandKit.secondaryColor, brandKit.accentColor].map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded-lg border border-border-default"
                          style={{ backgroundColor: c }}
                        />
                        <span className="font-mono text-[11px] text-text-muted">{c}</span>
                      </div>
                    ))}
                  </div>
                  {brandKit.logoUrl && (
                    <div className="mt-2">
                      <img src={brandKit.logoUrl} alt="" className="h-10 w-auto object-contain" />
                    </div>
                  )}
                </section>
                <section>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">
                    Audience
                  </h3>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="font-mono text-[11px] text-text-muted">Target audience</dt>
                      <dd className="font-sans text-sm text-text-primary">{brandKit.targetAudience || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] text-text-muted">Age range</dt>
                      <dd className="font-sans text-sm text-text-primary">{brandKit.ageRange || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] text-text-muted">Location</dt>
                      <dd className="font-sans text-sm text-text-primary">{brandKit.location || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] text-text-muted">Platforms</dt>
                      <dd className="font-sans text-sm text-text-primary">
                        {(brandKit.platforms ?? []).join(", ") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] text-text-muted">Language</dt>
                      <dd className="font-sans text-sm uppercase text-text-primary">{brandKit.language}</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">
                    Content
                  </h3>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="font-mono text-[11px] text-text-muted">Tone</dt>
                      <dd className="font-sans text-sm capitalize text-text-primary">{brandKit.tone}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-mono text-[11px] text-text-muted">Style notes</dt>
                      <dd className="font-sans text-sm text-text-primary">
                        {brandKit.styleNotes ? brandKit.styleNotes.slice(0, 200) + (brandKit.styleNotes.length > 200 ? "…" : "") : "—"}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>
            )}

            {tab === "posters" && (
              <div className="mt-6 rounded-2xl border border-border-default bg-bg-surface p-6">
                <p className="font-sans text-sm text-text-muted">
                  Posters for this brand kit will appear here.
                </p>
              </div>
            )}

            {tab === "settings" && (
              <div className="mt-6 rounded-2xl border border-border-default bg-bg-surface p-6">
                <p className="font-sans text-sm text-text-muted">
                  Editable brand kit settings coming soon.
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-lg border border-border-default px-4 py-2 font-apple text-sm text-text-primary hover:bg-bg-elevated"
                >
                  Save changes
                </button>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border-default bg-bg-surface p-4">
              <h3 className="font-sans text-sm font-semibold text-text-primary">
                Daily Schedule
              </h3>
              <p className="mt-2 font-mono text-[11px] text-text-muted">
                Poster job and preferred time.
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-lg border border-border-default px-4 py-2 font-apple text-sm text-text-primary hover:bg-bg-elevated"
              >
                Save schedule
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border-default bg-bg-surface">
              <div
                className="aspect-square w-full p-6"
                style={{ backgroundColor: brandKit.primaryColor }}
              >
                {brandKit.logoUrl ? (
                  <img src={brandKit.logoUrl} alt="" className="h-8 w-auto object-contain" />
                ) : (
                  <div
                    className="font-display text-lg font-semibold"
                    style={{ color: brandKit.secondaryColor }}
                  >
                    {brandKit.brandName}
                  </div>
                )}
              </div>
              <div className="border-t border-border-default p-4">
                <p className="font-sans text-sm font-semibold text-text-primary">{brandKit.brandName}</p>
                <p className="font-mono text-[11px] text-text-muted capitalize">{brandKit.industry}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="w-full rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black hover:opacity-90"
              >
                Generate poster now
              </button>
              <Link
                href="/dashboard"
                className="w-full rounded-lg border border-border-default px-4 py-2.5 text-center font-apple text-sm text-text-primary hover:bg-bg-elevated"
              >
                View all posters →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
