/**
 * Exchange rates from USD. Uses Frankfurter (free, no API key).
 * Fallback hardcoded rates if API fails. Cached 6 hours via Next.js unstable_cache.
 */

import { unstable_cache } from "next/cache";
import type { CurrencyInfo } from "./currencyMap";

/** Base prices in USD — source of truth for all plans. */
export const BASE_PRICES_USD = {
  pro_monthly: 12,
  pro_annual: 10,
  business_monthly: 24,
  business_annual: 20,
  studio_starter: 29,
  studio_pro: 59,
  studio_agency: 129,
} as const;

export type PricesKey = keyof typeof BASE_PRICES_USD;

/** Converted prices in local currency (numbers, not formatted). */
export type ConvertedPrices = Record<PricesKey, number>;

/** Fallback rates (USD → 1 unit of target) when Frankfurter fails. */
const FALLBACK_RATES: Record<string, number> = {
  TZS: 2650,
  NGN: 1580,
  KES: 130,
  GHS: 15.5,
  UGX: 3750,
  RWF: 1350,
  ZAR: 18.5,
  ETB: 57,
  XOF: 610,
  XAF: 610,
  EGP: 48.5,
  MAD: 10.1,
  GBP: 0.79,
  EUR: 0.92,
  USD: 1,
};

async function fetchRateFromApi(targetCurrency: string): Promise<number | null> {
  if (targetCurrency === "USD") return 1;
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=${encodeURIComponent(targetCurrency)}`,
      { next: { revalidate: 21600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.[targetCurrency];
    return typeof rate === "number" ? rate : null;
  } catch {
    return null;
  }
}

function getCachedRateUncached(targetCurrency: string): Promise<number> {
  return fetchRateFromApi(targetCurrency).then((rate) => {
    if (rate != null) return rate;
    const fallback = FALLBACK_RATES[targetCurrency];
    return typeof fallback === "number" ? fallback : 1;
  });
}

/**
 * Fetch USD → targetCurrency rate. Cached 6 hours per currency.
 * Uses Frankfurter; on failure uses FALLBACK_RATES or 1 for unknown.
 */
export function getCachedRate(targetCurrency: string): Promise<number> {
  if (targetCurrency === "USD") return Promise.resolve(1);
  return unstable_cache(
    () => getCachedRateUncached(targetCurrency),
    [`geo-rate-${targetCurrency}`],
    { revalidate: 21600 }
  )();
}

/**
 * Convert all BASE_PRICES_USD to target currency. Rounds using currency decimals:
 * decimals 0 → Math.round, decimals 2 → round to 2 decimal places.
 */
export async function convertPrices(
  targetCurrency: string,
  currencyInfo: CurrencyInfo
): Promise<ConvertedPrices> {
  const rate = await getCachedRate(targetCurrency);
  const decimals = currencyInfo.decimals;
  const round = (n: number) =>
    decimals === 0 ? Math.round(n) : Math.round(n * 100) / 100;

  const out = {} as ConvertedPrices;
  for (const [k, usd] of Object.entries(BASE_PRICES_USD)) {
    out[k as PricesKey] = round(usd * rate);
  }
  return out;
}
