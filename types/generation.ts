export type PosterSize = "1080x1080" | "1080x1350" | "1080x1920";

export interface BrandLocation {
  country?: string;
  countryCode?: string;
  city?: string;
  continent?: string;
  timezone?: string;
  currency?: string;
  languages?: string[];
}

export interface BrandKit {
  id: string;
  brandName?: string;
  industry?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  tone?: string;
  styleNotes?: string;
  brandLocation?: BrandLocation;
  targetAudience?: string;
  ageRange?: string;
  platforms?: string[];
  language?: string;
  sampleContent?: string;
  /** Shown on poster when set (e.g. 012 3456 7890) */
  phoneNumber?: string;
  /** Shown on poster when set (e.g. Dar es Salaam, or full address) */
  contactLocation?: string;
  /** Shown on poster when set (e.g. www.example.com) */
  website?: string;
}

export interface OccasionContext {
  name: string;
  category?: string;
  visualMood?: string;
  messagingTone?: string;
  colorSuggestion?: string[];
  answers?: { question: string; answer: string }[];
}

export interface Recommendation {
  id?: string;
  theme: string;
  topic: string;
  description: string;
  suggestedHeadline: string;
  suggestedCta: string;
  visualMood: string;
  urgency?: "high" | "medium" | "low";
  reason?: string;
  hashtags?: string[];
  category?: string;
}

export interface CopyData {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
}
