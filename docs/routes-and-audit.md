PATH | TYPE | AUTH_REQUIRED | HAS_DYNAMIC_SEGMENT | FILE_PATH
/ | page | no | no | app/page.tsx
/login | page | no | no | app/(auth)/login/page.tsx
/signup | page | no | no | app/(auth)/signup/page.tsx
/reset-password | page | no | no | app/(auth)/reset-password/page.tsx
/onboarding | page | yes | no | app/onboarding/page.tsx
/dashboard | page | yes | no | app/dashboard/page.tsx
/dashboard/create | page | yes | no | app/dashboard/create/page.tsx
/dashboard/posters | page | yes | no | app/dashboard/posters/page.tsx
/dashboard/brand-kits | page | yes | no | app/dashboard/brand-kits/page.tsx
/dashboard/brand-kits/new | page | yes | no | app/dashboard/brand-kits/new/page.tsx
/dashboard/brand-kits/[id]/edit | page | yes | yes | app/dashboard/brand-kits/[id]/edit/page.tsx
/dashboard/schedule | page | yes | no | app/dashboard/schedule/page.tsx
/dashboard/settings | page | yes | no | app/dashboard/settings/page.tsx
/dashboard/profile | page | yes | no | app/dashboard/profile/page.tsx
/dashboard/upgrade | page | yes | no | app/dashboard/upgrade/page.tsx
/checkout | page | yes | no | app/checkout/page.tsx
/admin | page | yes | no | app/admin/page.tsx
/admin/users | page | yes | no | app/admin/users/page.tsx
/admin/users/[uid] | page | yes | yes | app/admin/users/[uid]/page.tsx
/admin/brand-kits | page | yes | no | app/admin/brand-kits/page.tsx
/admin/artmaster-kit | page | yes | no | app/admin/artmaster-kit/page.tsx
/admin/create | page | yes | no | app/admin/create/page.tsx
/admin/schedule | page | yes | no | app/admin/schedule/page.tsx
/pricing | page | no | no | app/pricing/page.tsx
/privacy | page | no | no | app/privacy/page.tsx
/terms | page | no | no | app/terms/page.tsx
/data-deletion | page | no | no | app/data-deletion/page.tsx
 | layout | no | no | app/layout.tsx
 | layout | no | no | app/(auth)/layout.tsx
 | layout | no | no | app/dashboard/layout.tsx
 | layout | no | no | app/onboarding/layout.tsx
 | layout | yes | no | app/admin/layout.tsx
/api/auth/session | api | no | no | app/api/auth/session/route.ts
/api/auth/logout | api | no | no | app/api/auth/logout/route.ts
/api/me | api | yes | no | app/api/me/route.ts
/api/generate | api | yes | no | app/api/generate/route.ts
/api/posters | api | yes | no | app/api/posters/route.ts
/api/posters/[posterId]/download | api | yes | yes | app/api/posters/[posterId]/download/route.ts
/api/posters/[posterId]/duplicate | api | yes | yes | app/api/posters/[posterId]/duplicate/route.ts
/api/brand-kits | api | yes | no | app/api/brand-kits/route.ts
/api/brand-kits/[id] | api | yes | yes | app/api/brand-kits/[id]/route.ts
/api/brand-kits/[id]/analyze | api | yes | yes | app/api/brand-kits/[id]/analyze/route.ts
/api/brand-kits/coach | api | yes | no | app/api/brand-kits/coach/route.ts
/api/recommendations | api | yes | no | app/api/recommendations/route.ts
/api/templates | api | yes | no | app/api/templates/route.ts
/api/templates/suggest-search | api | yes | no | app/api/templates/suggest-search/route.ts
/api/schedule | api | yes | no | app/api/schedule/route.ts
/api/social/connect/instagram | api | no | no | app/api/social/connect/instagram/route.ts
/api/social/callback/instagram | api | no | no | app/api/social/callback/instagram/route.ts
/api/social/instagram/post | api | yes | no | app/api/social/instagram/post/route.ts
/api/social/instagram/disconnect | api | yes | no | app/api/social/instagram/disconnect/route.ts
/api/social/instagram/deauthorize | api | no | no | app/api/social/instagram/deauthorize/route.ts
/api/social/instagram/delete-data | api | no | no | app/api/social/instagram/delete-data/route.ts
/api/upload/logo | api | yes | no | app/api/upload/logo/route.ts
/api/upload/inspiration | api | yes | no | app/api/upload/inspiration/route.ts
/api/payments/create | api | yes | no | app/api/payments/create/route.ts
/api/webhooks/snippe | api | no | no | app/api/webhooks/snippe/route.ts
/api/cron/scheduled-generation | api | no | no | app/api/cron/scheduled-generation/route.ts
/api/freepik/webhook | api | no | no | app/api/freepik/webhook/route.ts
/api/admin/stats | api | yes | no | app/api/admin/stats/route.ts
/api/admin/users | api | yes | no | app/api/admin/users/route.ts
/api/admin/users/[uid] | api | yes | yes | app/api/admin/users/[uid]/route.ts
/api/admin/brand-kits | api | yes | no | app/api/admin/brand-kits/route.ts
/api/admin/artmaster-kit | api | yes | no | app/api/admin/artmaster-kit/route.ts
/api/admin/generate | api | yes | no | app/api/admin/generate/route.ts
/api/admin/recommendations | api | yes | no | app/api/admin/recommendations/route.ts
/api/admin/posts | api | yes | no | app/api/admin/posts/route.ts
/api/admin/schedule | api | yes | no | app/api/admin/schedule/route.ts
 | middleware | yes | no | middleware.ts

## COMPONENTS

FILE_PATH | USED_ON_PAGES
components/auth/GoogleIcon.tsx | /login, /signup
components/auth/AuthFormPanel.tsx | /login, /signup (via (auth) layout)
components/auth/AuthLeftPanel.tsx | /login, /signup (via (auth) layout)
components/auth/AuthShared.tsx | /login, /signup, /reset-password
components/CookieConsent.tsx | (root layout – all pages)
components/CookiePreferencesLink.tsx | /, /pricing, /privacy
components/PricingModal.tsx | /dashboard/create, /dashboard (DashboardPlanTrigger)
components/pricing/PricingPlans.tsx | /pricing, /dashboard/upgrade
components/ui/Input.tsx | unknown
components/ui/Button.tsx | /dashboard/profile
components/dashboard/QuickActions.tsx | /dashboard (DashboardContent)
components/dashboard/BrandKitCard.tsx | /dashboard (DashboardContent)
components/dashboard/RecentPosters.tsx | /dashboard (DashboardContent)
components/dashboard/DashboardNav.tsx | /dashboard/* (dashboard layout)
components/BrandKitWizard.tsx | /onboarding, /dashboard/brand-kits/new (NewBrandKitForm)

## PUBLIC_ASSETS

FILE_PATH | TYPE
public/favicon/site.webmanifest | other
public/herodashboard.png | image
public/favicon/favicon.svg | image
public/favicon/web-app-manifest-512x512.png | image
public/artmasterwordmarklogo-03-03.webp | image
public/favicon/favicon-96x96.png | image
public/favicon/apple-touch-icon.png | image
public/favicon/web-app-manifest-192x192.png | image
public/favicon/favicon.ico | image

## ENV_KEYS

KEY | USED_IN_FILE
USE_FREEPIK_IMPROVE_PROMPT | lib/generation/runGeneration.ts
FREEPIK_API_KEY | lib/freepik/generateImage.ts, lib/freepik/resources.ts, lib/freepik/improvePrompt.ts, lib/freepik/imageToPrompt.ts, lib/generation/imageProvider.ts, lib/generation/generateImage.ts
OPENAI_API_KEY | lib/generation/generateImagePrompt.ts, lib/ai/analyzeBrandKit.ts, lib/generation/generateCopy.ts, app/api/brand-kits/coach/route.ts, app/api/recommendations/route.ts, app/api/templates/suggest-search/route.ts, app/api/admin/recommendations/route.ts
NODE_ENV | app/api/auth/session/route.ts
SNIPPE_WEBHOOK_SECRET | app/api/webhooks/snippe/route.ts
NEXT_PUBLIC_APP_URL | app/api/payments/create/route.ts, app/api/auth/logout/route.ts
SNIPPE_API_KEY | app/api/payments/create/route.ts
INSTAGRAM_APP_SECRET | app/api/social/instagram/delete-data/route.ts, app/api/social/callback/instagram/route.ts, app/api/social/instagram/deauthorize/route.ts
FACEBOOK_APP_ID | app/api/social/connect/instagram/route.ts, app/api/social/callback/instagram/route.ts
FACEBOOK_REDIRECT_URI | app/api/social/connect/instagram/route.ts
FACEBOOK_APP_SECRET | app/api/social/callback/instagram/route.ts, app/api/social/instagram/deauthorize/route.ts, app/api/social/instagram/delete-data/route.ts
FIREBASE_ADMIN_PRIVATE_KEY | scripts/set-admin.ts, lib/firebase/admin.ts
FIREBASE_ADMIN_CLIENT_EMAIL | scripts/set-admin.ts, lib/firebase/admin.ts
FIREBASE_ADMIN_PROJECT_ID | scripts/set-admin.ts, lib/firebase/admin.ts
FONTCONFIG_PATH | lib/generation/compositePoster.ts
CRON_SECRET | app/api/cron/scheduled-generation/route.ts
GEMINI_API_KEY | lib/gemini/nanoBanana.ts
CLOUDINARY_CLOUD_NAME | lib/cloudinary.ts
CLOUDINARY_API_KEY | lib/cloudinary.ts
CLOUDINARY_API_SECRET | lib/cloudinary.ts
NEXT_PUBLIC_FIREBASE_API_KEY | lib/firebase/client.ts
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | lib/firebase/client.ts
NEXT_PUBLIC_FIREBASE_PROJECT_ID | lib/firebase/client.ts
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | lib/firebase/client.ts
NEXT_PUBLIC_FIREBASE_APP_ID | lib/firebase/client.ts
EVPS_API_USER | vps-panel/lib/evps.ts
EVPS_API_KEY | vps-panel/lib/evps.ts

## FIREBASE_COLLECTIONS

COLLECTION_PATH | USED_IN_FILE
users | app/api/social/instagram/disconnect/route.ts, app/api/admin/users/[uid]/route.ts, app/api/recommendations/route.ts, app/api/brand-kits/[id]/route.ts, app/api/posters/[posterId]/download/route.ts, app/api/cron/scheduled-generation/route.ts, app/api/posters/[posterId]/duplicate/route.ts, app/api/payments/create/route.ts, app/api/brand-kits/route.ts, app/api/brand-kits/[id]/analyze/route.ts, app/api/schedule/route.ts, app/api/social/instagram/post/route.ts, app/api/generate/route.ts, app/api/me/route.ts, app/api/auth/session/route.ts, app/api/webhooks/snippe/route.ts, app/api/admin/stats/route.ts, app/api/admin/users/route.ts, app/api/social/callback/instagram/route.ts, app/api/social/instagram/deauthorize/route.ts, app/api/social/instagram/delete-data/route.ts, app/api/templates/suggest-search/route.ts, app/dashboard/page.tsx, app/dashboard/brand-kits/page.tsx, app/dashboard/brand-kits/new/page.tsx, app/dashboard/brand-kits/actions.ts, lib/generation/generateRecommendations.ts, lib/generation/runGeneration.ts, lib/trial.ts, lib/user-plan.ts
users/brand_kits | app/api/admin/users/[uid]/route.ts, app/api/brand-kits/[id]/route.ts, app/api/brand-kits/route.ts, app/api/brand-kits/[id]/analyze/route.ts, app/api/schedule/route.ts, app/api/recommendations/route.ts, app/api/templates/suggest-search/route.ts, app/dashboard/page.tsx, app/dashboard/brand-kits/page.tsx, app/dashboard/brand-kits/new/page.tsx, app/dashboard/brand-kits/actions.ts, lib/generation/runGeneration.ts
users/posters | app/api/admin/users/[uid]/route.ts, app/api/posters/[posterId]/download/route.ts, app/api/posters/route.ts, app/api/posters/[posterId]/duplicate/route.ts, app/api/social/instagram/post/route.ts, app/api/generate/route.ts, app/api/me/route.ts, lib/generation/runGeneration.ts
schedules | app/api/cron/scheduled-generation/route.ts, app/api/schedule/route.ts, app/api/me/route.ts
payments | app/api/payments/create/route.ts, app/api/webhooks/snippe/route.ts, app/api/admin/stats/route.ts
recommendationHistory | lib/generation/generateRecommendations.ts
data_deletion_requests | app/api/social/instagram/delete-data/route.ts
admin_posts | app/api/admin/posts/route.ts, app/api/admin/generate/route.ts
admin_config (doc: artmaster_brand_kit) | app/api/admin/artmaster-kit/route.ts

## EXTERNAL_APIS

SERVICE | ENDPOINT_OR_SDK | USED_IN_FILE
Snippe | https://api.snippe.sh/v1/payments | lib/snippe.ts
Freepik (Seedream) | https://api.freepik.com/v1/ai/text-to-image/seedream-v4-5 | lib/freepik/generateImage.ts
Freepik (Mystic) | https://api.freepik.com/v1/ai/mystic | lib/freepik/generateImage.ts, lib/generation/imageProvider.ts
Freepik (improve-prompt) | https://api.freepik.com/v1/ai/improve-prompt | lib/freepik/improvePrompt.ts
Freepik (image-to-prompt) | https://api.freepik.com/v1/ai/image-to-prompt | lib/freepik/imageToPrompt.ts
Freepik (resources) | https://api.freepik.com/v1/resources | lib/freepik/resources.ts
Freepik (text-to-image/mystic) | https://api.freepik.com/v1/ai (mystic, text-to-image) | lib/generation/generateImage.ts
OpenAI | OpenAI SDK / API | lib/generation/generateImagePrompt.ts, lib/ai/analyzeBrandKit.ts, lib/generation/generateCopy.ts, app/api/brand-kits/coach/route.ts, app/api/recommendations/route.ts, app/api/templates/suggest-search/route.ts, app/api/admin/recommendations/route.ts
Cloudinary | cloudinary SDK (res.cloudinary.com) | lib/cloudinary.ts, next.config.js
Google Gemini | @google/genai SDK | lib/gemini/nanoBanana.ts
Firebase Auth | firebase-admin/auth, firebase/auth | lib/firebase/admin.ts, lib/firebase/client.ts, lib/firebase/verify-auth.ts
Meta / Instagram Graph | OAuth + Graph API | app/api/social/connect/instagram/route.ts, app/api/social/callback/instagram/route.ts, app/api/social/instagram/post/route.ts, app/api/social/instagram/disconnect/route.ts, app/api/social/instagram/deauthorize/route.ts, app/api/social/instagram/delete-data/route.ts
