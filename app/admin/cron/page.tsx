"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Pause,
  Play,
  SkipForward,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RefreshCw,
} from "lucide-react";

type CronEndpoint = "scheduled-generation" | "occasion-alerts" | "scheduled-posts";
type CronSkipNextRun = { scheduledGeneration?: boolean; occasionAlerts?: boolean; scheduledPosts?: boolean };

interface CronRun {
  endpoint: string;
  startedAt: number;
  finishedAt: number;
  status: "ok" | "skipped" | "error";
  reason?: string;
  due?: number;
  processed?: number;
  skipped?: number;
  results?: unknown[];
  error?: string;
}

interface UpcomingItem {
  endpoint: string;
  schedule: string;
  nextRunTimes: string[];
}

interface UpcomingUserSchedule {
  uid: string;
  email: string | null;
  displayName: string | null;
  nextRunAt: number;
  time: string;
  timezone: string;
}

interface CronControlState {
  paused: boolean;
  skipNextRun: CronSkipNextRun;
  updatedAt: number | null;
  runs: CronRun[];
  upcoming: UpcomingItem[];
  upcomingUserSchedules?: UpcomingUserSchedule[];
}

const ENDPOINT_LABELS: Record<CronEndpoint, string> = {
  "scheduled-generation": "Poster generation",
  "occasion-alerts": "Occasion alerts",
  "scheduled-posts": "Scheduled Instagram posts",
};

export default function AdminCronPage() {
  const [data, setData] = useState<CronControlState | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/cron-control", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load cron state");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function setPaused(paused: boolean) {
    setAction("paused");
    try {
      const res = await fetch("/api/admin/cron-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ paused }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const json = await res.json();
      setData((prev) => (prev ? { ...prev, ...json } : null));
      toast.success(paused ? "All cron jobs paused" : "Cron jobs resumed");
    } catch {
      toast.error("Failed to update");
    } finally {
      setAction(null);
    }
  }

  async function setSkipNextRun(skip: CronSkipNextRun) {
    setAction("skip");
    try {
      const res = await fetch("/api/admin/cron-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ skipNextRun: skip }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const json = await res.json();
      setData((prev) => (prev ? { ...prev, skipNextRun: json.skipNextRun } : null));
      toast.success("Next run will be skipped for selected job(s)");
    } catch {
      toast.error("Failed to update");
    } finally {
      setAction(null);
    }
  }

  function toggleSkipEndpoint(endpoint: CronEndpoint) {
    const key =
      endpoint === "scheduled-generation"
        ? "scheduledGeneration"
        : endpoint === "occasion-alerts"
          ? "occasionAlerts"
          : "scheduledPosts";
    const current = data?.skipNextRun ?? {};
    const next = { ...current, [key]: !(current as Record<string, boolean>)[key] };
    setSkipNextRun(next);
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">Cron jobs</h1>
          <p className="font-mono text-[12px] text-text-muted mt-1">
            Upcoming runs, pause/resume, skip next run, and run history
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); fetchData(); }}
          className="p-2 rounded-lg border border-border-default hover:border-border-strong text-text-muted hover:text-text-primary transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {!data && (
        <div className="text-text-muted text-[13px]">Could not load cron state.</div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Control: Pause + Skip next */}
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
            <h2 className="text-[14px] font-semibold text-text-primary mb-4">Control</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-text-muted">All cron jobs</span>
                <button
                  type="button"
                  onClick={() => setPaused(!data.paused)}
                  disabled={!!action}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                    data.paused
                      ? "bg-success/15 text-success border border-success/30 hover:bg-success/20"
                      : "bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20"
                  } disabled:opacity-50`}
                >
                  {action === "paused" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : data.paused ? (
                    <Play size={14} />
                  ) : (
                    <Pause size={14} />
                  )}
                  {data.paused ? "Resume" : "Pause all"}
                </button>
                {data.paused && (
                  <span className="text-[11px] text-amber-600 font-medium">Paused</span>
                )}
              </div>
              <div className="h-6 w-px bg-border-default" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-text-muted mr-1">Skip next run:</span>
                {(Object.keys(ENDPOINT_LABELS) as CronEndpoint[]).map((ep) => {
                  const key =
                    ep === "scheduled-generation"
                      ? "scheduledGeneration"
                      : ep === "occasion-alerts"
                        ? "occasionAlerts"
                        : "scheduledPosts";
                  const on = (data.skipNextRun as Record<string, boolean>)[key];
                  return (
                    <button
                      key={ep}
                      type="button"
                      onClick={() => toggleSkipEndpoint(ep)}
                      disabled={!!action}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                        on
                          ? "bg-accent/15 text-accent border-accent/30"
                          : "border-border-default text-text-secondary hover:border-border-strong"
                      } disabled:opacity-50`}
                    >
                      <SkipForward size={12} />
                      {ENDPOINT_LABELS[ep]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upcoming user generations (e.g. "3:00 PM" poster generation) */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle">
              <h2 className="text-[14px] font-semibold text-text-primary">Upcoming user generations</h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                Users who have scheduled poster generation — next run in their timezone (e.g. 3:00 PM)
              </p>
            </div>
            {(data.upcomingUserSchedules?.length ?? 0) > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border-subtle text-[11px] font-medium text-text-muted uppercase tracking-wider">
                      <th className="px-6 py-3">When (local)</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Timezone</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {data.upcomingUserSchedules?.map((u) => (
                      <tr key={u.uid} className="border-b border-border-subtle/50 hover:bg-bg-elevated/50">
                        <td className="px-6 py-3 font-mono text-text-primary whitespace-nowrap">
                          {new Date(u.nextRunAt).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <span className="text-text-muted font-normal ml-1">
                            ({u.time})
                          </span>
                        </td>
                        <td className="px-6 py-3 text-text-secondary">
                          {u.email ?? u.displayName ?? u.uid}
                        </td>
                        <td className="px-6 py-3 text-text-muted font-mono text-[11px]">
                          {u.timezone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-[12px] text-text-muted">
                No upcoming user generations. Users must enable &quot;Scheduled generation&quot; and save on their Schedule page.
              </div>
            )}
          </div>

          {/* Upcoming cron trigger times (UTC) */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle">
              <h2 className="text-[14px] font-semibold text-text-primary">When cron runs (UTC)</h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                Next times the VPS will call each endpoint
              </p>
            </div>
            <div className="divide-y divide-border-subtle/50">
              {data.upcoming?.map((u) => (
                <div key={u.endpoint} className="px-6 py-4 flex flex-wrap items-baseline gap-4">
                  <div className="min-w-[180px]">
                    <span className="font-mono text-[12px] text-text-primary">
                      {ENDPOINT_LABELS[u.endpoint as CronEndpoint] ?? u.endpoint}
                    </span>
                    <span className="text-[11px] text-text-muted ml-2">({u.schedule})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {u.nextRunTimes?.slice(0, 5).map((iso, i) => (
                      <span
                        key={i}
                        className="font-mono text-[11px] px-2 py-1 rounded bg-bg-elevated text-text-secondary"
                      >
                        {new Date(iso).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                        })}
                        {" UTC"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent runs */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle">
              <h2 className="text-[14px] font-semibold text-text-primary">Recent runs</h2>
              <p className="text-[11px] text-text-muted mt-0.5">Last 80 cron executions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-subtle text-[11px] font-medium text-text-muted uppercase tracking-wider">
                    <th className="px-6 py-3">Time (UTC)</th>
                    <th className="px-6 py-3">Job</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="text-[12px]">
                  {(data.runs ?? []).map((run, i) => (
                    <tr key={i} className="border-b border-border-subtle/50 hover:bg-bg-elevated/50">
                      <td className="px-6 py-3 font-mono text-text-secondary whitespace-nowrap">
                        {new Date(run.startedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          timeZone: "UTC",
                        })}
                      </td>
                      <td className="px-6 py-3 text-text-secondary">
                        {ENDPOINT_LABELS[run.endpoint as CronEndpoint] ?? run.endpoint}
                      </td>
                      <td className="px-6 py-3">
                        {run.status === "ok" && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 size={12} /> OK
                          </span>
                        )}
                        {run.status === "skipped" && (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <MinusCircle size={12} /> Skipped
                          </span>
                        )}
                        {run.status === "error" && (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <XCircle size={12} /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-text-muted">
                        {run.reason && <span>{run.reason}</span>}
                        {run.status === "ok" && run.processed != null && (
                          <span>Processed: {run.processed}</span>
                        )}
                        {run.status === "ok" && run.due != null && (
                          <span>Due: {run.due}</span>
                        )}
                        {run.error && <span className="text-red-500">{run.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!data.runs || data.runs.length === 0) && (
              <div className="px-6 py-8 text-center text-[12px] text-text-muted">
                No cron runs recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
