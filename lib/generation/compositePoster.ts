/**
 * Composites background image with text/logo overlay.
 * Minimal implementation: returns the background buffer as-is.
 * TODO: Use sharp to overlay headline, subheadline, logo per brand kit.
 */

import type { BrandKit } from "@/types";

export interface CopyData {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export async function compositePoster(
  backgroundBuffer: Buffer,
  _copy: CopyData,
  _brandKit: BrandKit
): Promise<Buffer> {
  // Placeholder: return background only. Add sharp-based text/logo overlay later.
  return backgroundBuffer;
}
