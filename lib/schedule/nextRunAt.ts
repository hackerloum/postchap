import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays } from "date-fns";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]; // 0=Sun, 1=Mon, ..., 6=Sat

/**
 * Get the next run time for a schedule.
 * Respects `activeDays` (array of 0–6 where 0=Sun). Defaults to every day.
 * Starts from `fromDate` (defaults to now). Scans up to 8 days to find the
 * next day that (a) is in activeDays and (b) the scheduled time is still in
 * the future.
 */
export function getNextRunAt(
  time: string,
  timezone: string,
  fromDate: Date = new Date(),
  activeDays?: number[]
): Date {
  const days = activeDays && activeDays.length > 0 ? activeDays : ALL_DAYS;
  const [hours = 0, minutes = 0] = time.split(":").map(Number);

  for (let i = 0; i <= 8; i++) {
    const candidate = new Date(fromDate);
    candidate.setDate(candidate.getDate() + i);

    const zoned = toZonedTime(candidate, timezone);
    const dayOfWeek = zoned.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    if (!days.includes(dayOfWeek)) continue;

    const y = zoned.getFullYear();
    const mo = zoned.getMonth();
    const d = zoned.getDate();
    const timeInZone = new Date(y, mo, d, hours, minutes, 0, 0);
    const runUtc = fromZonedTime(timeInZone, timezone);

    if (runUtc.getTime() > fromDate.getTime()) {
      return runUtc;
    }
  }

  // Fallback: start of the day after the 8-day window and try again
  const fallback = new Date(fromDate);
  fallback.setDate(fallback.getDate() + 9);
  fallback.setHours(0, 0, 0, 0);
  return getNextRunAt(time, timezone, fallback, activeDays);
}

/**
 * Get the next run that should be scheduled after a completed run.
 * Advances to the start of the next calendar day in the user's timezone, then
 * finds the first active-day occurrence of `time`.
 */
export function getNextRunAfter(
  previousRun: Date,
  time: string,
  timezone: string,
  activeDays?: number[]
): Date {
  const prevInZone = toZonedTime(previousRun, timezone);
  const y = prevInZone.getFullYear();
  const mo = prevInZone.getMonth();
  const d = prevInZone.getDate();
  // Start of the next calendar day in the user's timezone
  const nextDayLocal = new Date(y, mo, d, 0, 0, 0, 0);
  addDays(nextDayLocal, 1); // addDays is immutable-style in date-fns – use plain arithmetic
  const startOfNextDay = fromZonedTime(
    new Date(y, mo, d + 1, 0, 0, 0, 0),
    timezone
  );
  return getNextRunAt(time, timezone, startOfNextDay, activeDays);
}
