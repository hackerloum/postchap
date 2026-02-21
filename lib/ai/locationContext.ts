import type { BrandKit, BrandLocation } from "@/types";

/**
 * Normalize brand kit to always have a valid brandLocation (handles old flat `location` string).
 */
export function getBrandLocation(brandKit: BrandKit): BrandLocation {
  if (brandKit.brandLocation?.country) {
    return brandKit.brandLocation;
  }
  const oldLocation = (brandKit as unknown as { location?: string }).location as
    | string
    | undefined;
  return {
    country: oldLocation || "Unknown",
    countryCode: "XX",
    city: "",
    region: "Global",
    continent: "Global",
    timezone: "UTC",
    currency: "USD",
    languages: ["English"],
  };
}

/**
 * Build a location context string for AI prompts.
 */
export function buildLocationContext(
  brandLocation: BrandLocation | null | undefined
): string {
  if (!brandLocation || brandLocation.country === "Unknown") {
    return "Location: Global audience. Write in English.";
  }

  return `
BRAND LOCATION CONTEXT:
  Country: ${brandLocation.country} (${brandLocation.countryCode})
  City: ${brandLocation.city || "Not specified"}
  Continent: ${brandLocation.continent}
  Timezone: ${brandLocation.timezone}
  Local currency: ${brandLocation.currency}
  Local languages: ${brandLocation.languages.join(", ")}

IMPORTANT: All content must be culturally relevant and authentic
for ${brandLocation.country}. Consider:
  - Local holidays, events, and cultural moments in ${brandLocation.country}
  - Consumer behavior and values in ${brandLocation.continent}
  - Appropriate tone and references for ${brandLocation.country} audiences
  - Currency references should use ${brandLocation.currency}
  - ${
    brandLocation.languages.length > 1
      ? `Can incorporate phrases from: ${brandLocation.languages.join(", ")}`
      : `Primary language: ${brandLocation.languages[0]}`
  }
  `.trim();
}
