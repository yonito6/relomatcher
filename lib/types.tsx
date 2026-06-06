// lib/types.ts

import type { FactorRatings, ClimatePref, CulturePref, MobilityRights } from "@/lib/scoring/types";

export type ClimatePreference = "warm" | "mild" | "cold" | "no_preference";

export type PlaceTypePreference =
  | "big_city"
  | "mid_sized"
  | "small_town"
  | "no_preference";

//
// This is the payload shape sent between page.tsx and /api/quiz
//
export interface QuizData {
  ageRange?: string;
  currentCountry?: string;
  familyStatus?: string;
  relocatingWith?: string;
  passportCountry?: string;
  secondPassportCountry?: string;
  monthlyIncome?: string | number;
  incomeCurrency?: string;
  languagesSpoken?: string[];
  factorRatings?: FactorRatings;
  climatePref?: ClimatePref;
  culturePref?: CulturePref;
  mobilityRights?: MobilityRights;
}
