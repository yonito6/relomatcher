// app/api/quiz/route.ts
import { NextResponse } from "next/server";
import { COUNTRIES, type CountryRecord } from "@/lib/countriesDb";
import type { QuizData } from "@/lib/types";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Shape expected by app/page.tsx
type DimensionBreakdown = {
  tax: number;
  costOfLiving: number;
  incomeGrowth: number;
  remoteFriendly: number;
  safety: number;
  lifestyle: number;
  climateMatch?: number;
  languageMatch?: number;
  expatScene?: number;
  socialScene?: number;
  lgbtRights?: number; // separate LGBT stat

  // extra dimensions related to your form
  healthcareSystem?: number;
  publicTransport?: number;
  digitalServices?: number;
  infrastructureClean?: number;
};

type DimensionExplanations = {
  tax: string;
  costOfLiving: string;
  incomeGrowth: string;
  remoteFriendly: string;
  safety: string;
  lifestyle: string;
  climateMatch?: string;
  languageMatch?: string;
  expatScene?: string;
  socialScene?: string;
  lgbtRights?: string; // explanation for LGBT

  healthcareSystem?: string;
  publicTransport?: string;
  digitalServices?: string;
  infrastructureClean?: string;
};

export type CountryMatch = {
  code: string;
  name: string;
  totalScore: number;
  breakdown: DimensionBreakdown;
  explanations: DimensionExplanations;
  shortNote: string;
  netIncomePercent: number;
};

export type DisqualifiedCountry = {
  code: string;
  name: string;
  baseScore: number;
  breakdown: DimensionBreakdown;
  explanations: DimensionExplanations;
  shortNote: string;
  netIncomePercent: number;
  reason: string;
};

type QuizApiResponse = {
  ok: boolean;
  message: string;
  simpleScore: number;
  bestMatch: CountryMatch | null;
  topMatches: CountryMatch[]; // full ranked list
  disqualifiedTop: DisqualifiedCountry[];
  receivedData: QuizData;
};

// For AI re-ranking result
type AIReRanked = {
  code: string;
  aiRank: number;
  aiNote: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuizData;

    // Basic sanity check
    if (!body || typeof body !== "object") {
      return NextResponse.json<QuizApiResponse>(
        {
          ok: false,
          message: "Invalid request body.",
          simpleScore: 0,
          bestMatch: null,
          topMatches: [],
          disqualifiedTop: [],
          receivedData: body,
        },
        { status: 400 }
      );
    }

    // Numeric matcher (no external countryMatcher file)
    const { winners, disqualifiedTop } = rankCountriesInline(body);

    if (!winners || winners.length === 0) {
      return NextResponse.json<QuizApiResponse>(
        {
          ok: false,
          message:
            "We couldn’t confidently match you to any country with the current data.",
          simpleScore: 0,
          bestMatch: null,
          topMatches: [],
          disqualifiedTop: disqualifiedTop || [],
          receivedData: body,
        },
        { status: 200 }
      );
    }

    // Start from numeric ranking
    let matches: CountryMatch[] = winners.slice();

    // Try AI re-ranking on top of numeric scores (now allowed to reorder more aggressively)
    try {
      const { ranked } = await aiRerankMatches(body, winners, disqualifiedTop);
      if (ranked && ranked.length > 0) {
        const byCode = new Map(matches.map((m) => [m.code, m]));
        const aiSorted: CountryMatch[] = [];

        // Sort by aiRank ascending and map to real CountryMatch
        for (const r of ranked.sort((a, b) => a.aiRank - b.aiRank)) {
          const m = byCode.get(r.code);
          if (m && !aiSorted.find((x) => x.code === m.code)) {
            aiSorted.push(m);
          }
        }

        if (aiSorted.length > 0) {
          // Put AI-ordered ones first, then the rest in original numeric order
          matches = [
            ...aiSorted,
            ...matches.filter(
              (m) => !aiSorted.find((x) => x.code === m.code)
            ),
          ];
        }
      }
    } catch (e) {
      console.error("AI rerank failed, using numeric order:", e);
    }

    const bestMatch = matches[0];
    const simpleScore = bestMatch.totalScore ?? 0;

    return NextResponse.json<QuizApiResponse>(
      {
        ok: true,
        message: "Matches calculated successfully.",
        simpleScore,
        bestMatch,
        topMatches: matches,
        disqualifiedTop: disqualifiedTop || [],
        receivedData: body,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in /api/quiz:", err);
    return NextResponse.json<QuizApiResponse>(
      {
        ok: false,
        message:
          err?.message ||
          "Unexpected error while ranking countries for your profile.",
        simpleScore: 0,
        bestMatch: null,
        topMatches: [],
        disqualifiedTop: [],
        receivedData: {} as QuizData,
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                           AI RE-RANKER LAYER                               */
/* -------------------------------------------------------------------------- */

async function aiRerankMatches(
  profile: QuizData,
  candidates: CountryMatch[],
  disqualified: DisqualifiedCountry[]
): Promise<{ ranked: AIReRanked[]; disqualifiedNotes: AIReRanked[] }> {
  // No key → do nothing, fall back to numeric
  if (!process.env.OPENAI_API_KEY) {
    return {
      ranked: candidates.map((c, idx) => ({
        code: c.code,
        aiRank: idx + 1,
        aiNote: "AI not enabled – using numeric ranking order.",
      })),
      disqualifiedNotes: disqualified.map((c, idx) => ({
        code: c.code,
        aiRank: idx + 1,
        aiNote: c.reason,
      })),
    };
  }

  const pAny = profile as any;

  const cleanedProfile = {
    currentCountry: profile.currentCountry ?? null,
    ageRange: profile.ageRange ?? null,
    languagesSpoken: profile.languagesSpoken ?? [],
    reasons: profile.reasons ?? [],
    monthlyIncome: pAny.monthlyIncome ?? null,
    incomeCurrency: pAny.incomeCurrency ?? null,
  };

  // IMPORTANT: send ALL candidates (numeric winners)
  const shortCandidates = candidates;
  const shortDisq = disqualified.slice(0, 30);

  const userPayload = {
    profile: cleanedProfile,
    candidates: shortCandidates.map((c) => ({
      code: c.code,
      name: c.name,
      totalScore: c.totalScore,
      breakdown: c.breakdown,
      netIncomePercent: c.netIncomePercent,
      shortNote: c.shortNote,
    })),
    disqualified: shortDisq.map((c) => ({
      code: c.code,
      name: c.name,
      baseScore: c.baseScore,
      breakdown: c.breakdown,
      netIncomePercent: c.netIncomePercent,
      reason: c.reason,
      shortNote: c.shortNote,
    })),
  };

  const systemPrompt = `
You are Relomatcher's ranking engine.

You receive:
- A user profile (with "reasons" flags from the questionnaire, e.g. "better_lgbtq", "climate_pref_cold", "culture_northern_europe", "culture_mediterranean", "development_care_yes", etc.).
- A list of candidate countries with NUMERIC scores for dimensions (tax, costOfLiving, safety, lifestyle, climateMatch, lgbtRights, etc.).
- A list of disqualified countries with baseScore and disqualification reason.

You must produce a ranked list of the BEST country matches for THIS user.
Use the numeric scores as ground truth, but you are allowed to reorder countries
quite strongly when the user's priorities clearly point in another direction.

HARD RULES:

1. LGBTQ+:
   - If profile.reasons includes "better_lgbtq", you must treat lgbtRights as a hard filter.
   - Countries with breakdown.lgbtRights < 6 must NOT appear in the TOP 5 at all.
   - If lgbtRights < 5, they should not appear in the TOP 10 unless there are literally no alternatives.
   - When lgbtRights >= 7, treat this as a big positive.
   - It is NEVER acceptable to put countries with weak LGBT protections (for example,
     the Gulf, strongly anti-LGBT regimes, etc.) in the top 3 for such a user.

2. Climate:
   - If profile.reasons includes "better_weather" and there is "climate_pref_cold",
     prefer higher climateMatch scores for colder places and penalise very low climateMatch (<4).
   - If "climate_pref_warm" or "climate_pref_mild" appears, interpret climateMatch similarly:
     higher is better; very low climateMatch (<4) is a strong downside,
     especially if the user also has a high climateImportance.
   - Do NOT pick obviously opposite climates as #1 if strong climate preference exists.

3. Culture / Region:
   - Culture preference flags include:
     "culture_northern_europe", "culture_mediterranean",
     "culture_north_america", "culture_latin_america", "culture_asia".
   - These represent what the user wants the day-to-day culture and vibe to feel like.
   - If profile.reasons includes "culture_must_have" AND one or more specific culture flags,
     then the TOP 3 should, whenever possible, come from countries whose typical culture/region
     clearly matches those flags.
   - Use your own world knowledge and the shortNote + country name to infer the cultural region.
     For example, for "culture_northern_europe", think of Nordic and Northern European countries,
     not Gulf states or Southeast Asia. For "culture_mediterranean", think of Southern Europe.
   - If there are reasonably good numeric candidates that fit the culture and also satisfy LGBT constraints,
     they should be placed ABOVE out-of-region countries even if their numeric totalScore is slightly lower.
   - Only put clearly out-of-culture countries (e.g. Singapore, UAE, Thailand) in the top 3 if there are truly
     no culturally-aligned, LGBT-safe options.

4. Safety and development:
   - If profile.reasons includes "safety_stability_priority", do not put very low safety countries
     high in the list unless there is no alternative.
   - If profile.reasons includes "development_care_yes" or "development_care_some",
     slightly favour candidates that are clearly developed and have good remoteFriendly, lifestyle and safety.

5. Taxes and cost of living:
   - If "lower_taxes" is in profile.reasons, higher tax scores should be rewarded.
   - If "lower_cost_of_living" is in profile.reasons, higher costOfLiving scores should be rewarded.
   - However, these should NOT override the HARD LGBT and culture constraints above.

Your job:
- Produce a ranked list of the candidates with an "aiRank" and a short note for each.
- The ranked list must especially make sense for a profile that wants:
  * Strong LGBT rights
  * European (Northern or Mediterranean) culture
  * Reasonable or lower taxes
  * Developed, safe, modern cities.

Return ONLY JSON of the form:
{
  "ranked": [
    { "code": "EST", "aiRank": 1, "aiNote": "Short reason why this is #1." },
    { "code": "NLD", "aiRank": 2, "aiNote": "Short reason..." }
  ],
  "disqualifiedNotes": [
    { "code": "ARE", "aiRank": 1, "aiNote": "Short note explaining why it was disqualified for THIS user." }
  ]
}
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(userPayload, null, 2) },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI rerank JSON, falling back:", e);
    return {
      ranked: shortCandidates.map((c, idx) => ({
        code: c.code,
        aiRank: idx + 1,
        aiNote: "AI parsing failed – using numeric ranking order.",
      })),
      disqualifiedNotes: shortDisq.map((c, idx) => ({
        code: c.code,
        aiRank: idx + 1,
        aiNote: c.reason,
      })),
    };
  }

  return {
    ranked: parsed.ranked ?? [],
    disqualifiedNotes: parsed.disqualifiedNotes ?? [],
  };
}

/* -------------------------------------------------------------------------- */
/*                         INLINE MATCHER IMPLEMENTATION                       */
/* -------------------------------------------------------------------------- */

function rankCountriesInline(profile: QuizData): {
  winners: CountryMatch[];
  disqualifiedTop: DisqualifiedCountry[];
} {
  const reasons = new Set(profile.reasons || []);

  const results: CountryMatch[] = [];
  const disqualified: DisqualifiedCountry[] = [];

  for (const c of COUNTRIES) {
    const { breakdown, explanations } = scoreCountryDimensions(profile, c);
    const baseScore = computeTotalScore(breakdown, profile);

    if (baseScore == null || Number.isNaN(baseScore)) continue;

    const disqReason = getDisqualificationReason(profile, c, reasons, baseScore);

    if (disqReason) {
      disqualified.push({
        code: c.code,
        name: c.name,
        baseScore,
        breakdown,
        explanations,
        shortNote: c.shortNote,
        netIncomePercent: c.netIncomePercentTypical,
        reason: disqReason,
      });
    } else {
      results.push({
        code: c.code,
        name: c.name,
        totalScore: baseScore,
        breakdown,
        explanations,
        shortNote: c.shortNote,
        netIncomePercent: c.netIncomePercentTypical,
      });
    }
  }

  // numeric base sort
  results.sort((a, b) => b.totalScore - a.totalScore);
  disqualified.sort((a, b) => b.baseScore - a.baseScore);
  const disqualifiedTop = disqualified.slice(0, 3);

  return {
    winners: results,
    disqualifiedTop,
  };
}

function scoreCountryDimensions(
  profile: QuizData,
  c: CountryRecord
): {
  breakdown: DimensionBreakdown;
  explanations: DimensionExplanations;
} {
  const pAny = profile as any;
  const reasons = new Set(profile.reasons || []);

  // --- Base dimension scores from DB (0–10) ---
  const tax = c.taxScore;
  const costOfLiving = c.costOfLivingScore;
  const incomeGrowth = c.incomeGrowthScore;
  const remoteFriendly = c.remoteFriendlyScore;
  const safety = c.safetyScore;
  const lifestyle = c.lifestyleScore;

  // --- Extra structural / development scores (0–10) ---
  const cAny = c as any;

  const healthcareSystem = cAny.healthcareScore;
  const publicTransport = cAny.publicTransportScore;
  const digitalServices = cAny.digitalServicesScore;
  const infrastructureClean =
    cAny.infrastructureCleanScore ?? cAny.infrastructureScore ?? cAny.cleanlinessScore;

  // --- Climate match depending on user's preference ---
  let climatePref: "cold" | "warm" | "mild" | undefined;
  if (reasons.has("climate_pref_cold")) climatePref = "cold";
  else if (reasons.has("climate_pref_warm")) climatePref = "warm";
  else if (reasons.has("climate_pref_mild")) climatePref = "mild";

  let climateMatch: number | undefined;
  if (climatePref === "cold") {
    climateMatch = c.coldClimateScore ?? c.mildClimateScore ?? 5;
  } else if (climatePref === "warm") {
    climateMatch = c.warmClimateScore ?? c.mildClimateScore ?? 5;
  } else if (climatePref === "mild") {
    climateMatch = c.mildClimateScore ?? 7;
  } else {
    // No strong climate pref → approximate average if we have data
    if (
      c.coldClimateScore != null ||
      c.warmClimateScore != null ||
      c.mildClimateScore != null
    ) {
      const vals = [
        c.coldClimateScore,
        c.warmClimateScore,
        c.mildClimateScore,
      ].filter((v) => typeof v === "number") as number[];
      climateMatch = vals.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : undefined;
    }
  }

  // --- LGBT rights as its own dimension ---
  const lgbtRights = c.lgbtScore; // 0–10, separate from lifestyle now

  // --- Language match: treat English as default target if user speaks it ---
  const lowerLangs = (profile.languagesSpoken || []).map((l) =>
    l.toLowerCase()
  );
  let languageMatch: number | undefined;
  if (lowerLangs.includes("english")) {
    languageMatch = c.englishScore ?? 5;
  } else {
    languageMatch = undefined;
  }

  const expatScene = c.expatSceneScore;
  const socialScene = c.socialSceneScore;

  const breakdown: DimensionBreakdown = {
    tax,
    costOfLiving,
    incomeGrowth,
    remoteFriendly,
    safety,
    lifestyle,
  };

  if (climateMatch != null) breakdown.climateMatch = climateMatch;
  if (languageMatch != null) breakdown.languageMatch = languageMatch;
  if (expatScene != null) breakdown.expatScene = expatScene;
  if (socialScene != null) breakdown.socialScene = socialScene;
  if (lgbtRights != null) breakdown.lgbtRights = lgbtRights;

  if (healthcareSystem != null) breakdown.healthcareSystem = healthcareSystem;
  if (publicTransport != null) breakdown.publicTransport = publicTransport;
  if (digitalServices != null) breakdown.digitalServices = digitalServices;
  if (infrastructureClean != null)
    breakdown.infrastructureClean = infrastructureClean;

  // --- Explanations (for UI tooltips etc.) ---

  function describe(
    value: number,
    good: string,
    ok: string,
    bad: string
  ): string {
    if (value >= 8.3) return good;
    if (value >= 6.3) return ok;
    return bad;
  }

  const taxText = describe(
    tax,
    "Very efficient taxes compared to many alternatives.",
    "Taxes are middling – not terrible, not amazing.",
    "Taxes are on the heavier side here."
  );

  const colText = describe(
    costOfLiving,
    "Day-to-day costs are low relative to income potential.",
    "Cost of living is moderate.",
    "Cost of living can feel high versus local incomes."
  );

  const incomeText = describe(
    incomeGrowth,
    "Good potential for income growth and future earning.",
    "Some opportunities for income growth.",
    "Limited upside for income growth compared to other options."
  );

  const remoteText = describe(
    remoteFriendly,
    "Strong remote-work ecosystem, infrastructure and banking.",
    "Remote work is generally fine here.",
    "Remote work support and infrastructure can be clunky."
  );

  const safetyText = describe(
    safety,
    "Very solid scores on safety and stability.",
    "Generally safe with some caveats.",
    "Safety, politics or stability are more fragile."
  );

  const lifestyleText = describe(
    lifestyle,
    "Lifestyle and general day-to-day vibe are a strong point here.",
    "Lifestyle is decent but not exceptional.",
    "Lifestyle or culture might feel misaligned with what many expats want."
  );

  const climateText =
    climateMatch != null
      ? describe(
          climateMatch,
          "Climate is highly aligned with the weather you said you prefer (for example cold vs. warm).",
          "Climate is workable but not perfect for your preferences.",
          "Climate is quite different from what you said you want."
        )
      : "";

  const langText =
    languageMatch != null
      ? describe(
          languageMatch,
          "Language fit should be very comfortable for you.",
          "You can probably get by with your languages, but expect some friction.",
          "Language fit could be challenging in daily life."
        )
      : "";

  const expatText =
    expatScene != null
      ? describe(
          expatScene,
          "Big, active expat community – easy to meet people.",
          "Some expat community exists.",
          "Expat community is small or niche."
        )
      : "";

  const socialText =
    socialScene != null
      ? describe(
          socialScene,
          "Strong social and nightlife scene if you want it.",
          "Social life is okay but not a huge highlight.",
          "Social scene is fairly quiet or limited."
        )
      : "";

  const lgbtText =
    lgbtRights != null
      ? describe(
          lgbtRights,
          "LGBTQ+ protections and social climate are strong here.",
          "LGBTQ+ situation is mixed – okay in some areas, weaker in others.",
          "LGBTQ+ protections and/or social acceptance are relatively weak."
        )
      : "";

  const healthcareText =
    healthcareSystem != null
      ? describe(
          healthcareSystem,
          "Healthcare quality and access are strong here, especially for residents.",
          "Healthcare is workable, but expect more private spending and variation in quality.",
          "Healthcare system can feel limited or patchy, especially for newcomers."
        )
      : "";

  const publicTransportText =
    publicTransport != null
      ? describe(
          publicTransport,
          "Public transport is reliable and makes car-free living realistic.",
          "Public transport is okay but may require some compromises.",
          "Public transport is weak – life without a car can be challenging."
        )
      : "";

  const digitalServicesText =
    digitalServices != null
      ? describe(
          digitalServices,
          "Digital services and bureaucracy are very modern and online-first.",
          "Digital services are mixed – some processes are online, others still offline.",
          "Digital services are limited; expect more in-person paperwork."
        )
      : "";

  const infrastructureCleanText =
    infrastructureClean != null
      ? describe(
          infrastructureClean,
          "Streets, public spaces and infrastructure are generally clean and well maintained.",
          "Infrastructure is mostly fine with some rough edges.",
          "Cleanliness and maintenance can be an issue in parts of this country."
        )
      : "";

  const explanations: DimensionExplanations = {
    tax: taxText,
    costOfLiving: colText,
    incomeGrowth: incomeText,
    remoteFriendly: remoteText,
    safety: safetyText,
    lifestyle: lifestyleText,
  };

  if (climateText) explanations.climateMatch = climateText;
  if (langText) explanations.languageMatch = langText;
  if (expatText) explanations.expatScene = expatText;
  if (socialText) explanations.socialScene = socialText;
  if (lgbtText) explanations.lgbtRights = lgbtText;

  if (healthcareText) explanations.healthcareSystem = healthcareText;
  if (publicTransportText) explanations.publicTransport = publicTransportText;
  if (digitalServicesText) explanations.digitalServices = digitalServicesText;
  if (infrastructureCleanText)
    explanations.infrastructureClean = infrastructureCleanText;

  return { breakdown, explanations };
}

/**
 * Final 0–10 total score as weighted average of dimensions.
 * Uses sliders (taxImportance, colImportance, climateImportance)
 * + reason flags to determine how strong each dimension should be.
 */
function computeTotalScore(
  breakdown: DimensionBreakdown,
  profile: QuizData
): number | null {
  const reasons = new Set(profile.reasons || []);
  const pAny = profile as any;

  const weights: Partial<Record<keyof DimensionBreakdown, number>> = {};

  // ---- Base neutral weights ----
  // Core dims start at 1, optional at 0 (only added if user cares).
  weights.tax = 1;
  weights.costOfLiving = 1;
  weights.incomeGrowth = 1;
  weights.remoteFriendly = 1;
  weights.safety = 1;
  weights.lifestyle = 1;

  weights.climateMatch = 0;
  weights.languageMatch = 0;
  weights.expatScene = 0;
  weights.socialScene = 0;
  weights.lgbtRights = 0;

  // new structural dimensions start at 0 – only get weight if user cares
  weights.healthcareSystem = 0;
  weights.publicTransport = 0;
  weights.digitalServices = 0;
  weights.infrastructureClean = 0;

  const slider = (val: any, fallback: number) =>
    clampNumber(
      typeof val === "number" && !Number.isNaN(val) ? val : fallback,
      1,
      10
    );

  let taxSliderImp: number | null = null;

  // ---- TAXES ----
  if (reasons.has("lower_taxes")) {
    const imp = slider(pAny.taxImportance, 7); // 1–10
    taxSliderImp = imp;

    const taxWeight = 2 + ((imp - 1) * 5) / 9; // 2–7
    weights.tax = taxWeight;
  } else if (reasons.has("tax_not_important")) {
    weights.tax = 0.2;
  }

  // ---- COST OF LIVING ----
  if (reasons.has("lower_cost_of_living")) {
    const imp = slider(pAny.colImportance, 7);
    const colWeight = 1.5 + ((imp - 1) * 3.5) / 9; // 1.5–5
    weights.costOfLiving = colWeight;
  } else if (reasons.has("col_not_important")) {
    weights.costOfLiving = 0.2;
  }

  // ---- CLIMATE ----
  if (reasons.has("better_weather") && breakdown.climateMatch != null) {
    const imp = slider(pAny.climateImportance, 7);
    const climateWeight = 1 + ((imp - 1) * 3.5) / 9; // 1–4.5
    weights.climateMatch = climateWeight;
  } else {
    weights.climateMatch = 0;
  }

  // ---- LANGUAGE ----
  if (breakdown.languageMatch != null) {
    if (reasons.has("language_must_have")) {
      weights.languageMatch = 1.8;
    } else if (reasons.has("language_nice_to_have")) {
      weights.languageMatch = 1.2;
    } else if (reasons.has("language_flexible")) {
      weights.languageMatch = 0.4;
    }
  }

  // ---- INCOME / REMOTE WORK ----
  if (reasons.has("career_growth")) {
    weights.incomeGrowth = (weights.incomeGrowth ?? 1) + 1.5;
  }
  if (reasons.has("remote_work")) {
    weights.remoteFriendly = (weights.remoteFriendly ?? 1) + 1.5;
  }

  // ---- SAFETY ----
  if (reasons.has("safety_importance_high")) {
    weights.safety = (weights.safety ?? 1) * 1.8;
  } else if (reasons.has("safety_importance_medium")) {
    weights.safety = (weights.safety ?? 1) * 1.2;
  } else if (reasons.has("safety_not_important")) {
    weights.safety = 0.3;
  }

  // ---- SOCIAL / EXPAT SCENE ----
  if (reasons.has("expat_community")) {
    weights.expatScene = 1.4;
  }
  if (reasons.has("social_life")) {
    weights.socialScene = 1.3;
  }

  // ---- DEVELOPMENT / INFRASTRUCTURE / HEALTHCARE ----
  // If user explicitly cares about living in a developed, modern country,
  // give weight to healthcare, digital services, infrastructure cleanliness.
  if (reasons.has("development_care_yes") || reasons.has("development_care_some")) {
    const devBoost = 1.4;
    weights.healthcareSystem = (weights.healthcareSystem ?? 0) + devBoost;
    weights.digitalServices = (weights.digitalServices ?? 0) + devBoost;
    weights.infrastructureClean =
      (weights.infrastructureClean ?? 0) + devBoost * 0.9;
  }

  // If user explicitly flagged public transport / car-free life as important
  if (reasons.has("dev_public_transport") || reasons.has("public_transport_important")) {
    weights.publicTransport = (weights.publicTransport ?? 0) + 2.0;
  } else if (reasons.has("public_transport_nice_to_have")) {
    weights.publicTransport = (weights.publicTransport ?? 0) + 1.0;
  }

  // ---- LGBT ----
  if (reasons.has("better_lgbtq")) {
    const imp = slider(pAny.lgbtImportance ?? 8, 8);
    weights.lgbtRights = 1 + imp / 3.5; // ~1.3–3.8
    weights.lifestyle = (weights.lifestyle ?? 1) + 0.5;
  }

  // ---- If tax slider is maxed, dampen other econ-style dimensions a bit ----
  if (taxSliderImp !== null && taxSliderImp >= 9) {
    const damp = 0.65;
    weights.costOfLiving = (weights.costOfLiving ?? 1) * damp;
    weights.incomeGrowth = (weights.incomeGrowth ?? 1) * damp;
    weights.remoteFriendly = (weights.remoteFriendly ?? 1) * damp;
    weights.safety = (weights.safety ?? 1) * damp;
    weights.lifestyle = (weights.lifestyle ?? 1) * damp;
  }

  // ---- Aggregate weighted average 0–10 ----
  let sum = 0;
  let weightSum = 0;

  (Object.keys(breakdown) as (keyof DimensionBreakdown)[]).forEach((key) => {
    const value = breakdown[key];
    const w = weights[key];

    if (value == null || w == null || w <= 0) return;

    sum += value * w;
    weightSum += w;
  });

  if (!weightSum) return null;

  let avg = sum / weightSum;

  // extra tax tie-breaker
  if (reasons.has("lower_taxes") && breakdown.tax != null && taxSliderImp) {
    const centered = breakdown.tax - 5; // [-5, +5]
    const bonus = (centered / 5) * (taxSliderImp / 10) * 1.0;
    avg += bonus;
  }

  return clampNumber(avg, 0, 10);
}

/**
 * Hard disqualification rules (LGBT non-negotiable, stricter now).
 */
function getDisqualificationReason(
  profile: QuizData,
  c: CountryRecord,
  reasons: Set<string>,
  _baseScore: number
): string | null {
  const pAny = profile as any;

  if (reasons.has("better_lgbtq")) {
    const lgbtImportance = clampNumber(pAny.lgbtImportance ?? 8, 1, 10);
    const lgbtScore = c.lgbtScore ?? c.lifestyleScore;

    if (lgbtScore != null) {
      // If they care a lot (>=9), we require very strong LGBT score
      if (lgbtImportance >= 9 && lgbtScore < 7.5) {
        return "LGBTQ+ protections and social acceptance are below the strong level you asked for.";
      }
      // Default / medium-high importance: still disqualify clearly weak places
      if (lgbtImportance >= 7 && lgbtScore < 6) {
        return "LGBTQ+ protections and/or marriage rights are below the level you marked as important.";
      }
    }
  }

  return null;
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
