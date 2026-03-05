import type { Timestamp } from "firebase-admin/firestore";

// ─── Plans ─────────────────────────────────────────────────────────────────

export type StudioPlanId = "trial" | "starter" | "pro" | "agency";

// ─── Team ──────────────────────────────────────────────────────────────────

export type TeamRole = "owner" | "manager" | "designer" | "reviewer" | "intern";

export type InviteStatus = "pending" | "active";

export interface StudioTeamMember {
  id: string;
  userId: string;
  role: TeamRole;
  assignedClients: string[];
  inviteStatus: InviteStatus;
  email: string;
  displayName?: string;
  createdAt?: Timestamp | Date | null;
}

// ─── Agency ────────────────────────────────────────────────────────────────

export interface StudioAgency {
  id: string;
  ownerId: string;
  agencyName: string;
  plan: StudioPlanId;
  monthlyPosterLimit: number;
  postersUsedThisMonth: number;
  postersResetAt?: Timestamp | Date | null;
  customSubdomain?: string;
  portalBrandName?: string;
  portalLogoUrl?: string;
  portalAccentColor?: string;
  hidePoweredBy?: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

// ─── Clients ───────────────────────────────────────────────────────────────

export type ClientStatus = "active" | "paused" | "archived";

export interface StudioClient {
  id: string;
  agencyId: string;
  clientName: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  industry?: string;
  location?: string;
  businessType?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  status: ClientStatus;
  assignedDesignerId?: string;
  monthlyQuota: number;
  postersThisMonth: number;
  portalAccessEnabled: boolean;
  portalToken?: string;
  tags: string[];
  notes?: string;
  occasions?: StudioClientOccasion[];
  socialHandles?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };
  instagramTokens?: {
    accessToken: string;
    userId: string;
    username: string;
    connectedAt: Timestamp | Date | null;
  };
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface StudioClientOccasion {
  id: string;
  title: string;
  date: string; // MM-DD format for recurring or YYYY-MM-DD for one-time
  type: "recurring" | "one-time";
  description?: string;
}

// ─── Brand Kits ────────────────────────────────────────────────────────────

export type KitPurpose = "main" | "sub-brand" | "campaign" | "seasonal";

export interface StudioBrandKit {
  id: string;
  agencyId: string;
  clientId: string;
  kitPurpose: KitPurpose;
  isDefault: boolean;
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
  brandLocation?: { country?: string; countryCode?: string; city?: string; continent?: string; timezone?: string; currency?: string; languages?: string[] };
  targetAudience?: string;
  /** Cached BrandDNA from multimodal analysis (optional) */
  brandDna?: import("@/types/generation").BrandDNA;
  ageRange?: string;
  platforms?: string[];
  language?: string;
  sampleContent?: string;
  phoneNumber?: string;
  contactLocation?: string;
  website?: string;
  restrictedWords?: string[];
  approvedHashtagSets?: string[][];
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

// ─── Posters ───────────────────────────────────────────────────────────────

export type ApprovalStatus = "draft" | "pending" | "approved" | "revision_requested";

export interface StudioPoster {
  id: string;
  agencyId: string;
  clientId: string;
  brandKitId: string;
  imageUrl: string;
  backgroundImageUrl?: string;
  headline?: string;
  subheadline?: string;
  body?: string;
  cta?: string;
  hashtags?: string[];
  platformFormatId?: string;
  approvalStatus: ApprovalStatus;
  approvalComment?: string;
  approvedBy?: string;
  approvedAt?: Timestamp | Date | null;
  generatedBy: string;
  hasEditableLayout?: boolean;
  layoutJson?: string;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

// ─── Approvals ─────────────────────────────────────────────────────────────

export type ApprovalActorType = "designer" | "client";

export interface StudioApproval {
  id: string;
  posterId: string;
  round: number;
  action: "submitted" | "approved" | "revision_requested";
  comment?: string;
  actorType: ApprovalActorType;
  actorId: string;
  actorName?: string;
  timestamp?: Timestamp | Date | null;
}

// ─── Team invites ───────────────────────────────────────────────────────────

export interface StudioInvite {
  id: string;
  agencyId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  token: string;
  status: "pending" | "accepted" | "expired";
  createdAt?: Timestamp | Date | null;
  expiresAt?: Timestamp | Date | null;
}

// ─── Referrals ─────────────────────────────────────────────────────────────

export interface StudioReferral {
  id: string;
  referrerId: string;
  referredUserId?: string;
  referredEmail: string;
  plan?: string;
  commissionRate: number;
  status: "pending" | "active" | "paid";
  monthlyAmount?: number;
  createdAt?: Timestamp | Date | null;
}
