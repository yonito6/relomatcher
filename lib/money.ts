// lib/money.ts
// Shared, honest money-math helpers used by BOTH the results sales copy and the
// PDF report, so the numbers a buyer sees on the page match the numbers inside
// the report they pay for. All figures are clearly-labelled estimates derived
// from each country's typical net-income-kept percentage — no invented precision.

import { COUNTRIES, type CountryRecord } from "@/lib/countriesDb";
import type { QuizData } from "@/lib/types";
import { taxProfileFor } from "@/lib/tax/data";
import { estimateTax } from "@/lib/tax/estimate";
import type { TaxEstimate, EarnerActivity } from "@/lib/tax/types";
import { toUSD } from "@/lib/fx";

/** Resolve the user's work activity (new field), falling back to the older
 *  earnerType, then to employed. Drives which tax regime we apply. */
export function activityFor(profile: QuizData): EarnerActivity {
  if (profile.workActivity) return profile.workActivity;
  switch (profile.earnerType) {
    case "employed":
      return "employed";
    case "self_employed":
    case "remote_foreign":
      return "freelancer";
    default:
      return "employed";
  }
}

/** Parse the self-reported monthly income into a positive number, or null. */
export function parseMonthlyIncome(profile: QuizData): number | null {
  const raw = profile.monthlyIncome;
  if (raw == null || raw === "") return null;
  const n =
    typeof raw === "number"
      ? raw
      : parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Parse the optional self-reported annual business revenue into a positive number, or null. */
export function parseAnnualRevenue(profile: QuizData): number | null {
  const raw = profile.annualRevenue;
  if (raw == null || raw === "") return null;
  const n =
    typeof raw === "number"
      ? raw
      : parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** The user's home-country record (for relative comparisons), if it's in the DB. */
export function homeRecord(profile: QuizData): CountryRecord | undefined {
  if (!profile.currentCountry) return undefined;
  return COUNTRIES.find((c) => c.name === profile.currentCountry);
}

/**
 * Estimated annual take-home DIFFERENCE versus the user's home country, in the
 * same currency as their stated income. Positive = they keep MORE per year in
 * the candidate country. Returns null when income or the home country is unknown.
 *
 * Math: annualGross * (candidateNetKept% - homeNetKept%) / 100.
 * This is an estimate based on typical effective net-income rates, not tax advice.
 */
export function annualTakeHomeDelta(
  profile: QuizData,
  country: CountryRecord
): number | null {
  const monthly = parseMonthlyIncome(profile);
  const home = homeRecord(profile);
  if (monthly == null || !home) return null;
  const annualGross = monthly * 12;
  return Math.round((annualGross * (country.netIncomePercentTypical - home.netIncomePercentTypical)) / 100);
}

/**
 * Estimate the user's tax + take-home in a candidate country, using their
 * stated annual income and earner type. Returns null when income is unknown or
 * we have no tax profile for the country. Honest estimate (see TaxEstimate.disclaimer).
 */
export function estimateForCountry(
  profile: QuizData,
  country: CountryRecord
): TaxEstimate | null {
  const monthly = parseMonthlyIncome(profile);
  if (monthly == null) return null;
  const taxProfile = taxProfileFor(country.code);
  if (!taxProfile) return null;
  const activity = activityFor(profile);
  const cur = profile.incomeCurrency;
  const annualLocal = monthly * 12;
  // Convert to USD so the income lands on the correct (USD-denominated) brackets.
  const annualUSD = toUSD(annualLocal, cur);
  const revLocal = parseAnnualRevenue(profile);
  const revUSD = revLocal != null ? toUSD(revLocal, cur) : undefined;
  const est = estimateTax(taxProfile, annualUSD, activity, revUSD);
  // The effective rate is currency-agnostic; report the actual amounts back in
  // the user's own currency so the UI shows their coin, not USD.
  const taxAmount = Math.round(annualLocal * est.effectiveRate);
  const netAmount = annualLocal - taxAmount;
  return { ...est, taxAmount, netAmount };
}

/**
 * Estimated annual take-home DIFFERENCE vs home, using the per-earner tax
 * estimator for BOTH countries (more accurate than the static netIncomePercent
 * fields). Positive = keep more per year in the candidate. Null if income
 * unknown or either country lacks a tax profile.
 */
export function estimatedAnnualDeltaVsHome(
  profile: QuizData,
  country: CountryRecord
): number | null {
  const home = homeRecord(profile);
  if (!home) return null;
  const candEst = estimateForCountry(profile, country);
  const homeEst = estimateForCountry(profile, home);
  if (!candEst || !homeEst) return null;
  return candEst.netAmount - homeEst.netAmount;
}

/** Format a number as currency in the user's income currency (defaults USD). */
export function formatMoney(amount: number, currency?: string): string {
  const cur = (currency || "USD").toUpperCase();
  const abs = Math.abs(Math.round(amount));
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(abs);
  } catch {
    // Unknown/invalid currency code → fall back to a plain grouped number + code.
    return `${abs.toLocaleString("en-US")} ${cur}`;
  }
}

/**
 * A short, honest cost-of-living comparison phrase vs home, derived from the
 * 0–10 costOfLivingScore (higher = cheaper). Returns null if home unknown.
 */
export function costOfLivingVsHome(
  profile: QuizData,
  country: CountryRecord
): { cheaper: boolean; delta: number; phrase: string } | null {
  const home = homeRecord(profile);
  if (!home) return null;
  const delta = country.costOfLivingScore - home.costOfLivingScore;
  if (Math.abs(delta) < 0.5) {
    return { cheaper: false, delta, phrase: "Similar day-to-day costs to home" };
  }
  const cheaper = delta > 0;
  const phrase = cheaper
    ? "Noticeably cheaper day-to-day than home"
    : "More expensive day-to-day than home";
  return { cheaper, delta, phrase };
}
