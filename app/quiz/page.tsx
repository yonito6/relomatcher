// app/quiz/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdaptiveQuizForm from "@/components/AdaptiveQuizForm";
import type { QuizData } from "@/lib/types";

const TOTAL_STEPS = 3; // ⬅️ was 4

const initialData: QuizData = {
  ageRange: "",
  currentCountry: "",
  familyStatus: "",
  relocatingWith: "",
  passportCountry: "",
  secondPassportCountry: "",
  workSituation: [],
  monthlyIncome: "",
  languagesSpoken: [],
  reasons: [],
};

type DimensionBreakdown = {
  tax: number;
  costOfLiving: number;
  incomeGrowth: number;
  remoteFriendly: number;
  safety: number;
  lifestyle: number;
};

type DimensionExplanations = {
  tax: string;
  costOfLiving: string;
  incomeGrowth: string;
  remoteFriendly: string;
  safety: string;
  lifestyle: string;
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
  disqualifiedTop?: DisqualifiedCountry[];
  receivedData: QuizData;
};

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<QuizData>(initialData);
  const [originCurrencyLabel, setOriginCurrencyLabel] = useState("your currency");

  const [submittedProfile, setSubmittedProfile] = useState<QuizData | null>(null);
  const [result, setResult] = useState<QuizApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Infer default currency from country
  useEffect(() => {
    const map: Record<string, string> = {
      Israel: "ILS",
      Cyprus: "EUR",
      Portugal: "EUR",
      Spain: "EUR",
      Romania: "RON",
      Bulgaria: "BGN",
      Georgia: "GEL",
      Thailand: "THB",
      Netherlands: "EUR",
      Germany: "EUR",
      Malta: "EUR",
      "United Arab Emirates": "AED",
      Greece: "EUR",
      "United Kingdom": "GBP",
      "United States": "USD",
      Canada: "CAD",
      Mexico: "MXN",
    };

    if (data.currentCountry && map[data.currentCountry]) {
      setOriginCurrencyLabel(map[data.currentCountry]);
    } else {
      setOriginCurrencyLabel("your currency");
    }
  }, [data.currentCountry]);

  function handleUpdate(values: Partial<QuizData>) {
    setData((prev) => ({ ...prev, ...values }));
  }

  function handleNext() {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmittedProfile(data);
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with ${res.status}`);
      }

      const json = (await res.json()) as QuizApiResponse;
      setResult(json);
    } catch (err: any) {
      console.error("Quiz submit error:", err);
      setErrorMsg(err.message || "Something went wrong while scoring your matches.");
    } finally {
      setLoading(false);
    }
  }

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-6xl">
        {/* Top hero with logo */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <img
              src="https://i.ibb.co/d4D8806r/relomatcher.jpg"
              alt="Relomatcher logo"
              className="h-16 w-auto object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">
                The <span className="text-amber-500">dating app</span> for your next
                country.
              </h1>
              <p className="text-sm md:text-base text-slate-600 mt-1">
                Tell us who you are and what you care about. We&apos;ll match you with
                countries like it&apos;s Tinder for relocation.
              </p>
            </div>
          </div>
          <div className="self-start md:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
              Relomatcher · Beta
            </span>
          </div>
        </header>

        {/* Main layout: left explainer, right form + matches */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.2fr] items-start">
          {/* Left side explainer / benefits */}
          <section className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                Stop scrolling random Reddit threads.
              </h2>
              <p className="text-sm md:text-base text-slate-600">
                Most people research relocation backwards: they start with a country and
                then try to see if it fits. Relomatcher flips it – we start with{" "}
                <span className="font-semibold text-amber-600">you</span> and only then
                talk about countries.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Bullet icon="🧠" title="Adaptive questions">
                We only go deep on the things you say you care about – if you don&apos;t
                care about taxes, we won&apos;t interrogate you about taxes.
              </Bullet>
              <Bullet icon="🏳️‍🌈" title="Identity-aware">
                Mark LGBTQ+ safety, language and lifestyle as non-negotiable and we&apos;ll
                avoid places that clearly don&apos;t fit.
              </Bullet>
              <Bullet icon="🌦️" title="Climate & vibe first">
                Prefer cold cities with nightlife, or warm laid-back islands? We treat
                vibe as seriously as numbers.
              </Bullet>
              <Bullet icon="💸" title="Built for online earners">
                Tuned for remote workers, e-com owners and people whose income isn&apos;t
                locked to one country.
              </Bullet>
            </div>

            <p className="text-xs text-slate-500 max-w-lg">
              Today this is still a beta. The engine already ranks countries for you and
              explains why they fit – and also shows strong options it had to reject
              because of your non-negotiables (like LGBT or residency realism).
            </p>
          </section>

          {/* Right side: step indicator + form + results */}
          <section className="space-y-4">
            {/* Step indicator */}
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Step {currentStep + 1} of {TOTAL_STEPS}
              </p>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <AdaptiveQuizForm
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              data={data}
              originCurrencyLabel={originCurrencyLabel}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onBack={handleBack}
              onSubmit={handleSubmit}
            />

            {loading && (
              <div className="mt-2 text-xs text-slate-500">
                Calculating your matches…
              </div>
            )}
            {errorMsg && (
              <div className="mt-2 text-xs text-red-500">
                {errorMsg}
              </div>
            )}

            {result && result.topMatches && result.topMatches.length > 0 && (
              <ResultsPanel
                result={result}
                profile={submittedProfile}
                originCurrencyLabel={originCurrencyLabel}
              />
            )}

            {submittedProfile && (
              <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-200 mt-4">
                <p className="mb-1 font-semibold text-slate-800">
                  Debug: profile payload sent to the matcher
                </p>
                <pre className="max-h-44 overflow-auto bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] whitespace-pre-wrap text-slate-800">
                  {JSON.stringify(submittedProfile, null, 2)}
                </pre>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Bullet({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-7 w-7 flex items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-lg">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{children}</p>
      </div>
    </div>
  );
}

/* ResultsPanel, MatchCard, DisqualifiedPanel stay EXACTLY as you already have them */
