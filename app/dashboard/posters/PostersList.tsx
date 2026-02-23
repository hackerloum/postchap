"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getClientIdToken } from "@/lib/auth-client";

type PosterItem = {
  id: string;
  imageUrl: string | null;
  status: string;
  copy: { headline?: string } | null;
  posterSize: string;
  createdAt: number;
  headline: string;
};

export function PostersList() {
  const [posters, setPosters] = useState<PosterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getClientIdToken();
        const res = await fetch("/api/posters", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        if (cancelled) return;
        if (!res.ok) return;
        const data = await res.json();
        setPosters(data.posters ?? []);
      } catch {
        if (!cancelled) setPosters([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (posters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-bg-surface border border-border-default rounded-2xl">
        <div className="w-20 h-20 rounded-2xl bg-bg-elevated border border-border-default flex items-center justify-center mb-4">
          <span className="text-3xl opacity-50">🖼️</span>
        </div>
        <h2 className="font-semibold text-lg text-text-primary mb-2">No posters yet</h2>
        <p className="font-mono text-xs text-text-muted text-center max-w-sm mb-6">
          Generate your first poster to see it here
        </p>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors"
        >
          Generate poster →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {posters.map((poster) => (
        <div
          key={poster.id}
          className="group bg-bg-surface border border-border-default rounded-2xl overflow-hidden hover:border-border-strong transition-all"
        >
          <div className="aspect-square bg-bg-elevated relative">
            {poster.imageUrl ? (
              <Image
                src={poster.imageUrl}
                alt={poster.headline || "Poster"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl opacity-30">🖼️</span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                  poster.status === "complete"
                    ? "bg-success/10 text-success border border-success/20"
                    : poster.status === "failed"
                      ? "bg-error/10 text-error border border-error/20"
                      : "bg-warning/10 text-warning border border-warning/20"
                }`}
              >
                {poster.status === "complete" ? "Ready" : poster.status}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-medium text-sm text-text-primary truncate">
              {poster.copy?.headline ?? poster.headline}
            </h3>
            <p className="font-mono text-[10px] text-text-muted mt-1">
              {poster.posterSize}
            </p>
            <div className="flex gap-2 mt-3">
              {poster.imageUrl && (
                <a
                  href={poster.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 rounded-lg bg-bg-elevated border border-border-default font-mono text-[10px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors text-center"
                >
                  Open
                </a>
              )}
              <a
                href={poster.imageUrl ?? "#"}
                download
                className="flex-1 py-1.5 rounded-lg bg-bg-elevated border border-border-default font-mono text-[10px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors text-center"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
