/**
 * Country-based pricing. Base prices in USD; per-country currency and amounts for display and payment.
 * Snippe supports TZS (Tanzania: mobile + card); other countries use USD card.
 */

import type { PlanId } from "./plans";

/** Base monthly price in USD (Pro $12, Business $24). */
export const BASE_USD = { pro: 12, business: 24 } as const;

/** Per-country: currency code, amount in smallest unit for payment, and display label. */
export interface CountryPrice {
  currency: string;
  /** Amount in smallest unit (e.g. cents, no decimals). */
  amountMinor: number;
  /** Human label e.g. "30,000 TZS/mo" or "$12/mo". */
  label: string;
  /** Whether Snippe mobile money is available (Tanzania only). */
  mobileMoney: boolean;
}

/** Currencies that use 2 decimal places (amount stored in cents/smallest). */
const TWO_DECIMAL_CURRENCIES = new Set([
  "USD", "GBP", "ZAR", "KES", "GHS", "ETB", "EGP", "MAD", "MZN", "ZMW", "AED", "INR", "NGN",
]);

/** Africa and common countries: amount in smallest unit. */
const COUNTRY_PRICING: Record<string, { currency: string; proMinor: number; businessMinor: number; mobileMoney: boolean }> = {
  TZ: { currency: "TZS", proMinor: 30_000, businessMinor: 60_000, mobileMoney: true },
  NG: { currency: "NGN", proMinor: 18_000, businessMinor: 36_000, mobileMoney: false },
  ZA: { currency: "ZAR", proMinor: 22_200, businessMinor: 44_400, mobileMoney: false }, // 222.00 / 444.00
  KE: { currency: "KES", proMinor: 1_560_00, businessMinor: 3_120_00, mobileMoney: false },
  GH: { currency: "GHS", proMinor: 180_00, businessMinor: 360_00, mobileMoney: false },
  ET: { currency: "ETB", proMinor: 1_320_00, businessMinor: 2_640_00, mobileMoney: false },
  EG: { currency: "EGP", proMinor: 600_00, businessMinor: 1_200_00, mobileMoney: false },
  UG: { currency: "UGX", proMinor: 45_600, businessMinor: 91_200, mobileMoney: false },
  RW: { currency: "RWF", proMinor: 15_600, businessMinor: 31_200, mobileMoney: false },
  MA: { currency: "MAD", proMinor: 120_00, businessMinor: 240_00, mobileMoney: false },
  SN: { currency: "XOF", proMinor: 7_200, businessMinor: 14_400, mobileMoney: false },
  CI: { currency: "XOF", proMinor: 7_200, businessMinor: 14_400, mobileMoney: false },
  CM: { currency: "XAF", proMinor: 7_200, businessMinor: 14_400, mobileMoney: false },
  AO: { currency: "AOA", proMinor: 10_200, businessMinor: 20_400, mobileMoney: false },
  MZ: { currency: "MZN", proMinor: 768_00, businessMinor: 1_536_00, mobileMoney: false },
  ZM: { currency: "ZMW", proMinor: 324_00, businessMinor: 648_00, mobileMoney: false },
  ZW: { currency: "USD", proMinor: 1200, businessMinor: 2400, mobileMoney: false },
  US: { currency: "USD", proMinor: 1200, businessMinor: 2400, mobileMoney: false },
  GB: { currency: "GBP", proMinor: 950, businessMinor: 1900, mobileMoney: false }, // pence
  AE: { currency: "AED", proMinor: 44_00, businessMinor: 88_00, mobileMoney: false },
  IN: { currency: "INR", proMinor: 999_00, businessMinor: 1998_00, mobileMoney: false },
};

function formatAmount(minor: number, currency: string): string {
  if (TWO_DECIMAL_CURRENCIES.has(currency)) {
    const major = minor / 100;
    if (currency === "USD") return `$${major.toFixed(major % 1 === 0 ? 0 : 2)}`;
    if (currency === "GBP") return `£${major.toFixed(major % 1 === 0 ? 0 : 2)}`;
    const str = major % 1 === 0 ? String(major) : major.toFixed(2);
    return `${str.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${currency}`;
  }
  const str = String(minor).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${str} ${currency}`;
}

/**
 * Get price for a plan in the user's country. Falls back to USD if country not in map.
 */
export function getPlanPriceForCountry(
  planId: PlanId,
  countryCode: string | undefined | null
): CountryPrice {
  if (planId === "free") {
    return { currency: "USD", amountMinor: 0, label: "Free", mobileMoney: false };
  }
  const code = (countryCode ?? "US").toUpperCase();
  const row = COUNTRY_PRICING[code] ?? { currency: "USD", proMinor: 1200, businessMinor: 2400, mobileMoney: false };
  const amountMinor = planId === "pro" ? row.proMinor : row.businessMinor;
  return {
    currency: row.currency,
    amountMinor,
    label: amountMinor === 0 ? "Free" : `${formatAmount(amountMinor, row.currency)}/mo`,
    mobileMoney: row.mobileMoney,
  };
}

/**
 * For Snippe: payment currency and amount. Tanzania = TZS; others = USD (cents).
 */
export function getPaymentCurrencyAndAmount(
  planId: PlanId,
  countryCode: string | undefined | null
): { currency: string; amount: number } {
  if (planId === "free") return { currency: "USD", amount: 0 };
  const code = (countryCode ?? "US").toUpperCase();
  if (code === "TZ") {
    const row = COUNTRY_PRICING.TZ;
    return {
      currency: "TZS",
      amount: planId === "pro" ? row.proMinor : row.businessMinor,
    };
  }
  return {
    currency: "USD",
    amount: planId === "pro" ? 1200 : 2400, // cents
  };
}

export function isTanzania(countryCode: string | undefined | null): boolean {
  return (countryCode ?? "").toUpperCase() === "TZ";
}
