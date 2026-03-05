"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Calendar, Sparkles } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

interface OccasionAlert {
  clientId: string;
  clientName: string;
  type: string;
  title: string;
  daysUntil: number;
  date: string;
}

export default function OccasionsPage() {
  const [alerts, setAlerts] = useState<OccasionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(14);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = await getClientIdToken();
        const res = await fetch(`/api/studio/occasions?days=${daysAhead}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setAlerts((await res.json()).alerts ?? []);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [daysAhead]);

  const urgencyColor = (days: number) =>
    days === 0 ? "bg-error/15 text-error border-error/20" :
    days <= 2 ? "bg-warning/15 text-warning border-warning/20" :
    days <= 7 ? "bg-info/15 text-info border-info/20" :
    "bg-bg-elevated text-text-muted border-border-default";

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-semibold text-[24px] text-text-primary tracking-tight flex items-center gap-2">
            <Bell size={22} />
            Occasions
          </h1>
          <p className="font-mono text-[13px] text-text-muted mt-1">
            Upcoming occasions across all clients.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-xl p-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDaysAhead(d)}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                daysAhead === d ? "bg-bg-elevated text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-bg-surface rounded-2xl animate-pulse" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-2xl p-12 text-center">
          <Calendar size={28} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-[15px] text-text-primary mb-1">No upcoming occasions</p>
          <p className="font-mono text-[12px] text-text-muted">No occasions in the next {daysAhead} days for your active clients.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="bg-bg-surface border border-border-default rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[14px] text-text-primary">{alert.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-mono text-[11px] text-text-muted">{alert.clientName}</p>
                    <span className="font-mono text-[10px] text-text-muted">·</span>
                    <span className="font-mono text-[10px] text-text-muted capitalize">{alert.type === "client-specific" ? "Custom" : "Global"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[11px] px-2.5 py-1 rounded-full border ${urgencyColor(alert.daysUntil)}`}>
                    {alert.daysUntil === 0 ? "Today" : `${alert.daysUntil} day${alert.daysUntil !== 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <Link
                  href={`/studio/create?clientId=${alert.clientId}&occasion=${encodeURIComponent(alert.title)}`}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] text-info hover:underline"
                >
                  <Sparkles size={11} />
                  Generate poster for {alert.clientName}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
