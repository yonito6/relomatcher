import { FACTORS, ratingWeight } from "@/lib/factors";
import type { CountryRecord, CultureCluster } from "@/lib/countriesDb";
import type { QuizData } from "@/lib/types";
import type { CountryFit, Breakdown, ClimatePref, CulturePref } from "@/lib/scoring/types";

// ---------------------------------------------------------------------------
// Culture adjacency map
// Clusters that are "close" to each other (same continent / region bleed).
// Exact match = 10, adjacent = 5, otherwise = 2.
// ---------------------------------------------------------------------------
const ADJACENT: Partial<Record<CultureCluster, CultureCluster[]>> = {
  northern_europe: ["western_europe"],
  western_europe: ["northern_europe", "southern_europe", "mediterranean"],
  southern_europe: ["western_europe", "mediterranean"],
  mediterranean:   ["southern_europe", "western_europe"],
  north_america:   ["latin_america", "western_europe"],
  latin_america:   ["north_america", "mediterranean"],
  asia:            ["oceania"],
  oceania:         ["asia"],
  post_soviet:     ["northern_europe", "western_europe"],
  middle_east:     ["mediterranean"],
  other:           [],
};

function culturalScore(country: CountryRecord, culturePref: CulturePref | undefined): number {
  if (culturePref == null) return 6; // neutral when no pref
  const clusters = (country as any).cultureClusters as CultureCluster[] | undefined;
  if (!clusters || clusters.length === 0) return 2;
  if (clusters.includes(culturePref)) return 10;
  const neighbours = ADJACENT[culturePref] ?? [];
  if (clusters.some((c) => neighbours.includes(c))) return 5;
  return 2;
}

function climateScore(country: CountryRecord, climatePref: ClimatePref | undefined): number {
  if (climatePref === "warm") return country.warmClimateScore ?? 0;
  if (climatePref === "mild") return country.mildClimateScore ?? 0;
  if (climatePref === "cold") return country.coldClimateScore ?? 0;
  // No preference: mean of whichever climate scores are defined
  const defined = [country.warmClimateScore, country.mildClimateScore, country.coldClimateScore].filter(
    (v): v is number => v !== undefined
  );
  if (defined.length === 0) return 5;
  return defined.reduce((a, b) => a + b, 0) / defined.length;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function resolveFactorScore(
  factorId: string,
  country: CountryRecord,
  profile: any
): number {
  const factor = FACTORS.find((f) => f.id === factorId);
  if (!factor) return 0;

  if (factor.derived === "climate") {
    return climateScore(country, profile.climatePref as ClimatePref | undefined);
  }
  if (factor.derived === "culture") {
    return culturalScore(country, profile.culturePref as CulturePref | undefined);
  }

  // field-based resolution
  if (factorId === "taxes") {
    // special: mean of taxScore and netIncomePercentTypical / 10
    const a = (country as any).taxScore as number | undefined;
    const b = (country as any).netIncomePercentTypical as number | undefined;
    const vals: number[] = [];
    if (a !== undefined) vals.push(a);
    if (b !== undefined) vals.push(b / 10);
    return mean(vals);
  }

  // generic: mean of the factor's field values
  const nums = factor.fields.map((field) => {
    const v = (country as any)[field] as number | undefined;
    return v !== undefined ? v : 0;
  });
  return mean(nums);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function scoreCountry(profile: QuizData, country: CountryRecord): CountryFit {
  const p = profile as any;
  const factorRatings: Partial<Record<string, string>> = p.factorRatings ?? {};

  // Determine kept factors (rating exists and is not "dont_care")
  type KeptEntry = { id: string; score: number; weight: number; role: string; floor?: any };
  const kept: KeptEntry[] = [];

  for (const factor of FACTORS) {
    const rating = factorRatings[factor.id];
    if (!rating || rating === "dont_care") continue;
    // skip costOfLiving and taxes here — handled separately as money bundle
    if (factor.id === "costOfLiving" || factor.id === "taxes") continue;

    const score = resolveFactorScore(factor.id, country, p);
    const weight = ratingWeight(rating as any);
    kept.push({ id: factor.id, score, weight, role: factor.role, floor: factor.floor });
  }

  // Money bundle: collapse costOfLiving + taxes into one entry
  const colRating = factorRatings["costOfLiving"];
  const taxRating = factorRatings["taxes"];
  const colKept = colRating && colRating !== "dont_care";
  const taxKept = taxRating && taxRating !== "dont_care";

  let moneyEntry: (KeptEntry & { combined: true }) | null = null;
  if (colKept || taxKept) {
    const scores: number[] = [];
    const weights: number[] = [];
    if (colKept) {
      scores.push(resolveFactorScore("costOfLiving", country, p));
      weights.push(ratingWeight(colRating as any));
    }
    if (taxKept) {
      scores.push(resolveFactorScore("taxes", country, p));
      weights.push(ratingWeight(taxRating as any));
    }
    const bundleScore = mean(scores);
    const bundleWeight = Math.max(...weights);
    // Deterministic id: use "costOfLiving" if it's kept, else "taxes"
    const bundleId = colKept ? "costOfLiving" : "taxes";
    moneyEntry = {
      id: bundleId,
      score: bundleScore,
      weight: bundleWeight,
      role: "differentiator",
      floor: undefined,
      combined: true,
    };
  }

  const allContributions = moneyEntry ? [...kept, moneyEntry] : kept;

  if (allContributions.length === 0) {
    return { fit: 50, breakdown: [] };
  }

  // Weighted average of all contribution scores
  let totalWeightedScore = 0;
  let totalWeight = 0;
  for (const c of allContributions) {
    totalWeightedScore += c.score * c.weight;
    totalWeight += c.weight;
  }
  const weightedAvg = totalWeightedScore / totalWeight; // 0–10

  // Floor bonus for filter factors
  let bonusSum = 0;
  for (const c of kept) {
    if (c.role !== "filter" || !c.floor) continue;
    const factorDef = FACTORS.find((f) => f.id === c.id);
    if (!factorDef?.floor) continue;
    const rating = factorRatings[c.id] as any;
    const floorVal = factorDef.floor[rating as keyof typeof factorDef.floor];
    if (floorVal === undefined) continue;
    const diff = c.score - floorVal;
    if (diff <= 0) continue;
    const denominator = 10 - floorVal;
    const bonus = denominator > 0 ? 0.5 * (diff / denominator) : 0;
    bonusSum += Math.min(0.5, Math.max(0, bonus));
  }

  const rawScore = weightedAvg + bonusSum; // still roughly 0–10 range
  const fit = Math.min(100, Math.max(0, rawScore * 10));

  const breakdown: Breakdown[] = allContributions.map((c) => {
    const entry: Breakdown = { id: c.id as any, score: c.score, weight: c.weight };
    if ((c as any).combined) entry.combined = true;
    return entry;
  });

  return { fit, breakdown };
}
