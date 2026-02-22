# ArtMaster Platform — Pages

Documentation of the pages built in this application.

---

## Public

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | **Landing page** — Server component. Hero with headline, CTA buttons, poster mockup, "How it works" (3 steps), features grid (6 cards), CTA banner, footer. Mobile-first Tailwind. |

---

## Auth (unauthenticated)

| Route | File | Description |
|-------|------|-------------|
| `/login` | `app/(auth)/login/page.tsx` | **Sign in** — Email/password + Google sign-in. On success: session cookie set via `/api/auth/session`, then redirect to `/dashboard` (if `hasOnboarded`) or `/onboarding` (if not). |
| `/signup` | `app/(auth)/signup/page.tsx` | **Create account** — Email/password + Google signup. Password strength indicator. New users always redirect to `/onboarding`. |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | **Reset password** — Enter email, Firebase sends reset link. Success state shows checkmark and "Check your email". |

All auth pages share layout: `app/(auth)/layout.tsx` (ArtMaster header + centered form).

---

## Protected (post-login)

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `app/dashboard/page.tsx` | **Dashboard** — Welcome, date, 4 quick actions (Generate, Posters, Brand Kits, Schedule), brand kits list, generate CTA. Sign out link. |
| `/dashboard/create` | `app/dashboard/create/page.tsx` | Placeholder — Coming soon |
| `/dashboard/posters` | `app/dashboard/posters/page.tsx` | Placeholder — Coming soon |
| `/dashboard/brand-kits` | `app/dashboard/brand-kits/page.tsx` | Placeholder — Coming soon |
| `/dashboard/schedule` | `app/dashboard/schedule/page.tsx` | Placeholder — Coming soon |
| `/onboarding` | `app/onboarding/page.tsx` | **4-step wizard** — (1) Brand: name, industry, tagline, website. (2) Visual: colors, presets, logo upload. (3) Audience: country, city, target, platforms. (4) Content: tone, style notes, sample. Submits to `/api/brand-kits`. |

Onboarding layout: `app/onboarding/layout.tsx` (header + max-w-2xl content).

---

## Middleware

| File | Description |
|------|-------------|
| `middleware.ts` | Redirects: no token → `/login` for dashboard/onboarding; logged-in → auth pages → `/dashboard` or `/onboarding` based on `hasOnboarded`; invalid token → clear cookie, redirect to login. Uses jose for Edge JWT verification. |

---

## API

| Route | File | Description |
|-------|------|-------------|
| `POST /api/auth/session` | `app/api/auth/session/route.ts` | Creates `__session` cookie from Firebase ID token. Creates user in Firestore if new. Returns `{ success, hasOnboarded, uid }`. |
| `DELETE /api/auth/session` | (same) | Clears session cookie (logout). |
| `GET /api/auth/logout` | `app/api/auth/logout/route.ts` | Clears `__session` cookie and redirects to `/`. |
| `POST /api/brand-kits` | `app/api/brand-kits/route.ts` | Creates brand kit in Firestore, sets `hasOnboarded: true` on user, sets custom claim. Requires Bearer token. |
| `GET /api/brand-kits` | (same) | Returns user's brand kits. Requires Bearer token. |

---

## Footer links (placeholders)

| Route | Description |
|-------|-------------|
| `/privacy` | Privacy Policy (not yet built) |
| `/terms` | Terms of Service (not yet built) |
| `/contact` | Contact (not yet built) |
