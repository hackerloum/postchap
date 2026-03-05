# Generate Poster: What the User Sees and What Actually Happens

This document describes the **user-facing flow** on the Generate Poster screen and the **backend flow** that runs for each step.

---

## 1. User lands on the page

**What the user sees**

- **URL:** `/dashboard/create`
- **Header:** “Generate poster” with a back link to Dashboard
- **Brand kit selector** (dropdown): “Select brand kit” or the name of the selected kit
- **Tabs:** AI · Template · Inspiration · Product · Ads
- **Platform format:** e.g. Instagram Post (Square), Story, Facebook, etc.
- **Image provider** (when not on trial): e.g. Seedream v4.5, Mystic, Nano Banana 2, etc.
- **Optional toggles:** “Enhance prompt”, “Editable layout” (AI mode)
- **Content recommendations** section: “Content recommendations” with subtitle “Tailored for [Brand] · [Country] · Today”
- **Generate poster** button at the bottom

**What actually happens**

- Firebase auth is checked; if not logged in → redirect to login
- `GET`-style load of brand kits (via client SDK / user context)
- When a brand kit is **selected**, the app calls `POST /api/recommendations` with `{ brandKitId }`

---

## 2. Recommendations load (when user selects a brand kit)

**What the user sees**

- “Content recommendations” shows **loading skeletons** (e.g. 4 placeholder cards)
- After a few seconds, **6 recommendation cards** appear
- Each card shows: **theme**, **topic**, **category** (e.g. Promotion, Occasion), **urgency** (high/medium/low), **suggested headline** in quotes, and a few **hashtags**
- First recommendation is **auto-selected** (highlighted border / checkmark)
- Subtitle: “Tailored for [Brand] · [Country] · Today”
- A **Refresh** control lets the user fetch new recommendations

**What actually happens**

1. **Frontend** calls `POST /api/recommendations` with `{ brandKitId }`.
2. **Backend** (`app/api/recommendations/route.ts`):
   - Loads the brand kit from Firestore
   - If the kit has **logo or store photos** and no cached `brandDna`, calls **Gemini vision** (`analyzeBrandMultimodal`) to get **BrandDNA** (dominant colors, aesthetic profile, layout preferences)
   - Calls `getRecommendationsForBrandKit(db, uid, brandKitId, { brandDna })`
3. **Recommendation engine** (`lib/generation/generateRecommendations.ts`):
   - Builds a system prompt that includes **BrandDNA** (e.g. aesthetic profile) and **dynamic real-time context** (day of week, time of day, city/country — e.g. “Friday in Johannesburg → after-work, golden hour”)
   - **GPT-4o** returns 6 poster concepts (theme, topic, suggestedHeadline, suggestedCta, visualMood, hashtags, etc.)
4. Response is sent back as `{ recommendations }`; the UI renders the 6 cards and auto-selects the first.

So: **Select kit → API runs Eyes (BrandDNA) + Heart (GPT recommendations) → user sees 6 tailored ideas.**

---

## 3. User picks a recommendation (or custom brief)

**What the user sees**

- User can **click another card** to select a different recommendation (selection state updates)
- Or user can use **“Write your own”** and type a **custom topic/brief**; that replaces the selected recommendation for generation
- Hint text under the button: “Select a recommendation or write a brief” (in AI mode)
- **Generate poster** stays disabled until at least one of: selected recommendation **or** custom topic is present (depending on mode)

**What actually happens**

- Only frontend state changes: `selectedRec` or `useCustom` + `customTopic`
- No API call until the user clicks **Generate poster**

---

## 4. User clicks “Generate poster”

**What the user sees**

- Button shows a **spinner** and label like “Generating...” or a step message
- A **full-screen overlay** appears with:
  - ArtMaster logo
  - **Step message**, e.g.:
    - **AI mode:** “Writing copy & generating image...”
    - **Template mode:** “Analyzing template & writing copy...”
    - **Inspiration mode:** “Analyzing style reference & writing copy...”
    - **Product mode:** “Building product poster...”
  - Subtitle: “This takes 30–60 seconds”
  - Small animated dots
- The overlay stays until the request finishes (success or error)

**What actually happens**

1. **Frontend** builds a payload and calls `POST /api/generate` with:
   - `brandKitId`
   - `recommendation`: the selected recommendation object (or a synthetic one for custom topic) or `null` for product/template/ads
   - `platformFormatId`, `posterLanguage`, `imageProviderId`, `useImprovePrompt`
   - For template: `templateId`; for inspiration: `inspirationImageUrl`; for product: `productId`, `productIntent`, `productOverrides`
   - `useEditableLayout: true` in AI mode (so the result can open in the Fabric editor)

2. **Backend** (`app/api/generate/route.ts`):
   - Checks auth, plan, trial, and provider limits
   - Calls `runGenerationForUser(uid, brandKitId, recommendation, templateId, …)`

3. **Run generation** (`lib/generation/runGeneration.ts`):
   - Loads **brand kit** from Firestore (including `storePhotoUrls`, `brandDna` if cached)
   - **Eyes (if needed):** If no cached `brandDna` and kit has logo or store photos → **Gemini vision** → **BrandDNA**
   - **Copy:** `generateCopy(brandKit, null, recommendation, …)` → **GPT-4o** → headline, subheadline, body, CTA, hashtags
   - **Architect:** `generateImagePrompt(brandKit, copy, null, recommendation, …, imageProviderId, brandDna)`:
     - If **Freepik** → technical/keyword prompt (African template: industry, location, aesthetic, hex colors, studio/8k/macro, etc.)
     - If **Gemini** → narrative/spatial prompt (African Premium: safe zone, local pattern, time-of-day lighting, “DO NOT: text/logos”)
   - Optional: **Freepik Improve Prompt** on that prompt (when enabled)
   - **Image:** `generateImage(prompt, aspectRatio, imageProviderId, brandKit)` → **Freepik** (Seedream/Mystic) or **Gemini** → background image buffer + `imageHasText`, `logoHandledByAI`, `addCTAFromSharp`
   - **Composite:** `compositePoster(backgroundBuffer, brandKit, copy, …)`:
     - **Smart color match:** background luminance → headline color = white (dark) or brand primary (light)
     - **CTA bar:** semi-transparent brand color (glassmorphism-style)
     - **Logo:** if `logoHandledByAI` → skip; else place logo, using **Safe Zone** from BrandDNA when available (top-left / top-right / center)
   - **Upload** background and final image to Cloudinary; **save** poster doc in Firestore (e.g. `users/{uid}/posters`)

4. **API** returns `{ posterId, imageUrl, copy, hasEditableLayout }` (or error).

So: **One click → Eyes (optional) → Copy (GPT) → Architect (provider-specific prompt) → Image (Freepik or Gemini) → Composite (Sharp) → upload & save.**

---

## 5. After generation succeeds

**What the user sees**

- **If editable layout (AI mode)** and backend set `hasEditableLayout`: redirect to **`/dashboard/posters/{posterId}/edit`** (Fabric.js editor with layers).
- **If Instagram connected** and backend returned poster data: **“Poster ready!”** overlay with:
  - Generated poster thumbnail
  - **“Post to Instagram”** button
  - **“View poster”** button → `/dashboard/posters?new={posterId}`
- **Otherwise:** redirect to **`/dashboard/posters?new={posterId}`** (posters list with the new one highlighted)
- A **toast**: “Poster generated successfully!”

**What actually happens**

- No further backend call for the redirect; the poster is already stored and the URL is in Firestore/Cloudinary.
- “Post to Instagram” triggers a separate `POST /api/social/instagram/post` when the user clicks it.

---

## 6. Modes in short

| Mode        | User sees / does                                           | Backend difference                                                                 |
|------------|-------------------------------------------------------------|-------------------------------------------------------------------------------------|
| **AI**     | Select kit → see 6 recommendations → pick one (or custom) → Generate | Recommendations use BrandDNA + date/location; prompt is forked (Freepik vs Gemini); optional editable layout. |
| **Template** | Select kit → search/select Freepik template → pick content → Generate | No recommendation; template image → image-to-prompt → merge with brand/copy → improve → generate → composite. |
| **Inspiration** | Select kit → upload image or paste URL → pick content → Generate | Inspiration image → image-to-prompt → merge with brand/copy → generate → composite. |
| **Product** | Select kit → select product → set intent → Generate        | Product-focused copy + image prompt; product image can be sent to Gemini as hero reference. |
| **Ads**    | Select kit → pick one of the ads recommendations → Generate | Same pipeline as AI but recommendations come from admin ads endpoint.              |

---

## 7. One-line summary

**On screen:** User selects brand kit → sees 6 tailored recommendations (or uses template/inspiration/product) → picks one → clicks “Generate poster” → sees a short “Writing copy & generating image...” overlay → then either the editor, “Poster ready!” with Instagram option, or the posters list.

**Behind the scenes:** Kit (+ optional Eyes for BrandDNA) → Heart for recommendations → Copy (GPT) → Architect (provider-specific prompt) → Freepik or Gemini for the image → Sharp composite (smart headline color, glass CTA, logo in Safe Zone) → upload and save.
