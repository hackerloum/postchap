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

function formatDaysLeft(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function OccasionBanner() {
  const [occasions, setOccasions] = useState<UpcomingOccasion[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getClientIdToken();
        const res = await fetch("/api/occasions/upcoming?days=60", {
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

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
          <CalendarClock size={18} className="text-accent" />
        </div>
        <div>
          <p className="font-semibold text-[13px] text-text-primary">
            Upcoming occasions — get ready
          </p>
          <p className="font-mono text-[11px] text-text-muted">
            See what&apos;s coming up and prepare your posters in advance.
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {occasions.map((occ) => (
          <li
            key={occ.id}
            className="flex items-center justify-between gap-3 bg-bg-base/50 rounded-lg px-3 py-2.5 border border-border-default/50"
          >
            <span className="font-medium text-[13px] text-text-primary">
              {occ.name}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-[11px] text-text-muted">
                {formatDaysLeft(occ.daysUntil)}
              </span>
              <Link
                href={`/dashboard/create?occasion=${encodeURIComponent(occ.name)}`}
                className="text-accent font-semibold text-[12px] hover:underline"
              >
                Create poster →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
