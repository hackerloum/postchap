/**
 * GET /api/geo/currency
 * Server-side only: resolves IP → country → currency, fetches rate, returns converted prices.
 * Never exposes IP to the client. Optional FORCE_CURRENCY for local testing.
 */

import { NextRequest } from "next/server";
import { getCurrencyForCountry, getCurrencyByCode } from "@/lib/geo/currencyMap";
import { convertPrices, type ConvertedPrices } from "@/lib/geo/exchangeRates";

const CACHE_SECONDS = 21600; // 6 hours

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

async function getCountryFromIp(ip: string): Promise<string | null> {
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const code = data?.country_code;
    return typeof code === "string" ? code : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const forceCurrency = process.env.FORCE_CURRENCY; // e.g. TZS for local testing
  const overrideCode = req.nextUrl.searchParams.get("currency"); // client override e.g. ?currency=TZS
  let countryCode: string | null = null;

  let currency;
  if (overrideCode) {
    currency = getCurrencyByCode(overrideCode);
  } else if (forceCurrency) {
    currency = getCurrencyByCode(forceCurrency);
  } else {
    const ip = getClientIp(req);
    if (ip) countryCode = await getCountryFromIp(ip);
    currency = getCurrencyForCountry(countryCode ?? undefined);
  }

  const prices: ConvertedPrices = await convertPrices(currency.code, currency);

  const body = {
    country: countryCode ?? undefined,
    currency: {
      code: currency.code,
      symbol: currency.symbol,
      name: currency.name,
      decimals: currency.decimals,
    },
    prices,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
    },
  });
}
