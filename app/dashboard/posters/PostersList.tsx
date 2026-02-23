"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { getAuthClient } from "@/lib/firebase/client";
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

async function fetchPosters(token: string | null): Promise<PosterItem[]> {
  const res = await fetch("/api/posters", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to load posters");
  }
  const data = await res.json();
  return data.posters ?? [];
}

export function PostersList() {
  const [posters, setPosters] = useState<PosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosters = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getClientIdToken();
      const list = await fetchPosters(token);
      setPosters(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
      setPosters([]);
      if (msg === "Unauthorized") {
        const retryToken = await getClientIdToken();
        if (retryToken) {
          try {
            const list = await fetchPosters(retryToken);
            setPosters(list);
            setError(null);
          } catch {
            // keep error state
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getAuthClient();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadPosters();
      } else {
        setPosters([]);
        setLoading(false);
        setError("Please sign in to view your posters.");
      }
    });
    return () => unsubscribe();
  }, [loadPosters]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-bg-surface border border-border-default rounded-2xl">
        <p className="font-mono text-sm text-text-muted mb-4">{error}</p>
        <button
          type="button"
          onClick={() => loadPosters()}
          className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (posters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-bg-surface border border-border-default rounded-2xl">
        <div className="w-20 h-20 rounded-2xl bg-bg-elevated border border-border-default flex items-center justify-center mb-4 text-text-muted">
          <ImageIcon size={40} className="opacity-50" />
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
              <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                <ImageIcon size={48} className="opacity-30" />
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
