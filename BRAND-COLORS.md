# ArtMaster Platform — Brand Colors

Design tokens and brand colors used across the app.

---

## Primary Palette

| Token | Hex | Usage | Tailwind |
|-------|-----|-------|----------|
| **accent** | `#E8FF47` | Primary CTA, highlights, badges | `bg-accent`, `text-accent`, `border-accent` |
| **accent-dim** | `#D4F03A` | Hover state for accent buttons | `hover:bg-accent-dim` |

---

## Backgrounds

| Token | Hex | Usage | Tailwind |
|-------|-----|-------|----------|
| **bg-base** | `#0a0a0a` | Page background, main canvas | `bg-bg-base` |
| **bg-surface** | `#141414` | Cards, elevated surfaces | `bg-bg-surface` |
| **bg-elevated** | `#1a1a1a` | Hover states, nested surfaces | `bg-bg-elevated` |
| **bg-overlay** | `#222222` | Overlays, modals, dropdowns | `bg-bg-overlay` |

---

## Text

| Token | Hex | Usage | Tailwind |
|-------|-----|-------|----------|
| **text-primary** | `#fafafa` | Headings, primary body text | `text-text-primary` |
| **text-secondary** | `#a1a1aa` | Secondary copy, descriptions | `text-text-secondary` |
| **text-muted** | `#71717a` | Captions, hints, labels | `text-text-muted` |

---

## Borders

| Token | Hex | Usage | Tailwind |
|-------|-----|-------|----------|
| **border-default** | `#3f3f46` | Default borders, inputs | `border-border-default` |
| **border-strong** | `#52525b` | Focus, hover borders | `border-border-strong` |
| **border-subtle** | `#27272a` | Dividers, subtle separation | `border-border-subtle` |

---

## Semantic (feedback)

| Token | Hex | Usage | Tailwind |
|-------|-----|-------|----------|
| **error** | `#ef4444` | Errors, destructive actions | `text-error`, `bg-error`, `border-error` |
| **warning** | `#f59e0b` | Warnings | `text-warning`, `bg-warning` |
| **success** | `#3ddc84` | Success states, active badges | `text-success`, `bg-success`, `border-success` |
| **info** | `#4D9EFF` | Info, links, highlights | `text-info`, `bg-info`, `border-info` |

---

## Onboarding Preset Palettes

Default brand presets in the onboarding wizard:

| Name | Primary | Secondary | Accent |
|------|---------|-----------|--------|
| Neon Dark | `#E8FF47` | `#080808` | `#FFFFFF` |
| Warm Fire | `#FF6B35` | `#1A0A00` | `#FFD700` |
| Emerald | `#00D4AA` | `#001A14` | `#FFFFFF` |
| Purple | `#7C3AED` | `#0D0015` | `#E8FF47` |
| Rose | `#F43F5E` | `#1A0008` | `#FFFFFF` |

---

## CSS Variables

Defined in `app/globals.css`:

```css
:root {
  --bg-base:        #0a0a0a;
  --bg-surface:     #141414;
  --bg-elevated:    #1a1a1a;
  --bg-overlay:     #222222;
  --border-subtle:  #27272a;
  --border-default: #3f3f46;
  --border-strong:  #52525b;
  --text-primary:   #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted:     #71717a;
  --accent:         #e8ff47;
  --accent-dim:     #d4f03a;
  --success:        #3ddc84;
  --warning:        #f59e0b;
  --error:          #ef4444;
  --info:           #4D9EFF;
}
```
