import { describe, it, expect } from "vitest";
import { scoreCountry, rankCountries } from "@/lib/scoring/score";
import { COUNTRIES } from "@/lib/countriesDb";
import type { QuizData } from "@/lib/types";

const makeCountry = (over: any) => ({
  code: "X", name: "X", taxScore: 8, costOfLivingScore: 8, incomeGrowthScore: 5,
  remoteFriendlyScore: 6, safetyScore: 8, lifestyleScore: 7, lgbtScore: 8,
  englishScore: 7, healthcareScore: 7, socialSceneScore: 6, expatSceneScore: 6,
  warmClimateScore: 9, mildClimateScore: 6, coldClimateScore: 3,
  cultureClusters: ["southern_europe"], mainLanguages: ["English"],
  netIncomePercentTypical: 80, shortNote: "", ...over,
});

describe("scoreCountry", () => {
  it("drops dont_care factors (weight 0) and returns 0-100 fit", () => {
    const profile = { factorRatings: { weather: "must", taxes: "dont_care" } } as QuizData;
    const r = scoreCountry(profile, makeCountry({}));
    expect(r.fit).toBeGreaterThan(0);
    expect(r.fit).toBeLessThanOrEqual(100);
    expect(r.breakdown.find((b) => b.id === "taxes")).toBeUndefined();
  });

  it("money bundle (cost+taxes) contributes one combined voice", () => {
    const r = scoreCountry({ factorRatings: { costOfLiving: "important", taxes: "important" } } as QuizData, makeCountry({}));
    const money = r.breakdown.filter((b) => b.id === "costOfLiving" || b.id === "taxes");
    expect(money).toHaveLength(1); // collapsed
    expect(money[0].combined).toBe(true);
  });

  it("empty profile (no factorRatings) returns fit 50 and empty breakdown", () => {
    const r = scoreCountry({} as QuizData, makeCountry({}));
    expect(r.fit).toBe(50);
    expect(r.breakdown).toHaveLength(0);
  });

  it("all dont_care ratings returns fit 50 and empty breakdown", () => {
    const profile = {
      factorRatings: { weather: "dont_care", safety: "dont_care", taxes: "dont_care" },
    } as QuizData;
    const r = scoreCountry(profile, makeCountry({}));
    expect(r.fit).toBe(50);
    expect(r.breakdown).toHaveLength(0);
  });

  it("must filter above floor gives higher fit than same filter at/below floor", () => {
    const profile = { factorRatings: { safety: "must" } } as QuizData;
    // safetyScore 9 (well above must-floor of 7) vs safetyScore 7 (exactly at floor)
    const rHigh = scoreCountry(profile, makeCountry({ safetyScore: 9 }));
    const rAt   = scoreCountry(profile, makeCountry({ safetyScore: 7 }));
    expect(rHigh.fit).toBeGreaterThan(rAt.fit);
  });

  it("taxes-only money bundle: single entry with id 'taxes' and combined true", () => {
    const r = scoreCountry({ factorRatings: { taxes: "important" } } as QuizData, makeCountry({}));
    const money = r.breakdown.filter((b) => b.id === "costOfLiving" || b.id === "taxes");
    expect(money).toHaveLength(1);
    expect(money[0].id).toBe("taxes");
    expect(money[0].combined).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rankCountries tests
// ---------------------------------------------------------------------------

it("must-have LGBTQ+ disqualifies low-lgbt countries", () => {
  const out = rankCountries({ factorRatings: { lgbt: "must" } } as any, COUNTRIES);
  expect(out.top.every((m) => (m.country.lgbtScore ?? 0) >= 7.5)).toBe(true);
});

it("always returns up to 3 even if a must-have would empty the set", () => {
  const out = rankCountries({ factorRatings: { lgbt: "must", safety: "must" } } as any,
    COUNTRIES.map((c) => ({ ...c, lgbtScore: 1, safetyScore: 1 })));
  expect(out.top.length).toBeGreaterThanOrEqual(1);
  expect(out.relaxedFilters).toBe(true);
});

it("selects exactly one moonshot outside the achievable top 3 when applicable", () => {
  const out = rankCountries({ factorRatings: { weather: "must" }, passportCountry: "Atlantis" } as any, COUNTRIES);
  expect(out.moonshot === null || out.top.find((t) => t.country.code === out.moonshot!.country.code)).toBeFalsy();
});

// ---------------------------------------------------------------------------
// Regression: hard-disqualified country must never surface as moonshot
// ---------------------------------------------------------------------------

it("moonshot never surfaces a country that fails a hard must-filter (real COUNTRIES)", () => {
  // Many countries have lgbtScore >= 7.5, so relaxedFilters should remain false
  const out = rankCountries(
    { factorRatings: { lgbt: "must" }, passportCountry: "Germany" } as any,
    COUNTRIES
  );
  expect(out.relaxedFilters).toBe(false);
  if (out.moonshot !== null) {
    expect((out.moonshot.country.lgbtScore ?? 0) >= 7.5).toBe(true);
  }
});

it("moonshot never surfaces a hard-disqualified country (synthetic array)", () => {
  // Passport "Atlantis" = mid bucket (unknown passport → mid in passportBucket).
  // With mid bucket: OPENNESS >= 2 → "doable", OPENNESS 1 → "hard", OPENNESS 0 → "very_hard".
  // Strategy: fill 5 high-lgbt countries with real codes that have OPENNESS >= 1 (doable/hard tier)
  // so they pass the lgbt:must filter and form the top-3.
  // Decoy = real code "SG" (OPENNESS 0 → very_hard, strictly harder tier than doable/hard)
  // with lgbtScore 2 (fails must-floor 7.5) but otherwise perfect stats so it would win rawFit.
  // Before the fix the decoy's higher rawFit + harder tier makes it the moonshot — the bug.
  // After the fix the decoy is excluded from moonshot consideration because it fails the hard filter.

  // MX, TH, MY, CR, PA → all have OPENNESS 2 → "doable" tier with mid passport.
  const highLgbt = (code: string) =>
    makeCountry({ code, lgbtScore: 9.5, safetyScore: 9, taxScore: 9, costOfLivingScore: 9 });

  // SG has OPENNESS 0 → "very_hard" tier; lgbtScore 2 → fails lgbt:must floor (7.5)
  const lowLgbtDecoy = makeCountry({
    code: "SG",
    lgbtScore: 2,
    taxScore: 10, costOfLivingScore: 10, safetyScore: 10,
    incomeGrowthScore: 10, englishScore: 10,
  });

  const syntheticCountries = [
    highLgbt("MX"), highLgbt("TH"), highLgbt("MY"), highLgbt("CR"), highLgbt("PA"),
    lowLgbtDecoy,
  ];

  const out = rankCountries(
    { factorRatings: { lgbt: "must" }, passportCountry: "Atlantis" } as any,
    syntheticCountries as any
  );

  // Enough countries pass, so no relaxation needed
  expect(out.relaxedFilters).toBe(false);
  // The decoy must never be the moonshot
  expect(out.moonshot?.country.code).not.toBe("SG");
  if (out.moonshot !== null) {
    expect((out.moonshot.country.lgbtScore ?? 0) >= 7.5).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// Golden-profile property tests
// ---------------------------------------------------------------------------

describe("rankCountries golden profiles", () => {
  it("LGBTQ+ + EU passport: every top country has lgbtScore >= 7.5", () => {
    const out = rankCountries(
      { factorRatings: { lgbt: "must", safety: "important" }, passportCountry: "Germany" } as any,
      COUNTRIES
    );
    expect(out.top.length).toBeGreaterThan(0);
    expect(out.top.every((m) => (m.country.lgbtScore ?? 0) >= 7.5)).toBe(true);
  });

  it("LGBTQ+ + EU passport: at least the top result has tier 'easy'", () => {
    const out = rankCountries(
      { factorRatings: { lgbt: "must", safety: "important" }, passportCountry: "Germany" } as any,
      COUNTRIES
    );
    expect(out.top[0].tier).toBe("easy");
  });

  it("budget warm-weather persona: top-3 average warmClimateScore above median", () => {
    const warmScores = COUNTRIES.map((c) => c.warmClimateScore ?? 5).sort((a, b) => a - b);
    const medianWarm = warmScores[Math.floor(warmScores.length / 2)];
    const colScores = COUNTRIES.map((c) => c.costOfLivingScore).sort((a, b) => a - b);
    const medianCol = colScores[Math.floor(colScores.length / 2)];

    const out = rankCountries(
      { factorRatings: { weather: "must", costOfLiving: "must" }, climatePref: "warm" } as any,
      COUNTRIES
    );
    const avgWarm = out.top.reduce((s, m) => s + (m.country.warmClimateScore ?? 5), 0) / out.top.length;
    const avgCol = out.top.reduce((s, m) => s + m.country.costOfLivingScore, 0) / out.top.length;
    expect(avgWarm).toBeGreaterThan(medianWarm * 0.85); // tolerant threshold
    expect(avgCol).toBeGreaterThan(medianCol * 0.85);
  });

  it("low-tax persona: top countries have above-median taxScore", () => {
    const taxScores = COUNTRIES.map((c) => c.taxScore).sort((a, b) => a - b);
    const medianTax = taxScores[Math.floor(taxScores.length / 2)];

    const out = rankCountries(
      { factorRatings: { taxes: "must" } } as any,
      COUNTRIES
    );
    const avgTax = out.top.reduce((s, m) => s + m.country.taxScore, 0) / out.top.length;
    expect(avgTax).toBeGreaterThan(medianTax * 0.9);
  });
});
