import { passportBucket } from "./passport";
import { OPENNESS, EU_EEA_CODES } from "./openness";
import type { CountryRecord } from "@/lib/countriesDb";
import type { QuizData } from "@/lib/types";
import type { Tier } from "@/lib/scoring/types"; // single source of truth

export type Feasibility = { tier: Tier; reason: string };

export function feasibilityTier(profile: QuizData, c: CountryRecord): Feasibility {
  const bucket = (profile as any).mobilityRights === "eu_eea"
    ? "eu_eea"
    : passportBucket(profile.passportCountry) === "eu_eea" ||
      passportBucket((profile as any).secondPassportCountry) === "eu_eea"
      ? "eu_eea" : passportBucket(profile.passportCountry);

  if (bucket === "eu_eea" && EU_EEA_CODES.has(c.code)) {
    return { tier: "easy", reason: "EU/EEA freedom of movement — you can live and work here." };
  }
  const open = OPENNESS[c.code] ?? 1;
  if (bucket === "strong") {
    return open >= 1
      ? { tier: "doable", reason: "Visa-free entry plus realistic long-stay/nomad routes for your passport." }
      : { tier: "hard", reason: "Limited long-stay options for your passport." };
  }
  // mid / weak
  if (open >= 2) return { tier: "doable", reason: "Has accessible long-stay/nomad visa routes." };
  if (open === 1) return { tier: "hard", reason: "Long-stay residency is possible but not easy for your passport." };
  return { tier: "very_hard", reason: "No easy long-stay route for your passport." };
}
