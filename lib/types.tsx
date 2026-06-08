// lib/types.ts

import type { FactorRatings, ClimatePref, CulturePref, MobilityRights } from "@/lib/scoring/types";
import type { EarnerType, EarnerActivity } from "@/lib/tax/types";

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
  /** Optional annual business turnover/revenue (self-employed / nomad only).
   *  Used ONLY to test eligibility for revenue-capped flat tax regimes — the
   *  income field still drives the tax math. */
  annualRevenue?: string | number;
  languagesSpoken?: string[];
  factorRatings?: FactorRatings;
  climatePref?: ClimatePref;
  culturePref?: CulturePref;
  mobilityRights?: MobilityRights;
  /** When taxes is a kept factor: "lower" = wants lower taxes than their home
   *  country (relative scoring vs currentCountry); "any" = absolute low-tax. */
  taxPreference?: "lower" | "any";
  /** When costOfLiving is a kept factor: "cheaper" = wants cheaper than home;
   *  "any" = absolute affordability. */
  costPreference?: "cheaper" | "any";
  /** How the user earns — drives the tax estimate (employed vs self-employed vs
   *  remote/nomad). Defaults to "employed" when not set. Legacy; superseded by
   *  workActivity for regime selection. */
  earnerType?: EarnerType;
  /** What the user does — picks the right tax regime (ecommerce/goods vs
   *  freelance services are taxed very differently). Defaults to "employed". */
  workActivity?: EarnerActivity;
}
