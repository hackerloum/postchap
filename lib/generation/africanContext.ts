/**
 * African contextual injection for image prompts: local pattern labels and time-of-day
 * derived from brand location (and optional timezone).
 */

import type { BrandLocation } from "@/types/generation";

/** Map country/continent/city to a short "local pattern" label for cultural touch in prompts. */
export function getLocalPattern(brandLocation?: BrandLocation | null): string {
  if (!brandLocation) return "subtle geometric patterns";
  const country = (brandLocation.country ?? "").toLowerCase();
  const continent = (brandLocation.continent ?? "").toLowerCase();
  const city = (brandLocation.city ?? "").toLowerCase();

  if (/\b(kenya|nairobi|tanzania|dar es salaam|uganda|kampala)\b/i.test(country + city)) {
    return "East African geometric and textile-inspired textures";
  }
  if (/\b(nigeria|lagos|ghana|accra)\b/i.test(country + city)) {
    return "West African pattern influences in the shadows";
  }
  if (/\b(south africa|johannesburg|cape town)\b/i.test(country + city)) {
    return "Southern African design motifs";
  }
  if (/\b(egypt|morocco|north africa)\b/i.test(country + city)) {
    return "North African ornamental subtle textures";
  }
  if (/africa|african/i.test(continent)) {
    return "subtle African-inspired geometric textures";
  }
  return "subtle geometric patterns in the shadows";
}

/**
 * Return time-of-day label from current hour (UTC or optional timezone).
 * timezone: IANA string e.g. "Africa/Nairobi". If not set, uses server (UTC) hour.
 */
export function getTimeOfDay(timezone?: string | null): "morning" | "afternoon" | "evening" | "night" {
  let hour: number;
  try {
    if (timezone?.trim()) {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone });
      hour = parseInt(formatter.format(now), 10);
    } else {
      hour = new Date().getHours();
    }
  } catch {
    hour = new Date().getHours();
  }
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/** Short location string for prompts (city, country, continent). */
export function getLocationDescription(brandLocation?: BrandLocation | null): string {
  if (!brandLocation) return "the brand's market";
  const parts = [brandLocation.city, brandLocation.country, brandLocation.continent].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "the brand's market";
}
