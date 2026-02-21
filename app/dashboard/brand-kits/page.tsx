"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Music,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBrandKits } from "@/hooks/useBrandKits";
import { getBrandLocation } from "@/lib/ai/locationContext";
import { getFlagEmoji } from "@/lib/utils/location";
import type { Platform } from "@/types";

function PlatformIcon({ platform, size = 12 }: { platform: Platform; size?: number }) {
  const icons = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    tiktok: Music,
    whatsapp: MessageCircle,
  } as const;
  const Icon = icons[platform];
  return Icon ? <Icon size={size} className="text-text-muted" /> : null;
}

export default function BrandKitsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { brandKits, loading } = useBrandKits(user?.uid ?? null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-bg-base px-6 py-12 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            Brand Kits
            {!loading && (
              <span className="ml-2 rounded bg-bg-elevated px-2 py-0.5 font-mono text-sm text-text-muted">
                {brandKits.length}
              </span>
            )}
          </h1>
          <Link
            href="/onboarding"
            className="rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black hover:opacity-90"
          >
            Add Brand Kit
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-border-default bg-bg-surface"
              />
            ))}
          </div>
        ) : brandKits.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border-default bg-bg-surface">
              <Layers size={32} className="text-text-muted" />
            </div>
            <h2 className="font-display text-xl font-semibold text-text-primary">
              No Brand Kits yet
            </h2>
            <p className="mt-2 font-sans text-sm text-text-secondary">
              Create your first Brand Kit to start generating posters.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 font-apple text-sm font-semibold text-bg-base hover:opacity-90"
            >
              Create your first Brand Kit →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brandKits.map((kit) => (
              <div
                key={kit.id}
                className="overflow-hidden rounded-2xl border border-border-default bg-bg-surface transition-all duration-200 hover:border-border-strong"
              >
                <div className="flex h-2 w-full">
                  <div className="flex-1" style={{ backgroundColor: kit.primaryColor }} />
                  <div className="flex-1" style={{ backgroundColor: kit.secondaryColor }} />
                  <div className="flex-1" style={{ backgroundColor: kit.accentColor }} />
                </div>
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {kit.logoUrl ? (
                        <img
                          src={kit.logoUrl}
                          alt=""
                          className="h-8 w-8 rounded object-contain"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-elevated">
                          <Layers size={14} className="text-text-muted" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-sans text-sm font-semibold text-text-primary">
                          {kit.brandName}
                        </h3>
                        <p className="font-mono text-[11px] text-text-muted flex items-center gap-1.5">
                          {(() => {
                            const loc = getBrandLocation(kit);
                            const locationLine =
                              loc.city && loc.country !== "Unknown"
                                ? `${loc.city}, ${loc.country}`
                                : loc.country !== "Unknown"
                                  ? loc.country
                                  : kit.industry;
                            const flag =
                              loc.countryCode !== "XX" ? getFlagEmoji(loc.countryCode) : null;
                            return (
                              <>
                                {flag && <span>{flag}</span>}
                                <span className="capitalize">{locationLine}</span>
                              </>
                            );
                          })()}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`mt-1 h-2 w-2 rounded-full ${
                        kit.enabled ? "bg-status-success" : "bg-text-muted"
                      }`}
                    />
                  </div>
                  <div className="mb-4 flex gap-4">
                    <div>
                      <p className="font-mono text-[11px] text-text-muted">Language</p>
                      <p className="mt-0.5 font-sans text-xs uppercase text-text-primary">
                        {kit.language}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] text-text-muted">Tone</p>
                      <p className="mt-0.5 font-sans text-xs capitalize text-text-primary">
                        {kit.tone}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] text-text-muted">Platforms</p>
                      <p className="mt-0.5 font-sans text-xs text-text-primary">
                        {kit.platforms?.length ?? 0} connected
                      </p>
                    </div>
                  </div>
                  <div className="mb-4 flex gap-1.5">
                    {(kit.platforms ?? []).map((p) => (
                      <div
                        key={p}
                        className="flex h-6 w-6 items-center justify-center rounded bg-bg-elevated"
                      >
                        <PlatformIcon platform={p} size={12} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-border-subtle pt-4">
                    <Link
                      href={`/dashboard/brand-kits/${kit.id}`}
                      className="flex-1 rounded-lg border border-border-default bg-transparent px-3 py-2 text-center font-apple text-xs font-medium text-text-primary hover:bg-bg-elevated"
                    >
                      Manage
                    </Link>
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-accent px-3 py-2 text-center font-apple text-xs font-semibold text-black hover:opacity-90"
                    >
                      Generate now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
