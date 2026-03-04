import { OCCASIONS, type Occasion } from "./data";

export interface UpcomingOccasion extends Occasion {
  daysUntil: number;
}

/**
 * Returns occasions that are within leadDays of today and relevant for the given country.
 * countryCode: e.g. "TZ", "KE", "NG" from user's brand location or profile.
 */
export function getUpcomingOccasions(
  countryCode?: string | null,
  maxResults = 5
): UpcomingOccasion[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const results: UpcomingOccasion[] = [];

  for (const occ of OCCASIONS) {
    if (occ.date < todayStr) continue;

    const occDate = new Date(occ.date + "T00:00:00Z");
    const daysUntil = Math.ceil((occDate.getTime() - today.getTime()) / 86400000);

    if (daysUntil > occ.leadDays) continue;

    const matchesCountry =
      !countryCode ||
      occ.countries.some(
        (c) =>
          c.toUpperCase() === (countryCode ?? "").toUpperCase() ||
          c === "Africa"
      );

    if (!matchesCountry) continue;

    results.push({ ...occ, daysUntil });
  }

  results.sort((a, b) => a.daysUntil - b.daysUntil);
  return results.slice(0, maxResults);
}
