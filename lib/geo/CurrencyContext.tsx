"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CurrencyInfo } from "./currencyMap";
import type { ConvertedPrices } from "./exchangeRates";

const STORAGE_KEY = "am_currency";
const OVERRIDE_KEY = "am_currency_override";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface GeoCurrencyState {
  currency: CurrencyInfo;
  /** Never null; defaults to USD prices while loading. */
  prices: ConvertedPrices;
  country: string | undefined;
  isLoading: boolean;
  /** Format amount in current currency (e.g. "TSh 31,800" or "$12.00") */
  format: (amount: number) => string;
  /** Set user override (currency code or "auto" to clear). Persists to localStorage. */
  setOverride: (code: string | "auto") => void;
  /** Current override code or null if auto-detect */
  override: string | null;
}

const defaultPrices: ConvertedPrices = {
  pro_monthly: 12,
  pro_annual: 10,
  business_monthly: 24,
  business_annual: 20,
  studio_starter: 29,
  studio_pro: 59,
  studio_agency: 129,
};

const defaultCurrency: CurrencyInfo = {
  code: "USD",
  symbol: "$",
  name: "US Dollar",
  decimals: 2,
};

const CurrencyContext = createContext<GeoCurrencyState | null>(null);

function loadStored(): { currency: CurrencyInfo; prices: ConvertedPrices; country?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.expiresAt < Date.now()) return null;
    return {
      currency: data.currency ?? defaultCurrency,
      prices: data.prices ?? defaultPrices,
      country: data.country,
    };
  } catch {
    return null;
  }
}

function saveStored(
  currency: CurrencyInfo,
  prices: ConvertedPrices,
  country?: string
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currency,
        prices,
        country,
        expiresAt: Date.now() + TTL_MS,
      })
    );
  } catch {
    // ignore
  }
}

function getOverride(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(OVERRIDE_KEY);
    if (!v || v === "auto") return null;
    return v;
  } catch {
    return null;
  }
}

function formatAmount(amount: number, currency: CurrencyInfo): string {
  const decimals = currency.decimals;
  const rounded =
    decimals === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
  const str =
    decimals === 0
      ? String(rounded)
      : rounded.toFixed(decimals);
  const withCommas = str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency.symbol} ${withCommas}`.trim();
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyInfo>(defaultCurrency);
  const [prices, setPrices] = useState<ConvertedPrices | null>(defaultPrices);
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [override, setOverrideState] = useState<string | null>(null);

  const setOverride = useCallback((code: string | "auto") => {
    if (typeof window === "undefined") return;
    if (code === "auto") {
      localStorage.removeItem(OVERRIDE_KEY);
      setOverrideState(null);
    } else {
      localStorage.setItem(OVERRIDE_KEY, code);
      setOverrideState(code);
    }
    // Invalidate cache so next read will refetch
    localStorage.removeItem(STORAGE_KEY);
    setIsLoading(true);
  }, []);

  useEffect(() => {
    const overrideCode = getOverride();
    setOverrideState(overrideCode);

    const stored = loadStored();
    const effectiveOverride = overrideCode ?? undefined;

    // If we have valid stored data and no override, use it
    if (stored && !effectiveOverride) {
      setCurrency(stored.currency);
      setPrices(stored.prices);
      setCountry(stored.country);
      setIsLoading(false);
      return;
    }
    // If override is set and we have stored data for that currency, use it
    if (stored && effectiveOverride && stored.currency.code === effectiveOverride) {
      setCurrency(stored.currency);
      setPrices(stored.prices);
      setCountry(stored.country);
      setIsLoading(false);
      return;
    }

    const url = effectiveOverride
      ? `/api/geo/currency?currency=${encodeURIComponent(effectiveOverride)}`
      : "/api/geo/currency";

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Currency fetch failed");
        return res.json();
      })
      .then((data) => {
        const curr = data.currency ?? defaultCurrency;
        const pr = data.prices ?? defaultPrices;
        setCurrency(curr);
        setPrices(pr);
        setCountry(data.country);
        saveStored(curr, pr, data.country);
      })
      .catch(() => {
        setCurrency(defaultCurrency);
        setPrices(defaultPrices);
        setCountry(undefined);
      })
      .finally(() => setIsLoading(false));
  }, [override]);

  const format = useCallback(
    (amount: number) => formatAmount(amount, currency),
    [currency]
  );

  const value = useMemo<GeoCurrencyState>(
    () => ({
      currency,
      prices: prices ?? defaultPrices,
      country,
      isLoading,
      format,
      setOverride,
      override,
    }),
    [currency, prices, country, isLoading, format, setOverride, override]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): GeoCurrencyState {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: defaultCurrency,
      prices: defaultPrices,
      country: undefined,
      isLoading: false,
      format: (amount: number) => formatAmount(amount, defaultCurrency),
      setOverride: () => {},
      override: null,
    };
  }
  return ctx;
}
