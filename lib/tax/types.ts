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
 * What the user actually DOES — this picks the right tax regime, because
 * ecommerce (selling goods) and freelance services are taxed very differently
 * (e.g. in Poland 3% ryczałt on goods vs 8.5–12% on services). Drives regime
 * selection in the estimator.
 */
export type EarnerActivity = "employed" | "freelancer" | "ecommerce" | "investor";

export const EARNER_ACTIVITIES: { id: EarnerActivity; label: string; hint: string }[] = [
  { id: "employed", label: "Employed", hint: "Salary from a local or remote employer" },
  { id: "freelancer", label: "Freelancer / services", hint: "Sell your services: consulting, IT, design, agency" },
  { id: "ecommerce", label: "Ecommerce / sell goods", hint: "Online store, dropshipping, retail, trading products" },
  { id: "investor", label: "Investor / passive", hint: "Mostly dividends, rent, capital gains" },
];

/** Map the new activity to the legacy earner type used by un-migrated profiles. */
export function activityToEarner(activity: EarnerActivity): EarnerType {
  return activity === "employed" ? "employed" : "self_employed";
}

/** A single progressive income-tax bracket. `upTo` is annual USD-equiv income
 *  (use Infinity for the top band); `rate` is the marginal rate (0..1). */
export type Bracket = { upTo: number; rate: number };

/**
 * A mandatory social / health contribution layered ON TOP of income tax (e.g.
 * Poland's ZUS + health). All amounts/thresholds are USD-equivalents.
 */
export type SocialCharge = {
  /** Rate applied to income (0..1). */
  rate: number;
  /** Minimum annual amount payable regardless of income (e.g. fixed ZUS). */
  minAnnual?: number;
  /** Maximum annual amount of the charge itself (a hard cap on what you pay). */
  maxAnnual?: number;
  /** Income above which the rate stops applying (contribution ceiling). */
  capIncome?: number;
};

/**
 * An activity-specific tax regime option. The estimator considers every regime
 * the user's activity qualifies for (within caps) and the standard rules, then
 * picks whichever keeps the MOST money in their pocket.
 */
export type Regime = {
  /** Short label shown to the user. */
  label: string;
  /** Which activities can use it. */
  activities: EarnerActivity[];
  /** Whether `rate` is charged on revenue/turnover or on profit/taxable income. */
  basis: "revenue" | "profit";
  /** Flat rate (0..1) on the chosen basis. */
  rate: number;
  /** Mandatory social/health charged on top of the regime (USD-equiv). */
  social?: SocialCharge;
  /** Max annual turnover (USD-equiv) to qualify, if revenue-capped. */
  maxAnnualRevenue?: number;
  /** Max annual income/profit (USD-equiv) to qualify, if profit-capped. */
  maxAnnualIncome?: number;
};

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

  // ── Rich, verified model (present only on migrated countries) ──
  // When `regimes` is present the country is "migrated": the estimator uses the
  // explicit brackets/social/regimes below for non-employed earners instead of
  // the blended legacy curves, and picks the cheapest qualifying option.
  /** Progressive income-tax brackets (income tax only, USD-equiv). */
  brackets?: Bracket[];
  /** Standard employee social/health contribution (used with brackets). */
  standardSocial?: SocialCharge;
  /** Self-employed social/health contribution for the general-rules path. */
  selfEmployedSocial?: SocialCharge;
  /** Activity-aware regime options (ryczałt bands, flat-tax, etc.). */
  regimes?: Regime[];
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
