import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays } from "date-fns";

/**
 * Get the next run time for a daily schedule: next occurrence of `time` (HH:mm) in `timezone` (IANA).
 * If that time today has already passed, returns tomorrow at the same time.
 */
export function getNextRunAt(time: string, timezone: string, fromDate: Date = new Date()): Date {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const nowInZone = toZonedTime(fromDate, timezone);
  const y = nowInZone.getFullYear();
  const m = nowInZone.getMonth();
  const d = nowInZone.getDate();
  const todayAtTime = new Date(y, m, d, hours, minutes, 0, 0);
  let runUtc = fromZonedTime(todayAtTime, timezone);
  if (runUtc.getTime() <= fromDate.getTime()) {
    const tomorrowAtTime = addDays(todayAtTime, 1);
    runUtc = fromZonedTime(tomorrowAtTime, timezone);
  }
  return runUtc;
}

/**
 * Get the next run after a given run (e.g. "next day same time").
 */
export function getNextRunAfter(previousRun: Date, time: string, timezone: string): Date {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const prevInZone = toZonedTime(previousRun, timezone);
  const y = prevInZone.getFullYear();
  const m = prevInZone.getMonth();
  const d = prevInZone.getDate();
  const sameDayAtTime = new Date(y, m, d, hours, minutes, 0, 0);
  const nextDayAtTime = addDays(sameDayAtTime, 1);
  return fromZonedTime(nextDayAtTime, timezone);
}
