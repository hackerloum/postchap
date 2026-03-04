/**
 * Recommendation brainstorm engine.
 * Builds GPT-4o system prompts with locked visual archetypes,
 * industry-specific content matrices, freshness injection, and
 * cross-session deduplication via Firestore recommendation history.
 */

import { getFirestore } from "firebase-admin/firestore";
import OpenAI from "openai";
import type { Recommendation } from "@/types/generation";

type Firestore = ReturnType<typeof getFirestore>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VISUAL ARCHETYPES
// One per slot — mandatory assignment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VISUAL_ARCHETYPES = [
  {
    slot: 1,
    archetype: "TYPOGRAPHIC POWER",
    brief:
      "Typography IS the design. No photography. Pure type, negative space, and one accent color. Think: NYT Magazine cover, Pentagram poster, Emigre.",
    forbid: "No photos. No illustrations. No people.",
  },
  {
    slot: 2,
    archetype: "HUMAN EMOTION",
    brief:
      "A single real human face or hands tells the entire story. The emotion in the face IS the headline. Tight crop. Cinematic. Think: Annie Leibovitz, Sebastião Salgado, Helmut Newton.",
    forbid: "No stock-photo smiles. No group shots. No product placement.",
  },
  {
    slot: 3,
    archetype: "FLAT GRAPHIC / EDITORIAL",
    brief:
      "Bold geometric illustration. Flat colors. Graphic shapes. Think: Bauhaus poster, Saul Bass film titles, vintage travel poster.",
    forbid: "No photography. No gradients. No 3D.",
  },
  {
    slot: 4,
    archetype: "DARK LUXURY",
    brief:
      "Deep black background. Single directional light source. One hero subject. Extreme negative space. Think: Dior perfume ad, Apple product shot, Lamborghini campaign.",
    forbid:
      "No busy backgrounds. No multiple subjects. No bright colors except one accent.",
  },
  {
    slot: 5,
    archetype: "ENVIRONMENTAL / SCENE",
    brief:
      "A specific real-world place, environment, or moment. Time of day matters. Atmospheric. Cinematic wide shot or intimate detail. Think: National Geographic, Magnum Photos.",
    forbid: "No studio shots. No white backgrounds. No floating objects.",
  },
  {
    slot: 6,
    archetype: "BOLD CONTRAST / SPLIT",
    brief:
      "Hard geometric split: two halves, two colors, two ideas in tension. The composition creates the message. Think: Otl Aicher Olympics poster, IKEA catalog, Swiss International Style.",
    forbid: "No gradients. No soft edges. No more than 3 colors.",
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INDUSTRY-SPECIFIC CONTENT MATRICES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ContentMatrix {
  promotionAngles: string[];
  emotionAngles: string[];
  culturalAngles: string[];
  productAngles: string[];
  communityAngles: string[];
}

const INDUSTRY_CONTENT_MATRIX: Record<string, ContentMatrix> = {
  education: {
    promotionAngles: [
      "End-of-term exam prep offer",
      "New semester enrollment window",
      "Early bird course discount",
      "Sibling referral program",
      "Group study bundle deal",
    ],
    emotionAngles: [
      "First-generation student pride",
      "The moment a concept finally clicks",
      "Late-night study session perseverance",
      "Parent watching child graduate",
      "Student landing first job after course",
    ],
    culturalAngles: [
      "Back to school season in [country]",
      "National exam period stress relief",
      "School holiday learning continuity",
      "Ramadan study schedule tips",
      "African Youth Day education focus",
    ],
    productAngles: [
      "New course launch announcement",
      "Tutor availability reminder",
      "Study tool or resource spotlight",
      "Practice test or mock exam offer",
      "Certificate program highlight",
    ],
    communityAngles: [
      "Student success story spotlight",
      "Teacher or mentor appreciation",
      "Alumni achievement showcase",
      "Study group formation call",
      "Community tutoring program",
    ],
  },
  retail: {
    promotionAngles: [
      "Weekend flash sale",
      "New arrival drop",
      "Buy 2 get 1 free",
      "End of season clearance",
      "Loyalty customer exclusive",
    ],
    emotionAngles: [
      "The feeling of wearing something new",
      "Gift-giving joy",
      "Quality that outlasts trends",
      "Local craftsmanship pride",
      "Customer transformation story",
    ],
    culturalAngles: [
      "Ramadan / Eid gifting season",
      "Christmas and New Year shopping",
      "African Union Day celebration",
      "Mothers Day / Fathers Day",
      "Local harvest festival tie-in",
    ],
    productAngles: [
      "New collection reveal",
      "Best seller spotlight",
      "Behind the scenes: how it's made",
      "Product care tips",
      "Color of the season feature",
    ],
    communityAngles: [
      "Local supplier partnership",
      "Customer photo of the week",
      "Community market participation",
      "Staff member spotlight",
      "Charity tie-in campaign",
    ],
  },
  finance: {
    promotionAngles: [
      "Zero-fee transfer this week only",
      "New account opening bonus",
      "Referral reward campaign",
      "Loan rate reduction window",
      "Investment product launch",
    ],
    emotionAngles: [
      "First home purchase moment",
      "Business owner paying employees",
      "Child's school fees secured",
      "Retirement security peace of mind",
      "Overcoming debt freedom moment",
    ],
    culturalAngles: [
      "End of financial year planning",
      "Salary day reminder",
      "Harvest season savings tips",
      "January new year financial reset",
      "Eid/Christmas financial planning",
    ],
    productAngles: [
      "Mobile banking feature spotlight",
      "Savings account interest rate",
      "Insurance product explainer",
      "Investment calculator CTA",
      "Loan eligibility checker",
    ],
    communityAngles: [
      "SME success story",
      "Financial literacy tip of the week",
      "Women in business spotlight",
      "Youth entrepreneur feature",
      "Community savings group story",
    ],
  },
  healthcare: {
    promotionAngles: [
      "Free consultation this week",
      "Vaccination drive announcement",
      "Health screening package offer",
      "Membership plan discount",
      "Referral discount for new patients",
    ],
    emotionAngles: [
      "Doctor-patient trust moment",
      "Recovery and strength story",
      "Maternal health pride",
      "Elderly care dignity",
      "Mental health awareness vulnerability",
    ],
    culturalAngles: [
      "World Health Day campaign",
      "Malaria prevention season",
      "Ramadan health and fasting tips",
      "Back to school health checks",
      "Dry season respiratory health",
    ],
    productAngles: [
      "New equipment or technology",
      "Specialist service spotlight",
      "Telehealth availability reminder",
      "Pharmacy product feature",
      "Wellness program launch",
    ],
    communityAngles: [
      "Community health camp announcement",
      "Patient recovery testimonial",
      "Staff nurse or doctor spotlight",
      "Health tip of the week",
      "Partnership with local NGO",
    ],
  },
  technology: {
    promotionAngles: [
      "Free trial extended offer",
      "Annual plan discount window",
      "New feature early access",
      "Bundle pricing campaign",
      "Startup discount program",
    ],
    emotionAngles: [
      "Founder solving a problem they lived",
      "Developer staying late to ship",
      "Business owner seeing first dashboard",
      "Team celebrating a product launch",
      "User achieving goal with the tool",
    ],
    culturalAngles: [
      "Africa Tech Week / AfriTech",
      "Digital transformation push in [country]",
      "Youth coding initiative",
      "Internet access expansion moment",
      "E-government adoption campaign",
    ],
    productAngles: [
      "Feature of the week spotlight",
      "Integration announcement",
      "Performance milestone",
      "Security update reassurance",
      "API or developer tools launch",
    ],
    communityAngles: [
      "Customer case study",
      "Developer community shoutout",
      "Beta tester appreciation",
      "Open source contribution",
      "Hackathon or event sponsorship",
    ],
  },
  hospitality: {
    promotionAngles: [
      "Weekend getaway package",
      "Early booking discount",
      "Complimentary upgrade offer",
      "Group booking deal",
      "Loyalty member exclusive rate",
    ],
    emotionAngles: [
      "Arrival feeling — stepping into luxury",
      "Family reunion at the property",
      "Honeymoon suite emotion",
      "Business traveler relief at check-in",
      "Staff warmth and hospitality moment",
    ],
    culturalAngles: [
      "Long weekend and public holiday packages",
      "Ramadan iftar dining experience",
      "Christmas and New Year celebration",
      "Local festival accommodation",
      "Safari/tourism season opening",
    ],
    productAngles: [
      "New restaurant menu launch",
      "Spa or wellness facility feature",
      "Conference room availability",
      "Rooftop bar or view spotlight",
      "Room renovation announcement",
    ],
    communityAngles: [
      "Local supplier food sourcing story",
      "Staff member of the month",
      "Community event hosting",
      "Charity dinner announcement",
      "Guest review spotlight",
    ],
  },
};

const DEFAULT_CONTENT_MATRIX: ContentMatrix = {
  promotionAngles: [
    "Limited time offer",
    "New product launch",
    "Referral campaign",
    "Bundle deal",
    "Seasonal discount",
  ],
  emotionAngles: [
    "Customer success moment",
    "Founder story",
    "Community pride",
    "Behind the scenes",
    "Staff dedication",
  ],
  culturalAngles: [
    "Local holiday tie-in",
    "Weekend relevance",
    "Season change",
    "National awareness day",
    "Month theme",
  ],
  productAngles: [
    "Feature spotlight",
    "How it works",
    "Before and after",
    "Product comparison",
    "Quality demonstration",
  ],
  communityAngles: [
    "Customer testimonial",
    "Team spotlight",
    "Partner shoutout",
    "Event announcement",
    "Milestone celebration",
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FRESHNESS INJECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface BrandKitContext {
  brandName?: string;
  industry?: string;
  tone?: string;
  language?: string;
  targetAudience?: string;
  brandLocation?: {
    country?: string;
    city?: string;
    continent?: string;
    currency?: string;
    languages?: string[];
  };
}

function buildFreshnessContext(brandKit: BrandKitContext): string {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dayNum = now.getDate();
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const hour = now.getHours();
  const weekNum = Math.ceil(dayNum / 7);
  const entropyKey = Date.now().toString(36).slice(-6);

  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const weekContext =
    weekNum === 1
      ? "start of the month — fresh energy, new budgets"
      : weekNum === 2
        ? "second week — momentum building"
        : weekNum === 3
          ? "mid-month — check-in time"
          : "end of month — wrap up, prepare for next month";

  const dayContext: Record<string, string> = {
    Monday: "Start of week energy. Motivational, goal-setting, ambitious tone.",
    Tuesday: "Execution day. Practical, focused, here's-how-to-do-it tone.",
    Wednesday: "Mid-week. Beat the slump. Engagement and community tone.",
    Thursday: "Almost weekend. Urgency on promotions. \"Don't miss out\" energy.",
    Friday: "Weekend prep. Celebration. Reward yourself. Lighter tone.",
    Saturday: "Weekend mode. Leisure, family, enjoyment, treat yourself.",
    Sunday: "Reflection and preparation. Plan the week. Inspirational tone.",
  };

  return `
FRESHNESS CONTEXT — Session ${entropyKey}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Today:        ${dayName}, ${dayNum} ${monthName}
Time:         ${timeOfDay}
Week context: ${weekContext}
Day energy:   ${dayContext[dayName] ?? "Standard energy."}
Brand:        ${brandKit.brandName} (${brandKit.industry})
Market:       ${brandKit.brandLocation?.city ?? ""}, ${brandKit.brandLocation?.country ?? ""}
Continent:    ${brandKit.brandLocation?.continent ?? "Africa"}
Language:     ${brandKit.language ?? "English"}
Currency:     ${brandKit.brandLocation?.currency ?? "USD"}
Tone:         ${brandKit.tone ?? "professional"}

UNIQUENESS REQUIREMENT:
This session key is ${entropyKey}. Your 6 concepts MUST be
completely different from any previous session. The session key
is your proof that this output is unique. Include it nowhere
in your output — it is only for internal variance seeding.
`.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN SYSTEM PROMPT BUILDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildRecommendationSystemPrompt(
  brandKit: BrandKitContext,
  isAdmin = false
): string {
  const industry = brandKit.industry?.toLowerCase() ?? "general";
  const matrix = INDUSTRY_CONTENT_MATRIX[industry] ?? DEFAULT_CONTENT_MATRIX;
  const freshness = buildFreshnessContext(brandKit);

  const now = new Date();
  const todayPromo =
    matrix.promotionAngles[now.getDate() % matrix.promotionAngles.length];
  const todayEmotion =
    matrix.emotionAngles[now.getHours() % matrix.emotionAngles.length];
  const todayCultural =
    matrix.culturalAngles[now.getDay() % matrix.culturalAngles.length];

  return `
You are ${
    isAdmin
      ? "a combination of David Droga (narrative), Paula Scher (bold typography), and Dieter Rams (function-first). You think in campaigns, not posts."
      : `a senior creative director with 15 years specialising in social media marketing for ${brandKit.brandLocation?.continent ?? "African"} businesses. You know what works in ${brandKit.brandLocation?.country ?? "this market"}.`
  }

${freshness}

YOUR TASK:
Generate exactly 6 VISUALLY DISTINCT poster concepts for ${brandKit.brandName}.

VISUAL ARCHETYPE ASSIGNMENT (MANDATORY — one per slot):
Each concept MUST use its assigned visual archetype.
These are not suggestions — they are locked assignments.

${VISUAL_ARCHETYPES.map(
    (a) => `
SLOT ${a.slot} — ${a.archetype}
Brief:   ${a.brief}
Forbid:  ${a.forbid}
`
  ).join("\n")}

CONTENT ANGLE MANDATES (use these — do not invent generic alternatives):
- At least one concept MUST be about: "${todayPromo}"
- At least one concept MUST evoke this emotion: "${todayEmotion}"
- At least one concept MUST reference this cultural moment: "${todayCultural}"
- The remaining 3 concepts must use different angles from these categories:
  ${JSON.stringify(Object.keys(matrix))}

HEADLINE QUALITY STANDARD:
Every suggestedHeadline must pass this test:
  ✓ Could this appear on a billboard on Lagos Island or Nairobi CBD?
  ✓ Would a 14-year-old understand it immediately?
  ✓ Does it create a specific feeling, not just describe a product?
  ✗ REJECT: "Empowering Your Journey" (vague)
  ✗ REJECT: "Quality You Can Trust" (generic)
  ✗ REJECT: "Your Success Is Our Priority" (corporate filler)
  ✓ ACCEPT: "Back to School Starts Now" (specific)
  ✓ ACCEPT: "Your Exam. Your Rules." (empowering)
  ✓ ACCEPT: "Half Price Ends Midnight" (urgent, specific)

VISUAL MOOD STANDARD:
Every visualMood must reference a SPECIFIC visual director, film, or artwork:
  ✗ REJECT: "dark and moody with warm tones"
  ✗ REJECT: "vibrant and energetic"
  ✓ ACCEPT: "Caravaggio chiaroscuro — single candle light from left, 80% shadow"
  ✓ ACCEPT: "Wes Anderson symmetry — flat-on composition, pastel blocks, centered subject"
  ✓ ACCEPT: "Saul Bass reduction — one shape, one color, total negative space"
  ✓ ACCEPT: "Alvin Lustig poster — geometric forms, sans-serif, two-color maximum"

ABSOLUTE BANS — these make the output look like a cheap AI poster:
  ✗ Globe or world map imagery
  ✗ Generic spotlight on dark background
  ✗ Hands on keyboards
  ✗ Floating smartphone mockups
  ✗ Blue or purple gradient tech backgrounds
  ✗ Rocket ship or "launch" metaphors
  ✗ Person holding a sign with text
  ✗ Generic "teamwork" handshake image
  ✗ Vague "success" imagery (mountain summit, sunrise, stairs)
  ✗ Any stock photo cliché

INDUSTRY CONTEXT for ${brandKit.brandName}:
  Industry:    ${brandKit.industry}
  Country:     ${brandKit.brandLocation?.country ?? "Unknown"}
  City:        ${brandKit.brandLocation?.city ?? "Unknown"}
  Currency:    ${brandKit.brandLocation?.currency ?? "USD"}
  Tone:        ${brandKit.tone ?? "professional"}
  Target:      ${brandKit.targetAudience ?? "general audience"}
  Languages:   ${brandKit.language ?? "English"}

DIVERSITY CHECK — before returning, verify:
  [ ] All 6 concepts have DIFFERENT visual archetypes (no two look the same)
  [ ] All 6 headlines have DIFFERENT emotional tones
  [ ] All 6 categories are DIFFERENT
  [ ] None of the 6 could be confused for a generic AI output
  [ ] If someone saw all 6 together, would they believe they came from
      6 different creative directors? If yes, output. If no, redo.

OUTPUT RULES:
  - Return ONLY a raw JSON array. No markdown. No explanation. No code fences.
  - Exactly 6 objects. No more. No less.
  - Each object MUST include these fields:
    {
      "id": "unique_string",
      "theme": "2-4 word theme name",
      "topic": "Specific topic sentence",
      "description": "3 sentences: what to show, what emotion, what action.",
      "suggestedHeadline": "Billboard-quality headline (max 8 words)",
      "suggestedCta": "Sharp CTA (max 5 words)",
      "visualMood": "Specific art direction referencing a director or artwork (2 sentences)",
      "urgency": "high | medium | low",
      "reason": "Why this works today — 1 sentence",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"],
      "category": "promotion | occasion | engagement | brand | product | seasonal"
    }
  - If any field is weak, regenerate that concept entirely.
`.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEDUPLICATION — Firestore history
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getPreviousThemes(
  db: Firestore,
  uid: string,
  brandKitId: string
): Promise<string[]> {
  try {
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("recommendationHistory")
      .doc(brandKitId)
      .get();
    return (snap.data()?.recentThemes as string[]) ?? [];
  } catch {
    return [];
  }
}

export async function saveThemes(
  db: Firestore,
  uid: string,
  brandKitId: string,
  newThemes: string[]
): Promise<void> {
  try {
    const existing = await getPreviousThemes(db, uid, brandKitId);
    const updated = [...newThemes, ...existing].slice(0, 12);
    await db
      .collection("users")
      .doc(uid)
      .collection("recommendationHistory")
      .doc(brandKitId)
      .set({ recentThemes: updated, updatedAt: new Date() });
  } catch {
    // Non-critical — don't throw
  }
}

export function injectDeduplication(
  systemPrompt: string,
  previousThemes: string[]
): string {
  if (!previousThemes.length) return systemPrompt;

  return (
    systemPrompt +
    `

DEDUPLICATION — DO NOT REPEAT THESE RECENT THEMES:
The user has recently seen these concepts. Do not generate
anything similar to these themes or headlines:

${previousThemes.map((t, i) => `  ${i + 1}. "${t}"`).join("\n")}

Generate concepts that are completely unrelated to the above.
`
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVER-SIDE: get recommendations for cron or API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Load brand kit, generate 6 recommendations via OpenAI, persist themes, return array.
 * Used by POST /api/recommendations (with auth) and by the scheduled-generation cron (no user token).
 * Requires OPENAI_API_KEY. Throws on missing brand kit or API key.
 */
export async function getRecommendationsForBrandKit(
  db: Firestore,
  uid: string,
  brandKitId: string
): Promise<Recommendation[]> {
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("brand_kits")
    .doc(brandKitId)
    .get();

  if (!snap.exists) {
    throw new Error("Brand kit not found");
  }

  const kit = snap.data() as Record<string, unknown>;
  const brandKit = {
    brandName: (kit.brandName as string) ?? "",
    industry: (kit.industry as string) ?? "",
    tone: (kit.tone as string) ?? "professional",
    language: (kit.language as string) ?? "English",
    targetAudience: (kit.targetAudience as string) ?? "general",
    brandLocation: (kit.brandLocation as {
      country?: string;
      city?: string;
      continent?: string;
      currency?: string;
      languages?: string[];
    }) ?? {},
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const openai = new OpenAI({ apiKey });
  const previousThemes = await getPreviousThemes(db, uid, brandKitId);
  let systemPrompt = buildRecommendationSystemPrompt(brandKit, false);
  systemPrompt = injectDeduplication(systemPrompt, previousThemes);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 1.0,
    top_p: 0.95,
    max_tokens: 2000,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate exactly 6 poster concepts for ${brandKit.brandName}. Return raw JSON array only.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "[]";
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  let recommendations: Recommendation[];
  try {
    const parsed = JSON.parse(cleaned) as unknown[];
    recommendations = Array.isArray(parsed) ? (parsed as Recommendation[]) : [];
  } catch {
    console.error("[getRecommendationsForBrandKit] Parse error:", cleaned.slice(0, 300));
    throw new Error("Failed to parse AI response");
  }

  const themes = recommendations
    .map((r) => r.theme ?? "")
    .filter(Boolean);
  await saveThemes(db, uid, brandKitId, themes);

  return recommendations;
}
