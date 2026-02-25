# Plan: “Inspiration” poster creation (third path)

We have three ways for a user to create a poster:

1. **Template style** — Pick a layout from our template search (Freepik); we apply their brand + copy to that style.
2. **AI recommendation** — Pick a content theme from AI suggestions; we generate copy + image from scratch.
3. **Inspiration** *(new)* — User provides an image they saw elsewhere (e.g. another post on the internet) and wants “something like that” with their brand and message.

This doc plans how the **Inspiration** path works so we don’t mislead the user (e.g. wrong colors, wrong content) and so the result is clearly “inspired by” rather than a clone.

---

## 1. User flow (high level)

- User chooses **“Use an image as inspiration”** on the create page.
- User provides **one image**:
  - **Option A:** Paste URL of the image.
  - **Option B:** Upload a file (we store temporarily or pass as data URL to image-to-prompt).
- User still selects **brand kit** and either **AI recommendation** (for copy) or **custom topic** (we generate copy from that).
- We generate a poster that:
  - **Looks like** the inspiration in layout, style, and composition.
  - **Uses** the user’s brand colors, headline, CTA, and logo (not the inspiration’s text or branding).

No copying of text or exact visuals from the inspiration; we only use it to describe “style” and “layout” for the model.

---

## 2. What we take from the inspiration image

Use **image-to-prompt** (same as template flow) to get a text description. From that we **keep** only:

| Keep from inspiration | Meaning |
|------------------------|--------|
| **Layout / composition** | Where things sit (e.g. “headline at top center, large photo in middle, CTA button at bottom”). |
| **Style / mood** | E.g. minimal, bold, gradient, geometric, photo-led, illustration style. |
| **General structure** | Number of sections, balance, “full-bleed background”, “rounded corners on CTA”. |

We **do not** keep:

- Exact colors (we override with brand colors).
- Any text or wording (we replace with user’s headline, CTA, brand name).
- Specific imagery that implies someone else’s brand (e.g. “Nike logo”) — we describe generic equivalents if needed (“swoosh shape” → no; “bold sporty shape” → yes).

So in code: we take the image-to-prompt output, then **merge** it with the same kind of customizations we use for templates: brand colors, headline, CTA, brand name, “no logos/watermarks”, “only this text on poster”.

---

## 3. What we replace (so the user is not misled)

| Replace | With | Reason |
|--------|------|--------|
| **Colors** | User’s brand kit (primary, secondary, accent), described by **color names only** (no hex in prompt) | So the poster matches their brand, not the inspiration’s. Avoids “I wanted my green, not their orange.” |
| **All text** | Our generated copy: headline, CTA, brand name (from recommendation or custom topic) | Content must be theirs; we never replicate wording from the inspiration (copyright + relevance). |
| **Logo / branding** | User’s logo from brand kit (composited on top as today) | So it’s clearly their poster, not a copy of the other brand. |

We make this explicit in the prompt we send to the image model, e.g.:

- “Use the same layout and style as described above.”
- “Replace all text with: headline ‘…’, CTA ‘…’, brand name ‘…’.”
- “Use brand colors: [primary/secondary/accent as color names]. Do not use the original image’s colors.”
- “Do not reproduce any text or logos from the reference; only the user’s brand name, headline, and CTA may appear.”

---

## 4. Handling “what if the user wants different colors or images?”

- **Colors**  
  We **always** override with brand colors in the Inspiration path. So “something like that” = same layout/style, but **our** colors.  
  If we later add a toggle “Keep inspiration colors” vs “Use my brand colors”, that’s a small prompt change; default = brand colors.

- **Images / subjects**  
  - **V1:** We do **not** add a separate “change the main image” control. The image-to-prompt description might say “woman holding a product”. We keep that as a generic description (layout + “person with product”) and only force our copy and colors. So the result can still have “person + product” but with user’s colors and text.  
  - **Later:** We could add “Keep similar imagery” vs “Use my industry/product” (e.g. “coffee shop” vs “tech app”) and inject that into the prompt.

- **Misleading**  
  To avoid “I got the same orange and same text as the inspiration”:  
  - We **never** put the inspiration image’s text into the prompt as something to render.  
  - We **always** inject “Replace all text with: …” and “Use brand colors: …” in the merge step.  
  - We can show a short summary before generating: “We’ll use the layout and style of your image, with **your** brand colors and **your** headline/CTA.”

---

## 5. Content (copy) in the inspiration path

- **Source of copy:** Same as today: either from **AI recommendation** (user picks a theme) or **custom topic** (user writes a short brief). We do **not** use the inspiration image to generate copy; we use it only for **visual** style/layout.
- **What appears on the poster:** Only our generated headline, CTA, and brand name (and hashtags if we keep that). We never transcribe or reuse text from the inspiration image in the final poster.
- So: **Inspiration = visual reference only.** Content = always from brand + recommendation or custom topic.

---

## 6. Technical flow (summary)

1. User selects “Inspiration” and provides image (URL or upload).
2. If upload: we get a temporary URL or data URL and pass it to image-to-prompt (same API as template flow).
3. **imageToPrompt(inspirationImageUrl)** → raw description (layout, style, maybe colors/text — we’ll override).
4. **Strip** template-like labels (e.g. “A4”, “POSTER A4 TEMPLATE”) from that description, same as template flow.
5. **Merge** with:
   - Brand colors (from brand kit, described by color names only).
   - “Replace all text with: headline ‘…’, CTA ‘…’, brand name ‘…’. Do not reproduce any other text or logos from the reference.”
   - “Keep the same layout, style, and composition. Use the brand colors above, not the reference image’s colors.”
6. **improvePrompt**(merged) → single prompt for Seedream.
7. **generateImage**(prompt, aspectRatio) → image.
8. **compositePoster** with user’s logo (and optional overlay if no text in image) → final poster.

So the pipeline is the same as **template style**, but the “template” is the user’s inspiration image URL instead of a Freepik template ID. The merge step is what guarantees we replace colors and content and avoid misleading output.

---

## 7. Optional: “Inspiration options” (later)

- **Colors:** “Use my brand colors” (default) vs “Keep similar colors to the image”.
- **Imagery:** “Keep similar subject (e.g. person, product)” vs “Use imagery for my industry (e.g. [industry])”.
- **Layout only:** “Only copy the layout; style can be more minimal/modern” for users who want just the structure.

For v1 we can ship without these; the important part is **always replace content and default to brand colors** so the user gets “like that, but mine.”

---

## 8. Summary

| Question | Answer |
|----------|--------|
| How do we get “something like that”? | Image-to-prompt on the inspiration image, then merge with “same layout/style, but use our brand colors and our copy.” |
| What if user wants different colors? | We always use brand colors unless we add a future “keep inspiration colors” option. |
| What about images/subjects? | V1: keep generic description from image-to-prompt; only override text and colors. Later: optional “use my industry imagery.” |
| How about content inside? | Content is always from **our** copy (AI recommendation or custom topic). We never copy text from the inspiration image. |
| How do we avoid misleading? | Explicit merge instructions: “Replace all text with …”, “Use brand colors …”, “Do not reproduce reference text or logos.” Optional short summary before generate: “We’ll use layout & style with your colors and your copy.” |

This plan keeps the Inspiration path consistent with the template path (same image-to-prompt + merge + improve + generate), makes replacement of colors and content explicit, and avoids copying anyone else’s text or branding.
