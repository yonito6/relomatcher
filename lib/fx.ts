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
