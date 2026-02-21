import type { Timestamp } from "firebase/firestore";

export type PosterSize = "1080x1080" | "1080x1350" | "1080x1920";
export type PosterStatus = "generated" | "approved" | "posted" | "failed";
export type ActivityAction =
  | "generated"
  | "edited"
  | "approved"
  | "regenerated"
  | "failed";
export type Language = "en" | "sw";
export type Plan = "free" | "pro" | "enterprise";

export type GenerationStatus =
  | "pending"
  | "generating_copy"
  | "generating_image"
  | "compositing"
  | "uploading"
  | "complete"
  | "failed";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  plan: Plan;
}

export interface BrandKit {
  id: string;
  userId: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  language: Language;
  styleNotes: string;
  sampleContent: string;
  logoUrl: string;
  fontPreference?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PosterJob {
  id: string;
  userId: string;
  brandKitId: string;
  enabled: boolean;
  posterSize: PosterSize;
  timezone: string;
  preferredTime: string;
  createdAt: Timestamp;
}

export interface Poster {
  id: string;
  userId: string;
  brandKitId: string;
  createdForDate: string;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
  imageUrl: string;
  status: PosterStatus;
  error: string | null;
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PosterActivity {
  id: string;
  userId: string;
  posterId: string;
  action: ActivityAction;
  meta: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface GenerationStatusUpdate {
  status: GenerationStatus;
  progress: number;
  message: string;
  updatedAt: number;
}
