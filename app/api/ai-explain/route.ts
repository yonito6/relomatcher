// app/api/ai-explain/route.ts
import { NextResponse } from "next/server";
import type { QuizData } from "@/lib/types";

/**
 * These types mirror what page.tsx expects
 * (AIExplainData, AIExplainCountryComment) and the quiz API shapes.
 */

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
  lgbtRights?: number;
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
  lgbtRights?: string;
};

type CountryMatch = {
  code: string;
  name: string;
  totalScore: number;
  breakdown: DimensionBreakdown;
  explanations: DimensionExplanations;
  shortNote: string;
  netIncomePercent: number;
};

type DisqualifiedCountry = {
  code: string;
  name: string;
  baseScore: number;
  breakdown: DimensionBreakdown;
  explanations: DimensionExplanations;
  shortNote: string;
  netIncomePercent: number;
  reason: string;
};

type RequestBody = {
  profile: QuizData;
  topMatches: CountryMatch[];
  disqualifiedTop: DisqualifiedCountry[];
};

type AIExplainCountryComment = {
  code: string;
  aiComment: string;
};

type AIExplainData = {
  overallSummary: string;
  winners: AIExplainCountryComment[];
  disqualified: AIExplainCountryComment[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const { profile, topMatches, disqualifiedTop } = body || {};

    // Basic validation – if no winners, just return empty AI data
    if (!topMatches || topMatches.length === 0) {
      const empty: AIExplainData = {
        overallSummary:
          "We couldn’t generate AI insights because there were no country matches.",
        winners: [],
        disqualified: [],
      };
      return NextResponse.json(empty, { status: 200 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // If no key configured, return a graceful fallback instead of crashing
      const fallback: AIExplainData = {
        overallSummary:
          "AI explanation is temporarily unavailable (no API key configured on the server), but your numeric matches are still accurate.",
        winners: [],
        disqualified: [],
      };
      return NextResponse.json(fallback, { status: 200 });
    }

    // Build a compact JSON payload for the AI, not the full raw profile
    const compactProfile = {
      ageRange: profile.ageRange,
      currentCountry: profile.currentCountry,
      languagesSpoken: profile.languagesSpoken,
      reasons: profile.reasons,
    };

    const compactMatches = topMatches.slice(0, 10).map((m) => ({
      code: m.code,
      name: m.name,
      totalScore: m.totalScore,
      shortNote: m.shortNote,
      netIncomePercent: m.netIncomePercent,
      breakdown: m.breakdown,
      explanations: m.explanations,
    }));

    const compactDisqualified = (disqualifiedTop || [])
      .slice(0, 5)
      .map((d) => ({
        code: d.code,
        name: d.name,
        baseScore: d.baseScore,
        shortNote: d.shortNote,
        netIncomePercent: d.netIncomePercent,
        reason: d.reason,
        breakdown: d.breakdown,
        explanations: d.explanations,
      }));

    const systemPrompt = `
You are an expert relocation advisor.
The user is deciding where to relocate based on numeric scores from a country-matching engine.

You will receive:
- A short profile of the user and what they care about.
- A list of top matching countries (with scores and explanations).
- "Disqualified" strong options that were removed because of non-negotiables (e.g. LGBT, safety, realistic residency).

Your job:
1. Carefully consider the user's profile and the numeric scores.
2. From the "topMatches" list, choose up to THREE winner countries that you think are the best fit overall.
   - You MAY reorder the numeric ranking if you think another country is a better overall fit for this user.
   - The "winners" array MUST be in order from strongest match (index 0) to weaker matches (index 1, 2).
   - Do NOT invent countries; only use country codes that appear in "topMatches".
3. Write ONE short overall summary (2–4 sentences) comparing these winner countries and explaining the main tradeoffs.
   - Be concrete: mention country names and why each one fits (taxes, climate, LGBT, culture, etc).
   - Talk in friendly, clear language (no bullet points, no headings).
4. For each winner country, write 1–2 sentences focusing on WHY this specific country matches this user.
5. For each disqualified country, write 1–2 sentences explaining why it *almost* fit, and what rule killed it.

Return STRICT JSON in this exact format and nothing else:
{
  "overallSummary": string,
  "winners": [
    { "code": string, "aiComment": string },
    ...
  ],
  "disqualified": [
    { "code": string, "aiComment": string },
    ...
  ]
}
- "winners" MUST be in your recommended ranking order (best to weaker).
- Only use country codes that exist in the input.
No extra keys, no markdown, no prose outside JSON.
`;

    const userPrompt = {
      role: "user",
      content: JSON.stringify({
        profile: compactProfile,
        topMatches: compactMatches,
        disqualifiedTop: compactDisqualified,
      }),
    };

    const completionRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1", // you can change this to another model if you prefer
          messages: [{ role: "system", content: systemPrompt }, userPrompt],
          temperature: 0.7,
        }),
      }
    );

    if (!completionRes.ok) {
      console.error("AI explain API error status:", completionRes.status);
      const text = await completionRes.text().catch(() => "");
      console.error("AI explain API response:", text);

      return NextResponse.json(
        {
          error:
            "AI explanation request failed on the model side. Numeric matches still work.",
        },
        { status: 500 }
      );
    }

    const completionJson = await completionRes.json();
    const content =
      completionJson?.choices?.[0]?.message?.content?.trim() ?? "";

    let parsed: AIExplainData | null = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI JSON:", e, "content:", content);
    }

    // If parsing fails completely → simple fallback for top matches + disqualified
    if (!parsed || typeof parsed.overallSummary !== "string") {
      const fallback: AIExplainData = {
        overallSummary:
          "Here are your top country matches based on your answers. The engine balanced taxes, cost of living, safety, lifestyle, climate and LGBT fit according to what you said matters.",
        winners: compactMatches.slice(0, 3).map((m) => ({
          code: m.code,
          aiComment: `Good fit overall: strong score of ${m.totalScore.toFixed(
            1
          )}/10 and a mix of ${m.shortNote.toLowerCase()}.`,
        })),
        disqualified: compactDisqualified.map((d) => ({
          code: d.code,
          aiComment: `Was a strong potential match (around ${d.baseScore.toFixed(
            1
          )}/10) but was removed because: ${d.reason}`,
        })),
      };
      return NextResponse.json(fallback, { status: 200 });
    }

    // Basic sanitisation: make sure codes in winners/disqualified correspond
    const allowedWinnerCodes = new Set(compactMatches.map((m) => m.code));
    const allowedDisqCodes = new Set(compactDisqualified.map((d) => d.code));

    const rawWinners = Array.isArray(parsed.winners) ? parsed.winners : [];
    const rawDisqualified = Array.isArray(parsed.disqualified)
      ? parsed.disqualified
      : [];

    const cleanedWinnerBase: AIExplainCountryComment[] = rawWinners.filter(
      (w: any) => w.code && allowedWinnerCodes.has(w.code)
    );
    const cleanedDisqBase: AIExplainCountryComment[] = rawDisqualified.filter(
      (d: any) => d.code && allowedDisqCodes.has(d.code)
    );

    // Ensure ALL of the first 3 numeric matches get an AI comment
    const ensuredWinners: AIExplainCountryComment[] = [...cleanedWinnerBase];

    for (const m of compactMatches.slice(0, 3)) {
      if (!ensuredWinners.some((w) => w.code === m.code)) {
        ensuredWinners.push({
          code: m.code,
          aiComment: `Good fit overall: strong score of ${m.totalScore.toFixed(
            1
          )}/10 and a mix of ${m.shortNote.toLowerCase()}.`,
        });
      }
    }

    const cleaned: AIExplainData = {
      overallSummary:
        typeof parsed.overallSummary === "string" &&
        parsed.overallSummary.trim().length > 0
          ? parsed.overallSummary
          : "Here are your top country matches based on your answers. The engine balanced taxes, cost of living, safety, lifestyle, climate and LGBT fit according to what you said matters.",
      winners: ensuredWinners,
      disqualified: cleanedDisqBase,
    };

    return NextResponse.json(cleaned, { status: 200 });
  } catch (err: any) {
    console.error("Error in /api/ai-explain:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Unexpected error while generating AI explanations.",
      },
      { status: 500 }
    );
  }
}
