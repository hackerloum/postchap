"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, CheckCircle, Loader2 } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import {
  ALLOWED_SCHEDULE_TIMES,
  formatTimeLabel,
  snapToAllowedTime,
} from "@/lib/schedule/timeSlots";
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

function getNextRuns(
  time: string,
  _timezone: string,
  count: number
): { dateLabel: string; timeLabel: string }[] {
  const runs: { dateLabel: string; timeLabel: string }[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i + 1);

    runs.push({
      dateLabel: d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      timeLabel: formatTimeLabel(time),
    });
  }

  return runs;
}

export function ScheduleForm() {
  const [schedule, setSchedule] = useState<ScheduleData>(DEFAULT_SCHEDULE);
  const [kits, setKits] = useState<BrandKitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        const rawTime = data.time ?? "08:00";
        const time = ALLOWED_SCHEDULE_TIMES.includes(rawTime)
          ? rawTime
          : snapToAllowedTime(rawTime);
        setSchedule({
          enabled: data.enabled ?? false,
          time,
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
    setSaved(false);
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
      setSaved(true);
      toast.success("Schedule saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const noKits = kits.length === 0;
  const saveDisabled =
    saving || (schedule.enabled && (!schedule.brandKitId || noKits));
  const timezoneLabel =
    TIMEZONES.find((z) => z.value === schedule.timezone)?.label ??
    schedule.timezone;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-[13px] text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5 mb-4"
        >
          ← Back to dashboard
        </Link>
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">
          Daily poster schedule
        </h1>
        <p className="text-[14px] text-text-muted mt-1.5 max-w-xl">
          Set time, timezone, and brand kit — we&apos;ll generate a poster every day at that time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — settings (2 cols): Daily generation, Notifications, Brand kit */}
        <div className="lg:col-span-2 space-y-4">
          {/* 1. Daily generation */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div>
                <p className="font-semibold text-[14px] text-text-primary">
                  Daily generation
                </p>
                <p className="text-[12px] text-text-muted mt-0.5">
                  Automatically create a new poster every day
                </p>
              </div>
              <button
                type="button"
                onClick={() => update({ enabled: !schedule.enabled })}
                disabled={noKits}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 disabled:opacity-50 ${
                  schedule.enabled
                    ? "bg-accent"
                    : "bg-bg-elevated border border-border-strong"
                }`}
                role="switch"
                aria-checked={schedule.enabled}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${
                    schedule.enabled ? "left-6 bg-black" : "left-1 bg-text-muted"
                  }`}
                />
              </button>
            </div>

            <div
              className={`transition-all duration-200 ${
                schedule.enabled ? "opacity-100" : "opacity-40 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-2">
                    Generation time
                  </label>
                  <div className="relative">
                    <select
                      value={schedule.time}
                      onChange={(e) => update({ time: e.target.value })}
                      className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary font-mono appearance-none outline-none hover:border-border-strong focus:border-accent transition-colors cursor-pointer min-h-[44px]"
                    >
                      {ALLOWED_SCHEDULE_TIMES.map((t) => (
                        <option key={t} value={t}>
                          {formatTimeLabel(t)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                  </div>
                  <p className="text-[12px] text-text-muted mt-1.5">
                    30-minute intervals
                  </p>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-2">
                    Timezone
                  </label>
                  <div className="relative">
                    <select
                      value={schedule.timezone}
                      onChange={(e) => update({ timezone: e.target.value })}
                      className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary font-mono appearance-none outline-none hover:border-border-strong focus:border-accent transition-colors cursor-pointer min-h-[44px]"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {schedule.enabled && schedule.time && (
                <div className="mx-5 mb-5 flex items-center gap-2 bg-accent/5 border border-accent/15 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                  <p className="font-mono text-[12px] text-text-secondary">
                    Next generation:{" "}
                    <span className="text-text-primary font-semibold">
                      Tomorrow at {formatTimeLabel(schedule.time)} (
                      {timezoneLabel})
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Notifications */}
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <div className="mb-4">
              <p className="font-semibold text-[14px] text-text-primary">
                Notifications
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                Get alerted when your poster is ready to review
              </p>
            </div>
            <div className="space-y-2">
              {[
                {
                  id: "email",
                  label: "Email notification",
                  sub: "Receive an email when poster is generated",
                  value: schedule.notifyEmail,
                  set: (v: boolean) => update({ notifyEmail: v }),
                },
                {
                  id: "sms",
                  label: "SMS notification",
                  sub: "Receive a text message when ready",
                  value: schedule.notifySms,
                  set: (v: boolean) => update({ notifySms: v }),
                },
              ].map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => item.set(!item.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && item.set(!item.value)
                  }
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                    item.value
                      ? "border-accent/30 bg-accent/3"
                      : "border-border-default bg-bg-elevated"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-[13px] text-text-primary">
                      {item.label}
                    </p>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      {item.sub}
                    </p>
                  </div>
                  <div
                    className={`relative w-9 h-5 rounded-full transition-all duration-200 shrink-0 ${
                      item.value
                        ? "bg-accent"
                        : "bg-bg-base border border-border-strong"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                        item.value ? "left-4 bg-black" : "left-0.5 bg-text-muted"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Brand kit */}
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <div className="mb-4">
              <p className="font-semibold text-[14px] text-text-primary">
                Brand kit
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                Which brand to use for daily poster generation
              </p>
            </div>
            {noKits ? (
              <p className="text-[12px] text-text-muted">
                Create a brand kit first to schedule generation.{" "}
                <Link href="/onboarding" className="text-accent hover:underline">
                  Create brand kit
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {kits.map((kit) => (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => update({ brandKitId: kit.id })}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                      schedule.brandKitId === kit.id
                        ? "border-accent bg-accent/5 ring-1 ring-accent/15"
                        : "border-border-default bg-bg-elevated hover:border-border-strong"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 overflow-hidden border border-white/10"
                      style={{
                        background: kit.primaryColor ?? "#333",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-text-primary">
                        {kit.brandName}
                      </p>
                      <p className="text-[12px] text-text-muted capitalize">
                        {kit.industry}
                        {kit.brandLocation?.country
                          ? ` · ${kit.brandLocation.country}`
                          : ""}
                      </p>
                    </div>
                    {schedule.brandKitId === kit.id && (
                      <CheckCircle size={15} className="text-accent shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — status + save (no duplicate of left-column settings) */}
        <div className="space-y-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <p className="font-semibold text-[14px] text-text-primary mb-1">
              Status
            </p>
            <p className="text-[12px] text-text-muted mb-4">
              {schedule.enabled ? "Your schedule is active" : "Daily generation is off"}
            </p>

            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                schedule.enabled
                  ? "bg-success/5 border-success/20"
                  : "bg-bg-elevated border-border-default"
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  schedule.enabled ? "bg-success animate-pulse" : "bg-text-muted"
                }`}
              />
              <div className="min-w-0">
                <p
                  className={`font-semibold text-[13px] ${
                    schedule.enabled ? "text-success" : "text-text-muted"
                  }`}
                >
                  {schedule.enabled ? "Active" : "Inactive"}
                </p>
                <p className="text-[12px] text-text-muted truncate">
                  {schedule.enabled
                    ? `${formatTimeLabel(schedule.time)} · ${timezoneLabel}${schedule.brandKitId ? ` · ${kits.find((k) => k.id === schedule.brandKitId)?.brandName ?? ""}` : ""}`
                    : "Turn on daily generation in the left panel"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className="w-full mt-5 bg-accent text-black font-semibold text-[13px] py-3 rounded-xl hover:bg-accent-dim transition-all duration-200 active:scale-[0.99] min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle size={14} />
                  Saved
                </>
              ) : (
                "Save schedule"
              )}
            </button>

            {saved && (
              <p className="text-[12px] text-success text-center mt-3">
                Saved
              </p>
            )}
          </div>

          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle">
              <p className="font-semibold text-[14px] text-text-primary">
                Upcoming runs
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                Next scheduled generations
              </p>
            </div>

            {!schedule.enabled ? (
              <div className="p-5 text-center">
                <p className="text-[12px] text-text-muted">
                  Turn on daily generation to see runs here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle/50">
                {getNextRuns(schedule.time, schedule.timezone, 5).map(
                  (run, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            i === 0 ? "bg-accent" : "bg-border-strong"
                          }`}
                        />
                        <span className="text-[12px] text-text-secondary">
                          {run.dateLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-text-muted">
                          {run.timeLabel}
                        </span>
                        {i === 0 && (
                          <span className="text-[10px] font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-1.5 py-0.5">
                            Next
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
