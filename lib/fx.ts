// lib/fx.ts
// Static currency-conversion table so the tax engine can place a user's income
// on the correct (USD-denominated) tax brackets regardless of the currency they
// entered. These are REFERENCE rates (USD per 1 unit of currency), good enough
// for bracket placement — they are NOT live and not for actual money transfer.
//
// HONESTY: tax brackets only shift meaningfully across large income ranges, so a
// few-percent FX drift does not change which bracket you land in. A live-rate
// refresh can be layered on later; for now these are dated, editable constants.

/** USD value of 1 unit of the given currency. Updated ~June 2026. */
export const USD_PER_UNIT: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  ILS: 0.27,
  CAD: 0.73,
  AUD: 0.66,
  CHF: 1.12,
  JPY: 0.0067,
  AED: 0.27,
  SGD: 0.74,
  BRL: 0.18,
  MXN: 0.055,
  INR: 0.012,
  RON: 0.22,
  BGN: 0.55,
  GEL: 0.37,
  THB: 0.028,
  TRY: 0.025,
  PLN: 0.25,
  HUF: 0.0027,
  // Asia-Pacific
  HKD: 0.128,
  TWD: 0.0315,
  KRW: 0.00073,
  NZD: 0.6,
  MYR: 0.225,
  IDR: 0.0000615,
  // Nordics
  DKK: 0.145,
  SEK: 0.096,
  NOK: 0.092,
  // CEE / Balkans
  CZK: 0.045,
  RSD: 0.0093,
  MKD: 0.0176,
  MDL: 0.057,
  UAH: 0.0238,
  BAM: 0.55,
  ALL: 0.0108,
  // Latin America / Africa
  UYU: 0.025,
  MUR: 0.022,
  CRC: 0.00193,
  PAB: 1,
  VND: 0.0000393,
  CLP: 0.00105,
  COP: 0.00024,
  PHP: 0.0179,
  ISK: 0.0072,
  MAD: 0.1,
  AMD: 0.0026,
  KZT: 0.0019,
  ZAR: 0.055,
};

/**
 * Convert an amount in `currency` to its USD-equivalent for tax-bracket
 * placement. Unknown currencies are treated as already-USD (rate 1).
 */
export function toUSD(amount: number, currency?: string): number {
  const code = (currency || "USD").toUpperCase();
  const rate = USD_PER_UNIT[code] ?? 1;
  return amount * rate;
}
