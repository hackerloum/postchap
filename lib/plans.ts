/**
 * Plan tiers and limits. Single source of truth for Free / Pro / Business.
 */

export type PlanId = "free" | "pro" | "business";

export interface PlanLimits {
  brandKits: number;
  postersPerMonth: number;
  scheduledGeneration: boolean;
  aiRecommendationsFull: boolean;
}

export interface PlanInfo {
  id: PlanId;
  name: string;
  /** Display price (Option A: Africa-optimised). */
  priceLabel: string;
  /** Monthly price in USD (0 for free). */
  priceMonthly: number;
  /** Yearly price in USD (10 months). Optional for paid plans. */
  priceYearlyUSD?: number;
  /** Price in TZS (smallest unit) for Snippe. Required for paid plans. */
  priceTzs?: number;
  limits: PlanLimits;
}

export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "Free",
    priceMonthly: 0,
    limits: {
      brandKits: 1,
      postersPerMonth: 5,
      scheduledGeneration: false,
      aiRecommendationsFull: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "$12/mo",
    priceMonthly: 12,
    priceYearlyUSD: 120, // Save 2 months (10 × $12)
    priceTzs: 30_000, // TZS per month (adjust for your rate)
    limits: {
      brandKits: 5,
      postersPerMonth: 50,
      scheduledGeneration: true,
      aiRecommendationsFull: true,
    },
  },
  {
    id: "business",
    name: "Business",
    priceLabel: "$24/mo",
    priceMonthly: 24,
    priceYearlyUSD: 240, // Save 2 months (10 × $24)
    priceTzs: 60_000, // TZS per month (adjust for your rate)
    limits: {
      brandKits: -1, // unlimited
      postersPerMonth: -1,
      scheduledGeneration: true,
      aiRecommendationsFull: true,
    },
  },
];

const planMap = new Map<PlanId, PlanInfo>(PLANS.map((p) => [p.id, p]));

export function getPlanLimits(planId: string | undefined | null): PlanLimits {
  const id = (planId ?? "free") as PlanId;
  const plan = planMap.get(id) ?? planMap.get("free")!;
  return plan.limits;
}

export function getPlanInfo(planId: string | undefined | null): PlanInfo | undefined {
  const id = (planId ?? "free") as PlanId;
  return planMap.get(id);
}

export function isValidPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && planMap.has(value as PlanId);
}
