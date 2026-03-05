import type { StudioPlanId } from "@/types/studio";

export interface StudioPlanLimits {
  maxClients: number;
  maxBrandKitsPerClient: number;
  maxPostersPerMonth: number;
  teamMembers: number;
  clientPortal: boolean;
  whiteLabel: boolean;
  bulkGeneration: boolean;
  pdfReports: boolean;
  directPublishing: boolean;
  extraPosterPacks: boolean;
}

export interface StudioPlanInfo {
  id: StudioPlanId;
  name: string;
  priceLabel: string;
  priceMonthly: number;
  priceTzs?: number;
  limits: StudioPlanLimits;
  tagline: string;
}

/** Trial: view-only until user pays for a Studio plan. Not in checkout — upgrade to starter/pro/agency. */
export const STUDIO_PLANS: StudioPlanInfo[] = [
  {
    id: "trial",
    name: "Trial",
    priceLabel: "Free",
    priceMonthly: 0,
    priceTzs: 0,
    tagline: "View dashboard only — upgrade to use Studio",
    limits: {
      maxClients: 0,
      maxBrandKitsPerClient: 0,
      maxPostersPerMonth: 0,
      teamMembers: 0,
      clientPortal: false,
      whiteLabel: false,
      bulkGeneration: false,
      pdfReports: false,
      directPublishing: false,
      extraPosterPacks: false,
    },
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$29/mo",
    priceMonthly: 29,
    priceTzs: 72_500,
    tagline: "For freelancers starting out",
    limits: {
      maxClients: 5,
      maxBrandKitsPerClient: 3,
      maxPostersPerMonth: 100,
      teamMembers: 0,
      clientPortal: false,
      whiteLabel: false,
      bulkGeneration: false,
      pdfReports: false,
      directPublishing: false,
      extraPosterPacks: true,
    },
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "$59/mo",
    priceMonthly: 59,
    priceTzs: 147_500,
    tagline: "For growing agencies (5–20 clients)",
    limits: {
      maxClients: 20,
      maxBrandKitsPerClient: -1,
      maxPostersPerMonth: 500,
      teamMembers: 2,
      clientPortal: true,
      whiteLabel: false,
      bulkGeneration: true,
      pdfReports: true,
      directPublishing: true,
      extraPosterPacks: true,
    },
  },
  {
    id: "agency",
    name: "Agency",
    priceLabel: "$129/mo",
    priceMonthly: 129,
    priceTzs: 322_500,
    tagline: "For established agencies (20+ clients)",
    limits: {
      maxClients: -1,
      maxBrandKitsPerClient: -1,
      maxPostersPerMonth: 2000,
      teamMembers: -1,
      clientPortal: true,
      whiteLabel: true,
      bulkGeneration: true,
      pdfReports: true,
      directPublishing: true,
      extraPosterPacks: true,
    },
  },
];

const planMap = new Map<StudioPlanId, StudioPlanInfo>(
  STUDIO_PLANS.map((p) => [p.id, p])
);

export function getStudioPlanLimits(planId: string | undefined | null): StudioPlanLimits {
  const id = (planId ?? "trial") as StudioPlanId;
  const plan = planMap.get(id) ?? planMap.get("trial")!;
  return plan.limits;
}

export function getStudioPlanInfo(planId: string | undefined | null): StudioPlanInfo | undefined {
  const id = (planId ?? "starter") as StudioPlanId;
  return planMap.get(id);
}

export function isValidStudioPlanId(value: unknown): value is StudioPlanId {
  return typeof value === "string" && planMap.has(value as StudioPlanId);
}

export function getMonthlyPosterLimit(planId: string | undefined | null): number {
  return getStudioPlanLimits(planId).maxPostersPerMonth;
}
