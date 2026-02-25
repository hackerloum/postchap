"use client";

import { useEffect, useState } from "react";
import { getAuthClient } from "@/lib/firebase/client";
import { getClientIdToken } from "@/lib/auth-client";
import Link from "next/link";
import { Images, ArrowRight } from "lucide-react";

export function RecentPosters({ uid }: { uid: string }) {
  const [posters, setPosters] = useState<{ id: string; imageUrl: string | null; headline: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = getAuthClient().currentUser;
        if (!user) return;
        const token = await getClientIdToken(false);
        const res = await fetch("/api/posters?limit=6", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setPosters(data.posters || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid]);

  return (
    <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Images size={14} className="text-text-muted" />
          <span className="font-semibold text-[13px] text-text-primary">Recent posters</span>
        </div>
        <Link
          href="/dashboard/posters"
          className="font-mono text-[11px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
        >
          View all
          <ArrowRight size={10} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-bg-elevated rounded-xl animate-pulse" />
          ))}
        </div>
      ) : posters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center mb-3">
            <Images size={18} className="text-text-muted" />
          </div>
          <p className="font-semibold text-[13px] text-text-primary mb-1">No posters yet</p>
          <p className="font-mono text-[11px] text-text-muted mb-4">
            Generate your first poster to see it here
          </p>
          <Link
            href="/dashboard/create"
            className="bg-accent text-black font-semibold text-[12px] px-4 py-2 rounded-lg hover:bg-accent-dim transition-colors"
          >
            Generate now →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 p-4">
          {posters.slice(0, 6).map((poster) => (
            <Link
              key={poster.id}
              href={`/dashboard/posters?new=${poster.id}`}
              className="group relative aspect-square rounded-xl overflow-hidden bg-bg-elevated border border-border-default hover:border-border-strong transition-all duration-200"
            >
              {poster.imageUrl ? (
                <img
                  src={poster.imageUrl}
                  alt={poster.headline}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Images size={16} className="text-text-muted" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                <p className="font-mono text-[9px] text-white line-clamp-2 leading-tight">
                  {poster.headline}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
