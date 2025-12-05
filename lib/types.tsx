// lib/types.ts

//
// All the "reason" flags we use in the form + scoring engine
//
export type RelocationReasonId =
  // Taxes & cost of living
  | "lower_taxes"
  | "tax_not_important"
  | "lower_cost_of_living"
  | "col_not_important"

  // Climate / weather
  | "better_weather"
  | "climate_pref_cold"
  | "climate_pref_mild"
  | "climate_pref_warm"
  | "climate_dont_care"
  | "climate_must_have"

  // Language fit
  | "language_must_have"
  | "language_nice_to_have"
  | "language_flexible"

  // Safety & stability
  | "safety_importance_high"
  | "safety_importance_medium"
  | "safety_not_important"
  | "safety_stability_priority"
  | "personal_safety"
  | "personal_safety_low_priority"
  | "political_stability"
  | "political_stability_low_priority"
  | "low_corruption"
  | "low_corruption_low_priority"

  // Healthcare
  | "healthcare_strong_public"
  | "healthcare_mixed"
  | "healthcare_private"
  | "healthcare_not_important"

  // LGBTQ+
  | "better_lgbtq"
  | "lgbt_full_rights"
  | "lgbt_friendly"
  | "lgbt_dont_care"

  // Culture & vibe
  | "culture_northern_europe"
  | "culture_mediterranean"
  | "culture_north_america"
  | "culture_latin_america"
  | "culture_asia"
  | "culture_not_important"
  | "culture_must_have"

  // Development & infrastructure
  | "development_care_yes"
  | "development_care_some"
  | "development_not_important"
  | "dev_public_transport"
  | "dev_digital_services"
  | "dev_infrastructure_clean"
  | "dev_everyday_services"

  // Work & lifestyle extras (used in scoring / future steps)
  | "career_growth"
  | "remote_work"
  | "expat_community"
  | "social_life";

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
  // Basics
  ageRange?: string;
  currentCountry?: string;
  familyStatus?: string;
  relocatingWith?: string;
  passportCountry?: string;
  secondPassportCountry?: string;

  // Work / income (optional, for the “you keep X%” text)
  workSituation?: string[];
  monthlyIncome?: string | number;
  incomeCurrency?: string;

  // Languages + priorities
  languagesSpoken?: string[];

  // Core priorities from the form
  reasons?: RelocationReasonId[];

  // Sliders / numeric intensities
  taxImportance?: number;       // 1–10
  colImportance?: number;       // 1–10 (cost of living)
  climateImportance?: number;   // 1–10
  lgbtImportance?: number;      // 1–10 (used for hard disqualify)
  languageImportance?: number;  // optional future use
}
