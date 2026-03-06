# How Posters Are Generated and How the Logo Is Placed

This document describes the full poster generation pipeline and the mechanics of logo placement on the final output.

---

## Overview

Poster generation is a multi-stage pipeline:

1. **Copy** — GPT-4o writes headline, subheadline, body, CTA, and hashtags.
2. **Image prompt** — GPT-4o or Freepik image-to-prompt produces a detailed prompt.
3. **Background image** — Freepik (Seedream/Mystic) or Gemini (Nano Banana) generates the background.
4. **Composite** — Sharp overlays the logo, optional contact bar, and (when needed) full text.
5. **Upload** — Cloudinary stores the final image; Firestore records the poster.

---

## Generation Flow by Mode

### Mode 1 — AI Pick (Recommendation)

```
User selects recommendation
        ↓
generateCopy(brandKit, null, recommendation)
        ↓
generateImagePrompt(brandKit, copy, null, recommendation)
        ↓
[Optional] improvePrompt(imagePrompt)  ← if user checked "Enhance prompt"
        ↓
generateImage(prompt, aspectRatio, imageProviderId)
        ↓
compositePoster(background, brandKit, copy, imageHasText, width, height)
        ↓
uploadBufferToCloudinary → Firestore
```

- **Copy**: Uses recommendation theme, topic, suggested headline, CTA, hashtags.
- **Image prompt**: Uses recommendation `visualMood`, `description`, and copy.
- **imageHasText**: Usually `true` (Seedream/Gemini render text into the image).

### Mode 2 — Template

```
User selects Freepik template
        ↓
downloadResource(templateId) → template image URL
        ↓
imageToPrompt(templateImageUrl)  ← Freepik API extracts prompt from image
        ↓
Merge extracted prompt + brand colors, headline, CTA, brand name
        ↓
improvePrompt(mergedPrompt)  ← always runs
        ↓
generateImage → compositePoster → upload
```

- Reuses template layout/style, swaps in brand copy and colors.
- Template watermarks (e.g. A4, POSTER A4 TEMPLATE) are stripped.

### Mode 3 — Inspiration Image

```
User uploads or pastes image URL
        ↓
imageToPrompt(inspirationImageUrl)  ← Freepik API extracts prompt
        ↓
Merge extracted prompt + "use layout/style only, replace text"
        ↓
improvePrompt(mergedPrompt)  ← always runs
        ↓
generateImage → compositePoster → upload
```

- Uses the reference’s layout and style, not its text or logos.

---

## Image Provider Selection

The user chooses one of:

| Provider | Model(s) | Output |
|----------|----------|--------|
| Freepik Seedream | Seedream v4.5 (Mystic fallback) | Renders text in image |
| Freepik Mystic | Mystic (realism) | No text in image → full overlay |
| Gemini Nano Banana 2 | gemini-3.1-flash-image-preview | Renders text |
| Gemini Nano Banana Pro | gemini-3-pro-image-preview | Renders text |
| Gemini Nano Banana | gemini-2.5-flash-image | Renders text |

- **Seedream / Gemini** → `imageHasText: true` — background has text; composite adds only logo (+ optional contact bar).
- **Mystic only** → `imageHasText: false` — background has no text; composite adds full text overlay (headline, body, CTA, hashtags, contact).

---

## Platform Formats

Each platform maps to a Freepik aspect ratio and output size:

| Platform | Aspect | Freepik ID | Output Size |
|----------|--------|------------|-------------|
| Instagram Post (Square) | 1:1 | square_1_1 | 1080×1080 |
| Instagram Post (Portrait) | 4:5 | social_post_4_5 | 1080×1350 |
| Instagram Story / Reels / TikTok | 9:16 | social_story_9_16 | 1080×1920 |
| Facebook Post | 4:5 | social_post_4_5 | 1080×1350 |
| X (Twitter) | 3:2 | standard_3_2 | 1600×900 |
| LinkedIn | 16:9 | widescreen_16_9 | 1200×628 |
| YouTube Thumbnail | 16:9 | widescreen_16_9 | 1920×1080 |
| Pinterest Pin | 2:3 | portrait_2_3 | 1000×1500 |

The base layout is designed for 1080×1080; other sizes scale proportionally.

---

## Composite Logic (Sharp)

Composite runs in `lib/sharp/compositePoster.ts`:

1. Resize background to target width×height (`fit: "cover"`, `position: "top"`).
2. Overlay logo (if `brandKit.logoUrl`).
3. If `imageHasText` — add optional contact bar at bottom; composite and finish.
4. If not `imageHasText` — add full SVG overlay (headline, body, CTA, hashtags, contact); overlay logo on top; finish.

---

## Logo Placement

The system handles brand logos in two ways depending on provider and mode:

### Multi-Modal Reference (Gemini, and Seedream when logo is sent)

When the logo is sent to the AI as a visual reference:

1. **Visual Reference**: The brand logo is sent as an `inlineData` part (Base64) to the model.
2. **Identity Anchoring**: The AI is instructed to:
   - *"BRAND LOGO REFERENCE: Extract its core geometry and color values."*
   - *"Integrate it seamlessly into the final design as a subtle but authoritative signature."*
3. **Intelligent Composition**: The AI integrates the logo into the design’s composition (no fixed coordinate); placement respects the chosen design style. Sharp does not add a logo overlay when the AI has already integrated it (`logoHandledByAI: true`).

This is used for **Gemini** image generation and for the **editable layout** path when a logo is present (logo is passed so the background image can include it).

### Sharp Composite (Mystic, or when no logo is sent)

When the model does **not** receive the logo (e.g. Freepik Mystic, or no `logoUrl`), the prompt uses a **“top-left dead zone”** (≈250×120 px) that must be empty. The real logo is then composited by Sharp over that zone (badge + logo).

### Logo Badge Layout

1. **Position**: Flush top-left (`top: 0`, `left: 0`).
2. **Size** (1080×1080 base):
   - Logo: 140×140 px
   - Padding: 20 px horizontal, 16 px vertical
   - Badge: ~180×172 px (logo + padding)
3. **Scale**: For non-square formats, values scale with `scale = min(scaleX, scaleY)`.

### Badge Visual

- Dark semi-opaque background: `rgba(0,0,0,0.92)`.
- Square top-left corner (anchored to edge).
- Rounded bottom-right corner (20 px radius) for a soft cut.
- Extra dark rectangle at bottom-right to visually separate from busy backgrounds.

### Compositing Order

1. SVG badge (dark background).
2. Logo image, centered inside badge, with transparent background.

### Code Reference

```ts
// lib/sharp/compositePoster.ts
const LOGO_SIZE = Math.round(140 * scale);
const BADGE_PAD_X = Math.round(20 * scale);
const BADGE_PAD_Y = Math.round(16 * scale);
const BADGE_W = LOGO_SIZE + BADGE_PAD_X * 2;
const BADGE_H = LOGO_SIZE + BADGE_PAD_Y * 2;

// Badge SVG anchored top-left
compositeInputs.push({ input: badgeSvg, top: 0, left: 0, blend: "over" });
// Logo centered within badge
compositeInputs.push({
  input: logoResized,
  top: BADGE_PAD_Y,
  left: BADGE_PAD_X,
  blend: "over",
});
```

### When There Is No Logo

If `brandKit.logoUrl` is missing or the download fails, no logo overlay is added. The poster still includes text/contact bar as usual.

---

## Contact Bar (imageHasText mode)

When `imageHasText` is true and contact info exists:

- Phone number, contact location, website
- Rendered in a bar at the bottom (`top: H - 44` at 1080 base)
- Semi-transparent background (`opacity: 0.85`), secondary color
- Text in primary color, centered

---

## Full Text Overlay (Mystic / imageHasText: false)

When the background has no text, Sharp adds an SVG overlay with:

- Top bar gradient (brand name, dot)
- Lower gradient panel (≈y ≥ 620)
- Headline (1–2 lines), subheadline, body (2 lines)
- CTA button (accent fill, secondary text)
- Hashtags
- Contact line (if present)

All text uses the brand palette (primary, secondary, accent).

---

## Negative Constraints in Image Prompts

The image prompt includes strict negative constraints so the model does not render logos or clutter the top-left:

- “TOP-LEFT CORNER IS A DEAD ZONE: 250 px wide × 120 px tall — pure background only.”
- “Do NOT show any logo, wordmark, brand mark, emblem, icon, arrow, triangle, or decorative symbol anywhere.”
- “Do NOT render any brand name as text or graphic anywhere.”
- “No watermarks. No copyright symbols. No AI-generated logos or icons.”

These are appended after `improvePrompt` so they cannot be overridden.

---

## Output and Storage

1. Sharp composites to PNG (`quality: 95`, `compressionLevel: 6`).
2. Upload to Cloudinary: `artmaster/posters/{uid}/{posterId}`.
3. Firestore: `users/{uid}/posters` with `imageUrl`, `headline`, `subheadline`, `body`, `cta`, `hashtags`, `theme`, `topic`, `status: "generated"`.
