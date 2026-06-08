// lib/tax/types.ts
// Real (but clearly-labelled-estimate) tax model used to estimate how much of a
// user's income they would keep in each country, for their specific earner type.
//
// HONESTY: every number here is a researched approximation of a country's
// effective tax + mandatory social/health burden for a mid-income relocator. It
// is NOT tax advice and NOT a guarantee — the estimator always returns a
// disclaimer + a confidence level so the UI/PDF can present it honestly.

/** How the user earns — this materially changes their effective tax. */
export type EarnerType =
  | "employed" // salaried employee (employee-side income tax + social contributions)
  | "self_employed" // freelancer / sole trader / ecommerce owner taxed personally
  | "remote_foreign"; // remote worker / digital nomad earning from foreign clients

export const EARNER_TYPES: { id: EarnerType; label: string; hint: string }[] = [
  { id: "employed", label: "Employed", hint: "Salary from a local or remote employer" },
  { id: "self_employed", label: "Self-employed / business", hint: "Freelance, ecommerce, your own company" },
  { id: "remote_foreign", label: "Remote / nomad", hint: "Paid by foreign clients while living abroad" },
];

/**
 * Effective all-in tax rate (income tax + mandatory social/health contributions)
 * as a fraction 0..1, captured at 3 annual-income anchors so we can interpolate
 * across the progressive curve without hand-coding full brackets per country.
 * Anchors are in USD-equivalent gross annual income.
 */
export type RateCurve = {
  low: number; // effective rate at ~$30k/yr
  mid: number; // effective rate at ~$75k/yr
  high: number; // effective rate at ~$150k/yr
};

/** Income anchors (USD/yr) the RateCurve points correspond to. */
export const RATE_ANCHORS = { low: 30_000, mid: 75_000, high: 150_000 } as const;

/**
 * A special tax regime a country offers to qualifying remote / foreign-income
 * earners or new residents (e.g. Portugal NHR, Cyprus non-dom, Georgia small
 * business, UAE 0%). When the user is `remote_foreign` and a regime applies, the
 * estimator uses the lower of the normal curve and this flat rate.
 */
export type SpecialRegime = {
  /** Flat effective rate (0..1) under the regime. */
  rate: number;
  /** Short label shown to the user, e.g. "NHR 20% flat (10 yrs)". */
  label: string;
  /** Which earner types can realistically use it. */
  appliesTo: EarnerType[];
  /**
   * Max annual TURNOVER/revenue (USD-equiv) to qualify, if the regime has a
   * revenue ceiling (e.g. France micro ~€203k, Italy forfettario ~€85k). Above
   * this the regime does NOT apply and the normal curve is used instead. The
   * estimator checks this against the user's stated revenue (falling back to
   * income when no revenue is given).
   */
  maxAnnualRevenue?: number;
  /**
   * Max annual taxable INCOME/profit (USD-equiv) to qualify, if the regime is
   * gated on profit rather than turnover. Above this the regime does not apply.
   */
  maxAnnualIncome?: number;
};

export type TaxProfile = {
  employed: RateCurve;
  selfEmployed: RateCurve;
  /** Optional regime that can beat the normal curve for qualifying earners. */
  remoteRegime?: SpecialRegime;
  /** Headline standard VAT / sales tax rate as a percentage (0–30ish). */
  vat: number;
  /** Honest one-liner about the tax situation / regime / caveats. */
  notes: string;
  /** How confident we are in these figures. */
  confidence: "high" | "medium" | "low";
};

/** Output of an estimate — everything the UI/PDF needs to show it honestly. */
export type TaxEstimate = {
  /** Effective all-in rate actually applied, 0..1. */
  effectiveRate: number;
  /** Estimated annual tax + mandatory contributions, in the input currency. */
  taxAmount: number;
  /** Estimated annual take-home after that, in the input currency. */
  netAmount: number;
  /** Percent of gross income kept (0–100). */
  netPercent: number;
  /** Regime label if a special regime was applied, else null. */
  regimeApplied: string | null;
  vat: number;
  notes: string;
  confidence: "high" | "medium" | "low";
  /** Always present so callers can render the honesty line. */
  disclaimer: string;
};
