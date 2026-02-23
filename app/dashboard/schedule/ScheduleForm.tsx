"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getClientIdToken } from "@/lib/auth-client";
import { getBrandKitsAction, type BrandKitItem } from "../brand-kits/actions";

const TIMEZONES = [
  { value: "Africa/Lagos", label: "Lagos (WAT)" },
  { value: "Africa/Nairobi", label: "Nairobi (EAT)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  { value: "Africa/Accra", label: "Accra (GMT)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
];

interface ScheduleData {
  enabled: boolean;
  time: string;
  timezone: string;
  brandKitId: string;
  notifyEmail: boolean;
  notifySms: boolean;
  nextRunAt: number | null;
  lastRunAt: number | null;
}

const DEFAULT_SCHEDULE: ScheduleData = {
  enabled: false,
  time: "08:00",
  timezone: "Africa/Lagos",
  brandKitId: "",
  notifyEmail: true,
  notifySms: false,
  nextRunAt: null,
  lastRunAt: null,
};

function formatUpcomingRun(ms: number, timezone: string): string {
  const d = new Date(ms);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(d);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const runDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((runDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return `Today ${hour}:${minute}`;
  if (diffDays === 1) return `Tomorrow ${hour}:${minute}`;
  return `${weekday} ${day} ${month} ${hour}:${minute}`;
}

export function ScheduleForm() {
  const [schedule, setSchedule] = useState<ScheduleData>(DEFAULT_SCHEDULE);
  const [kits, setKits] = useState<BrandKitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getClientIdToken();
      const [scheduleRes, kitsList] = await Promise.all([
        fetch("/api/schedule", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        getBrandKitsAction(token ?? undefined),
      ]);
      if (cancelled) return;
      setKits(kitsList);
      if (scheduleRes.ok) {
        const data = await scheduleRes.json();
        setSchedule({
          enabled: data.enabled ?? false,
          time: data.time ?? "08:00",
          timezone: data.timezone ?? "Africa/Lagos",
          brandKitId: data.brandKitId ?? "",
          notifyEmail: data.notifyEmail ?? true,
          notifySms: data.notifySms ?? false,
          nextRunAt: data.nextRunAt ?? null,
          lastRunAt: data.lastRunAt ?? null,
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (partial: Partial<ScheduleData>) => {
    setSchedule((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    if (schedule.enabled && !schedule.brandKitId) {
      toast.error("Select a brand kit when schedule is enabled");
      return;
    }
    setSaving(true);
    try {
      const token = await getClientIdToken();
      const res = await fetch("/api/schedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          enabled: schedule.enabled,
          time: schedule.time,
          timezone: schedule.timezone,
          brandKitId: schedule.brandKitId || undefined,
          notifyEmail: schedule.notifyEmail,
          notifySms: schedule.notifySms,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to save");
      }
      const data = await res.json();
      setSchedule((prev) => ({
        ...prev,
        nextRunAt: data.nextRunAt ?? null,
        lastRunAt: data.lastRunAt ?? null,
      }));
      toast.success("Schedule saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const upcomingRuns: { label: string }[] = [];
  if (schedule.enabled && schedule.nextRunAt && schedule.timezone) {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    for (let i = 0; i < 7; i++) {
      upcomingRuns.push({
        label: formatUpcomingRun(schedule.nextRunAt + i * ONE_DAY_MS, schedule.timezone),
      });
    }
  }

  const noKits = kits.length === 0;
  const saveDisabled = saving || (schedule.enabled && (!schedule.brandKitId || noKits));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {noKits && (
        <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4">
          <p className="font-mono text-xs text-text-primary">
            Create a brand kit first to schedule poster generation.{" "}
            <Link href="/onboarding" className="text-accent hover:underline">
              Create brand kit
            </Link>
          </p>
        </div>
      )}

      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-sm text-text-primary">Daily generation</h2>
            <p className="font-mono text-[11px] text-text-muted mt-1">Automatically create a new poster every day</p>
          </div>
          <button
            type="button"
            onClick={() => update({ enabled: !schedule.enabled })}
            disabled={noKits}
            className={`relative w-12 h-6 rounded-full transition-colors ${schedule.enabled ? "bg-accent" : "bg-bg-elevated border border-border-default"} disabled:opacity-50`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                schedule.enabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2">Time</label>
            <input
              type="time"
              value={schedule.time}
              onChange={(e) => update({ time: e.target.value })}
              disabled={!schedule.enabled}
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2">Timezone</label>
            <select
              value={schedule.timezone}
              onChange={(e) => update({ timezone: e.target.value })}
              disabled={!schedule.enabled}
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent disabled:opacity-50"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {schedule.enabled && (
          <div className="mt-4">
            <label className="block font-mono text-[11px] text-text-muted mb-2">Brand kit</label>
            <select
              value={schedule.brandKitId}
              onChange={(e) => update({ brandKitId: e.target.value })}
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            >
              <option value="">Select brand kit</option>
              {kits.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.brandName ?? k.id}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <h2 className="font-semibold text-sm text-text-primary mb-4">Notifications</h2>
        <p className="font-mono text-[11px] text-text-muted mb-4">Get alerted when your poster is ready</p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.notifyEmail}
              onChange={(e) => update({ notifyEmail: e.target.checked })}
              className="w-4 h-4 rounded border-border-default bg-bg-elevated text-accent focus:ring-accent"
            />
            <span className="font-mono text-sm text-text-primary">Email notification</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.notifySms}
              onChange={(e) => update({ notifySms: e.target.checked })}
              className="w-4 h-4 rounded border-border-default bg-bg-elevated text-accent focus:ring-accent"
            />
            <span className="font-mono text-sm text-text-primary">SMS notification</span>
          </label>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <h2 className="font-semibold text-sm text-text-primary mb-3">Upcoming</h2>
        {upcomingRuns.length > 0 ? (
          <div className="space-y-2">
            {upcomingRuns.map((run, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
              >
                <span className="font-mono text-xs text-text-secondary">{run.label}</span>
                <span className="font-mono text-[10px] text-text-muted">Scheduled</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-xs text-text-muted py-2">
            {schedule.enabled
              ? "Save your schedule to see upcoming runs."
              : "Enable daily generation and save to see upcoming runs."}
          </p>
        )}
        {schedule.lastRunAt != null && (
          <p className="font-mono text-[11px] text-text-muted mt-4 pt-4 border-t border-border-subtle">
            Last generated: {new Date(schedule.lastRunAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            {" · "}
            <Link href="/dashboard/posters" className="text-accent hover:underline">
              My Posters
            </Link>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saveDisabled}
        className="w-full flex items-center justify-center gap-2 bg-accent text-black font-semibold text-sm py-4 rounded-xl hover:bg-accent-dim transition-colors min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save schedule"}
      </button>
    </div>
  );
}
