import { FACTORS, ratingWeight } from "@/lib/factors";
import { COUNTRIES } from "@/lib/countriesDb";
import type { CountryRecord, CultureCluster } from "@/lib/countriesDb";
import type { QuizData } from "@/lib/types";
import type { CountryFit, Breakdown, ClimatePref, CulturePref, FactorId, Rating, Tier, MatchResult } from "@/lib/scoring/types";
import { feasibilityTier } from "@/lib/feasibility/tier";

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
  // No pref → deliberately slightly-positive default (per spec: users who skip
  // culture preference shouldn't be penalised; 6 is a mild positive signal).
  if (culturePref == null) return 6;
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

/** Find the user's home country record in the DB by name (for relative
 *  "lower than my country" preferences). Returns undefined if not in the DB. */
function homeCountry(profile: any): CountryRecord | undefined {
  const name = profile.currentCountry as string | undefined;
  if (!name) return undefined;
  return COUNTRIES.find((c) => c.name === name);
}

/** Map a candidate-vs-home score delta onto a 0–10 scale, neutral at 5.
 *  Both inputs are "higher = better for the user" scores (e.g. higher taxScore
 *  = lower taxes). A candidate matching home → 5; clearly better → above 5. */
function relativeScore(candidateScore: number, homeScore: number): number {
  return Math.min(10, Math.max(0, 5 + (candidateScore - homeScore)));
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

  // Taxes gets special treatment: `taxes.fields` lists ["taxScore","netIncomePercentTypical"]
  // but netIncomePercentTypical is a 0–100 percentage, not a 0–10 score, so we can't use
  // the generic field-average path. Instead we normalise it by dividing by 10 here.
  if (factorId === "taxes") {
    // Relative mode: user wants LOWER taxes than their home country. Score each
    // candidate by how much lower its taxes are vs home (neutral at parity).
    if (profile.taxPreference === "lower") {
      const home = homeCountry(profile);
      if (home) return relativeScore((country as any).taxScore ?? 0, home.taxScore);
    }
    const a = (country as any).taxScore as number | undefined;
    const b = (country as any).netIncomePercentTypical as number | undefined;
    const vals: number[] = [];
    if (a !== undefined) vals.push(a);
    if (b !== undefined) vals.push(b / 10); // convert 0–100 percentage → 0–10 scale
    return mean(vals);
  }

  // Cost of living relative mode: user wants somewhere CHEAPER than home.
  if (factorId === "costOfLiving" && profile.costPreference === "cheaper") {
    const home = homeCountry(profile);
    if (home) return relativeScore((country as any).costOfLivingScore ?? 0, home.costOfLivingScore);
  }

  // generic: mean of the factor's field values (undefined fields treated as 0)
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

  // Determine kept factors (rating exists and is not "dont_care").
  // Store floor directly from FactorDef so the bonus loop needs no second FACTORS.find.
  type KeptEntry = {
    id: FactorId;
    score: number;
    weight: number;
    role: string;
    floor?: Partial<Record<Rating, number>>;
    combined?: true;
  };
  const kept: KeptEntry[] = [];

  for (const factor of FACTORS) {
    const rating = factorRatings[factor.id];
    if (!rating || rating === "dont_care") continue;
    // skip costOfLiving and taxes here — handled separately as money bundle
    if (factor.id === "costOfLiving" || factor.id === "taxes") continue;

    const score = resolveFactorScore(factor.id, country, p);
    const weight = ratingWeight(rating as Rating);
    kept.push({ id: factor.id as FactorId, score, weight, role: factor.role, floor: factor.floor });
  }

  // Money bundle: collapse costOfLiving + taxes into one combined entry.
  // Money is always treated as a differentiator bundle regardless of original roles.
  const colRating = factorRatings["costOfLiving"];
  const taxRating = factorRatings["taxes"];
  const colKept = colRating && colRating !== "dont_care";
  const taxKept = taxRating && taxRating !== "dont_care";

  let moneyEntry: KeptEntry | null = null;
  if (colKept || taxKept) {
    const scores: number[] = [];
    const weights: number[] = [];
    if (colKept) {
      scores.push(resolveFactorScore("costOfLiving", country, p));
      weights.push(ratingWeight(colRating as Rating));
    }
    if (taxKept) {
      scores.push(resolveFactorScore("taxes", country, p));
      weights.push(ratingWeight(taxRating as Rating));
    }
    const bundleScore = mean(scores);
    const bundleWeight = Math.max(...weights);
    // Deterministic id: use "costOfLiving" if it's kept, else "taxes"
    const bundleId: FactorId = colKept ? "costOfLiving" : "taxes";
    moneyEntry = {
      id: bundleId,
      score: bundleScore,
      weight: bundleWeight,
      role: "differentiator", // money is always a differentiator bundle
      combined: true,
    };
  }

  const allContributions = moneyEntry ? [...kept, moneyEntry] : kept;

  if (allContributions.length === 0) {
    return { fit: 50, breakdown: [] };
  }

  // Weighted average of all contribution scores → 0–10
  let totalWeightedScore = 0;
  let totalWeight = 0;
  for (const c of allContributions) {
    totalWeightedScore += c.score * c.weight;
    totalWeight += c.weight;
  }
  const weightedAvg = totalWeightedScore / totalWeight; // 0–10

  // Floor bonus for filter factors: rewards countries that clear their floor threshold.
  // Each per-filter bonus is capped at 0.5; total bonusSum capped at 1.0 to prevent
  // stacking multiple must-filters from compressing the top of the scale.
  // Final rawScore range: weightedAvg (0–10) + bonusSum (0–1.0), so max ≈ 11 before ×10 clamp.
  let bonusSum = 0;
  for (const c of kept) {
    if (c.role !== "filter" || !c.floor) continue;
    const rating = factorRatings[c.id] as Rating | undefined;
    if (!rating) continue;
    const floorVal = c.floor[rating];
    if (floorVal === undefined) continue;
    const diff = c.score - floorVal;
    if (diff <= 0) continue;
    const denominator = 10 - floorVal;
    const bonus = denominator > 0 ? 0.5 * (diff / denominator) : 0;
    bonusSum += Math.min(0.5, Math.max(0, bonus));
  }
  bonusSum = Math.min(bonusSum, 1.0); // cap total bonus

  const rawScore = weightedAvg + bonusSum; // 0–10 weighted avg + up to 1.0 bonus
  const fit = Math.min(100, Math.max(0, rawScore * 10));

  const breakdown: Breakdown[] = allContributions.map((c) => {
    const entry: Breakdown = { id: c.id, score: c.score, weight: c.weight };
    if (c.combined) entry.combined = true;
    return entry;
  });

  return { fit, breakdown };
}

// ---------------------------------------------------------------------------
// rankCountries helpers
// ---------------------------------------------------------------------------

/** Tier → integer rank for ordering (easy=0 … very_hard=3). */
function tierRank(tier: Tier): number {
  switch (tier) {
    case "easy":      return 0;
    case "doable":    return 1;
    case "hard":      return 2;
    case "very_hard": return 3;
  }
}

/**
 * Feasibility soft penalty subtracted from fit for ranking purposes (fit-points on the
 * 0–100 scale). Tuned so a barely-viable easy-tier country stays ahead of a higher-raw-fit
 * but much-harder-to-move-to country, while remaining bounded and monotonic.
 *   easy=0, doable=−3, hard=−8, very_hard=−15
 */
function feasibilityPenalty(tier: Tier): number {
  switch (tier) {
    case "easy":      return 0;
    case "doable":    return 3;
    case "hard":      return 8;
    case "very_hard": return 15;
  }
}

/**
 * Field name on CountryRecord that corresponds to a filter factor's score.
 * Only the three filter factors (safety, lgbt, healthcare) have a floor.
 */
const FILTER_FIELD: Partial<Record<string, string>> = {
  safety:     "safetyScore",
  lgbt:       "lgbtScore",
  healthcare: "healthcareScore",
};

/** Build one tradeoff line from the breakdown: "Weakest on <label>" for the
 *  lowest-scoring kept factor (by raw score), or a generic line if empty. */
function buildTradeoff(breakdown: Breakdown[]): string {
  if (breakdown.length === 0) return "No specific factors rated — consider adding priorities.";
  const worst = breakdown.reduce((a, b) => (a.score <= b.score ? a : b));
  const factor = FACTORS.find((f) => f.id === worst.id);
  const label = factor?.label ?? worst.id;
  return `Weakest on ${label}`;
}

// ---------------------------------------------------------------------------
// rankCountries — main export
// ---------------------------------------------------------------------------

export type RankResult = {
  top: MatchResult[];
  moonshot: MatchResult | null;
  disqualified: MatchResult[];
  relaxedFilters: boolean;
};

export function rankCountries(profile: QuizData, countries: CountryRecord[]): RankResult {
  const p = profile as any;
  const factorRatings: Partial<Record<string, string>> = p.factorRatings ?? {};

  // --- Identify hard must-have filters ---
  // Factors that are: role=filter, rated "must", and have a floor.must defined.
  type MustFilter = { field: string; floor: number };
  const mustFilters: MustFilter[] = [];
  for (const factor of FACTORS) {
    if (factor.role !== "filter") continue;
    if (factorRatings[factor.id] !== "must") continue;
    if (factor.floor?.must === undefined) continue;
    const field = FILTER_FIELD[factor.id];
    if (!field) continue;
    mustFilters.push({ field, floor: factor.floor.must });
  }

  /** Returns true if country passes all must-filters. */
  function passesHardFilters(c: CountryRecord): boolean {
    return mustFilters.every(({ field, floor }) => ((c as any)[field] ?? 0) >= floor);
  }

  // Compute how many countries pass the hard filters
  const passingCount = countries.filter(passesHardFilters).length;
  const relaxedFilters = mustFilters.length > 0 && passingCount < 3;

  // --- Score + tier every country ---
  type Candidate = {
    country: CountryRecord;
    rawFit: number;
    breakdown: Breakdown[];
    tier: Tier;
    reason: string;
    adjustedFit: number;
    failed: boolean; // failed hard filters (only relevant when relaxedFilters=false)
  };

  const candidates: Candidate[] = countries.map((c) => {
    const { fit: rawFit, breakdown } = scoreCountry(profile, c);
    const { tier, reason } = feasibilityTier(profile, c);
    const failed = mustFilters.length > 0 && !passesHardFilters(c);

    let adjustedFit = rawFit - feasibilityPenalty(tier);

    if (relaxedFilters && failed) {
      // Soft penalty: for each failed filter, subtract proportionally to how far below floor
      let softPenalty = 0;
      for (const { field, floor } of mustFilters) {
        const score = (c as any)[field] ?? 0;
        if (score < floor) {
          // deficit as a fraction of the floor, scaled to a heavy penalty (max 40 per filter)
          const deficit = (floor - score) / floor;
          softPenalty += 40 * deficit;
        }
      }
      adjustedFit -= softPenalty;
    }

    // Floor at −50: prevents a multi-filter-failing country from sinking arbitrarily
    // low so the relaxed-fallback sort stays intuitive between failing countries.
    // (The final UI fit is separately clamped to 0–100 when building MatchResults.)
    adjustedFit = Math.max(-50, adjustedFit);

    return { country: c, rawFit, breakdown, tier, reason, adjustedFit, failed };
  });

  // --- Split passing vs disqualified (only meaningful when relaxedFilters=false) ---
  // Honesty note (relaxed-mode exception): when relaxedFilters=true, nothing cleared
  // every hard must-filter, so we intentionally let Must-failing countries into the
  // ranked set (with a heavy soft penalty above) rather than show an empty result.
  // This is always disclosed to the user via the relaxedFilters banner in the UI.
  // The invariant still holds where it matters most: a Must-failing country can NEVER
  // become the aspirational moonshot (see the `!c.failed` guard below).
  const passing = relaxedFilters
    ? candidates
    : candidates.filter((c) => !c.failed);
  const disqualifiedCandidates = relaxedFilters
    ? []
    : candidates.filter((c) => c.failed);

  // Sort passing by adjustedFit descending
  const sorted = [...passing].sort((a, b) => b.adjustedFit - a.adjustedFit);

  // --- Build top 3 MatchResults ---
  const topCandidates = sorted.slice(0, 3);
  const top: MatchResult[] = topCandidates.map((c) => ({
    country:   c.country,
    fit:       Math.max(0, Math.min(100, c.adjustedFit)),
    rawFit:    c.rawFit,
    tier:      c.tier,
    reason:    c.reason,
    tradeoff:  buildTradeoff(c.breakdown),
    breakdown: c.breakdown,
  }));

  // --- Moonshot: highest rawFit country NOT in top whose tier-rank is strictly
  //     greater than the max tier-rank of the top 3. ---
  let moonshot: MatchResult | null = null;
  if (top.length > 0) {
    const topCodes = new Set(top.map((m) => m.country.code));
    const maxTopTierRank = Math.max(...top.map((m) => tierRank(m.tier)));

    // Only consider countries that pass hard must-filters — never surface a
    // disqualified country as an aspirational pick.
    const moonshotCandidates = candidates
      .filter((c) => !c.failed && !topCodes.has(c.country.code) && tierRank(c.tier) > maxTopTierRank)
      .sort((a, b) => b.rawFit - a.rawFit);

    if (moonshotCandidates.length > 0) {
      const mc = moonshotCandidates[0];
      moonshot = {
        country:   mc.country,
        fit:       Math.max(0, Math.min(100, mc.adjustedFit)),
        rawFit:    mc.rawFit,
        tier:      mc.tier,
        reason:    mc.reason,
        tradeoff:  buildTradeoff(mc.breakdown),
        breakdown: mc.breakdown,
        moonshot:  true,
      };
    }
  }

  // --- Disqualified MatchResults ---
  const disqualified: MatchResult[] = disqualifiedCandidates.map((c) => ({
    country:   c.country,
    fit:       Math.max(0, Math.min(100, c.adjustedFit)),
    rawFit:    c.rawFit,
    tier:      c.tier,
    reason:    c.reason,
    tradeoff:  buildTradeoff(c.breakdown),
    breakdown: c.breakdown,
  }));

  return { top, moonshot, disqualified, relaxedFilters };
}
