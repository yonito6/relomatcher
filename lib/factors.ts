import type { FactorId, FactorRole, Rating } from "@/lib/scoring/types";

export type FactorDef = {
  id: FactorId;
  label: string;
  emoji: string;
  role: FactorRole;
  /** Numeric DB fields this factor reads; multi-field factors average them (0–10). Empty when `derived` is set. */
  fields: string[];
  /** Special resolver for non-numeric/derived scores. "climate" uses climatePref; "culture" uses culturePref + cultureClusters. */
  derived?: "climate" | "culture";
  /** for filters: minimum acceptable country score at each rating */
  floor?: Partial<Record<Rating, number>>;
};

export const FACTORS: FactorDef[] = [
  { id: "weather", label: "Weather", emoji: "🌦️", role: "differentiator", fields: [], derived: "climate" },
  { id: "safety", label: "Safety & stability", emoji: "🛡️", role: "filter", fields: ["safetyScore"], floor: { nice: 0, important: 5.5, must: 7 } },
  { id: "lgbt", label: "LGBTQ+ acceptance", emoji: "🏳️‍🌈", role: "filter", fields: ["lgbtScore"], floor: { nice: 0, important: 6, must: 7.5 } },
  { id: "language", label: "Language ease", emoji: "🗣️", role: "differentiator", fields: ["englishScore"] },
  { id: "jobs", label: "Jobs & income", emoji: "💼", role: "differentiator", fields: ["incomeGrowthScore","remoteFriendlyScore"] },
  { id: "costOfLiving", label: "Cost of living", emoji: "💸", role: "differentiator", fields: ["costOfLivingScore"] },
  { id: "taxes", label: "Low taxes", emoji: "🧾", role: "differentiator", fields: ["taxScore","netIncomePercentTypical"] },
  { id: "healthcare", label: "Healthcare", emoji: "🏥", role: "filter", fields: ["healthcareScore"], floor: { nice: 0, important: 5, must: 6.5 } },
  { id: "culture", label: "Culture & vibe", emoji: "🌍", role: "differentiator", fields: [], derived: "culture" },
  { id: "social", label: "Social life", emoji: "🎉", role: "differentiator", fields: ["socialSceneScore","expatSceneScore"] },
];

export function ratingWeight(r: Rating): number {
  switch (r) {
    case "dont_care": return 0;
    case "nice": return 1;
    case "important": return 2.5;
    case "must": return 4;
  }
}
