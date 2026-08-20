import { logger } from "./logger.js";

// Converts Naira amounts to USD using a live exchange rate, for Stripe
// checkout (Stripe on this account settles in USD/CAD, not NGN).
//
// Rate is cached for 1 hour to avoid hitting the FX API on every checkout
// request. If the FX lookup fails, callers should treat this as a hard
// error — silently falling back to a stale/guessed rate risks mischarging
// a real customer.

const FX_API_URL = "https://open.er-api.com/v6/latest/NGN";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedRate: number | null = null;
let cachedAt = 0;

async function getNgnToUsdRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate !== null && now - cachedAt < CACHE_TTL_MS) {
    return cachedRate;
  }

  const res = await fetch(FX_API_URL);
  if (!res.ok) {
    throw new Error(`FX API error (${res.status})`);
  }

  const data: any = await res.json();
  const rate = data?.rates?.USD;

  if (typeof rate !== "number" || rate <= 0) {
    throw new Error("FX API returned an invalid NGN->USD rate");
  }

  cachedRate = rate;
  cachedAt = now;
  logger.info({ rate }, "Refreshed NGN->USD exchange rate");

  return rate;
}

// Converts a Naira amount to USD cents (integer), as required by Stripe's
// unit_amount field. Rounds to the nearest cent.
export async function ngnToUsdCents(ngnAmount: number): Promise<number> {
  const rate = await getNgnToUsdRate();
  const usdAmount = ngnAmount * rate;
  return Math.round(usdAmount * 100);
}
