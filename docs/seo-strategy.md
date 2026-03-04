# ArtMaster — Super SEO Strategy & Implementation Guide

> **Domain:** artmasterpro.com  
> **Stack:** Next.js 14 App Router (supports `export const metadata` per page and `generateMetadata` for dynamic routes)  
> **Last updated:** March 2026

---

## 1. Brand & Positioning Summary

| Field | Value |
|---|---|
| Product name | **ArtMaster** |
| Tagline | *"Your brand deserves to show up every day"* |
| Sub-tagline | *"Built for Africa · Used worldwide"* |
| Core value prop | AI-powered daily social media poster generation, tailored to each brand's identity |
| Target audience | African SMBs, marketers, solo founders, social media managers needing consistent content without a designer |
| Primary competitors | Canva, Adobe Express, ContentStudio, Simplified |
| Differentiators | Africa-first pricing (TZS/mobile money), fully automated daily generation, brand kit system, Instagram auto-posting |

---

## 2. Keyword Research Strategy

### 2.1 Core Seed Keywords

| Cluster | Keywords |
|---|---|
| **Product type** | AI poster maker, AI social media poster generator, automated poster generator, daily poster generator |
| **African market** | social media design tool Africa, poster maker Tanzania, poster maker Kenya, poster maker Nigeria, African business marketing tool |
| **Use cases** | Instagram post generator, Facebook post design, promotional poster maker, brand poster maker |
| **Pain points** | post every day on Instagram, consistent social media posts, no designer needed, social media automation |
| **Competitor-aware** | Canva alternative Africa, free poster maker online, better than Canva for business |

### 2.2 Long-tail Targets (high intent, low competition)

```
"AI poster generator for small business Africa"
"automated daily Instagram posts for brands"
"how to post every day on Instagram without a designer"
"brand kit social media generator"
"AI social media content for African businesses"
"Tanzania social media marketing tool"
"auto generate Instagram posters"
"poster maker with brand colors"
```

### 2.3 Negative Keywords (avoid in content)

- Generic "free logo maker" / "photo editor" — wrong intent
- "flyer maker" unless pairing with "digital"

---

## 3. Page-by-Page Metadata Implementation

Paste the code blocks below into the corresponding `page.tsx` files. All follow Next.js 14 App Router `metadata` export conventions.

---

### 3.1 Root Layout (`app/layout.tsx`)

Replace the existing metadata with this enriched version:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL("https://artmasterpro.com"),
  title: {
    template: "%s | ArtMaster",
    default: "ArtMaster — AI Poster Generator for Your Brand",
  },
  description:
    "ArtMaster automatically generates stunning daily social media posters tailored to your brand. Set up your brand kit once, get AI-crafted posters every day. Built for African businesses, used worldwide.",
  keywords: [
    "AI poster generator",
    "social media poster maker",
    "automated brand posters",
    "daily Instagram posts",
    "AI marketing tool Africa",
    "brand kit poster generator",
  ],
  authors: [{ name: "ArtMaster", url: "https://artmasterpro.com" }],
  creator: "ArtMaster",
  publisher: "ArtMaster",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://artmasterpro.com",
    siteName: "ArtMaster",
    title: "ArtMaster — AI Poster Generator for Your Brand",
    description:
      "Generate stunning daily social media posters tailored to your brand. Set up once, post every day.",
    images: [
      {
        url: "/og/default.png",          // 1200×630 — create this asset
        width: 1200,
        height: 630,
        alt: "ArtMaster — AI Poster Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArtMaster — AI Poster Generator for Your Brand",
    description:
      "Generate stunning daily social media posters tailored to your brand. Set up once, post every day.",
    images: ["/og/default.png"],
    creator: "@artmasterpro",        // update to real handle
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
  alternates: {
    canonical: "https://artmasterpro.com",
  },
};
```

---

### 3.2 Landing Page (`app/page.tsx`)

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArtMaster — AI Poster Generator That Posts for You Every Day",
  description:
    "Stop manually creating social media posts. ArtMaster uses AI to generate beautiful branded posters every day, automatically — perfect for African businesses ready to grow online.",
  alternates: { canonical: "https://artmasterpro.com" },
  openGraph: {
    title: "ArtMaster — AI Poster Generator That Posts for You Every Day",
    description:
      "Stop manually creating social media posts. ArtMaster uses AI to generate beautiful branded posters every day, automatically.",
    url: "https://artmasterpro.com",
    images: [{ url: "/og/home.png", width: 1200, height: 630, alt: "ArtMaster landing page" }],
  },
};
```

---

### 3.3 Pricing Page (`app/pricing/page.tsx`)

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Affordable AI Poster Generation Plans",
  description:
    "Choose the ArtMaster plan that fits your brand. Start free, upgrade to Pro or Business for unlimited daily AI posters, multiple brand kits, and Instagram auto-posting.",
  alternates: { canonical: "https://artmasterpro.com/pricing" },
  openGraph: {
    title: "ArtMaster Pricing — AI Poster Generation Plans",
    description:
      "Free, Pro, and Business plans for AI-powered daily social media poster generation. Built for African businesses.",
    url: "https://artmasterpro.com/pricing",
    images: [{ url: "/og/pricing.png", width: 1200, height: 630, alt: "ArtMaster pricing" }],
  },
};
```

---

### 3.4 Login Page (`app/(auth)/login/page.tsx`)

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — ArtMaster",
  description: "Sign in to your ArtMaster account to manage your brand kits and AI-generated posters.",
  robots: { index: false, follow: false },
};
```

---

### 3.5 Signup Page (`app/(auth)/signup/page.tsx`)

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Free Account — ArtMaster",
  description:
    "Join ArtMaster for free. Set up your brand kit in minutes and start getting AI-generated social media posters every day.",
  alternates: { canonical: "https://artmasterpro.com/signup" },
  openGraph: {
    title: "Create Your Free ArtMaster Account",
    description:
      "Join thousands of African businesses using AI to post on social media every day — no designer needed.",
    url: "https://artmasterpro.com/signup",
    images: [{ url: "/og/signup.png", width: 1200, height: 630, alt: "Sign up for ArtMaster" }],
  },
};
```

---

### 3.6 Reset Password Page (`app/(auth)/reset-password/page.tsx`)

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password — ArtMaster",
  description: "Reset your ArtMaster account password.",
  robots: { index: false, follow: false },
};
```

---

### 3.7 Onboarding Page (`app/onboarding/page.tsx`)

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Your Brand Kit — ArtMaster",
  description: "Configure your brand colors, logo, tone, and audience. ArtMaster will use this to generate posters that look and feel like your brand every day.",
  robots: { index: false, follow: false },
};
```

---

### 3.8 Privacy Page (`app/privacy/page.tsx`) ✓ *Already set — enhance it:*

```typescript
export const metadata: Metadata = {
  title: "Privacy & Cookie Policy — ArtMaster",
  description:
    "Read ArtMaster's privacy policy to understand how we collect, use, and protect your personal data and how cookies are used on artmasterpro.com.",
  alternates: { canonical: "https://artmasterpro.com/privacy" },
  robots: { index: true, follow: false },
};
```

---

### 3.9 Terms Page (`app/terms/page.tsx`) ✓ *Already set — enhance it:*

```typescript
export const metadata: Metadata = {
  title: "Terms of Service — ArtMaster",
  description:
    "Read the terms and conditions governing your use of ArtMaster, the AI-powered daily poster generation platform.",
  alternates: { canonical: "https://artmasterpro.com/terms" },
  robots: { index: true, follow: false },
};
```

---

### 3.10 Data Deletion Page (`app/data-deletion/page.tsx`) ✓ *Keep as-is (required by Meta)*

---

### 3.11 Dashboard Pages (all noindex)

All `/dashboard/*` and `/admin/*` pages are authenticated, private, and must never be indexed. Add this to `app/dashboard/layout.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};
```

And to `app/admin/layout.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};
```

---

### 3.12 Checkout Page (noindex)

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — ArtMaster",
  description: "Complete your ArtMaster plan upgrade.",
  robots: { index: false, follow: false },
};
```

---

## 4. Structured Data (JSON-LD)

Add the following schemas to the pages indicated. Place them as `<script type="application/ld+json">` inside the page component, or use a `JsonLd` server component.

### 4.1 Organization Schema — Root Layout

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ArtMaster",
  "url": "https://artmasterpro.com",
  "logo": "https://artmasterpro.com/favicon/favicon-96x96.png",
  "description": "AI-powered daily social media poster generator built for African businesses.",
  "foundingLocation": "Tanzania",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@artmasterpro.com"
  },
  "sameAs": [
    "https://instagram.com/artmasterpro",
    "https://twitter.com/artmasterpro"
  ]
}
```

### 4.2 SoftwareApplication Schema — Landing Page (`app/page.tsx`)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ArtMaster",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://artmasterpro.com",
  "description": "AI-powered platform that automatically generates branded social media posters every day.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free Plan",
      "price": "0",
      "priceCurrency": "USD"
    },
    {
      "@type": "Offer",
      "name": "Pro Plan",
      "price": "10",
      "priceCurrency": "USD"
    },
    {
      "@type": "Offer",
      "name": "Business Plan",
      "price": "25",
      "priceCurrency": "USD"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "120"
  }
}
```

> Update `aggregateRating` with real numbers once you have reviews.

### 4.3 FAQPage Schema — Landing Page or Pricing Page

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is ArtMaster?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ArtMaster is an AI-powered platform that automatically generates branded social media posters every day based on your brand kit — your colors, logo, industry, and tone."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a designer to use ArtMaster?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. ArtMaster is designed for business owners and marketers with no design experience. You set up your brand kit once, and AI handles the rest."
      }
    },
    {
      "@type": "Question",
      "name": "Is ArtMaster free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, ArtMaster has a free plan that lets you try the platform with a limited number of poster generations. Pro and Business plans unlock unlimited daily posters and advanced features."
      }
    },
    {
      "@type": "Question",
      "name": "Does ArtMaster work for African businesses?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ArtMaster was built specifically for the African market with local payment options including mobile money (M-Pesa/Tigopesa) and pricing in TZS. It works for businesses worldwide."
      }
    },
    {
      "@type": "Question",
      "name": "Can ArtMaster post to Instagram automatically?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Connect your Instagram Business account and ArtMaster can automatically publish your daily generated poster at a scheduled time."
      }
    }
  ]
}
```

### 4.4 WebSite Schema (for Sitelinks Search Box) — Root Layout

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ArtMaster",
  "url": "https://artmasterpro.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://artmasterpro.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

---

## 5. `sitemap.xml` — Implementation

Create `app/sitemap.ts` (Next.js will auto-serve it at `/sitemap.xml`):

```typescript
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://artmasterpro.com";
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
```

> **Exclude:** `/dashboard/*`, `/admin/*`, `/checkout`, `/onboarding`, `/data-deletion` — these are either private or not useful for search indexing.

---

## 6. `robots.txt` — Implementation

Create `app/robots.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/signup", "/login", "/terms", "/privacy"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/checkout",
          "/onboarding",
          "/api/",
          "/_next/",
          "/data-deletion",
        ],
      },
    ],
    sitemap: "https://artmasterpro.com/sitemap.xml",
    host: "https://artmasterpro.com",
  };
}
```

---

## 7. Open Graph Image Assets — Required

Create these image files in the `public/og/` folder (1200×630 px, PNG):

| File | Used on | Suggested content |
|---|---|---|
| `public/og/default.png` | Fallback for all pages | ArtMaster logo + tagline on brand background |
| `public/og/home.png` | Landing page | Hero visual — phone with poster preview + tagline |
| `public/og/pricing.png` | Pricing page | Plan comparison cards + "Start Free Today" CTA |
| `public/og/signup.png` | Signup page | "Join thousands of businesses" + sample posters grid |

**Tip:** Use ArtMaster itself to generate these OG images!

---

## 8. Technical SEO Checklist

### 8.1 Core Web Vitals (must fix before going live)

| Signal | Target | Action |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5s | Lazy-load below-fold sections on landing page; serve hero image from Cloudinary with `f_auto,q_auto` |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Add explicit `width`/`height` to all `<Image>` elements (Next.js Image component already helps) |
| **INP** (Interaction to Next Paint) | < 200ms | Defer non-critical JS; avoid heavy state recomputation in poster list |
| **TTFB** | < 600ms | Use Vercel Edge for landing + pricing pages; enable ISR/SSG where possible |

### 8.2 Next.js-specific

- [ ] Set `metadataBase` in root layout (done in §3.1 above) — required for absolute OG URLs
- [ ] Convert landing page (`app/page.tsx`) to **static** if not using user-specific data (it isn't — do this)
- [ ] Add `export const revalidate = 3600` to pricing page to ISR-cache it
- [ ] Make sure `<html lang="en">` is set in root layout (helps accessibility + SEO)
- [ ] Ensure `next/image` is used for all images with proper `alt` text

### 8.3 Canonical URLs

Every public page should have `alternates.canonical` set to its absolute URL (examples included in §3 above). This prevents duplicate content penalties from `?ref=`, `?utm_source=` query params.

### 8.4 Heading Hierarchy

Audit these on the landing page:
- Exactly **one `<h1>`** per page (the hero headline)
- Section headlines should be `<h2>`, sub-items `<h3>`
- Never skip levels (don't jump from `<h1>` to `<h3>`)

---

## 9. Content SEO — Blog Strategy

Creating a blog at `/blog` is the highest-leverage SEO move. Suggested article topics targeting high-intent, low-competition keywords:

| Article Title | Target Keyword | Intent |
|---|---|---|
| "How to Post on Instagram Every Day Without a Designer" | `post on instagram every day` | Informational → Conversion |
| "10 Social Media Post Ideas for African Small Businesses" | `social media post ideas Africa` | Informational |
| "Canva vs ArtMaster: Which Is Better for African Businesses?" | `Canva alternative Africa` | Comparison → Conversion |
| "How to Create a Brand Kit in Under 5 Minutes" | `brand kit for social media` | Tutorial |
| "AI Social Media Marketing Tools for Tanzania in 2026" | `social media marketing tools Tanzania` | Local |
| "How to Set Up Instagram Auto-Posting for Your Business" | `instagram auto posting` | Tutorial → Conversion |
| "What Is a Brand Kit and Why Every Business Needs One" | `what is a brand kit` | Informational |
| "Best Social Media Scheduling Tools for Nigerian Businesses" | `social media tools Nigeria` | Local |

**Blog route:** Create `app/blog/page.tsx` (index) and `app/blog/[slug]/page.tsx` (post) with `generateMetadata` pulling title/description from each post's frontmatter or a CMS.

---

## 10. Local & Regional SEO

ArtMaster's strongest differentiation is Africa-first. Lean into it:

1. **Landing page copy** — mention Tanzania, Kenya, Nigeria, Ghana explicitly in body text (not just "Africa")
2. **hreflang tags** — add `en` as the primary language; if you add Swahili content later, add `sw`
3. **Google Business Profile** — create one for ArtMaster even if SaaS; helps brand searches
4. **Local link building** — get listed in:
   - Startuplist Africa
   - Disrupt Africa
   - Kenya/Nigeria/Tanzania tech media (Techpoint Africa, Techmoran, etc.)

---

## 11. Link Building Priorities

| Tactic | Effort | Impact |
|---|---|---|
| Submit to Product Hunt | Low | High (backlinks + traffic) |
| African tech directories (Startuplist Africa, Weetracker) | Low | Medium |
| Guest posts on Techpoint Africa, Disrupt Africa | Medium | High |
| Reach out to African marketing blogs for reviews | Medium | High |
| Create free "social media calendar template" PDF (linkbait) | Medium | High |
| Submit to SaaS directories: G2, Capterra, GetApp | Low | High (trust signals) |

---

## 12. Implementation Priority Order

Do these in order for maximum impact with minimum effort:

1. **[P0 — Do today]** Set `metadataBase` + title template in root layout (§3.1)
2. **[P0 — Do today]** Add metadata to `/` landing page (§3.2)
3. **[P0 — Do today]** Add metadata to `/pricing` (§3.3)
4. **[P0 — Do today]** Add `noindex` to dashboard and admin layouts (§3.11)
5. **[P0 — Do today]** Create `app/sitemap.ts` and `app/robots.ts` (§5, §6)
6. **[P1 — This week]** Add metadata to `/signup` and auth pages (§3.4–3.6)
7. **[P1 — This week]** Add JSON-LD schemas to landing page (§4.2–4.3)
8. **[P1 — This week]** Create OG image assets (§7)
9. **[P2 — This month]** Submit to Product Hunt + African tech directories (§11)
10. **[P2 — This month]** Start blog with first 3 articles (§9)
11. **[P3 — Next quarter]** G2/Capterra listings + review campaigns

---

## 13. Monitoring Setup

| Tool | Purpose | Setup |
|---|---|---|
| **Google Search Console** | Track impressions, clicks, crawl errors | Add `artmasterpro.com`, verify via HTML tag in root layout |
| **Google Analytics 4** | Traffic analysis, conversion tracking | Add GA4 script to root layout |
| **Vercel Analytics** | Core Web Vitals, real-user data | Already built in — enable in Vercel dashboard |
| **Ahrefs / Semrush** | Keyword rank tracking, backlink monitoring | Paid — start when you have budget |

### Google Search Console Verification (add to root layout metadata)

```typescript
verification: {
  google: "YOUR_GOOGLE_VERIFICATION_CODE",
  // yandex: "...",
  // bing: "...",
}
```

---

*Generated for ArtMaster — artmasterpro.com — March 2026*
