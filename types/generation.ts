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
}

export interface OccasionContext {
  name: string;
  category?: string;
  visualMood?: string;
  messagingTone?: string;
  colorSuggestion?: string[];
  answers?: { question: string; answer: string }[];
}

export interface CopyData {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
}
