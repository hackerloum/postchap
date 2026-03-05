# PROMPT TEMPLATE: AFRICAN PREMIUM INJECTOR

These templates are used in `lib/generation/generateImagePrompt.ts` for provider-specific prompt generation.

---

## For Gemini (Narrative / Spatial)

```
A premium marketing background for [INDUSTRY] located in [LOCATION].
VISUAL STYLE: [AESTHETIC_PROFILE]
COLOR HARMONY: Use a palette based on [BRAND_COLORS].
COMPOSITION: Ensure a clean 'Safe Zone' for text in the [TEXT_POSITION].
CULTURAL TOUCH: Incorporate subtle [LOCAL_PATTERN] textures in the shadows.
LIGHTING: [TIME_OF_DAY] lighting, reflecting the warmth of [LOCATION].
DO NOT: Include any text, watermarks, or logos in the generated image.
```

---

## For Freepik Seedream (Technical / Keyword-Heavy)

```
[INDUSTRY] professional background, [AESTHETIC_PROFILE] style,
hex colors [BRAND_COLORS], studio lighting, macro photography,
sharp focus, 8k resolution, minimalist composition, commercial stock photo style,
bokeh background, high-end feel.
```

---

## Placeholders

| Placeholder        | Source |
|--------------------|--------|
| INDUSTRY           | brandKit.industry |
| LOCATION           | brandKit.brandLocation (city, country, continent) |
| AESTHETIC_PROFILE  | BrandDNA.aestheticProfile or brand kit tone/styleNotes |
| BRAND_COLORS       | BrandDNA.dominantColors (hex) or brandKit primary/secondary/accent |
| TEXT_POSITION      | BrandDNA.layoutPreferences.safeZone or default "top" |
| LOCAL_PATTERN      | africanContext.ts mapping from country/city/continent |
| TIME_OF_DAY        | Current hour + optional brandLocation.timezone |
