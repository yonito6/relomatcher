// lib/tax/estimate.ts
// Turns a TaxProfile + a user's income + activity into an honest estimate of how
// much tax they'd pay and how much they'd keep. Pure, deterministic, no I/O.
//
// Income is expected in USD-equivalent (convert with lib/fx before calling) so
// it lands on the correct tax brackets. For "migrated" countries (those with a
// `regimes` array) the estimator models real progressive brackets + social
// charges + activity-aware regimes and picks whichever keeps the MOST money in
// the user's pocket. For un-migrated countries it falls back to the blended
// legacy rate curves + optional remoteRegime.

import {
  type Bracket,
  type EarnerActivity,
  type EarnerType,
  type RateCurve,
  type SocialCharge,
  type TaxProfile,
  type TaxEstimate,
  RATE_ANCHORS,
  activityToEarner,
} from "@/lib/tax/types";

const DISCLAIMER =
  "Estimate only — not tax or financial advice. Based on researched typical rates, social contributions and regimes for a relocator; your real tax depends on your exact situation, residency, deductions and current law.";

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
  if (earner === "employed") return profile.employed;
  return profile.selfEmployed;
}

/** Progressive income tax from ordered brackets (last bracket should use Infinity). */
export function progressiveTax(brackets: Bracket[], income: number): number {
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (income <= lower) break;
    const slice = Math.min(income, b.upTo) - lower;
    tax += slice * b.rate;
    lower = b.upTo;
  }
  return tax;
}

/** Annual social/health charge in USD-equiv, honoring floor, ceiling and income cap. */
export function socialCharge(charge: SocialCharge | undefined, income: number): number {
  if (!charge) return 0;
  const base = charge.capIncome != null ? Math.min(income, charge.capIncome) : income;
  let amt = base * charge.rate;
  if (charge.minAnnual != null) amt = Math.max(amt, charge.minAnnual);
  if (charge.maxAnnual != null) amt = Math.min(amt, charge.maxAnnual);
  return amt;
}

type Candidate = { tax: number; label: string | null };

/**
 * Estimate tax + take-home for a country.
 * @param profile country tax profile
 * @param annualIncome gross annual income (profit / taxable income), USD-equiv
 * @param activity what the user does (drives regime selection)
 * @param annualRevenue optional annual turnover (USD-equiv), gates revenue-based
 *   regimes and is the base for revenue-taxed regimes (e.g. ryczałt).
 */
export function estimateTax(
  profile: TaxProfile,
  annualIncome: number,
  activity: EarnerActivity,
  annualRevenue?: number
): TaxEstimate {
  const income = Math.max(0, annualIncome);
  const earner = activityToEarner(activity);
  const migrated = !!profile.regimes;

  const candidates: Candidate[] = [];

  if (activity === "employed") {
    // Employee path: explicit brackets+social if provided, else legacy curve.
    if (profile.brackets && profile.standardSocial) {
      candidates.push({
        tax: progressiveTax(profile.brackets, income) + socialCharge(profile.standardSocial, income),
        label: null,
      });
    } else {
      candidates.push({ tax: income * rateAtIncome(profile.employed, income), label: null });
    }
  } else {
    // Non-employed path.
    if (profile.brackets && profile.selfEmployedSocial) {
      // General-rules option for migrated countries.
      candidates.push({
        tax: progressiveTax(profile.brackets, income) + socialCharge(profile.selfEmployedSocial, income),
        label: "General rules",
      });
    }
    if (!migrated) {
      // Legacy blended curve + optional legacy regime.
      candidates.push({ tax: income * rateAtIncome(profile.selfEmployed, income), label: null });
      const r = profile.remoteRegime;
      if (r && r.rate * income < income) {
        // Non-employed activities (freelancer/ecommerce/investor) can plausibly
        // use remote/foreign-income regimes too, so honor those here.
        const legacyEligible = r.appliesTo.includes(earner) || r.appliesTo.includes("remote_foreign");
        const revOk = r.maxAnnualRevenue == null || (annualRevenue ?? income) <= r.maxAnnualRevenue;
        const incOk = r.maxAnnualIncome == null || income <= r.maxAnnualIncome;
        if (legacyEligible && revOk && incOk) {
          candidates.push({ tax: income * r.rate, label: r.label });
        }
      }
    }
  }

  // Rich activity-aware regimes (migrated countries).
  for (const reg of profile.regimes ?? []) {
    if (!reg.activities.includes(activity)) continue;
    if (reg.maxAnnualRevenue != null && (annualRevenue ?? income) > reg.maxAnnualRevenue) continue;
    if (reg.maxAnnualIncome != null && income > reg.maxAnnualIncome) continue;
    const basisAmount = reg.basis === "revenue" ? (annualRevenue ?? income) : income;
    const tax = basisAmount * reg.rate + socialCharge(reg.social, income);
    candidates.push({ tax, label: reg.label });
  }

  // Safety net: if somehow no candidate (e.g. migrated employed w/o curve), use the curve.
  if (candidates.length === 0) {
    candidates.push({ tax: income * rateAtIncome(curveFor(profile, earner), income), label: null });
  }

  // Keep the most money in the user's pocket → lowest total tax.
  const best = candidates.reduce((a, b) => (b.tax < a.tax ? b : a));

  let effectiveRate = income > 0 ? best.tax / income : 0;
  effectiveRate = Math.max(0, Math.min(0.75, effectiveRate));
  const taxAmount = Math.round(income * effectiveRate);
  const netAmount = Math.round(income - taxAmount);
  const netPercent = income > 0 ? Math.round((netAmount / income) * 100) : 0;

  return {
    effectiveRate,
    taxAmount,
    netAmount,
    netPercent,
    regimeApplied: best.label,
    vat: profile.vat,
    notes: profile.notes,
    confidence: profile.confidence,
    disclaimer: DISCLAIMER,
  };
}
