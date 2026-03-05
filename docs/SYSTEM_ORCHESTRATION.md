# ArtMaster V2: Intelligent Orchestration Flow

This document defines the logic for how the AI "Brain" handles different inputs in the Intelligent Orchestration flow.

---

## 1. Multimodal Brand Analysis (The "Eyes")

**Model:** Gemini with vision (e.g. gemini-1.5-pro or gemini-2.0-flash)  
**Task:** Ingest Brand Kit + Store Photos + Logo.

**Upgrade:** Instead of just reading text, Gemini analyzes the **Visual Weight** of the logo and the **Atmospheric Lighting** of the user's business photos.

**Output:** `BrandDNA` object containing:

- **dominantColors:** Actual hex codes extracted from images.
- **aestheticProfile:** Short label (e.g. "Nairobi Cyberpunk" or "Lagos Minimalist").
- **layoutPreferences:** Where the logo naturally fits based on its shape (e.g. logoPosition, safeZone for text).

---

## 2. Contextual Concept Engine (The "Heart")

**Model:** GPT-4o or Gemini 3.1 Pro  
**Upgrade:** Injects "Dynamic Real-Time Data."

**Inputs:** `BrandDNA` + `CurrentDate/Location` + optional `TrendingLocalTopic`.

**Logic:** If it's Friday in Johannesburg, suggest "After-work drinks" themes with "Golden hour" lighting. Themes and visual moods align with the brand's aesthetic profile and the current time of day and location.

---

## 3. The "Forked" Prompt Generator (The "Architect")

**Upgrade:** The system generates **two different prompts** based on the chosen provider.

### Path A: Freepik (Technical / Keyword-Heavy)

- **Focus:** Sharpness, Studio Lighting, Commercial Quality.
- **Keywords:** `f/1.8`, `ISO 100`, `high-end commercial photography`, `clean background`, `8k resolution`, `macro photography`, `bokeh background`.

### Path B: Gemini (Narrative / Spatial)

- **Focus:** Mood, Compositional Reasoning, Negative Space.
- **Keywords:** `cinematic atmosphere`, `negative space in top-left`, `ethereal lighting`, Safe Zone for text, cultural touch, time-of-day lighting.

---

## Key Improvements

- **Cultural Grounding:** The system asks "Where is the business?" and adjusts the sun's angle and texture accordingly.
- **Safety Zones:** By explicitly defining "Safe Zones" in the prompt, you reduce the chance of the AI putting a face right under your headline.
- **Cost Efficiency:** Route "Standard" posters to Freepik (cheaper) and "Premium/Complex" posters to Gemini (higher quality reasoning).
