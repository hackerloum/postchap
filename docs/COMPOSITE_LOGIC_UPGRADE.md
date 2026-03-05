# SHARP COMPOSITE UPGRADE

This document defines how the final Sharp composite layer behaves after the AI generates the background image.

---

## 1. Smart Color Match

**Logic:** Sharp analyzes the generated background's average brightness (e.g. via `sharp().stats()` channel means, then luminance = 0.299*R + 0.587*G + 0.114*B).

**Action:**

- If the background is **dark** (luminance below threshold, e.g. 0.4): headline text = **White**.
- If **light**: headline text = **Brand Primary**.

This ensures headline readability against any generated background.

---

## 2. Dynamic CTA Bar (Glassmorphism)

**Logic:** Instead of a fully opaque bar, use a semi-transparent "glass" effect.

**Style:** `background: rgba(brandColor, 0.7)`. In Sharp, draw the CTA rect with fill `rgba(primaryR, primaryG, primaryB, 0.7)`. True `backdrop-filter: blur()` is not available in Sharp; V1 uses semi-transparent fill. Optional: extract region under CTA, blur, composite, then overlay CTA for a blur effect.

---

## 3. Logo Anchoring

**Logic:**

- If Gemini handled the logo (`logoHandledByAI === true`), Sharp **skips** the logo overlay (already implemented).
- **Fallback:** If `logoHandledByAI === false`, Sharp places the logo in the **Safe Zone** identified in Brand Analysis (Step 1). When `layoutPreferences` / `logoSafeZone` is provided, position the logo overlay using that zone; otherwise keep current top-left badge behavior.
