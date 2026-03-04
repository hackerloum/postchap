"use client";

import { useEffect, useState } from "react";
import { getClientIdToken } from "@/lib/auth-client";
import { ChevronLeft, ChevronRight, Plus, CheckCircle, CalendarClock } from "lucide-react";
import Link from "next/link";

interface CalendarData {
  month: string;
  byDate: Record<string, { created: { id: string; imageUrl: string | null; headline: string }[]; scheduled: unknown[]; posted: unknown[] }>;
}

export default function CalendarPage() {
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const token = await getClientIdToken();
        const res = await fetch(`/api/posters/calendar?month=${month}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        if (!cancelled && res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [month]);

  const [y, m] = month.split("-").map(Number);
  const firstDay = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) week.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  function dateStr(day: number): string {
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function prevMonth() {
    if (m === 1) setMonth(`${y - 1}-12`);
    else setMonth(`${y}-${String(m - 1).padStart(2, "0")}`);
  }

  function nextMonth() {
    if (m === 12) setMonth(`${y + 1}-01`);
    else setMonth(`${y}-${String(m + 1).padStart(2, "0")}`);
  }

  const monthLabel = new Date(y, m - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">
          Content calendar
        </h1>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[13px] px-4 py-2 rounded-lg hover:bg-accent-dim transition-colors"
        >
          <Plus size={14} />
          Generate
        </Link>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-semibold text-[16px] text-text-primary">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <th key={d} className="font-mono text-[10px] uppercase text-text-muted py-2 border-b border-border-subtle">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((day, di) => {
                      if (day === null) {
                        return <td key={di} className="p-1 min-w-[80px] h-20 bg-bg-elevated/30" />;
                      }
                      const ds = dateStr(day);
                      const dayData = data?.byDate?.[ds];
                      const hasPosted = (dayData?.posted?.length ?? 0) > 0;
                      const hasScheduled = (dayData?.scheduled?.length ?? 0) > 0;
                      const hasCreated = (dayData?.created?.length ?? 0) > 0;
                      const hasActivity = hasPosted || hasScheduled || hasCreated;
                      return (
                        <td
                          key={di}
                          className="p-1 min-w-[80px] h-20 align-top border-b border-r border-border-subtle last:border-r-0"
                        >
                          <div className="flex flex-col h-full">
                            <span className="font-mono text-[11px] text-text-muted mb-1">{day}</span>
                            <div className="flex-1 flex flex-wrap gap-1">
                              {hasPosted && (
                                <span className="inline-flex items-center gap-0.5 text-success" title="Posted">
                                  <CheckCircle size={10} />
                                </span>
                              )}
                              {hasScheduled && (
                                <span className="inline-flex items-center gap-0.5 text-accent" title="Scheduled">
                                  <CalendarClock size={10} />
                                </span>
                              )}
                              {hasCreated && !hasPosted && !hasScheduled && (
                                <span className="inline-flex items-center gap-0.5 text-text-muted" title="Generated">
                                  <Plus size={10} />
                                </span>
                              )}
                            </div>
                            {hasActivity && (
                              <Link
                                href={`/dashboard/posters?date=${ds}`}
                                className="font-mono text-[9px] text-accent hover:underline mt-1"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-success" /> Posted</span>
        <span className="flex items-center gap-1.5"><CalendarClock size={12} className="text-accent" /> Scheduled</span>
        <span className="flex items-center gap-1.5"><Plus size={12} /> Generated</span>
      </div>
    </div>
  );
}
