// lib/tax/estimate.ts
// Turns a TaxProfile + a user's income + earner type into an honest estimate of
// how much tax they'd pay and how much they'd keep. Pure, deterministic, no I/O.

import {
  type EarnerType,
  type RateCurve,
  type TaxProfile,
  type TaxEstimate,
  RATE_ANCHORS,
} from "@/lib/tax/types";

const DISCLAIMER =
  "Estimate only — not tax or financial advice. Based on typical effective rates for a mid-income relocator; your real tax depends on your exact situation, deductions, and residency status.";

/** Linear-interpolate (and flat-extrapolate) an effective rate from the 3-anchor curve. */
export function rateAtIncome(curve: RateCurve, annualIncome: number): number {
  const { low, mid, high } = RATE_ANCHORS;
  if (annualIncome <= low) return curve.low;
  if (annualIncome >= high) return curve.high;
  if (annualIncome <= mid) {
    const t = (annualIncome - low) / (mid - low);
    return curve.low + t * (curve.mid - curve.low);
  }
  const t = (annualIncome - mid) / (high - mid);
  return curve.mid + t * (curve.high - curve.mid);
}

function curveFor(profile: TaxProfile, earner: EarnerType): RateCurve {
  // remote_foreign people are taxed like residents on the normal personal curve
  // UNLESS a special regime applies (handled below); default them to the
  // self-employed curve since most nomads invoice as freelancers/contractors.
  if (earner === "employed") return profile.employed;
  return profile.selfEmployed;
}

/**
 * Is the user within a regime's eligibility ceilings? A flat/simplified regime
 * (e.g. France micro, Italy forfettario, Georgia small business) only applies
 * below a revenue and/or income ceiling. We check the user's stated annual
 * revenue against `maxAnnualRevenue` (falling back to income when revenue is
 * unknown), and their income against `maxAnnualIncome`. Missing ceilings mean
 * "no limit" for that dimension.
 */
function regimeEligible(
  regime: NonNullable<TaxProfile["remoteRegime"]>,
  annualIncome: number,
  annualRevenue?: number
): boolean {
  if (regime.maxAnnualRevenue != null) {
    // Use revenue if the user gave it; otherwise income is the best proxy we have.
    const turnover = annualRevenue ?? annualIncome;
    if (turnover > regime.maxAnnualRevenue) return false;
  }
  if (regime.maxAnnualIncome != null && annualIncome > regime.maxAnnualIncome) {
    return false;
  }
  return true;
}

/**
 * Estimate tax + take-home for a given country tax profile.
 * @param annualIncome gross annual income (profit / taxable income) in the user's currency
 * @param earner how the user earns
 * @param annualRevenue optional annual business turnover, used ONLY to test
 *   eligibility for revenue-capped flat regimes. Income still drives the tax math.
 */
export function estimateTax(
  profile: TaxProfile,
  annualIncome: number,
  earner: EarnerType,
  annualRevenue?: number
): TaxEstimate {
  const income = Math.max(0, annualIncome);

  // Base effective rate from the appropriate progressive curve.
  let effectiveRate = rateAtIncome(curveFor(profile, earner), income);
  let regimeApplied: string | null = null;

  // If a special regime applies to this earner, beats the normal curve, AND the
  // user is within its revenue/income eligibility ceilings, use it.
  const regime = profile.remoteRegime;
  if (
    regime &&
    regime.appliesTo.includes(earner) &&
    regime.rate < effectiveRate &&
    regimeEligible(regime, income, annualRevenue)
  ) {
    effectiveRate = regime.rate;
    regimeApplied = regime.label;
  }

  effectiveRate = Math.max(0, Math.min(0.75, effectiveRate));
  const taxAmount = Math.round(income * effectiveRate);
  const netAmount = Math.round(income - taxAmount);
  const netPercent = income > 0 ? Math.round((netAmount / income) * 100) : 0;

  return {
    effectiveRate,
    taxAmount,
    netAmount,
    netPercent,
    regimeApplied,
    vat: profile.vat,
    notes: profile.notes,
    confidence: profile.confidence,
    disclaimer: DISCLAIMER,
  };
}
