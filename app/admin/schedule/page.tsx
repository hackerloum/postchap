"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CalendarClock, CheckCircle, Loader2, Save } from "lucide-react";
import {
  ALLOWED_SCHEDULE_TIMES,
  formatTimeLabel,
  snapToAllowedTime,
} from "@/lib/schedule/timeSlots";

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
  nextRunAt: number | null;
  lastRunAt: number | null;
}

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleData>({
    enabled: false,
    time: "08:00",
    timezone: "Africa/Lagos",
    nextRunAt: null,
    lastRunAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/schedule", { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((d) => {
        if (!d) return;
        const rawTime = d.time ?? "08:00";
        const time = ALLOWED_SCHEDULE_TIMES.includes(rawTime) ? rawTime : snapToAllowedTime(rawTime);
        setSchedule({ ...d, time });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          enabled: schedule.enabled,
          time: schedule.time,
          timezone: schedule.timezone,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const d = await res.json();
      setSchedule((prev) => ({ ...prev, nextRunAt: d.nextRunAt ?? null }));
      toast.success(schedule.enabled ? "Schedule saved!" : "Schedule disabled.");
    } catch {
      toast.error("Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={18} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">Schedule</h1>
        <p className="font-mono text-[12px] text-text-muted mt-1">
          Auto-generate and post an ArtMaster poster daily
        </p>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-2xl p-6 space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[14px] text-text-primary">Daily auto-post</p>
            <p className="font-mono text-[11px] text-text-muted mt-0.5">
              Generate and post a poster to ArtMaster&apos;s Instagram every day
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSchedule((p) => ({ ...p, enabled: !p.enabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              schedule.enabled ? "bg-accent" : "bg-bg-elevated border border-border-default"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                schedule.enabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {schedule.enabled && (
          <>
            {/* Time picker */}
            <div>
              <label className="block font-mono text-[11px] text-text-muted mb-2 uppercase tracking-wide">
                Post time
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {ALLOWED_SCHEDULE_TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSchedule((p) => ({ ...p, time: t }))}
                    className={`px-2 py-2 rounded-lg border text-[12px] font-mono transition-colors ${
                      schedule.time === t
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border-default text-text-secondary hover:border-border-strong"
                    }`}
                  >
                    {formatTimeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block font-mono text-[11px] text-text-muted mb-2 uppercase tracking-wide">
                Timezone
              </label>
              <select
                value={schedule.timezone}
                onChange={(e) => setSchedule((p) => ({ ...p, timezone: e.target.value }))}
                className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-accent"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Next run info */}
            {schedule.nextRunAt && (
              <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-xl p-3">
                <CheckCircle size={13} className="text-accent shrink-0" />
                <p className="font-mono text-[11px] text-text-muted">
                  Next post:{" "}
                  <span className="text-text-secondary">
                    {new Date(schedule.nextRunAt).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>
            )}
          </>
        )}

        {schedule.lastRunAt && (
          <p className="font-mono text-[11px] text-text-muted">
            Last run:{" "}
            {new Date(schedule.lastRunAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-accent text-black font-semibold text-[14px] py-3 rounded-xl hover:bg-accent-dim transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Schedule
        </button>
      </div>

      <div className="mt-6 bg-bg-surface border border-border-subtle rounded-xl p-4">
        <div className="flex items-start gap-2.5">
          <CalendarClock size={13} className="text-text-muted mt-0.5 shrink-0" />
          <p className="font-mono text-[11px] text-text-muted leading-relaxed">
            The cron job runs every hour and checks for any scheduled posts due. Make sure your
            ArtMaster brand kit is configured and Instagram is connected before enabling.
          </p>
        </div>
      </div>
    </div>
  );
}
