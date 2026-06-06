import { describe, it, expect } from "vitest";
import { scoreCountry } from "@/lib/scoring/score";
import type { QuizData } from "@/lib/types";

const c = (over: any) => ({
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
    const r = scoreCountry(profile, c({}));
    expect(r.fit).toBeGreaterThan(0);
    expect(r.fit).toBeLessThanOrEqual(100);
    expect(r.breakdown.find((b) => b.id === "taxes")).toBeUndefined();
  });
  it("money bundle (cost+taxes) contributes one combined voice", () => {
    const r = scoreCountry({ factorRatings: { costOfLiving: "important", taxes: "important" } } as QuizData, c({}));
    const money = r.breakdown.filter((b) => b.id === "costOfLiving" || b.id === "taxes");
    expect(money).toHaveLength(1); // collapsed
    expect(money[0].combined).toBe(true);
  });
});
