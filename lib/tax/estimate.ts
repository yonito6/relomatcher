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
 * Estimate tax + take-home for a given country tax profile.
 * @param annualIncome gross annual income in the user's currency
 * @param earner how the user earns
 */
export function estimateTax(
  profile: TaxProfile,
  annualIncome: number,
  earner: EarnerType
): TaxEstimate {
  const income = Math.max(0, annualIncome);

  // Base effective rate from the appropriate progressive curve.
  let effectiveRate = rateAtIncome(curveFor(profile, earner), income);
  let regimeApplied: string | null = null;

  // If a special regime applies to this earner and beats the normal curve, use it.
  const regime = profile.remoteRegime;
  if (regime && regime.appliesTo.includes(earner) && regime.rate < effectiveRate) {
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
