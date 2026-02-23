export type PosterSize = "1080x1080" | "1080x1350" | "1080x1920";

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
  brandLocation?: { country?: string };
}

export interface CopyData {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
}
