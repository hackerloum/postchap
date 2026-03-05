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

/** Output of multimodal brand analysis (Gemini vision). Optional cache on brand kit. */
export interface BrandDNA {
  /** Hex codes extracted from logo/store photos */
  dominantColors?: string[];
  /** Short aesthetic label (e.g. "Nairobi Cyberpunk", "Lagos Minimalist") */
  aestheticProfile?: string;
  /** Where logo fits and safe zone for text */
  layoutPreferences?: {
    logoPosition?: string;
    safeZone?: string;
  };
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
  /** URLs of store/business photos for multimodal analysis */
  storePhotoUrls?: string[];
  tone?: string;
  styleNotes?: string;
  brandLocation?: BrandLocation;
  targetAudience?: string;
  ageRange?: string;
  platforms?: string[];
  language?: string;
  sampleContent?: string;
  /** Cached BrandDNA from multimodal analysis (optional) */
  brandDna?: BrandDNA;
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

export type ProductIntent = "showcase" | "promote" | "educate" | "testimonial";

export interface ProductOverrides {
  headlineFocus?: string;
  showPrice?: boolean;
  showDiscount?: boolean;
  urgency?: "none" | "limited_stock" | "ends_soon" | "ends_today" | "ends_sunday";
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  priceLabel: string;
  discountPrice?: number;
  discountPriceLabel?: string;
  category: string;
  images: string[];
  inStock: boolean;
  tags: string[];
  brandKitId?: string;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface EditHistoryEntry {
  version: number;
  editedAt: number;
  editType: "recomposite" | "regenerate" | "fix";
  instruction?: string;
  previousUrl: string;
}
