/**
 * Static list of occasions for smart alerts.
 * Maintained by ArtMaster; can later move to Firestore for admin editing.
 */

export interface Occasion {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  countries: string[]; // Country codes or names, e.g. "TZ", "KE", "NG", "Africa"
  category: string;
  leadDays: number;
  priority: "high" | "medium" | "low";
}

export const OCCASIONS: Occasion[] = [
  { id: "eid-al-fitr-2026", name: "Eid al-Fitr", date: "2026-03-30", countries: ["TZ", "KE", "NG", "GH", "UG", "RW", "EG", "ZA", "Africa"], category: "religious", leadDays: 7, priority: "high" },
  { id: "eid-al-adha-2026", name: "Eid al-Adha", date: "2026-06-06", countries: ["TZ", "KE", "NG", "GH", "UG", "RW", "EG", "ZA", "Africa"], category: "religious", leadDays: 7, priority: "high" },
  { id: "christmas-2025", name: "Christmas", date: "2025-12-25", countries: ["TZ", "KE", "NG", "GH", "ZA", "UG", "RW", "ZM", "ZW", "Africa"], category: "religious", leadDays: 7, priority: "high" },
  { id: "christmas-2026", name: "Christmas", date: "2026-12-25", countries: ["TZ", "KE", "NG", "GH", "ZA", "UG", "RW", "ZM", "ZW", "Africa"], category: "religious", leadDays: 7, priority: "high" },
  { id: "independence-tz", name: "Tanzania Independence Day", date: "2025-12-09", countries: ["TZ"], category: "national", leadDays: 5, priority: "medium" },
  { id: "independence-tz-2026", name: "Tanzania Independence Day", date: "2026-12-09", countries: ["TZ"], category: "national", leadDays: 5, priority: "medium" },
  { id: "independence-ke", name: "Kenya Jamhuri Day", date: "2025-12-12", countries: ["KE"], category: "national", leadDays: 5, priority: "medium" },
  { id: "independence-ke-2026", name: "Kenya Jamhuri Day", date: "2026-12-12", countries: ["KE"], category: "national", leadDays: 5, priority: "medium" },
  { id: "independence-ng", name: "Nigeria Independence Day", date: "2025-10-01", countries: ["NG"], category: "national", leadDays: 5, priority: "medium" },
  { id: "independence-ng-2026", name: "Nigeria Independence Day", date: "2026-10-01", countries: ["NG"], category: "national", leadDays: 5, priority: "medium" },
  { id: "ramadan-2026", name: "Ramadan", date: "2026-02-01", countries: ["TZ", "KE", "NG", "EG", "Africa"], category: "religious", leadDays: 14, priority: "high" },
  { id: "valentines-2026", name: "Valentine's Day", date: "2026-02-14", countries: ["Africa", "TZ", "KE", "NG", "GH", "ZA"], category: "celebration", leadDays: 5, priority: "medium" },
  { id: "mothers-2026", name: "Mother's Day", date: "2026-05-10", countries: ["Africa", "TZ", "KE", "NG"], category: "celebration", leadDays: 5, priority: "medium" },
  { id: "new-year-2026", name: "New Year", date: "2026-01-01", countries: ["Africa", "TZ", "KE", "NG", "GH", "ZA"], category: "celebration", leadDays: 5, priority: "high" },
];
