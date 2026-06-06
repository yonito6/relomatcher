import type { CountryRecord, CultureCluster } from "@/lib/countriesDb";

export type FactorId =
  | "weather" | "safety" | "lgbt" | "language" | "jobs"
  | "costOfLiving" | "taxes" | "healthcare" | "culture" | "social";
export type Rating = "dont_care" | "nice" | "important" | "must";
export type FactorRole = "filter" | "differentiator";
export type FactorRatings = Partial<Record<FactorId, Rating>>;
export type ClimatePref = "warm" | "mild" | "cold";
export type CulturePref = CultureCluster;
export type MobilityRights = "eu_eea" | "strong_passport" | "none";

// feasibility (single source of truth for Tier — tier.ts imports this)
export type Tier = "easy" | "doable" | "hard" | "very_hard";

// scoring result shapes (used by score.ts, the API contract, and the UI)
export type Breakdown = { id: FactorId; score: number; weight: number; combined?: boolean };
export type CountryFit = { fit: number; breakdown: Breakdown[] };
export type MatchResult = {
  country: CountryRecord;
  fit: number;            // 0–100, feasibility-adjusted for ranking
  rawFit: number;         // 0–100, before feasibility nudge (used for moonshot)
  tier: Tier;
  reason: string;         // feasibility reason (one line)
  tradeoff: string;       // honest weakest-kept-factor line
  note?: string;          // optional AI-polished blurb
  breakdown: Breakdown[];
  moonshot?: boolean;
};
