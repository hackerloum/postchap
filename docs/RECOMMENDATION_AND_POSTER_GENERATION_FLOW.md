# Recommendation & Poster Generation Flow

This document describes the end-to-end flow: how **OpenAI** produces recommendations, how those recommendations are turned into copy and image prompts, and how **Freepik** and **Gemini** receive that prompt to generate the poster background.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  1. OPENAI (GPT-4o) — Recommendations                                            │
│     Brand kit + context → 6 poster concepts (theme, headline, visualMood, …)     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ User selects 1 recommendation
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  2. OPENAI (GPT-4o) — Copy                                                        │
│     Brand kit + selected recommendation → headline, subheadline, CTA, hashtags   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  3. OPENAI (GPT-4o) — Image Prompt                                                │
│     Brand kit + copy + recommendation.visualMood → detailed image prompt         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ (optional) Freepik Improve Prompt API
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  4. IMAGE PROVIDER (Freepik or Gemini)                                            │
│     Same prompt + aspect ratio + optional logo → background image                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  5. SHARP — Composite                                                             │
│     Background + logo + text + CTA bar → final poster → Cloudinary + Firestore    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. How OpenAI Gives Recommendations

### Entry points

| Flow        | API / Code                                                                 | Model / temp      |
|------------|-----------------------------------------------------------------------------|-------------------|
| User       | `POST /api/recommendations` → `getRecommendationsForBrandKit()`             | gpt-4o, temp 1.0  |
| Admin      | `POST /api/admin/recommendations`                                           | gpt-4o, temp 1.15 |
| Studio     | `POST /api/studio/recommendations` → `generateStudioRecommendationsFromContext()` | gpt-4o, temp 0.9  |

### What happens

1. **Input**
   - **User/Admin:** Brand kit from Firestore (name, industry, tagline, tone, location, date, etc.).
   - **Studio:** Brand kit context from Studio DB (`brandName`, `industry`, `tone`, `language`, `targetAudience`, `brandLocation`).

2. **System prompt**
   - Built by `buildRecommendationSystemPrompt()` (user/admin) or `buildStudioRecommendationSystemPrompt()` (Studio).
   - GPT-4o is positioned as a creative director / brand strategist.
   - Rules include: local relevance, date/day, no generic tropes, distinct visual categories per slot (e.g. typography, emotion, luxury, abstract).

3. **User message**
   - e.g. `"Generate exactly 6 poster concepts for {brandName}. Return raw JSON array only."`

4. **Output**
   - Raw JSON array of **6 recommendation objects**. Parsed and returned to the client.

### Recommendation schema (from OpenAI)

```json
{
  "id": "unique_string",
  "theme": "Short theme (2–4 words)",
  "topic": "Specific topic sentence",
  "description": "What the poster shows/says. 2–3 sentences.",
  "suggestedHeadline": "Ready-to-use headline (max 6–8 words)",
  "suggestedCta": "Call to action (max 4–5 words)",
  "visualMood": "Art direction: lighting, composition, palette, style. 1–2 sentences.",
  "urgency": "high | medium | low",
  "reason": "Why relevant TODAY. 1 sentence.",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "category": "promotion | occasion | engagement | brand | product | seasonal"
}
```

- **`visualMood`** is the main bridge to the image: it drives the image-prompt stage and thus what Freepik/Gemini draw.

---

## 2. How the Recommendation Flows Into Copy and Image Prompt

The **selected recommendation** is not sent to Freepik or Gemini directly. It is used in two OpenAI steps first.

### Step A — Copy (OpenAI)

- **Function:** `generateCopy()` in `lib/generation/generateCopy.ts`.
- **Input:** Brand kit + selected recommendation (and optional product/platform/language).
- **Output:** `CopyData`: `headline`, `subheadline`, `body`, `cta`, `hashtags`.
- Copy is tailored to the recommendation’s theme, suggested headline, CTA, and hashtags.

### Step B — Image prompt (OpenAI)

- **Function:** `generateImagePrompt()` in `lib/generation/generateImagePrompt.ts`.
- **Input:** Brand kit + **copy** + **recommendation** (theme, topic, description, **visualMood**), platform format, language.
- **Output:** A single natural-language **image prompt** (Seedream/Gemini style).
- The prompt encodes:
  - Layout, text placement, colours (by name, not hex), composition, mood, lighting.
  - **recommendation.visualMood** is central to the art direction.
  - Logo-only / negative constraints (e.g. no logo in image, dead zone top-left) are part of the system prompt; extra negative constraints are appended later in the pipeline.

So: **OpenAI recommendation → OpenAI copy → OpenAI image prompt**. That image prompt is what Freepik and Gemini see.

---

## 3. Optional: Freepik Improve Prompt (Enhancement Only)

- **When:** After `generateImagePrompt()`, if `useImprovePrompt` is true or env `USE_FREEPIK_IMPROVE_PROMPT=true`.
- **What:** `improvePrompt()` in `lib/freepik/improvePrompt.ts` calls Freepik’s **Improve Prompt API** (`/v1/ai/improve-prompt`).
- **Role:** Enhances the text prompt (lighting, composition, style). It does **not** generate an image; it only returns an improved **string**.
- **Flow:** `imagePrompt` (from OpenAI) → Freepik Improve Prompt API → improved `imagePrompt` → same prompt is then passed to the image provider (Freepik Seedream/Mystic or Gemini).

So Freepik here only **refines the recommendation-derived prompt**; it does not replace OpenAI for recommendations.

---

## 4. How Freepik and Gemini Receive the Recommendation (Via the Same Prompt)

The **same final image prompt** (after optional Improve Prompt and negative constraints) is passed to the **image provider** chosen by `imageProviderId`. There is no separate “recommendation” object sent to Freepik or Gemini — only this single text prompt (and optional images).

### Provider selection

- **Router:** `lib/generation/imageProvider.ts` → `generateImage(prompt, freepikAspectRatio, imageProviderId, brandKit)`.
- **Default:** `freepik:seedream` if no valid provider.
- **Options:** e.g. `freepik:seedream`, `freepik:mystic`, `gemini:2.5-flash`, etc. (see `lib/image-models`).

### Freepik path

1. **freepik:seedream (primary)**
   - **API:** Freepik Seedream v4.5 (`/v1/ai/text-to-image/seedream-v4-5`).
   - **Input:** Same `prompt`, `aspect_ratio`, optional `reference_image` (logo or sample poster as base64) and `reference_weight`.
   - **Flow:** Submit task → poll for completion → download image URL → return buffer.
   - **Logo:** If `brandKit.logoUrl` is set, logo is sent as `reference_image` so Seedream can integrate it; then `logoHandledByAI: true`.

2. **freepik:mystic (fallback or when chosen)**
   - **API:** Freepik Mystic (`/v1/ai/mystic`).
   - **Input:** Same `prompt`, `aspect_ratio`, `negative_prompt`; **no** `reference_image`.
   - **Logo:** Mystic does not get the logo; Sharp composites the logo later (`logoHandledByAI: false`).

So: **recommendation** → (OpenAI) → **image prompt** → (optional Freepik improve) → **same prompt** → Freepik Seedream or Mystic. Freepik never sees the recommendation JSON, only the prompt that was built from it.

### Gemini path

1. **Router:** If `provider.provider === "gemini"`, `imageProvider.ts` uses `lib/gemini/nanoBanana.ts`.
2. **Prompt shaping:** If a brand kit is provided, `buildGeminiPromptWithLogo(prompt, brandKit)` appends:
   - Logo integration (or “no logo” top-left dead zone),
   - Optional inspiration layout note,
   - CTA instruction (typography, not a big box),
   - Brand colors.
3. **Negative constraints:** Provider-specific negative constraints (e.g. no logos, no watermarks, dead zone) are appended in `imageProvider.ts` before calling Gemini.
4. **Input to Gemini:** This **final prompt string** + optional **images** (logo, inspiration image, product image) as inline base64.
5. **Models:** e.g. `gemini-2.5-flash-image`, `gemini-2.0-flash-image` (cascade on quota). Aspect ratio is mapped from Freepik format (e.g. `square_1_1` → `1:1`).
6. **Output:** Buffer, `imageHasText`, `logoHandledByAI`, `addCTAFromSharp` (Sharp draws CTA when using Gemini).

So: **recommendation** → (OpenAI) → **image prompt** → (optional Freepik improve) → **same prompt + Gemini-specific suffix + negative constraints** → Gemini. Gemini also never sees the recommendation object, only the prompt (and optional images).

---

## 5. How Posters Are Generated (End-to-End)

### AI recommendation mode (user selects one of the 6)

```
User selects recommendation
        ↓
generateCopy(brandKit, null, recommendation, …)
        ↓
generateImagePrompt(brandKit, copy, null, recommendation, platformFormatId, language)
        ↓
[Optional] improvePrompt(imagePrompt)  ← Freepik Improve Prompt API
        ↓
Negative constraints appended
        ↓
generateImage(imagePrompt, aspectRatio, imageProviderId, brandKit)
        ├── Freepik Seedream (optional logo ref) → or Mystic fallback
        └── Gemini Nano Banana (optional logo + inspiration/product as images)
        ↓
compositePoster(backgroundBuffer, brandKit, copy, imageHasText, logoHandledByAI, …)
        ↓
uploadBufferToCloudinary → Firestore poster doc
```

### Template mode (no recommendation)

```
User selects Freepik template
        ↓
downloadResource(templateId) → template image URL
        ↓
imageToPrompt(templateImageUrl)  ← Freepik API: image → text prompt
        ↓
Merge extracted prompt + brand colors, headline, CTA, brand name
        ↓
improvePrompt(mergedPrompt)  ← always
        ↓
generateImage(…) → compositePoster → upload
```

### Inspiration image mode (no recommendation)

```
User provides inspiration image URL
        ↓
imageToPrompt(inspirationImageUrl)  ← Freepik API
        ↓
Merge with brand/copy customizations → improvePrompt
        ↓
generateImage(…) → compositePoster → upload
```

---

## Summary Table

| Stage              | Who          | Input                                      | Output / Role |
|--------------------|-------------|--------------------------------------------|----------------|
| Recommendations    | **OpenAI**  | Brand kit, context, date                   | 6 concepts (theme, visualMood, headline, CTA, …) |
| Copy               | **OpenAI**  | Brand kit + selected recommendation        | headline, subheadline, body, cta, hashtags |
| Image prompt       | **OpenAI**  | Brand kit + copy + recommendation          | One natural-language image prompt |
| Improve prompt     | **Freepik** | That image prompt (text only)              | Enhanced text prompt (no image) |
| Image generation   | **Freepik** or **Gemini** | Same final prompt + aspect + optional images | Background image buffer |
| Composite & upload | **Sharp** + Cloudinary | Background + brand kit + copy            | Final poster URL, Firestore |

So: **OpenAI** owns the recommendation and the text that describes the poster; **Freepik** and **Gemini** only receive the **same recommendation-derived prompt** (and optional images) and produce the poster background; **Freepik** can also optionally **improve** that prompt text before it is sent to any image provider.
