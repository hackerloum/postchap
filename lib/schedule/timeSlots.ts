/**
 * Allowed schedule times (30-minute slots) to avoid cron overload
 * and give users clear, flexible choices.
 */

const SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

export const ALLOWED_SCHEDULE_TIMES = SLOTS as readonly string[];

export function isAllowedScheduleTime(time: string): boolean {
  return ALLOWED_SCHEDULE_TIMES.includes(time);
}

/** Snap a time string (HH:mm or H:mm) to nearest allowed 30-min slot. */
export function snapToAllowedTime(time: string): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const slot = m < 30 ? 0 : 30;
  const hour = Math.min(23, Math.max(0, h));
  return `${String(hour).padStart(2, "0")}:${String(slot).padStart(2, "0")}`;
}

/** Format "08:00" -> "8:00 AM", "20:30" -> "8:30 PM" for display. */
export function formatTimeLabel(value: string): string {
  const [hStr, mStr] = value.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = mStr ?? "00";
  if (h === 0) return `12:${m} AM`;
  if (h === 12) return `12:${m} PM`;
  if (h < 12) return `${h}:${m} AM`;
  return `${h - 12}:${m} PM`;
}
