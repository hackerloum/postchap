/**
 * Generates poster copy (headline, subheadline, body, CTA, hashtags) from brand kit.
 * Stub implementation — replace with OpenAI when ready.
 */

import type { BrandKit } from "@/types";

export interface GeneratedCopy {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export async function generateCopy(_brandKit: BrandKit): Promise<GeneratedCopy> {
  // TODO: Use OpenAI to generate copy from brand kit
  return {
    headline: "Your headline",
    subheadline: "Your subheadline",
    body: "Body text",
    cta: "Learn more",
    hashtags: ["#brand"],
  };
}
