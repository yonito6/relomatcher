// app/api/report/route.ts
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type MatchInput = {
  name: string;
  code: string;
  shortNote?: string;
  totalScore?: number;
  netIncomePercent?: number;
  breakdown?: {
    tax?: number;
    costOfLiving?: number;
    safety?: number;
    lifestyle?: number;
    climateMatch?: number;
    lgbtRights?: number;
  };
};

type ProfileInput = {
  currentCountry?: string;
  ageRange?: string;
  languagesSpoken?: string[];
  reasons?: string[];
  monthlyIncome?: number | string;
  incomeCurrency?: string;
};

type AIReportCountry = {
  name: string;
  tagline: string;
  whyItFits: string;
  visaOptions: string[];
  practicalSteps: string[];
  recommendedCities: string[];
  caveats: string;
};

type AIReport = {
  intro: string;
  globalAdvice: string;
  countries: AIReportCountry[];
};

export async function POST(req: Request) {
  try {
    const { profile, topMatches } = (await req.json()) as {
      profile: ProfileInput;
      topMatches: MatchInput[];
    };

    if (!topMatches || !Array.isArray(topMatches) || topMatches.length === 0) {
      return NextResponse.json(
        { error: "No matches provided to generate a report." },
        { status: 400 }
      );
    }

    // 1) Ask ChatGPT for a structured relocation report for these matches
    const aiReport = await buildAIReport(profile, topMatches);

    // 2) Build a nicely formatted multi-page PDF
    const pdfBytes = await buildPdf(profile, topMatches, aiReport);

    // Wrap Uint8Array in a Blob so TS is happy
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    return new Response(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="relomatcher-report.pdf"',
      },
    });
  } catch (err) {
    console.error("Error generating report:", err);
    return NextResponse.json(
      { error: "Failed to generate report." },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                            AI REPORT GENERATION                             */
/* -------------------------------------------------------------------------- */

async function buildAIReport(
  profile: ProfileInput,
  topMatches: MatchInput[]
): Promise<AIReport> {
  // Fallback if no API key – still return something valid
  if (!process.env.OPENAI_API_KEY) {
    return {
      intro:
        "Relomatcher could not access the AI engine, so this is a simplified report.",
      globalAdvice:
        "Once AI is connected, this section will contain tailored advice on how to plan your relocation and compare your top countries.",
      countries: topMatches.map((m) => ({
        name: m.name,
        tagline: "Top relocation match based on your answers.",
        whyItFits:
          "This country scored well across your key priorities such as taxes, safety, lifestyle and climate. Once AI is connected, this paragraph will explain the fit in more human language.",
        visaOptions: [
          "Work visa – if you have a job offer or can find employment there.",
          "Business / entrepreneur route – if you run a company or can invest.",
          "Student / language course – if you want a softer entry and can enroll.",
        ],
        practicalSteps: [
          "Check the official government immigration or interior ministry website.",
          "Look up visa requirements for your passport and age group.",
          "Gather basic documents: passport, CV, bank statements, criminal record extract.",
        ],
        recommendedCities: [
          "Capital city or main metropolis",
          "Secondary city with good expat scene",
        ],
        caveats:
          "Visa details here are placeholders. Once AI is connected, this will highlight real restrictions and typical downsides.",
      })),
    };
  }

  const cleanedProfile = {
    currentCountry: profile.currentCountry || null,
    ageRange: profile.ageRange || null,
    languagesSpoken: profile.languagesSpoken || [],
    reasons: profile.reasons || [],
    monthlyIncome: profile.monthlyIncome || null,
    incomeCurrency: profile.incomeCurrency || null,
  };

  const simpleMatches = topMatches.map((m) => ({
    name: m.name,
    shortNote: m.shortNote || "",
    totalScore: m.totalScore ?? null,
    netIncomePercent: m.netIncomePercent ?? null,
    stats: {
      tax: m.breakdown?.tax ?? null,
      costOfLiving: m.breakdown?.costOfLiving ?? null,
      safety: m.breakdown?.safety ?? null,
      lifestyle: m.breakdown?.lifestyle ?? null,
      climateMatch: m.breakdown?.climateMatch ?? null,
      lgbtRights: m.breakdown?.lgbtRights ?? null,
    },
  }));

  const systemPrompt = `
You are a relocation strategist and immigration consultant.
Given a user profile and 2–5 matched countries, generate a *practical* relocation report.

The user wants:
- Concrete, realistic visa paths (not guaranteed approvals, but typical routes).
- Short, skimmable sections they could actually use to start acting.
- Tone: clear, friendly, not overhyped. Assume the user is willing to research further.

IMPORTANT:
- Focus only on the countries provided.
- If you don't know some detail about a country's visa, give generic but sensible advice (e.g. "look for digital nomad visa", "look into EU long-term residence via this or that").
- DO NOT invent fake visa names; you may mention categories like "work visa", "digital nomad visa", "EU residency routes", etc.
`.trim();

  const userPrompt = `
User profile (cleaned JSON):
${JSON.stringify(cleanedProfile, null, 2)}

Top relocation matches (cleaned JSON):
${JSON.stringify(simpleMatches, null, 2)}

Produce a JSON object with:
{
  "intro": "2–4 sentences summarising the user's situation and how these matches were chosen.",
  "globalAdvice": "3–6 sentences of general guidance on how to approach relocation, comparing these countries and next steps.",
  "countries": [
    {
      "name": "Country name exactly as provided",
      "tagline": "A sharp 1-sentence slogan for this match.",
      "whyItFits": "3–6 sentences explaining why this country fits the user, referencing taxes / safety / LGBT / climate etc. where relevant.",
      "visaOptions": [
        "Short bullet phrase with 1 specific route or category",
        "Another realistic option if there is one",
        "Generic 'if you cannot use the above' pathway"
      ],
      "practicalSteps": [
        "Concrete next step the user can do in 1–3 days",
        "Another concrete step, max 160 characters",
        "Another concrete step, max 160 characters"
      ],
      "recommendedCities": [
        "Main city 1 – short 3–6 word descriptor",
        "Main city 2 – short 3–6 word descriptor",
        "Optional third city"
      ],
      "caveats": "2–4 sentences with realistic downsides or things to watch for (costs, visa bureaucracy, culture shock, etc.)."
    }
  ]
}

Return ONLY this JSON, no markdown, no commentary.
`.trim();

  // Use classic chat completions; no response_format to avoid TS issues
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    // If your SDK supports it you *could* add:
    // response_format: { type: "json_object" }
  });

  const jsonText = completion.choices[0]?.message?.content ?? "{}";

  let parsed: AIReport;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse AI report JSON, falling back:", e);
    // Fallback to simpler non-AI structure
    return {
      intro:
        "We had trouble parsing the AI output, so this is a simplified report.",
      globalAdvice:
        "You can still use the match list and stats in the app. Once the AI output is stable, this will become a detailed report.",
      countries: simpleMatches.map((m) => ({
        name: m.name,
        tagline: "Relocation match based on your answers.",
        whyItFits:
          "This country scored well for at least some of your core preferences.",
        visaOptions: [
          "Work visa or employment-based residence.",
          "Business / entrepreneur / self-employed options.",
          "Student or language course route for softer entry.",
        ],
        practicalSteps: [
          "Study the official immigration website for this country.",
          "Check if your passport has specific agreements or exemptions.",
          "Start collecting core documents: passport scans, CV, bank statements.",
        ],
        recommendedCities: [
          "Capital / largest city",
          "Secondary city with good expat scene",
        ],
        caveats:
          "Visa rules change often. Always check recent information before making financial commitments.",
      })),
    };
  }

  // Basic sanity check
  if (!parsed.countries || !Array.isArray(parsed.countries)) {
    parsed.countries = [];
  }

  // Keep only countries we actually matched
  const allowedNames = new Set(topMatches.map((m) => m.name));
  parsed.countries = parsed.countries.filter((c) =>
    allowedNames.has(c.name)
  );

  return parsed;
}

/* -------------------------------------------------------------------------- */
/*                                PDF BUILDER                                 */
/* -------------------------------------------------------------------------- */

async function buildPdf(
  profile: ProfileInput,
  topMatches: MatchInput[],
  aiReport: AIReport
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Optional: try to fetch and embed flags for each country
  const flagImages: Record<string, any> = {};
  for (const m of topMatches) {
    const code = (m.code || "").toLowerCase();
    if (!code) continue;
    try {
      const flagUrl = `https://flagcdn.com/w160/${code}.png`;
      const res = await fetch(flagUrl);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const img = await pdfDoc.embedPng(buf);
        flagImages[m.code] = img;
      }
    } catch {
      // No flag – ignore
    }
  }

  /* ----------------------------- Title / Intro ---------------------------- */

  {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let y = height - 60;

    // Title
    page.drawText("Relomatcher – Relocation Report", {
      x: 50,
      y,
      size: 20,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 30;

    // Subheading
    page.drawText("Based on your answers and top country matches", {
      x: 50,
      y,
      size: 12,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 30;

    // Short profile summary
    const profileLines = buildProfileSummaryLines(profile);
    y = drawParagraph(page, profileLines, {
      x: 50,
      y,
      font: fontRegular,
      size: 11,
      lineGap: 4,
    });
    y -= 10;

    // Intro & global advice from AI
    const introTitle = "How to read this report";
    page.drawText(introTitle, {
      x: 50,
      y,
      size: 13,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 18;

    const introLines = wrapText(aiReport.intro || "", 90);
    y = drawParagraph(page, introLines, {
      x: 50,
      y,
      font: fontRegular,
      size: 11,
      lineGap: 4,
    });
    y -= 10;

    const globalTitle = "Overall relocation strategy";
    page.drawText(globalTitle, {
      x: 50,
      y,
      size: 13,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 18;

    const globalLines = wrapText(aiReport.globalAdvice || "", 90);
    y = drawParagraph(page, globalLines, {
      x: 50,
      y,
      font: fontRegular,
      size: 11,
      lineGap: 4,
    });
  }

  /* --------------------------- Country pages --------------------------- */

  const aiCountryByName = new Map<string, AIReportCountry>();
  for (const c of aiReport.countries || []) {
    aiCountryByName.set(c.name, c);
  }

  for (const match of topMatches) {
    const aiCountry = aiCountryByName.get(match.name);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let y = height - 60;

    // Header bar
    page.drawRectangle({
      x: 0,
      y: height - 40,
      width,
      height: 40,
      color: rgb(0.98, 0.93, 0.85), // soft amber
    });

    page.drawText(match.name, {
      x: 50,
      y: height - 28,
      size: 16,
      font: fontBold,
      color: rgb(0.3, 0.2, 0.1),
    });

    const score =
      typeof match.totalScore === "number"
        ? match.totalScore.toFixed(1)
        : "–";

    page.drawText(`Match score: ${score} / 10`, {
      x: width - 200,
      y: height - 26,
      size: 11,
      font: fontRegular,
      color: rgb(0.25, 0.25, 0.25),
    });

    y = height - 70;

    // Flag image if available
    const flagImg = match.code && flagImages[match.code];
    if (flagImg) {
      const flagW = 60;
      const flagH = (flagImg.height / flagImg.width) * flagW;
      page.drawImage(flagImg, {
        x: width - 80,
        y: y - flagH + 10,
        width: flagW,
        height: flagH,
      });
    }

    // Tagline
    const tagline =
      aiCountry?.tagline ||
      match.shortNote ||
      "Top relocation match based on your profile.";
    const taglineLines = wrapText(tagline, 70);
    y = drawParagraph(page, taglineLines, {
      x: 50,
      y,
      font: fontRegular,
      size: 12,
      lineGap: 4,
    });
    y -= 10;

    // Two-column layout: left stats, right visa/steps
    const leftX = 50;
    const rightX = width / 2 + 10;
    let leftY = y;
    let rightY = y;

    /* ---- Left: numeric stats as mini bars ---- */
    page.drawText("Key scores (0–10)", {
      x: leftX,
      y: leftY,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    leftY -= 16;

    const statsToShow: { label: string; value?: number }[] = [
      { label: "Taxes", value: match.breakdown?.tax },
      { label: "Cost of living", value: match.breakdown?.costOfLiving },
      { label: "Safety & stability", value: match.breakdown?.safety },
      { label: "Lifestyle & culture", value: match.breakdown?.lifestyle },
      { label: "Climate match", value: match.breakdown?.climateMatch },
      { label: "LGBT protections", value: match.breakdown?.lgbtRights },
    ];

    for (const stat of statsToShow) {
      if (stat.value == null) continue;
      leftY = drawScoreBar(page, {
        x: leftX,
        y: leftY,
        label: stat.label,
        value: stat.value,
        fontLabel: fontRegular,
        fontBold,
      });
      leftY -= 4;
    }

    if (typeof match.netIncomePercent === "number") {
      leftY -= 8;
      const text = `Approx. net income kept: ${match.netIncomePercent.toFixed(
        1
      )}%`;
      const lines = wrapText(text, 38);
      leftY = drawParagraph(page, lines, {
        x: leftX,
        y: leftY,
        font: fontRegular,
        size: 10,
        lineGap: 3,
      });
    }

    /* ---- Right: why it fits + visa & steps ---- */
    page.drawText("Why this fits you", {
      x: rightX,
      y: rightY,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    rightY -= 16;

    const whyText =
      aiCountry?.whyItFits ||
      "This country performed well on several of your priorities. Once AI is fully connected, this section will explain the fit in more detail.";
    const whyLines = wrapText(whyText, 40);
    rightY = drawParagraph(page, whyLines, {
      x: rightX,
      y: rightY,
      font: fontRegular,
      size: 10.5,
      lineGap: 3,
    });
    rightY -= 8;

    // Visa options
    page.drawText("Visa routes to explore", {
      x: rightX,
      y: rightY,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    rightY -= 14;

    const visaOptions =
      aiCountry?.visaOptions && aiCountry.visaOptions.length > 0
        ? aiCountry.visaOptions
        : [
            "Work / employment-based residence.",
            "Business or entrepreneur residence.",
            "Study / language-course based stay.",
          ];
    rightY = drawBulletedList(page, visaOptions, {
      x: rightX,
      y: rightY,
      font: fontRegular,
      size: 10,
      lineGap: 3,
      maxChars: 40,
    });
    rightY -= 8;

    // Practical steps
    page.drawText("Concrete next steps", {
      x: rightX,
      y: rightY,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    rightY -= 14;

    const steps =
      aiCountry?.practicalSteps && aiCountry.practicalSteps.length > 0
        ? aiCountry.practicalSteps
        : [
            "Bookmark the official immigration website.",
            "Check whether your passport has special agreements or shorter paths.",
            "List required documents and start collecting them.",
          ];
    rightY = drawBulletedList(page, steps, {
      x: rightX,
      y: rightY,
      font: fontRegular,
      size: 10,
      lineGap: 3,
      maxChars: 40,
    });
    rightY -= 8;

    // Recommended cities
    page.drawText("Cities to research first", {
      x: rightX,
      y: rightY,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    rightY -= 14;

    const cities =
      aiCountry?.recommendedCities && aiCountry.recommendedCities.length > 0
        ? aiCountry.recommendedCities
        : [match.name + " main city"];
    rightY = drawBulletedList(page, cities, {
      x: rightX,
      y: rightY,
      font: fontRegular,
      size: 10,
      lineGap: 3,
      maxChars: 40,
    });
    rightY -= 8;

    // Caveats
    const caveatsTitle = "Caveats & things to watch";
    const caveatsText =
      aiCountry?.caveats ||
      "Visa rules, taxes and residency paths change often. Always cross-check with recent information before committing money or signing contracts.";
    const caveatLines = wrapText(caveatsText, 90);

    let caveatY = Math.min(leftY, rightY) - 12;
    page.drawText(caveatsTitle, {
      x: 50,
      y: caveatY,
      size: 11,
      font: fontBold,
      color: rgb(0.3, 0.1, 0.1),
    });
    caveatY -= 14;
    drawParagraph(page, caveatLines, {
      x: 50,
      y: caveatY,
      font: fontRegular,
      size: 10,
      lineGap: 3,
    });
  }

  return pdfDoc.save();
}

/* -------------------------------------------------------------------------- */
/*                           TEXT / DRAW HELPERS                               */
/* -------------------------------------------------------------------------- */

function buildProfileSummaryLines(profile: ProfileInput): string[] {
  const lines: string[] = [];

  lines.push("Your profile snapshot:");
  if (profile.currentCountry) {
    lines.push(`• Current country: ${profile.currentCountry}`);
  }
  if (profile.ageRange) {
    lines.push(`• Age range: ${profile.ageRange}`);
  }
  if (profile.languagesSpoken?.length) {
    lines.push(`• Languages: ${profile.languagesSpoken.join(", ")}`);
  }

  if (profile.reasons?.length) {
    const humanReasons = profile.reasons
      .slice(0, 8)
      .map((r) => humanizeReason(r));
    lines.push(`• Priorities: ${humanReasons.join(", ")}`);
  }

  if (profile.monthlyIncome) {
    const income = profile.monthlyIncome;
    const currency = profile.incomeCurrency || "your currency";
    lines.push(`• Monthly income (self-reported): ${income} ${currency}`);
  }

  return lines;
}

function humanizeReason(id: string): string {
  const map: Record<string, string> = {
    lower_taxes: "lower taxes",
    personal_safety: "personal safety",
    better_lgbtq: "LGBT+ protections",
    climate: "better climate",
    lower_cost_of_living: "lower cost of living",
    language_fit: "language fit",
    type_of_place: "city size & vibe",
    community: "community / expats",
    visa_ease: "visa & residency ease",
    career_growth: "career & income growth",
    safety_stability_priority: "political stability",
    political_stability: "political stability",
    low_corruption: "low corruption",
    better_weather: "specific weather preference",
    climate_pref_cold: "prefers colder climate",
    development_care_yes: "wants clearly developed country",
    dev_public_transport: "good public transport",
    lgbt_full_rights: "full LGBT rights",
  };
  return map[id] || id.replace(/_/g, " ");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = (current ? current + " " : "") + word;
    if (test.length > maxCharsPerLine) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawParagraph(
  page: any,
  lines: string[],
  opts: { x: number; y: number; font: any; size: number; lineGap: number }
): number {
  let y = opts.y;
  for (const line of lines) {
    page.drawText(line, {
      x: opts.x,
      y,
      size: opts.size,
      font: opts.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= opts.size + opts.lineGap;
    if (y < 50) break; // simple bottom guard for this page
  }
  return y;
}

function drawScoreBar(page: any, args: {
  x: number;
  y: number;
  label: string;
  value: number;
  fontLabel: any;
  fontBold: any;
}): number {
  const { x, y, label, value, fontLabel } = args;
  const clamped = Math.max(0, Math.min(10, value));
  const barWidth = 130;
  const barHeight = 6;
  const fillWidth = (clamped / 10) * barWidth;

  page.drawText(label, {
    x,
    y,
    size: 9,
    font: fontLabel,
    color: rgb(0.25, 0.25, 0.25),
  });

  page.drawText(`${clamped.toFixed(1)}/10`, {
    x: x + barWidth + 10,
    y,
    size: 9,
    font: fontLabel,
    color: rgb(0.25, 0.25, 0.25),
  });

  const barY = y - 10;
  page.drawRectangle({
    x,
    y: barY,
    width: barWidth,
    height: barHeight,
    color: rgb(0.9, 0.9, 0.9),
  });
  page.drawRectangle({
    x,
    y: barY,
    width: fillWidth,
    height: barHeight,
    color: rgb(0.96, 0.74, 0.35), // amber
  });

  return barY - 12;
}

function drawBulletedList(
  page: any,
  items: string[],
  opts: {
    x: number;
    y: number;
    font: any;
    size: number;
    lineGap: number;
    maxChars: number;
  }
): number {
  let y = opts.y;
  for (const item of items) {
    const lines = wrapText(item, opts.maxChars);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const bullet = i === 0 ? "• " : "  ";
      page.drawText(bullet + line, {
        x: opts.x,
        y,
        size: opts.size,
        font: opts.font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= opts.size + opts.lineGap;
      if (y < 60) return y;
    }
  }
  return y;
}
// kaki