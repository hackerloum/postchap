# ArtMaster Platform — Brand Colors

Reference for design and development. All colors are defined in `app/globals.css` and exposed as Tailwind utilities.

---

## Backgrounds

| Token | Hex | Usage |
|-------|-----|--------|
| `--bg-base` | `#080808` | Page background, default canvas |
| `--bg-surface` | `#111111` | Cards, panels, elevated surfaces |
| `--bg-elevated` | `#1a1a1a` | Modals, dropdowns |
| `--bg-overlay` | `#222222` | Overlays, backdrops |

**Tailwind:** `bg-bg-base`, `bg-bg-surface`, `bg-bg-elevated`, `bg-bg-overlay`

---

## Borders

| Token | Hex | Usage |
|-------|-----|--------|
| `--border-subtle` | `#1f1f1f` | Light dividers, section edges |
| `--border-default` | `#2a2a2a` | Default borders (inputs, cards) |
| `--border-strong` | `#3a3a3a` | Hover/focus, emphasis |

**Tailwind:** `border-border-subtle`, `border-border-default`, `border-border-strong`

---

## Text

| Token | Hex | Usage |
|-------|-----|--------|
| `--text-primary` | `#f2f2f2` | Headings, body copy |
| `--text-secondary` | `#888888` | Supporting text, captions |
| `--text-muted` | `#555555` | Placeholders, disabled, labels |

**Tailwind:** `text-text-primary`, `text-text-secondary`, `text-text-muted`

---

## Accent (Brand)

| Token | Hex | Usage |
|-------|-----|--------|
| `--accent` | `#e8ff47` | Primary CTA, links, highlights, favicon |
| `--accent-dim` | `#b8cc38` | Hover states, secondary accent |

**Tailwind:** `text-accent`, `bg-accent`, `border-accent`, `text-accent-dim`, `border-accent-dim`

---

## Status

| Token | Hex | Usage |
|-------|-----|--------|
| `--status-success` | `#3ddc84` | Success states, confirmations |
| `--status-warning` | `#f5a623` | Warnings, caution |
| `--status-error` | `#ff4d4d` | Errors, destructive actions |
| `--status-info` | `#4d9eff` | Info, neutral feedback |

**Tailwind:** `text-status-success`, `text-status-warning`, `text-status-error`, `text-status-info`

---

## Quick swatches

```
Backgrounds:  #080808  #111111  #1a1a1a  #222222
Borders:     #1f1f1f  #2a2a2a  #3a3a3a
Text:        #f2f2f2  #888888  #555555
Accent:      #e8ff47  #b8cc38
Status:      #3ddc84  #f5a623  #ff4d4d  #4d9eff
```

---

## CSS variables (raw)

Use in custom CSS or `style` props:

```css
var(--bg-base)
var(--bg-surface)
var(--text-primary)
var(--accent)
var(--border-default)
/* etc. */
```

## Fonts

- **Body / UI:** `--font-apple` (SF Pro Text / Display, Helvetica Neue, Arial)
- **Display (headings):** `--font-display` (SF Pro Display, Helvetica Neue, Arial)
- **Monospace:** `--font-mono` (SF Mono, Cascadia Code, Fira Code, Menlo, Consolas)

**Tailwind:** `font-apple`, `font-display`, `font-mono`
