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

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]; // 0=Sun, 1=Mon, ..., 6=Sat

const DAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  0: "Sun",
};

// Display order: Mon–Sun
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const TIMEZONES = [
  // Africa
  { value: "Africa/Lagos", label: "Lagos / West Africa (WAT, UTC+1)" },
  { value: "Africa/Nairobi", label: "Nairobi / East Africa (EAT, UTC+3)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST, UTC+2)" },
  { value: "Africa/Accra", label: "Accra / Ghana (GMT, UTC+0)" },
  { value: "Africa/Cairo", label: "Cairo (EET, UTC+2)" },
  { value: "Africa/Casablanca", label: "Casablanca (WET, UTC+0/+1)" },
  { value: "Africa/Abidjan", label: "Abidjan / Dakar (GMT, UTC+0)" },
  { value: "Africa/Douala", label: "Douala / Cameroon (WAT, UTC+1)" },
  { value: "Africa/Kigali", label: "Kigali / Rwanda (CAT, UTC+2)" },
  { value: "Africa/Dar_es_Salaam", label: "Dar es Salaam / Tanzania (EAT, UTC+3)" },
  { value: "Africa/Addis_Ababa", label: "Addis Ababa / Ethiopia (EAT, UTC+3)" },
  { value: "Africa/Kampala", label: "Kampala / Uganda (EAT, UTC+3)" },
  { value: "Africa/Lusaka", label: "Lusaka / Zambia (CAT, UTC+2)" },
  { value: "Africa/Harare", label: "Harare / Zimbabwe (CAT, UTC+2)" },
  // Americas
  { value: "America/New_York", label: "New York / Toronto (ET, UTC-5)" },
  { value: "America/Chicago", label: "Chicago (CT, UTC-6)" },
  { value: "America/Denver", label: "Denver (MT, UTC-7)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT, UTC-8)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT, UTC-3)" },
  { value: "America/Bogota", label: "Bogotá (COT, UTC-5)" },
  { value: "America/Lima", label: "Lima (PET, UTC-5)" },
  { value: "America/Mexico_City", label: "Mexico City (CST, UTC-6)" },
  // Europe
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris / Berlin (CET, UTC+1)" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT, UTC+3)" },
  { value: "Europe/Moscow", label: "Moscow (MSK, UTC+3)" },
  // Middle East & Asia
  { value: "Asia/Riyadh", label: "Riyadh / Kuwait (AST, UTC+3)" },
  { value: "Asia/Dubai", label: "Dubai / Abu Dhabi (GST, UTC+4)" },
  { value: "Asia/Karachi", label: "Karachi (PKT, UTC+5)" },
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)" },
  { value: "Asia/Dhaka", label: "Dhaka (BST, UTC+6)" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT, UTC+7)" },
  { value: "Asia/Singapore", label: "Singapore / KL (SGT, UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST, UTC+9)" },
  { value: "Asia/Seoul", label: "Seoul (KST, UTC+9)" },
  // Pacific
  { value: "Australia/Sydney", label: "Sydney (AEST, UTC+10/+11)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST, UTC+12)" },
];

// ─── Timezone helpers ─────────────────────────────────────────────────────────

function getDetectedTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

function buildTimezoneList(detected: string | null): typeof TIMEZONES {
  if (!detected) return TIMEZONES;
  if (TIMEZONES.some((t) => t.value === detected)) return TIMEZONES;
  // Add detected timezone at the top if it's not already in the list
  return [{ value: detected, label: `${detected} (your timezone)` }, ...TIMEZONES];
}

// ─── Run-time helpers ─────────────────────────────────────────────────────────

function getDayOfWeekInTz(date: Date, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    }).formatToParts(date);
    const w = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(w);
  } catch {
    return date.getDay();
  }
}

function isTimePassedInTz(time: string, timezone: string): boolean {
  try {
    const [schH, schM] = time.split(":").map(Number);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const curH = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
    const curM = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0");
    return curH > schH || (curH === schH && curM >= schM);
  } catch {
    return false;
  }
}

function getNextRuns(
  time: string,
  timezone: string,
  count: number,
  activeDays: number[]
): { dateLabel: string; timeLabel: string }[] {
  const runs: { dateLabel: string; timeLabel: string }[] = [];
  const safeDays = activeDays.length > 0 ? activeDays : ALL_DAYS;
  const now = new Date();
  let daysForward = 0;

  while (runs.length < count && daysForward <= 14) {
    const d = new Date(now);
    d.setDate(d.getDate() + daysForward);

    const dayOfWeek = getDayOfWeekInTz(d, timezone);
    if (!safeDays.includes(dayOfWeek)) {
      daysForward++;
      continue;
    }

    if (daysForward === 0 && isTimePassedInTz(time, timezone)) {
      daysForward++;
      continue;
    }

    const dateLabel =
      daysForward === 0
        ? "Today"
        : daysForward === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              timeZone: timezone,
            });

    runs.push({ dateLabel, timeLabel: formatTimeLabel(time) });
    daysForward++;
  }

  return runs;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScheduleData {
  enabled: boolean;
  time: string;
  timezone: string;
  brandKitId: string;
  notifyEmail: boolean;
  notifySms: boolean;
  activeDays: number[];
  postToInstagramEnabled: boolean;
  postTime: string;
  postTimezone: string;
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
  activeDays: ALL_DAYS,
  postToInstagramEnabled: false,
  postTime: "08:00",
  postTimezone: "Africa/Lagos",
  nextRunAt: null,
  lastRunAt: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ScheduleForm() {
  const [schedule, setSchedule] = useState<ScheduleData>(DEFAULT_SCHEDULE);
  const [kits, setKits] = useState<BrandKitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tzList, setTzList] = useState(TIMEZONES);

  useEffect(() => {
    let cancelled = false;
    const detected = getDetectedTimezone();
    setTzList(buildTimezoneList(detected));

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

        // Auto-detect timezone only when the user hasn't saved a custom one yet
        const isDefaultTimezone =
          !data.enabled && data.nextRunAt == null;
        const timezone =
          isDefaultTimezone && detected
            ? detected
            : data.timezone ?? "Africa/Lagos";

        const rawPostTime = data.postTime ?? data.time ?? "08:00";
        const postTime = ALLOWED_SCHEDULE_TIMES.includes(rawPostTime) ? rawPostTime : snapToAllowedTime(rawPostTime);
        setSchedule({
          enabled: data.enabled ?? false,
          time,
          timezone,
          brandKitId: data.brandKitId ?? "",
          notifyEmail: data.notifyEmail ?? true,
          notifySms: data.notifySms ?? false,
          activeDays: Array.isArray(data.activeDays) ? data.activeDays : ALL_DAYS,
          postToInstagramEnabled: data.postToInstagramEnabled ?? false,
          postTime,
          postTimezone: data.postTimezone ?? data.timezone ?? timezone,
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

  const toggleDay = (day: number) => {
    setSaved(false);
    setSchedule((prev) => {
      const already = prev.activeDays.includes(day);
      if (already && prev.activeDays.length === 1) return prev; // must keep at least one
      const next = already
        ? prev.activeDays.filter((d) => d !== day)
        : [...prev.activeDays, day];
      return { ...prev, activeDays: next };
    });
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
          activeDays: schedule.activeDays,
          postToInstagramEnabled: schedule.postToInstagramEnabled,
          postTime: schedule.postTime,
          postTimezone: schedule.postTimezone,
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
    tzList.find((z) => z.value === schedule.timezone)?.label ?? schedule.timezone;

  const upcomingRuns = getNextRuns(
    schedule.time,
    schedule.timezone,
    5,
    schedule.activeDays
  );

  const nextRunLabel =
    upcomingRuns.length > 0
      ? `${upcomingRuns[0].dateLabel} at ${upcomingRuns[0].timeLabel}`
      : "No upcoming runs";

  const everyDay =
    schedule.activeDays.length === 7 ||
    ALL_DAYS.every((d) => schedule.activeDays.includes(d));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* 1. Daily generation */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div>
                <p className="font-semibold text-[14px] text-text-primary">
                  Scheduled generation
                </p>
                <p className="text-[12px] text-text-muted mt-0.5">
                  Automatically create a new poster on your chosen days
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
                {/* Time picker */}
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

                {/* Timezone picker */}
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
                      {tzList.map((tz) => (
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

              {/* Days selector */}
              <div className="px-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    Active days
                  </label>
                  <button
                    type="button"
                    onClick={() => update({ activeDays: everyDay ? [] : ALL_DAYS })}
                    className="text-[11px] text-accent hover:underline"
                  >
                    {everyDay ? "Clear all" : "Every day"}
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_ORDER.map((day) => {
                    const active = schedule.activeDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`w-10 h-10 rounded-xl text-[12px] font-semibold transition-all duration-150 border ${
                          active
                            ? "bg-accent text-black border-accent"
                            : "bg-bg-elevated text-text-muted border-border-default hover:border-border-strong"
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-text-muted mt-2">
                  {everyDay
                    ? "Runs every day"
                    : schedule.activeDays.length === 0
                      ? "Select at least one day"
                      : `Runs on ${DAY_ORDER.filter((d) => schedule.activeDays.includes(d))
                          .map((d) => DAY_LABELS[d])
                          .join(", ")}`}
                </p>
              </div>

              {/* Next run banner */}
              {schedule.enabled && schedule.time && (
                <div className="mx-5 mb-5 flex items-center gap-2 bg-accent/5 border border-accent/15 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                  <p className="font-mono text-[12px] text-text-secondary">
                    Next generation:{" "}
                    <span className="text-text-primary font-semibold">
                      {nextRunLabel} ({timezoneLabel})
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Auto-post to Instagram */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div>
                <p className="font-semibold text-[14px] text-text-primary">
                  Auto-post to Instagram
                </p>
                <p className="text-[12px] text-text-muted mt-0.5">
                  After each scheduled generation, post the poster to Instagram at a time you choose
                </p>
              </div>
              <button
                type="button"
                onClick={() => update({ postToInstagramEnabled: !schedule.postToInstagramEnabled })}
                disabled={!schedule.enabled}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 disabled:opacity-50 ${
                  schedule.postToInstagramEnabled
                    ? "bg-accent"
                    : "bg-bg-elevated border border-border-strong"
                }`}
                role="switch"
                aria-checked={schedule.postToInstagramEnabled}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${
                    schedule.postToInstagramEnabled ? "left-6 bg-black" : "left-1 bg-text-muted"
                  }`}
                />
              </button>
            </div>
            <div
              className={`transition-all duration-200 ${
                schedule.postToInstagramEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-2">
                    Post time
                  </label>
                  <div className="relative">
                    <select
                      value={schedule.postTime}
                      onChange={(e) => update({ postTime: e.target.value })}
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
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-2">
                    Timezone
                  </label>
                  <div className="relative">
                    <select
                      value={schedule.postTimezone}
                      onChange={(e) => update({ postTimezone: e.target.value })}
                      className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary font-mono appearance-none outline-none hover:border-border-strong focus:border-accent transition-colors cursor-pointer min-h-[44px]"
                    >
                      {tzList.map((tz) => (
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
              <p className="text-[11px] text-text-muted px-5 pb-5">
                Connect Instagram in Settings → Connected Accounts. The poster will be scheduled for this time after each daily generation.
              </p>
            </div>
          </div>

          {/* 3. Notifications */}
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
                  onKeyDown={(e) => e.key === "Enter" && item.set(!item.value)}
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

          {/* 4. Brand kit */}
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <div className="mb-4">
              <p className="font-semibold text-[14px] text-text-primary">
                Brand kit
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                Which brand to use for scheduled poster generation
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
                      style={{ background: kit.primaryColor ?? "#333" }}
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

        {/* RIGHT — status + save */}
        <div className="space-y-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5">
            <p className="font-semibold text-[14px] text-text-primary mb-1">
              Status
            </p>
            <p className="text-[12px] text-text-muted mb-4">
              {schedule.enabled
                ? "Your schedule is active"
                : "Scheduled generation is off"}
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
                    ? `${formatTimeLabel(schedule.time)} · ${timezoneLabel}${
                        schedule.brandKitId
                          ? ` · ${kits.find((k) => k.id === schedule.brandKitId)?.brandName ?? ""}`
                          : ""
                      }`
                    : "Turn on scheduled generation above"}
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

          {/* Upcoming runs */}
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
                  Turn on scheduled generation to see runs here.
                </p>
              </div>
            ) : upcomingRuns.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-[12px] text-text-muted">
                  No upcoming runs — select at least one active day.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle/50">
                {upcomingRuns.map((run, i) => (
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
