// components/ResultsTabs.tsx
"use client";

import React, { useState } from "react";

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
  healthcare?: number;
  development?: number;
  publicTransport?: number;
  digitalServices?: number;
  cleanliness?: number;
  everydayServices?: number;
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
  healthcare?: string;
  development?: string;
  publicTransport?: string;
  digitalServices?: string;
  cleanliness?: string;
  everydayServices?: string;
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

type QuizApiResponse = {
  ok: boolean;
  message: string;
  simpleScore: number;
  bestMatch: CountryMatch | null;
  topMatches: CountryMatch[];
  disqualifiedTop: DisqualifiedCountry[];
  receivedData: any;
};

type ResultsTabsProps = {
  result: QuizApiResponse | null;
  isLoading: boolean;
};

const DIMENSION_LABELS: { key: keyof DimensionBreakdown; label: string }[] = [
  { key: "tax", label: "Taxes" },
  { key: "costOfLiving", label: "Cost of living" },
  { key: "incomeGrowth", label: "Income potential" },
  { key: "remoteFriendly", label: "Remote-work friendliness" },
  { key: "safety", label: "Safety & stability" },
  { key: "lifestyle", label: "Lifestyle & culture" },
  { key: "climateMatch", label: "Weather match" },
  { key: "languageMatch", label: "Language fit" },
  { key: "lgbtRights", label: "LGBT protections & rights" },
  { key: "healthcare", label: "Healthcare" },
  { key: "development", label: "Development level" },
  { key: "publicTransport", label: "Public transport" },
  { key: "digitalServices", label: "Digital services" },
  { key: "cleanliness", label: "Clean & maintained streets" },
  { key: "everydayServices", label: "Everyday services" },
];

function ScoreBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(10, value));
  const percent = (clamped / 10) * 100;

  return (
    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
      <div
        className="h-full rounded-full bg-slate-900 transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function DimensionRow({
  label,
  value,
  explanation,
}: {
  label: string;
  value: number | undefined;
  explanation?: string;
}) {
  if (value == null) return null;

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 border border-slate-100 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-900">{label}</span>
        <span className="text-xs font-semibold text-slate-700">
          {value.toFixed(1)} / 10
        </span>
      </div>
      <ScoreBar value={value} />
      {explanation && (
        <p className="mt-1 text-xs text-slate-600 leading-snug">
          {explanation}
        </p>
      )}
    </div>
  );
}

function CountryCard({
  country,
  index,
  isDisqualified,
}: {
  country: CountryMatch | DisqualifiedCountry;
  index: number;
  isDisqualified?: boolean;
}) {
  const breakdown = country.breakdown;
  const explanations = country.explanations as DimensionExplanations;

  const overall =
    "totalScore" in country ? country.totalScore : country.baseScore;

  const subtitle = isDisqualified
    ? "Good fit on some metrics, but didn’t pass your non-negotiables."
    : index === 0
    ? "Best overall match for your profile."
    : "Strong alternative based on your preferences.";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              #{index + 1}
            </span>
            <h3 className="text-lg font-semibold text-slate-900">
              {country.name}
            </h3>
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {subtitle}
          </p>
          <p className="mt-2 text-sm text-slate-700">{country.shortNote}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500">
              Overall match
            </div>
            <div className="text-xl font-semibold text-slate-900">
              {overall.toFixed(1)} / 10
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500">
              Keep after tax (est.)
            </div>
            <div className="text-sm font-semibold text-emerald-700">
              ~{country.netIncomePercent}% of your income
            </div>
          </div>
          {isDisqualified && "reason" in country && (
            <p className="mt-1 max-w-xs text-xs text-right text-rose-600">
              {country.reason}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {DIMENSION_LABELS.map(({ key, label }) => (
          <DimensionRow
            key={key}
            label={label}
            value={breakdown[key]}
            explanation={explanations[key as keyof DimensionExplanations]}
          />
        ))}
      </div>
    </div>
  );
}

export const ResultsTabs: React.FC<ResultsTabsProps> = ({
  result,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<"qualified" | "disqualified">(
    "qualified"
  );

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          <div>
            <p className="text-sm font-medium text-slate-900">
              Checking countries against your answers…
            </p>
            <p className="text-xs text-slate-600">
              We’re weighing taxes, climate, LGBT protections, development and
              more, then ranking the best matches for you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result || !result.ok) {
    return null;
  }

  const qualified = (result.topMatches || []).slice(0, 3);
  const disqualified = result.disqualifiedTop || [];

  return (
    <div className="mt-8">
      {/* Tabs header */}
      <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
        <button
          type="button"
          className={`rounded-full px-4 py-1.5 font-medium transition ${
            activeTab === "qualified"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("qualified")}
        >
          Qualified matches
          {qualified.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
              {qualified.length}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-1.5 font-medium transition ${
            activeTab === "disqualified"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("disqualified")}
        >
          Disqualified
          {disqualified.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
              {disqualified.length}
            </span>
          )}
        </button>
      </div>

      {/* Small explanatory text */}
      <p className="mt-3 text-xs text-slate-600 max-w-xl">
        The{" "}
        <span className="font-semibold text-slate-900">
          Qualified matches
        </span>{" "}
        are the countries that best align with everything you marked as
        important. The{" "}
        <span className="font-semibold text-slate-900">Disqualified</span>{" "}
        tab shows strong candidates that were filtered out based on
        non-negotiables like LGBT protections.
      </p>

      {/* Content */}
      <div className="mt-5 space-y-4">
        {activeTab === "qualified" && (
          <>
            {qualified.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                We couldn’t find clear “qualified” matches for this profile.
                Try relaxing one of your constraints and run it again.
              </div>
            )}

            {qualified.map((c, idx) => (
              <CountryCard
                key={c.code}
                country={c}
                index={idx}
                isDisqualified={false}
              />
            ))}
          </>
        )}

        {activeTab === "disqualified" && (
          <>
            {disqualified.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                No strong candidates were disqualified based on your
                non-negotiables. That’s usually a good sign.
              </div>
            )}

            {disqualified.map((c, idx) => (
              <CountryCard
                key={c.code}
                country={c}
                index={idx}
                isDisqualified
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};
