# How OpenAI Brainstorms Poster Design Recommendations

This document explains the full AI pipeline that powers the poster recommendation
and generation system in PosterChap, from the first brainstorm call to the final
image prompt handed off to the image provider.

---

## Overview

Every poster goes through **three sequential GPT-4o calls** before a single pixel
is generated:

```
1. Recommendations  →  6 poster concepts (themes, headlines, visual moods)
2. Copy             →  Headline, subheadline, CTA, hashtags
3. Image Prompt     →  Detailed Seedream/Gemini generation prompt
```

Each call builds on the output of the previous one, ensuring total consistency
from concept to final image.

---

## Stage 1 — Brainstorming Recommendations

**Endpoint:** `POST /api/recommendations` (user) · `POST /api/admin/recommendations` (admin)  
**Model:** `gpt-4o`  
**Temperature:** `0.85` (user) · `1.1` (admin — more creative variance)

### What it does

GPT-4o acts as a senior creative director and brand strategist. It reads the
brand kit stored in Firestore and generates **6 distinct poster concepts**, each
tailored to:

- The brand's name, industry, tone, and tagline
- The user's country, city, continent, and currency
- The **exact day and date** the request is made (Monday energy vs. Friday mood)
- Local cultural moments, seasonal relevance, and regional languages

### System prompt roles

**User flow** — GPT is instructed to be a creative director specialising in
social media marketing for businesses in the brand's continent. It is told to
never return generic content and to reference specific local events, days of the
week, and market-specific promotions.

**Admin flow** — GPT is given a more aggressive creative brief, told to think
like a combination of David Droga (storytelling), Paula Scher (bold typography),
and Dieter Rams (function-first design). It is explicitly forbidden from using
overused AI tropes:

- Globe / world map imagery
- Generic "spotlight on dark background"
- Hands on keyboards
- Floating smartphone mockups
- Blue/purple gradient tech-bro backgrounds
- Rocket or "launch" metaphors
- Person holding a sign with text or logos

Instead it must choose from diverse visual categories per concept slot:

| Slot | Visual Category |
|------|-----------------|
| 1 | Typographic Power — the type IS the design |
| 2 | Human Emotion — a real face tells the story |
| 3 | Split Duality — before/after contrast |
| 4 | Dark Luxury Minimal — premium, directional light |
| 5 | Abstract Data / Concept — unexpected AI metaphor |
| 6 | Urgency / Social Proof — testimonial format |

### Output schema

GPT returns a raw JSON array of exactly 6 objects:

```json
[
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
]
```

The admin schema adds a stricter `category` enum:
`typography | emotion | comparison | luxury | abstract | social_proof`

### Quality constraints

- `suggestedHeadline` must feel like a billboard in NYC or Lagos — not a landing page
- `visualMood` must reference a specific visual style or director  
  (e.g. "Kubrick symmetry", "Wes Anderson palette", "Caravaggio lighting")
- Each of the 6 concepts must be so visually distinct a viewer would never guess
  they share the same brand kit
- A session seed (last 4 digits of `Date.now()`) is injected into the admin
  prompt to prevent duplicate outputs on repeat calls

---

## Stage 2 — Copy Generation

**File:** `lib/generation/generateCopy.ts`  
**Model:** `gpt-4o`  
**Temperature:** `0.8`  
**Max tokens:** `500`

### What it does

Once the user selects a recommendation, GPT writes the actual on-poster copy.
It receives the full brand kit plus the selected recommendation as a creative
brief, and is told to follow it closely but write with the brand's exact tone
and language.

### System prompt role

GPT acts as a senior copywriter at a top creative agency. It is told every word
must be tailored to the exact brand — no generic content. It must output only
raw JSON with no markdown or explanation.

### Inputs

- Brand kit (name, industry, tagline, tone, language, target audience, country,
  continent, currency, style notes, sample content)
- The selected recommendation (theme, topic, description, suggested headline,
  suggested CTA, hashtags)

### Output schema

```json
{
  "headline": "max 6 words",
  "subheadline": "max 12 words",
  "body": "2–3 lines",
  "cta": "max 4 words",
  "hashtags": ["#tag1", "#tag2", "...up to 12 tags"]
}
```

### Validation

After parsing, the code runs two safety checks:

1. **Hex color guard** — any hashtag that looks like a hex colour code (e.g.
   `#d1700w`) is stripped from the hashtag array. GPT occasionally confuses hex
   values with hashtags when the brand palette is in the prompt.

2. **CTA hex guard** — if the CTA field itself contains a hex-like string (a
   known GPT hallucination), it is reset to `"Learn More"`.

---

## Stage 3 — Image Prompt Generation

**File:** `lib/generation/generateImagePrompt.ts`  
**Model:** `gpt-4o`  
**Temperature:** `0.7` (lower — more deterministic art direction)  
**Max tokens:** `800`

### What it does

GPT translates the brand kit + copy + visual mood into a detailed natural-language
prompt for the image model (Seedream 4.5 or Gemini Nano Banana). This prompt
describes the complete poster: layout, text placement, colours, subject, lighting,
composition, and quality keywords.

### System prompt role

GPT acts as an expert Seedream 4.5 prompt engineer. The system prompt contains
**ten explicit rules** it must follow:

| Rule | Instruction |
|------|-------------|
| 1 | Include exact text (headline, tagline, CTA) **or** logo-only mode if no brand name provided |
| 2 | Specify text placement (e.g. "headline centered at top in large bold") |
| 3 | Define colour palette using names, never hex codes |
| 4 | Describe composition and layout |
| 5 | Set mood and lighting style |
| 6 | Add quality keywords (professional, high-end, no watermarks) |
| 6b | Absolutely no logos or brand marks in the image |
| 7 | Describe the main visual subject clearly |
| 8 | Only the headline and CTA may appear as text — never hex codes or variable names |
| 9 | Full-bleed background — image fills every edge, no separate bottom bars |
| 10 | Clean bottom edge — no footer artifacts or watermark symbols |

### Logo-only mode

If the brand kit has no `brandName` set (or it is blank), GPT is switched into
**logo-only branding mode**. It is told:

> "Do NOT include any brand name, wordmark, or company name as text in the image.
> The top-left area (250 × 120 px) must be completely empty — pure background only.
> This space is reserved for the logo overlay composited after generation."

This prevents the AI from inventing a fake logo and ensures the real brand logo
can be composited cleanly in post-processing via Sharp.

### Non-English language support

If the brand's language is non-English (Swahili, Arabic, French, etc.), an
additional instruction is injected:

> "Specify the EXACT text to display in quotes so Seedream can render it correctly.
> Example: 'The headline *Karibu Dukani* displayed prominently at top in bold
> sans-serif'. Do not translate the copy; use the exact headline and CTA text as given."

### Negative constraints (appended at runtime)

After GPT returns the prompt, the generation pipeline hard-appends a block of
negative constraints that override everything else. These are injected in
`app/api/admin/generate/route.ts` and `lib/generation/runGeneration.ts`:

```
STRICT NEGATIVE CONSTRAINTS — these override everything above:
- TOP-LEFT CORNER IS A DEAD ZONE: 250 px wide × 120 px tall — pure background only.
- Do NOT show any logo, wordmark, brand mark, emblem, icon, arrow, triangle, or
  decorative symbol anywhere in the image.
- Do NOT render any brand name as text or graphic anywhere.
- No watermarks. No copyright symbols. No AI-generated logos or icons.
```

These are appended after `improvePrompt` so they cannot be overridden by any
earlier instruction in the chain.

---

## Full Pipeline Diagram

```
User selects brand kit
        │
        ▼
[GPT-4o] Stage 1 — Recommendations
  System: Creative director for {continent}
  User:   Brand kit + today's date + local rules
  Out:    6 recommendation objects (theme, headline, visualMood…)
        │
        │  User picks 1 recommendation
        ▼
[GPT-4o] Stage 2 — Copy
  System: Senior copywriter
  User:   Brand kit + selected recommendation
  Out:    { headline, subheadline, body, cta, hashtags }
        │
        ▼
[GPT-4o] Stage 3 — Image Prompt
  System: Seedream 4.5 prompt engineer (10 rules)
  User:   Brand kit + copy + visualMood + layout rules
  Out:    Natural-language image generation prompt (max 400 words)
        │
        ▼
[improvePrompt] — Freepik prompt enhancer API (optional)
        │
        ▼
Hard-append negative constraints
        │
        ▼
[Image Provider] — User-selected model
  ├── freepik:seedream  → Freepik Seedream v4.5
  ├── freepik:mystic    → Freepik Mystic
  ├── gemini:3.1-flash  → gemini-3.1-flash-image-preview
  ├── gemini:3-pro      → gemini-3-pro-image-preview  ─┐ cascade on quota
  └── gemini:2.5-flash  → gemini-2.5-flash-image      ─┘ exhaustion
        │
        ▼
[Sharp] — Composite poster
  Logo overlay, headline text, CTA bar, brand colours
        │
        ▼
[Cloudinary] — Upload & return final URL
```

---

## Key Design Decisions

### Why three separate GPT calls instead of one?

Each stage has a different job and a different temperature. Separating them
allows each GPT call to focus on a single concern, makes each output parseable
and validatable independently, and makes it easy to retry or regenerate a single
stage without rerunning the entire pipeline.

### Why temperature 1.1 for admin recommendations?

The admin dashboard is used to generate brand-representative marketing content
for ArtMaster itself. Higher temperature produces more creative variance, which
is desirable when generating 6 visually distinct concepts that must feel like
they came from different agencies.

### Why temperature 0.7 for image prompts?

Image prompts require precise, deterministic art direction. Lower temperature
keeps the prompt focused, well-structured, and faithful to the brand kit without
wandering into unexpected visual territory.

### Why hard-append negative constraints?

GPT tends to include logos, watermarks, or brand text even when told not to,
especially after a long prompt. Appending the constraints at the very end of the
final prompt — after all other instructions — gives them the highest weight in
Seedream's attention, making them far more reliable than embedding them mid-prompt.
