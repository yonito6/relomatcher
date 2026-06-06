// app/api/quiz/route.ts
import { NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/countriesDb";
import type { QuizData } from "@/lib/types";
import { rankCountries } from "@/lib/scoring/score";
import type { MatchResult } from "@/lib/scoring/types";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Response contract
// ---------------------------------------------------------------------------

type QuizApiResponse = {
  ok: boolean;
  message: string;
  top: MatchResult[];
  moonshot: MatchResult | null;
  disqualified: MatchResult[];
  relaxedFilters: boolean;
  receivedData: QuizData;
};

// ---------------------------------------------------------------------------
// OpenAI lazy client
// ---------------------------------------------------------------------------

let openaiClient: OpenAI | null = null;
let _warnedNoKey = false;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    if (!_warnedNoKey) {
      console.warn("[Relomatcher] OPENAI_API_KEY not set – AI note-polish disabled.");
      _warnedNoKey = true;
    }
    return null;
  }
  if (!openaiClient) {
    try {
      openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } catch (err) {
      console.warn("[Relomatcher] Failed to init OpenAI client – skipping AI polish.", err);
    }
  }
  return openaiClient;
}

// ---------------------------------------------------------------------------
// polishNotes — optional AI note/tradeoff rewriter
//
// NEVER reorders, NEVER changes the country set.
// Only edits the string fields `tradeoff` and/or `note` on each MatchResult,
// matched by country.code.  Any malformed response keeps the originals.
// ---------------------------------------------------------------------------

type PolishPayloadItem = {
  code: string;
  name: string;
  fit: number;
  tier: string;
  reason: string;
  tradeoff: string;
  breakdown: { id: string; score: number; weight: number }[];
};

type PolishResponseItem = {
  code: string;
  tradeoff?: string;
  note?: string;
};

async function polishNotes(
  profile: QuizData,
  top: MatchResult[],
  moonshot: MatchResult | null
): Promise<{ top: MatchResult[]; moonshot: MatchResult | null }> {
  // Fast-mode or no key → skip entirely
  if (process.env.NEXT_PUBLIC_RM_FAST_MODE === "1") return { top, moonshot };
  const client = getOpenAIClient();
  if (!client) return { top, moonshot };

  // Build a minimal payload: only send what the model needs
  const targets: MatchResult[] = moonshot ? [...top, moonshot] : [...top];

  const payload: PolishPayloadItem[] = targets.map((m) => ({
    code: m.country.code,
    name: m.country.name,
    fit: Math.round(m.fit),
    tier: m.tier,
    reason: m.reason,
    tradeoff: m.tradeoff,
    breakdown: m.breakdown.map((b) => ({ id: b.id, score: Math.round(b.score * 10) / 10, weight: b.weight })),
  }));

  const systemPrompt = `
You are a friendly but honest relocation copywriter for Relomatcher.
You receive a list of country matches for a user, each with fit score, tier, feasibility reason, tradeoff, and factor breakdown.

Your job: for each country, write a short (1–2 sentence) "note" blurb that is honest, warm, and specific to the user's profile,
and optionally improve the "tradeoff" line to be more human-readable.

RULES:
- You MUST return exactly the same country codes in the same order.
- Only edit "note" and/or "tradeoff" string fields — never change codes or omit entries.
- Keep tradeoff honest (mention the real weakest factor, not something vague).
- note should be encouraging but not hide real friction.
- Max 2 sentences per field.

Return ONLY valid JSON: an array of { "code": "...", "tradeoff": "...", "note": "..." }.
`.trim();

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({ matches: payload }, null, 2),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "[]";
    let parsed: PolishResponseItem[];
    try {
      parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("not an array");
    } catch {
      console.warn("[Relomatcher] polishNotes: could not parse AI response, keeping originals.");
      return { top, moonshot };
    }

    // Build lookup by code
    const byCode = new Map<string, PolishResponseItem>(parsed.map((r) => [r.code, r]));

    function applyPolish(m: MatchResult): MatchResult {
      const p = byCode.get(m.country.code);
      if (!p) return m;
      return {
        ...m,
        tradeoff: (typeof p.tradeoff === "string" && p.tradeoff.trim()) ? p.tradeoff.trim() : m.tradeoff,
        note:     (typeof p.note === "string" && p.note.trim()) ? p.note.trim() : m.note,
      };
    }

    return {
      top:      top.map(applyPolish),
      moonshot: moonshot ? applyPolish(moonshot) : null,
    };
  } catch (err) {
    console.warn("[Relomatcher] polishNotes failed, returning numeric results unchanged.", err);
    return { top, moonshot };
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuizData;

    if (!body || typeof body !== "object") {
      return NextResponse.json<QuizApiResponse>(
        {
          ok: false,
          message: "Invalid request body.",
          top: [],
          moonshot: null,
          disqualified: [],
          relaxedFilters: false,
          receivedData: body,
        },
        { status: 400 }
      );
    }

    // Core engine — deterministic, no I/O
    const { top: rawTop, moonshot: rawMoonshot, disqualified, relaxedFilters } =
      rankCountries(body, COUNTRIES);

    // Limit top to 3 (rankCountries already returns ≤3, but be explicit)
    const top3 = rawTop.slice(0, 3);

    // Optional AI note-polish (never reorders, safe to skip on any failure)
    const { top, moonshot } = await polishNotes(body, top3, rawMoonshot);

    return NextResponse.json<QuizApiResponse>(
      {
        ok: true,
        message: "Matches calculated successfully.",
        top,
        moonshot,
        disqualified,
        relaxedFilters,
        receivedData: body,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[Relomatcher] Error in /api/quiz:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Unexpected error while ranking countries for your profile.";
    return NextResponse.json<QuizApiResponse>(
      {
        ok: false,
        message,
        top: [],
        moonshot: null,
        disqualified: [],
        relaxedFilters: false,
        receivedData: {} as QuizData,
      },
      { status: 500 }
    );
  }
}
