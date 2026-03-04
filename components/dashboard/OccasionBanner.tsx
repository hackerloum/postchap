"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

interface UpcomingOccasion {
  id: string;
  name: string;
  date: string;
  daysUntil: number;
  category: string;
}

export function OccasionBanner() {
  const [occasions, setOccasions] = useState<UpcomingOccasion[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getClientIdToken();
        const res = await fetch("/api/occasions/upcoming", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setOccasions(data.occasions ?? []);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (occasions.length === 0) return null;

  const first = occasions[0];
  const daysText = first.daysUntil === 0 ? "today" : first.daysUntil === 1 ? "tomorrow" : `in ${first.daysUntil} days`;

  return (
    <div className="flex items-center justify-between bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
          <CalendarClock size={18} className="text-accent" />
        </div>
        <div>
          <p className="font-semibold text-[13px] text-text-primary">
            {first.name} is {daysText}
          </p>
          <p className="font-mono text-[11px] text-text-muted">
            Generate your {first.name} poster now before the rush.
          </p>
        </div>
      </div>
      <Link
        href={`/dashboard/create?occasion=${encodeURIComponent(first.name)}`}
        className="bg-accent text-black font-semibold text-[12px] px-4 py-2 rounded-lg hover:bg-accent-dim transition-colors whitespace-nowrap shrink-0"
      >
        Generate now →
      </Link>
    </div>
  );
}
