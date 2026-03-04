/**
 * Provider-specific negative constraints for image generation prompts.
 *
 * Rules:
 *  - Gemini or Seedream WITH logo reference → logo guidance constraints
 *    (don't redraw logo, place top-left, use reference exactly)
 *  - Mystic or any provider WITHOUT logo → dead-zone constraints
 *    (keep top-left empty for Sharp logo badge composite)
 */

export function getNegativeConstraints(provider: string, hasLogo: boolean, brandName?: string): string {
  const isMystic = provider === "freepik:mystic";
  const isSeedream = provider === "freepik:seedream";
  const isGemini = provider.startsWith("gemini:");

  // Mystic never receives a logo reference — always dead zone
  if (isMystic) {
    return `STRICT NEGATIVE CONSTRAINTS:
- TOP-LEFT CORNER IS A DEAD ZONE: 250px wide × 120px tall — pure background only
- Do NOT render any logo, wordmark, brand mark, or symbol anywhere
- Do NOT render the brand name as text anywhere
- No watermarks. No copyright symbols.`;
  }

  const brandNameRule = brandName
    ? `\n- CRITICAL: The brand name "${brandName}" MUST NOT appear as standalone text anywhere in the image. The logo IS the brand identity.`
    : "";

  // Seedream or Gemini WITH logo reference — different instructions
  if ((isSeedream || isGemini) && hasLogo) {
    const bottomRule = isGemini
      ? `
- BOTTOM AREA: Do NOT draw a large standalone rectangle, box, or colored panel for the CTA. Render CTA as integrated styled text. Background must bleed to all edges.`
      : "";
    return `NEGATIVE CONSTRAINTS:
- Do NOT redraw or recreate the logo — use the reference exactly as provided
- Do NOT add glow, outline, shadow, or effects to the logo
- Do NOT place the logo anywhere except top-left
- Do NOT render brand name as separate text anywhere — the logo already represents the brand${brandNameRule}
- No watermarks. No copyright symbols. No AI artifacts.
- Only these text elements allowed: headline, subheadline, CTA phrase${bottomRule}`;
  }

  // Seedream or Gemini WITHOUT logo — dead zone
  const bottomRule = isGemini
    ? `
- BOTTOM AREA: Do NOT draw a large standalone rectangle, box, or colored panel for the CTA. Render CTA as integrated styled text. Background must bleed to all edges.`
    : "";
  return `STRICT NEGATIVE CONSTRAINTS:
- TOP-LEFT CORNER IS A DEAD ZONE: 250px wide × 120px tall — pure background only
- Do NOT render any logo, wordmark, brand mark, or symbol
- Do NOT render the brand name as text${brandNameRule}
- No watermarks. No copyright symbols.${bottomRule}`;
}
