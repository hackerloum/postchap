/**
 * generateLayout — GPT-4o produces a full JSON layout spec for a poster.
 *
 * The spec separates the background image (no text) from every text / logo /
 * shape element, which the Fabric.js editor renders on the frontend.
 */

import OpenAI from "openai";
import type { BrandKit } from "@/types/generation";
import type {
  LayoutBrief,
  LayoutGptOutput,
  PosterLayout,
  PosterElement,
  TextElement,
  LogoElement,
  ShapeElement,
} from "@/lib/generation/layoutTypes";
import type { PlatformFormat } from "@/lib/generation/platformFormats";

// ---------------------------------------------------------------------------
// Background-only instruction — appended to the image prompt so the image
// model never renders text, logos, or UI elements into the background.
// ---------------------------------------------------------------------------

export const BACKGROUND_ONLY_INSTRUCTION = `
CRITICAL: Do NOT include ANY text, words, letters, numbers, typography, brand name,
logo, or written content anywhere in this image.
The image is a BACKGROUND ONLY — all copy and logos are composited on top as
separate layers by the editor.
Leave visual breathing room and clear areas where text will be placed.
Full-bleed background only, edge to edge. No footer strips, no text panels.
`.trim();

// ---------------------------------------------------------------------------
// GPT system prompt
// ---------------------------------------------------------------------------

const LAYOUT_SYSTEM_PROMPT = `
You are an expert poster layout designer specialising in social media marketing.

Given a brand kit and content brief, you output a JSON layout spec that:
1. Produces a background image prompt (no text, no logos — visuals only).
2. Positions every editable element (text, logo, shapes) using % coordinates.

RULES:
- backgroundPrompt: a scene description for an AI image model — no text, no logos, no UI.
  The model will add copy on top. Describe lighting, mood, subject, colour palette, style.
- Coordinates are percentages (0–100) of poster width/height.
- Safe zone: 5% margin from all edges — no element x < 5 or x+width > 95 (same for y).
- Logo is always top-left. Use x: 1, y: 1, width: 20 (% of poster width).
- Headline: large, dominant — 36–72px font size. Typically top or bottom third.
- Subheadline: smaller (18–28px) near headline.
- CTA: smallest text or badge style (14–18px), bottom area.
- Hashtags: tiny (10–12px), bottom edge if included.
- Dark semi-transparent shape overlays ("type": "shape") improve text legibility over busy backgrounds.
- All zIndex values must be unique integers. Background = 0 (implicit). Shapes = 1–9. Text = 10–49. Logo = 50.
- locked: true for logo; false for all text and shape elements.
- Use colour names from the brand palette for text colours (primaryColor, secondaryColor, accentColor).
  If the background is dark, use light text. If light, use dark text.
- fontFamily must be one of: "Syne", "DM Sans", "Playfair Display", "Space Grotesk", "Inter", "Bebas Neue", "Oswald", "Montserrat".

OUTPUT: Valid JSON only. No explanation. No markdown fences.
Schema: { "backgroundPrompt": "...", "backgroundStyle": "dark|light|vibrant|minimal", "elements": [...] }
`.trim();

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export async function generateLayout(
  brief: LayoutBrief,
  brandKit: BrandKit,
  format: PlatformFormat
): Promise<LayoutGptOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI key not configured");
  const openai = new OpenAI({ apiKey });

  const country = brandKit.brandLocation?.country ?? "";
  const continent = brandKit.brandLocation?.continent ?? "";
  const location = [country, continent].filter(Boolean).join(", ");

  const userMessage = `
BRAND KIT:
  Name: ${brandKit.brandName ?? ""}
  Industry: ${brandKit.industry ?? ""}
  Tone: ${brandKit.tone ?? ""}
  Primary color:   ${brandKit.primaryColor ?? "#E8FF47"}
  Secondary color: ${brandKit.secondaryColor ?? "#111111"}
  Accent color:    ${brandKit.accentColor ?? "#FFFFFF"}
  Has logo: ${brandKit.logoUrl ? "yes" : "no"}
  Location: ${location || "unspecified"}

CONTENT:
  Headline:    "${brief.headline}"
  Subheadline: "${brief.subheadline}"
  CTA:         "${brief.cta}"
  Hashtags:    ${JSON.stringify(brief.hashtags)}
  Visual mood: ${brief.visualMood ?? "professional"}
  Design style: ${brief.designStyle ?? "modern"}

POSTER DIMENSIONS: ${format.width}×${format.height}px
ASPECT RATIO: ${format.freepikAspectRatio}

Generate the full layout JSON now.
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: LAYOUT_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const raw = response.choices[0].message.content ?? "{}";
  let parsed: LayoutGptOutput;
  try {
    parsed = JSON.parse(raw) as LayoutGptOutput;
  } catch {
    console.error("[generateLayout] JSON parse failed:", raw.slice(0, 300));
    throw new Error("Layout generation returned invalid JSON");
  }

  if (!parsed.backgroundPrompt || typeof parsed.backgroundPrompt !== "string") {
    throw new Error("Layout generation missing backgroundPrompt");
  }

  // Ensure elements is an array
  if (!Array.isArray(parsed.elements)) {
    parsed.elements = buildFallbackElements(brief, brandKit);
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Build a complete PosterLayout from the GPT output + brand kit + dimensions.
// Injects the logo element (GPT is told to include a logo placeholder, but we
// override src and position to ensure accuracy).
// ---------------------------------------------------------------------------

export function buildPosterLayout(
  gptOutput: LayoutGptOutput,
  backgroundImageUrl: string,
  brandKit: BrandKit,
  format: PlatformFormat
): PosterLayout {
  const elements: PosterElement[] = [...gptOutput.elements];

  // Remove any GPT-generated logo element — we inject a canonical one below.
  const withoutLogo: PosterElement[] = elements.filter((e) => e.type !== "logo");

  // Inject real logo element from brand kit
  if (brandKit.logoUrl) {
    const logoEl: LogoElement = {
      id: "logo",
      type: "logo",
      src: brandKit.logoUrl,
      x: 1,
      y: 1,
      width: 20,
      height: 12,
      opacity: 1,
      locked: true,
      zIndex: 50,
    };
    withoutLogo.push(logoEl);
  }

  return {
    backgroundImageUrl,
    backgroundDominantColor: brandKit.primaryColor ?? "#1a1a2e",
    width: format.width,
    height: format.height,
    elements: withoutLogo,
  };
}

// ---------------------------------------------------------------------------
// Fallback elements when GPT returns empty/invalid array
// ---------------------------------------------------------------------------

function buildFallbackElements(brief: LayoutBrief, brandKit: BrandKit): PosterElement[] {
  const textColor =
    isLight(brandKit.primaryColor ?? "#E8FF47") ? "#111111" : "#FFFFFF";
  const accentColor = brandKit.accentColor ?? "#E8FF47";

  const els: PosterElement[] = [
    // Dark overlay for readability
    {
      id: "overlay",
      type: "shape",
      shape: "rectangle",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: "#000000",
      opacity: 0.4,
      zIndex: 1,
      locked: false,
    } as ShapeElement,
    {
      id: "headline",
      type: "text",
      content: brief.headline,
      x: 8,
      y: 30,
      width: 84,
      fontSize: 56,
      fontFamily: "Syne",
      fontWeight: 700,
      color: textColor,
      textAlign: "center",
      lineHeight: 1.15,
      letterSpacing: 0.02,
      opacity: 1,
      locked: false,
      zIndex: 10,
    } as TextElement,
    {
      id: "subheadline",
      type: "text",
      content: brief.subheadline,
      x: 8,
      y: 55,
      width: 84,
      fontSize: 24,
      fontFamily: "DM Sans",
      fontWeight: 400,
      color: textColor,
      textAlign: "center",
      lineHeight: 1.3,
      letterSpacing: 0,
      opacity: 0.9,
      locked: false,
      zIndex: 11,
    } as TextElement,
    {
      id: "cta",
      type: "text",
      content: brief.cta,
      x: 25,
      y: 78,
      width: 50,
      fontSize: 18,
      fontFamily: "DM Sans",
      fontWeight: 700,
      color: "#111111",
      textAlign: "center",
      lineHeight: 1.2,
      letterSpacing: 0.05,
      backgroundColor: accentColor,
      backgroundPadding: 12,
      borderRadius: 8,
      opacity: 1,
      locked: false,
      zIndex: 12,
    } as TextElement,
  ];

  if (brief.hashtags.length > 0) {
    els.push({
      id: "hashtags",
      type: "text",
      content: brief.hashtags.slice(0, 5).join("  "),
      x: 5,
      y: 92,
      width: 90,
      fontSize: 11,
      fontFamily: "DM Sans",
      fontWeight: 400,
      color: textColor,
      textAlign: "center",
      lineHeight: 1.2,
      letterSpacing: 0.03,
      opacity: 0.7,
      locked: false,
      zIndex: 13,
    } as TextElement);
  }

  return els;
}

function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
