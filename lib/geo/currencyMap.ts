/**
 * Country code → currency for display. Used with IP geolocation to show local prices.
 * Stripe always charges in USD; this is cosmetic conversion for UX.
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

/** Country code (ISO 3166-1 alpha-2) → currency. */
export const COUNTRY_CURRENCY: Record<string, CurrencyInfo> = {
  TZ: { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", decimals: 0 },
  NG: { code: "NGN", symbol: "₦", name: "Nigerian Naira", decimals: 0 },
  KE: { code: "KES", symbol: "KSh", name: "Kenyan Shilling", decimals: 0 },
  GH: { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", decimals: 2 },
  UG: { code: "UGX", symbol: "USh", name: "Ugandan Shilling", decimals: 0 },
  RW: { code: "RWF", symbol: "RWF", name: "Rwandan Franc", decimals: 0 },
  ZA: { code: "ZAR", symbol: "R", name: "South African Rand", decimals: 2 },
  ET: { code: "ETB", symbol: "Br", name: "Ethiopian Birr", decimals: 2 },
  SN: { code: "XOF", symbol: "CFA", name: "West African CFA Franc", decimals: 0 },
  CI: { code: "XOF", symbol: "CFA", name: "West African CFA Franc", decimals: 0 },
  CM: { code: "XAF", symbol: "CFA", name: "Central African CFA Franc", decimals: 0 },
  EG: { code: "EGP", symbol: "E£", name: "Egyptian Pound", decimals: 2 },
  MA: { code: "MAD", symbol: "MAD", name: "Moroccan Dirham", decimals: 2 },
  GB: { code: "GBP", symbol: "£", name: "British Pound", decimals: 2 },
  EU: { code: "EUR", symbol: "€", name: "Euro", decimals: 2 },
  US: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 },
};

export const DEFAULT_CURRENCY: CurrencyInfo = {
  code: "USD",
  symbol: "$",
  name: "US Dollar",
  decimals: 2,
};

/**
 * Get currency for a country code. Returns USD for unknown countries.
 */
export function getCurrencyForCountry(countryCode: string | undefined | null): CurrencyInfo {
  if (!countryCode || typeof countryCode !== "string") return DEFAULT_CURRENCY;
  const key = countryCode.toUpperCase().slice(0, 2);
  return COUNTRY_CURRENCY[key] ?? DEFAULT_CURRENCY;
}

/** Get currency by 3-letter code (e.g. TZS). Used for FORCE_CURRENCY env. */
export function getCurrencyByCode(code: string | undefined | null): CurrencyInfo {
  if (!code || typeof code !== "string") return DEFAULT_CURRENCY;
  const c = code.toUpperCase();
  const found = SUPPORTED_CURRENCIES_LIST.find((x) => x.code === c);
  return found ?? DEFAULT_CURRENCY;
}

/** All supported currencies for the override dropdown (unique by code). */
export const SUPPORTED_CURRENCIES_LIST: CurrencyInfo[] = [
  DEFAULT_CURRENCY,
  COUNTRY_CURRENCY.TZ,
  COUNTRY_CURRENCY.NG,
  COUNTRY_CURRENCY.KE,
  COUNTRY_CURRENCY.GH,
  COUNTRY_CURRENCY.UG,
  COUNTRY_CURRENCY.RW,
  COUNTRY_CURRENCY.ZA,
  COUNTRY_CURRENCY.ET,
  COUNTRY_CURRENCY.SN,
  COUNTRY_CURRENCY.CI,
  COUNTRY_CURRENCY.CM,
  COUNTRY_CURRENCY.EG,
  COUNTRY_CURRENCY.MA,
  COUNTRY_CURRENCY.GB,
  COUNTRY_CURRENCY.EU,
].filter((c, i, arr) => arr.findIndex((x) => x.code === c.code) === i);
