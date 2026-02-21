/**
 * Generates poster copy (headline, subheadline, body, CTA, hashtags) from brand kit.
 * Stub implementation — replace with OpenAI when ready.
 */

import type { BrandKit } from "@/types";
import { getBrandLocation } from "@/lib/ai/locationContext";

export interface GeneratedCopy {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export async function generateCopy(brandKit: BrandKit): Promise<GeneratedCopy> {
  const loc = getBrandLocation(brandKit);
  // When implementing OpenAI: use buildLocationContext(loc) in system/user message
  // and location-relevant hashtags for loc.country
  void loc;
  return {
    headline: "Your headline",
    subheadline: "Your subheadline",
    body: "Body text",
    cta: "Learn more",
    hashtags: ["#brand"],
  };
}
