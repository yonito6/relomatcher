import { describe, it, expect } from "vitest";
import { scoreCountry } from "@/lib/scoring/score";
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
