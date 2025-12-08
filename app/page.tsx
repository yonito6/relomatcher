// app/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import AdaptiveQuizForm from "@/components/AdaptiveQuizForm";
import type { QuizData } from "@/lib/types";
import { GenerateReportButton } from "@/components/GenerateReportButton";

const TOTAL_STEPS = 10;
const SESSION_STORAGE_KEY = "relomatcherLastResult";

const initialData: QuizData = {
  ageRange: "",
  currentCountry: "",
  familyStatus: "",
  relocatingWith: "",
  passportCountry: "",
  secondPassportCountry: "",
  workSituation: [],
  monthlyIncome: "",
  incomeCurrency: "",
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
  climateMatch?: number;
  languageMatch?: number;
  expatScene?: number;
  socialScene?: number;
  lgbtRights?: number;

  // extra dimensions related to your form
  healthcareSystem?: number;
  publicTransport?: number;
  digitalServices?: number;
  infrastructureClean?: number;
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

  healthcareSystem?: string;
  publicTransport?: string;
  digitalServices?: string;
  infrastructureClean?: string;
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
  disqualifiedTop?: DisqualifiedCountry[];
  receivedData: QuizData;
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

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<QuizData>(initialData);
  const [originCurrencyLabel, setOriginCurrencyLabel] =
    useState("your currency");

  const [submittedProfile, setSubmittedProfile] =
    useState<QuizData | null>(null);
  const [result, setResult] = useState<QuizApiResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Unified loading + visual progress
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // AI explanation state
  const [aiData, setAiData] = useState<AIExplainData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Landing vs quiz
  const [showQuiz, setShowQuiz] = useState(false);

  // For auto-scroll to loading and results
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToResultsRef = useRef(false);

  /* ---------------------------------------------------------------------- */
  /*        FORCE-DISABLE HORIZONTAL SCROLL ON HTML/BODY (MOBILE)          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflowX = html.style.overflowX;
    const prevBodyOverflowX = body.style.overflowX;

    html.style.overflowX = "hidden";
    body.style.overflowX = "hidden";

    return () => {
      html.style.overflowX = prevHtmlOverflowX;
      body.style.overflowX = prevBodyOverflowX;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                        RESTORE LAST RESULT (SESSION)                   */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const fromStripe = url.searchParams.get("restore") === "1";

    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      if (fromStripe) {
        url.searchParams.delete("restore");
        window.history.replaceState({}, "", url.toString());
      }
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        profile: QuizData;
        result: QuizApiResponse;
        aiData: AIExplainData | null;
        aiError: string | null;
      };

      if (parsed.result?.receivedData) {
        setData(parsed.result.receivedData);
      } else {
        setData(parsed.profile);
      }

      setSubmittedProfile(parsed.profile);
      setResult(parsed.result);
      setAiData(parsed.aiData || null);
      setAiError(parsed.aiError || null);

      setCurrentStep(TOTAL_STEPS - 1);
      setShowQuiz(true);
    } catch (e) {
      console.error("Failed to restore relomatcherLastResult:", e);
    } finally {
      if (fromStripe) {
        url.searchParams.delete("restore");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

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
    // If on first step → go back to landing page
    if (currentStep === 0) {
      setShowQuiz(false);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmittedProfile(data);
    setLoading(true);
    setProgress(5);
    setErrorMsg(null);
    setResult(null);
    setAiData(null);
    setAiError(null);
    hasScrolledToResultsRef.current = false;

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

      let localAiData: AIExplainData | null = null;
      let localAiError: string | null = null;

      if (json.topMatches && json.topMatches.length > 0) {
        try {
          const aiRes = await fetch("/api/ai-explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profile: data,
              topMatches: json.topMatches || [],
              disqualifiedTop: json.disqualifiedTop || [],
            }),
          });

          const body = (await aiRes
            .json()
            .catch(
              () => ({ error: "Failed to parse AI response JSON" }) as {
                error?: string;
              }
            )) as Partial<AIExplainData> & { error?: string };

          if (!aiRes.ok) {
            localAiError =
              body.error || "AI explanation request failed with non-200 status.";
          } else {
            localAiData = body as AIExplainData;
          }
        } catch (aiErr: any) {
          console.error("AI explanation error:", aiErr);
          localAiError =
            aiErr?.message ||
            "Something went wrong while generating AI insights.";
        }
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            profile: data,
            result: json,
            aiData: localAiData,
            aiError: localAiError,
          })
        );
      }

      setResult(json);
      setAiData(localAiData);
      setAiError(localAiError);
    } catch (err: any) {
      console.error("Quiz submit error:", err);
      setErrorMsg(
        err.message || "Something went wrong while scoring your matches."
      );
    } finally {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }

  const stepProgress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  // Progress animation for the loading bar
  useEffect(() => {
    if (!loading) return;

    // Ensure we never start from 0 visually
    setProgress((prev) => (prev < 5 ? 5 : prev));

    const id = setInterval(() => {
      setProgress((prev) => {
        // Let it go up to 95% while waiting for real results
        if (prev >= 95) return prev;

        const target = 95;
        const distance = target - prev;
        const baseIncrement = distance * 0.04; // a bit faster
        const jitter = Math.random() * 0.8;
        let next = prev + baseIncrement + jitter;
        if (next > target) next = target;
        return next;
      });
    }, 200);

    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (loading && loadingRef.current) {
      loadingRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [loading]);

  useEffect(() => {
    if (
      !loading &&
      result &&
      result.topMatches &&
      result.topMatches.length > 0 &&
      !hasScrolledToResultsRef.current
    ) {
      hasScrolledToResultsRef.current = true;
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [loading, result]);

  function handleStartQuiz() {
    setShowQuiz(true);
    setCurrentStep(0);
    setTimeout(() => {
      const el = document.getElementById("quiz-form-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }

  function handleRetakeQuiz() {
    setData(initialData);
    setSubmittedProfile(null);
    setResult(null);
    setAiData(null);
    setAiError(null);
    setErrorMsg(null);
    setLoading(false);
    setProgress(0);
    setCurrentStep(0);
    setShowQuiz(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-50 flex items-start justify-center py-10 px-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        {/* Top bar with logo */}
        <header className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co/vxmwqW2x/logo-v1.png"
              alt="ReloMatcher – relocation quiz logo"
              className="h-12 w-auto object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.75)] rounded-xl"
            />
          </div>
        </header>

        {/* LANDING VIEW */}
        {!showQuiz && (
          <section className="space-y-8">
            {/* Hero */}
            <div className="space-y-3 max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-50 leading-tight">
                Where should I move? Free quiz to find the best country and city
                to live in.
              </h1>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                Answer a few smart questions and let ReloMatcher act as your{" "}
                <strong className="font-semibold">
                  &quot;where should I live&quot; test
                </strong>
                . We rank{" "}
                <strong className="font-semibold">
                  the best places to live in the world
                </strong>{" "}
                for your taxes, cost of living, safety, LGBTQ+ rights, climate
                and lifestyle – then explain exactly why each match fits you.
              </p>
            </div>

            {/* Bullets */}
            <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
              <Bullet icon="🧠" title="Adaptive questions">
                We only go deep on the things you say you care about – if you
                don&apos;t care about taxes, we won&apos;t interrogate you about
                taxes.
              </Bullet>
              <Bullet icon="🏳️‍🌈" title="Identity-aware">
                You can mark things like safety, culture and lifestyle as
                non-negotiable and we&apos;ll avoid places that don&apos;t fit.
              </Bullet>
              <Bullet icon="🌦️" title="Climate & vibe first">
                Prefer cold cities with nightlife, or warm laid-back coasts? We
                treat vibe as seriously as numbers.
              </Bullet>
              <Bullet icon="💸" title="Built for online earners">
                Tuned for remote workers, founders and people whose income
                isn&apos;t locked to one country.
              </Bullet>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleStartQuiz}
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 text-slate-950 text-sm font-semibold px-7 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.6)] hover:bg-amber-300 transition-colors"
              >
                <span>✨ Start the relocation quiz</span>
                <span className="text-lg">→</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                ~10 quick steps · a personalised{" "}
                <strong className="font-semibold">
                  &quot;where should I move&quot; quiz
                </strong>{" "}
                for remote workers, founders and online earners.
              </p>
            </div>

            {/* SEO intro copy with real keywords */}
            <SeoIntroBlock />

            {/* Collapsible SEO/article menu for internal links */}
            <SeoArticleMenu />
          </section>
        )}

        {/* QUIZ VIEW */}
        {showQuiz && (
          <>
            <section
              id="quiz-form-section"
              className="space-y-4 mt-4 max-w-3xl mx-auto"
            >
              {/* Step indicator */}
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_14px_32px_rgba(15,23,42,0.3)] text-slate-900">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
                  Step {currentStep + 1} of {TOTAL_STEPS}
                </p>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
              </div>

              {/* Form card */}
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-4 sm:px-5 sm:py-5 shadow-[0_18px_40px_rgba(15,23,42,0.45)] text-slate-900">
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
              </div>

              {/* Loading */}
              {loading && (
                <div ref={loadingRef}>
                  <LoadingScreen progress={progress} />
                </div>
              )}

              {errorMsg && (
                <div className="mt-2 text-[11px] text-rose-300">{errorMsg}</div>
              )}
            </section>

            {/* Results under quiz */}
            {!loading &&
              result &&
              result.topMatches &&
              result.topMatches.length > 0 && (
                <section
                  ref={resultsRef}
                  className="mt-8 max-w-5xl mx-auto px-0"
                >
                  <ResultsPanel
                    result={result}
                    profile={submittedProfile}
                    originCurrencyLabel={originCurrencyLabel}
                    aiData={aiData}
                    aiError={aiError}
                    onRetake={handleRetakeQuiz}
                  />
                </section>
              )}
          </>
        )}
      </div>
    </main>
  );
}

/* -------------------- Landing page SEO helpers -------------------- */

function SeoIntroBlock() {
  return (
    <section className="max-w-3xl space-y-2 text-[12px] md:text-[13px] text-slate-400 leading-relaxed">
      <p>
        Most{" "}
        <strong className="font-semibold">
          &quot;best places to live in the world&quot;
        </strong>{" "}
        lists are generic. ReloMatcher looks at what actually matters to you:
        taxes, cost of living, safety, LGBTQ+ protections, public transport,
        digital services and the climate or vibe you prefer.
      </p>
      <p>
        Use this quiz instead of scrolling random lists of{" "}
        <strong className="font-semibold">best countries to live</strong>,{" "}
        <strong className="font-semibold">best cities to live in</strong> or{" "}
        <strong className="font-semibold">best expat countries</strong>. You get
        a ranked shortlist that fits your reality – whether you&apos;re a
        digital nomad, an expat, or just curious about where you could be
        happier.
      </p>
    </section>
  );
}

function SeoArticleMenu() {
  const [open, setOpen] = useState(true);

  return (
    <section className="max-w-3xl">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">📚</span>
            <div>
              <p className="text-[12px] font-semibold text-slate-50 tracking-tight">
                Explore relocation guides &amp; rankings
              </p>
              <p className="text-[11px] text-slate-400">
                We&apos;ll add in-depth articles here – everything from best
                expat countries to easiest countries to immigrate to.
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            {open ? "Hide ▲" : "Show ▼"}
          </span>
        </button>

        <SimpleCollapsible isOpen={open}>
          <nav className="px-4 pb-4 pt-1 text-[11px] text-slate-300 space-y-3">
            <div>
              <p className="uppercase tracking-[0.18em] text-slate-500 text-[10px] mb-1">
                Relocation quizzes &amp; tests
              </p>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="#quiz-form-section"
                    className="hover:text-amber-300"
                  >
                    Where should I move quiz (main tool)
                  </a>
                </li>
                <li>
                  <a
                    href="/guides/where-should-i-relocate-quiz"
                    className="hover:text-amber-300"
                  >
                    Where should I relocate quiz – deep dive
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="uppercase tracking-[0.18em] text-slate-500 text-[10px] mb-1">
                Best places to live
              </p>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="/guides/best-places-to-live-in-the-world"
                    className="hover:text-amber-300"
                  >
                    Best places to live in the world
                  </a>
                </li>
                <li>
                  <a
                    href="/guides/best-countries-to-live"
                    className="hover:text-amber-300"
                  >
                    Best countries to live
                  </a>
                </li>
                <li>
                  <a
                    href="/guides/best-cities-to-live-in"
                    className="hover:text-amber-300"
                  >
                    Best cities to live in
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="uppercase tracking-[0.18em] text-slate-500 text-[10px] mb-1">
                Expat &amp; digital nomad guides
              </p>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="/guides/best-expat-countries"
                    className="hover:text-amber-300"
                  >
                    Best expat countries
                  </a>
                </li>
                <li>
                  <a
                    href="/guides/best-cities-for-expats"
                    className="hover:text-amber-300"
                  >
                    Best cities for expats
                  </a>
                </li>
                <li>
                  <a
                    href="/guides/digital-nomad-countries"
                    className="hover:text-amber-300"
                  >
                    Best digital nomad countries
                  </a>
                </li>
                <li>
                  <a
                    href="/guides/easiest-countries-to-immigrate-to"
                    className="hover:text-amber-300"
                  >
                    Easiest countries to immigrate to
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </SimpleCollapsible>
      </div>
    </section>
  );
}

/* -------------------- Generic landing bullets -------------------- */

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
    <div className="flex gap-3 items-start">
      <div className="mt-1 h-7 w-7 flex items-center justify-center rounded-2xl bg-slate-900 border border-slate-700 text-lg">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-[13px] text-slate-50 leading-snug tracking-tight">
          {title}
        </p>
        <p className="text-[12px] text-slate-400 leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );
}

/* PREMIUM UPSELL */

function PremiumUpsell({
  profile,
  topMatches,
}: {
  profile: QuizData | null;
  topMatches: CountryMatch[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_14px_32px_rgba(15,23,42,0.3)] h-full text-slate-900">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-7 w-7 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-xs border border-amber-200">
          🔒
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Premium relocation report
          </p>
          <h3 className="text-sm font-semibold text-slate-900 leading-snug">
            Turn these matches into a{" "}
            <span className="text-amber-500">step-by-step plan</span>.
          </h3>
          <p className="text-[11px] text-slate-600">
            Get a downloadable PDF tailored to your answers and top countries:
          </p>
          <ul className="space-y-1 text-[11px] text-slate-700">
            <li>
              ✅ <span className="font-semibold">Recommended cities</span> and
              areas that match your vibe, budget and climate
            </li>
            <li>
              ✅ <span className="font-semibold">Visa options</span> matched to
              your passport, income and work situation
            </li>
            <li>
              ✅{" "}
              <span className="font-semibold">
                Tax-residency angles &amp; red flags
              </span>{" "}
              to check before booking a one-way ticket
            </li>
            <li>
              ✅{" "}
              <span className="font-semibold">
                30–60 day action checklist
              </span>{" "}
              so you know exactly what to do first
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <GenerateReportButton profile={profile} topMatches={topMatches} />

        <div className="flex items-center gap-1 mt-1">
          <span className="text-[12px]">🛡️</span>
          <p className="text-[10px] text-slate-500">
            SSL-secured payment (Stripe). Your PDF is generated{" "}
            <span className="font-semibold text-slate-900">
              immediately after payment
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

/* Simple collapsible helper with smooth slide + fade */

function SimpleCollapsible({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className={isOpen ? "mt-3" : ""}>{children}</div>
    </div>
  );
}

/* Results UI */

function ResultsPanel({
  result,
  profile,
  originCurrencyLabel,
  aiData,
  aiError,
  onRetake,
}: {
  result: QuizApiResponse;
  profile: QuizData | null;
  originCurrencyLabel: string;
  aiData: AIExplainData | null;
  aiError: string | null;
  onRetake: () => void;
}) {
  const rawMatches = result.topMatches || [];
  const topMatches = rawMatches.slice(0, 3);

  if (!topMatches || topMatches.length === 0) return null;

  const disqualifiedTop = (result.disqualifiedTop || []).slice(0, 3);

  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [votes, setVotes] = useState<
    Record<string, "like" | "dislike" | undefined>
  >({});
  const [activeTab, setActiveTab] = useState<"qualified" | "disqualified">(
    "qualified"
  );
  const [aiCollapsed, setAiCollapsed] = useState(false);

  const monthlyIncome = profile?.monthlyIncome
    ? Number(profile.monthlyIncome.toString().replace(/,/g, ""))
    : null;

  const currency = originCurrencyLabel || "your currency";

  const dims = buildDimensionsForProfile(profile, topMatches[0]);

  const aiWinnerMap = new Map<string, string>();
  const aiDisqMap = new Map<string, string>();

  if (aiData?.winners) {
    for (const w of aiData.winners) {
      if (w.code && w.aiComment) {
        aiWinnerMap.set(w.code, w.aiComment);
      }
    }
  }
  if (aiData?.disqualified) {
    for (const d of aiData.disqualified) {
      if (d.code && d.aiComment) {
        aiDisqMap.set(d.code, d.aiComment);
      }
    }
  }

  const hasDisqualified = disqualifiedTop.length > 0;

  return (
    <div className="space-y-5 mt-4">
      {/* Top row: Upsell + AI summary */}
      <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
        <div className="h-full">
          <PremiumUpsell profile={profile} topMatches={topMatches} />
        </div>

        <div className="h-full">
          {aiError ? (
            <div className="h-full rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-900 shadow-[0_12px_30px_rgba(15,23,42,0.25)] flex items-start gap-3">
              <span className="text-base mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-[0.14em] mb-1 text-rose-700">
                  AI insight unavailable
                </p>
                <p>{aiError}</p>
              </div>
            </div>
          ) : (
            <div className="h-full rounded-2xl border border-emerald-300 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.25)] text-slate-900">
              <button
                type="button"
                onClick={() => setAiCollapsed((v) => !v)}
                className="flex items-center justify-between gap-2 w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <p className="font-semibold text-[11px] uppercase tracking-[0.14em] text-emerald-600">
                    AI summary of your matches
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {aiCollapsed ? "Show ▼" : "Hide ▲"}
                </span>
              </button>

              <SimpleCollapsible isOpen={!aiCollapsed}>
                <p className="text-xs text-slate-800">
                  {aiData?.overallSummary
                    ? aiData.overallSummary
                    : "Your matches are ready. If AI insights fail for some reason, you still have the full numeric breakdown below."}
                </p>
              </SimpleCollapsible>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-1">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-[11px] font-medium shadow-[0_10px_24px_rgba(15,23,42,0.25)] text-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab("qualified")}
            className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${
              activeTab === "qualified"
                ? "bg-slate-900 text-white"
                : "bg-transparent text-slate-700 hover:text-slate-900"
            }`}
          >
            <span>✅</span>
            <span>Qualified matches</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("disqualified")}
            className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${
              activeTab === "disqualified"
                ? "bg-slate-900 text-white"
                : "bg-transparent text-slate-700 hover:text-slate-900"
            }`}
          >
            <span>🚫</span>
            <span>Disqualified almost-matches</span>
          </button>
        </div>
      </div>

      {/* Qualified tab */}
      {activeTab === "qualified" && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-slate-400">
            Your top matches (tap like or pass, then open the breakdown)
          </p>

          {/* Hidden trigger for story image (no visible duplicate row) */}
          <ShareStoryImageButton topMatches={topMatches} />

          <div className="space-y-3">
            {topMatches.map((m, idx) => {
              const vote = votes[m.code];
              const expanded = expandedCode === m.code;

              const netPct = m.netIncomePercent ?? null;
              const approxNet =
                monthlyIncome && netPct != null
                  ? Math.round((monthlyIncome * netPct) / 100)
                  : null;

              const aiComment = aiWinnerMap.get(m.code) || undefined;

              return (
                <MatchCard
                  key={m.code}
                  match={m}
                  rank={idx + 1}
                  isBest={idx === 0}
                  dims={dims}
                  expanded={expanded}
                  onToggle={() =>
                    setExpandedCode((prev) =>
                      prev === m.code ? null : m.code
                    )
                  }
                  vote={vote}
                  onVote={(v) =>
                    setVotes((prev) => ({
                      ...prev,
                      [m.code]: prev[m.code] === v ? undefined : v,
                    }))
                  }
                  monthlyIncome={monthlyIncome}
                  currency={currency}
                  netPct={netPct}
                  approxNet={approxNet}
                  aiComment={aiComment}
                />
              );
            })}
          </div>

          {/* Retake + Share buttons under top matches */}
          <div className="pt-2 border-t border-slate-800/40 mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRetake}
              className="inline-flex items-center justify-center gap-1 rounded-full border border-slate-600 bg-slate-900 px-5 py-2 text-[11px] font-semibold text-slate-50 hover:bg-slate-800 transition-colors min-w-[150px]"
            >
              <span>🔁</span>
              <span>Retake quiz</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.querySelector(
                  "[data-share-story-button]"
                ) as HTMLButtonElement | null;
                if (el) el.click();
              }}
              className="inline-flex items-center justify-center gap-1 rounded-full bg-amber-400 text-slate-950 px-5 py-2 text-[11px] font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.5)] hover:bg-amber-300 transition-colors min-w-[150px]"
            >
              <span>📤</span>
              <span>Share your results</span>
            </button>
          </div>
        </div>
      )}

      {/* Disqualified tab */}
      {activeTab === "disqualified" && hasDisqualified && (
        <DisqualifiedPanel
          disqualifiedTop={disqualifiedTop}
          dims={dims}
          monthlyIncome={monthlyIncome}
          currency={currency}
          aiDisqMap={aiDisqMap}
        />
      )}

      {activeTab === "disqualified" && !hasDisqualified && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.25)]">
          We didn&apos;t have to disqualify any strong matches based on your
          hard rules. If you tighten something like LGBTQ+ or culture later,
          you&apos;ll see countries appear here that we had to remove.
        </div>
      )}
    </div>
  );
}

/* Dimension builder */

function buildDimensionsForProfile(
  profile: QuizData | null,
  sampleMatch: CountryMatch | null
): { key: keyof DimensionBreakdown; label: string }[] {
  const baseDims: { key: keyof DimensionBreakdown; label: string }[] = [
    { key: "tax", label: "Taxes" },
    { key: "costOfLiving", label: "Cost of living" },
    { key: "incomeGrowth", label: "Income & growth" },
    { key: "remoteFriendly", label: "Remote-work friendly" },
    {
      key: "safety",
      label: "Safety & stability",
    },
    {
      key: "lifestyle",
      label: "Lifestyle & culture",
    },
  ];

  const optionalDims: { key: keyof DimensionBreakdown; label: string }[] = [
    { key: "climateMatch", label: "Weather match" },
    { key: "languageMatch", label: "Language fit" },
    { key: "expatScene", label: "Expat scene" },
    { key: "socialScene", label: "Social & nightlife" },
    { key: "lgbtRights", label: "LGBT protections & rights" },
    { key: "healthcareSystem", label: "Healthcare system" },
    { key: "publicTransport", label: "Public transport" },
    { key: "digitalServices", label: "Digital services" },
    { key: "infrastructureClean", label: "Clean & maintained" },
    { key: "everydayServices", label: "Everyday services" },
  ];

  if (!profile) return baseDims.slice(0, 4);

  const reasons = new Set(profile.reasons || []);
  const selectedKeys = new Set<keyof DimensionBreakdown>();

  if (reasons.has("lower_taxes")) selectedKeys.add("tax");
  if (reasons.has("lower_cost_of_living")) selectedKeys.add("costOfLiving");
  if (reasons.has("career_growth")) selectedKeys.add("incomeGrowth");
  if (reasons.has("remote_work")) selectedKeys.add("remoteFriendly");
  if (reasons.has("safety_stability_priority")) selectedKeys.add("safety");

  if (reasons.has("better_lgbtq")) {
    selectedKeys.add("lgbtRights");
    selectedKeys.add("lifestyle");
  }

  if (reasons.has("better_weather")) selectedKeys.add("climateMatch");
  if (reasons.has("expat_community")) selectedKeys.add("expatScene");
  if (reasons.has("social_life")) selectedKeys.add("socialScene");

  if (
    reasons.has("language_must_have") ||
    reasons.has("language_nice_to_have") ||
    reasons.has("language_flexible")
  ) {
    selectedKeys.add("languageMatch");
  }

  if (
    reasons.has("healthcare_strong_public") ||
    reasons.has("healthcare_mixed") ||
    reasons.has("healthcare_private")
  ) {
    selectedKeys.add("healthcareSystem");
  }

  if (reasons.has("dev_public_transport")) {
    selectedKeys.add("publicTransport");
  }
  if (reasons.has("dev_digital_services")) {
    selectedKeys.add("digitalServices");
  }
  if (reasons.has("dev_infrastructure_clean")) {
    selectedKeys.add("infrastructureClean");
  }
  if (reasons.has("dev_everyday_services")) {
    selectedKeys.add("everydayServices");
  }

  const dimsFromReasons: { key: keyof DimensionBreakdown; label: string }[] =
    [];
  for (const dim of [...baseDims, ...optionalDims]) {
    if (selectedKeys.has(dim.key)) dimsFromReasons.push(dim);
  }

  const resultDims = [...dimsFromReasons];
  const ensureList = [...baseDims, ...optionalDims];

  for (const dim of ensureList) {
    if (resultDims.length >= 4) break;
    if (!resultDims.find((d) => d.key === dim.key)) {
      resultDims.push(dim);
    }
  }

  if (sampleMatch) {
    return resultDims.filter(
      (d) =>
        sampleMatch.breakdown[d.key] !== undefined &&
        sampleMatch.breakdown[d.key] !== null
    );
  }

  return resultDims;
}

/* Match card */

function MatchCard({
  match,
  rank,
  isBest,
  dims,
  expanded,
  onToggle,
  vote,
  onVote,
  monthlyIncome,
  currency,
  netPct,
  approxNet,
  aiComment,
}: {
  match: CountryMatch;
  rank: number;
  isBest?: boolean;
  dims: { key: keyof DimensionBreakdown; label: string }[];
  expanded: boolean;
  onToggle: () => void;
  vote?: "like" | "dislike";
  onVote: (v: "like" | "dislike") => void;
  monthlyIncome: number | null;
  currency: string;
  netPct: number | null;
  approxNet: number | null;
  aiComment?: string;
}) {
  const rawScore =
    typeof match.totalScore === "number"
      ? match.totalScore
      : typeof (match as any).baseScore === "number"
      ? (match as any).baseScore
      : 0;

  const displayScore = Number.isFinite(rawScore) ? rawScore : 0;

  const baseCardClasses =
    "rounded-2xl border px-4 py-3 shadow-[0_12px_26px_rgba(15,23,42,0.25)] transition-colors bg-white";
  const bestClasses = isBest
    ? "border-amber-300 bg-amber-50"
    : "border-slate-200 bg-white";

  return (
    <div className={`${baseCardClasses} ${bestClasses} text-slate-900`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-7 w-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-semibold text-slate-900">
            #{rank}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 tracking-tight">
              {match.name}
              {isBest && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-semibold text-slate-950">
                  Best match
                </span>
              )}
            </p>
            {match.shortNote && (
              <p className="text-[11px] text-slate-700 mt-0.5">
                {match.shortNote}
              </p>
            )}

            {netPct !== null && (
              <p className="mt-1 text-[11px] text-slate-800">
                You keep roughly{" "}
                <span className="font-semibold text-amber-600">
                  {netPct}%
                </span>{" "}
                of your income here
                {approxNet && (
                  <>
                    , ≈{" "}
                    <span className="font-semibold text-slate-900">
                      {approxNet.toLocaleString()} {currency}
                    </span>{" "}
                    / month
                  </>
                )}
                .
              </p>
            )}
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Overall score
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {displayScore.toFixed(1)}
              <span className="text-[11px] text-slate-500"> / 10</span>
            </p>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onVote("dislike")}
              className={`h-7 w-7 rounded-full border flex items-center justify-center text-xs
                ${
                  vote === "dislike"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              aria-label="Pass"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={() => onVote("like")}
              className={`h-7 w-7 rounded-full border flex items-center justify-center text-xs
                ${
                  vote === "like"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                }`}
              aria-label="Like"
            >
              ❤
            </button>
          </div>
        </div>
      </div>

      {aiComment && (
        <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900 flex gap-2">
          <span className="mt-[1px] text-xs">🤖</span>
          <div>
            <p className="font-semibold text-[11px] uppercase tracking-[0.14em] text-emerald-700 mb-0.5">
              AI insight
            </p>
            <p>{aiComment}</p>
          </div>
        </div>
      )}

      <div className="mt-3 border-t border-slate-200 pt-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center justify-between w-full text-[11px] text-slate-800 hover:text-slate-900"
        >
          <span className="font-semibold">
            {expanded ? "Hide full breakdown" : "View full breakdown"}
          </span>
          <span className="text-[11px]">{expanded ? "▲" : "▼"}</span>
        </button>

        <SimpleCollapsible isOpen={expanded}>
          <div className="space-y-2">
            {dims.map((d) => {
              const value = match.breakdown[d.key];
              const expl =
                match.explanations[d.key as keyof DimensionExplanations];
              if (value === undefined || value === null) return null;
              const pctWidth = `${(value / 10) * 100}%`;
              return (
                <div key={d.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{d.label}</span>
                    <span className="font-semibold text-slate-900">
                      {value.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: pctWidth }}
                    />
                  </div>
                  {expl && (
                    <p className="text-[11px] text-slate-700">{expl}</p>
                  )}
                </div>
              );
            })}
          </div>
        </SimpleCollapsible>
      </div>
    </div>
  );
}

/* Disqualified panel */

function DisqualifiedPanel({
  disqualifiedTop,
  dims,
  monthlyIncome,
  currency,
  aiDisqMap,
}: {
  disqualifiedTop: DisqualifiedCountry[];
  dims: { key: keyof DimensionBreakdown; label: string }[];
  monthlyIncome: number | null;
  currency: string;
  aiDisqMap: Map<string, string>;
}) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  return (
    <div className="space-y-3 mt-2">
      <p className="text-[11px] font-semibold text-slate-400">
        Strong fits we had to disqualify for your rules
      </p>
      <p className="text-[11px] text-slate-500">
        These countries matched you on many things, but were removed because of a
        hard rule you set (for example non-negotiable LGBT rights, culture, or
        residency realism). They can still be interesting to research if
        you&apos;re flexible.
      </p>

      <div className="space-y-3">
        {disqualifiedTop.map((m) => {
          const expanded = expandedCode === m.code;

          const netPct = m.netIncomePercent ?? null;
          const approxNet =
            monthlyIncome && netPct != null
              ? Math.round((monthlyIncome * netPct) / 100)
              : null;

          const aiComment = aiDisqMap.get(m.code) || undefined;

          const displayScore =
            typeof m.baseScore === "number" && Number.isFinite(m.baseScore)
              ? m.baseScore
              : 0;

          return (
            <div
              key={m.code}
              className="rounded-2xl border px-4 py-3 shadow-[0_12px_26px_rgba(15,23,42,0.25)] bg-white border-rose-300 text-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-rose-50 border border-rose-300 flex items-center justify-center text-[10px] font-semibold text-rose-700">
                    ⚠
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 tracking-tight">
                      {m.name}
                      <span className="ml-2 inline-flex items-center rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-semibold text-slate-50">
                        Disqualified
                      </span>
                    </p>
                    {m.shortNote && (
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        {m.shortNote}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-rose-800">
                      {m.reason}
                    </p>

                    {netPct !== null && (
                      <p className="mt-1 text-[11px] text-slate-800">
                        Financially, you could keep roughly{" "}
                        <span className="font-semibold text-amber-600">
                          {netPct}%
                        </span>{" "}
                        of your income here
                        {approxNet && (
                          <>
                            , ≈{" "}
                            <span className="font-semibold text-slate-900">
                              {approxNet.toLocaleString()} {currency}
                            </span>{" "}
                            / month
                          </>
                        )}
                        .
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Overall score
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {displayScore.toFixed(1)}
                    <span className="text-[11px] text-slate-500">
                      {" "}
                      / 10
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    ignoring this red flag
                  </p>
                </div>
              </div>

              {aiComment && (
                <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900 flex gap-2">
                  <span className="mt-[1px] text-xs">🤖</span>
                  <div>
                    <p className="font-semibold text-[11px] uppercase tracking-[0.14em] text-emerald-700 mb-0.5">
                      AI insight
                    </p>
                    <p>{aiComment}</p>
                  </div>
                </div>
              )}

              <div className="mt-3 border-t border-slate-200 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCode((prev) => (prev === m.code ? null : m.code))
                  }
                  className="flex items-center justify-between w-full text-[11px] text-slate-800 hover:text-slate-900"
                >
                  <span className="font-semibold">
                    {expanded
                      ? "Hide detailed breakdown"
                      : "View detailed breakdown anyway"}
                  </span>
                  <span className="text-[11px]">
                    {expanded ? "▲" : "▼"}
                  </span>
                </button>

                <SimpleCollapsible isOpen={expanded}>
                  <div className="space-y-2">
                    {dims.map((d) => {
                      const value = m.breakdown[d.key];
                      const expl =
                        m.explanations[d.key as keyof DimensionExplanations];
                      if (value === undefined || value === null) return null;
                      const pctWidth = `${(value / 10) * 100}%`;
                      return (
                        <div key={d.key} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{d.label}</span>
                            <span className="font-semibold text-slate-900">
                              {value.toFixed(1)}/10
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all"
                              style={{ width: pctWidth }}
                            />
                          </div>
                          {expl && (
                            <p className="text-[11px] text-slate-700">
                              {expl}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SimpleCollapsible>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Loading */

function LoadingScreen({ progress }: { progress: number }) {
  const clamped = Math.max(3, Math.min(progress, 100));

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <span className="text-base">🤖</span>
        <span>AI is calculating your best matches…</span>
      </div>

      <div className="w-full max-w-xs h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 transition-all duration-150 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>

      <p className="text-[11px] text-slate-400 max-w-xs">
        We&apos;re actually scoring every country against your answers, then
        letting AI re-rank the top ones. It takes a few seconds – but it&apos;s
        worth it to find a place that really fits you.
      </p>
    </div>
  );
}

/* Share story image via canvas (hidden trigger; only bottom CTA visible) */

function ShareStoryImageButton({ topMatches }: { topMatches: CountryMatch[] }) {
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  if (!topMatches || topMatches.length === 0) return null;

  const first = topMatches[0];
  const second = topMatches[1];
  const third = topMatches[2];

  async function loadFlag(code?: string): Promise<HTMLImageElement | null> {
    if (!code) return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
      return;
    });
  }

  async function handleSave() {
    if (typeof document === "undefined") return;

    try {
      setSaving(true);

      const canvas = document.createElement("canvas");
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No 2D context");

      // Background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width / 2,
        0,
        0,
        width / 2,
        0,
        width
      );
      gradient.addColorStop(0, "rgba(251,191,36,0.45)");
      gradient.addColorStop(1, "rgba(2,6,23,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const [flag1, flag2, flag3] = await Promise.all([
        loadFlag(first?.code),
        loadFlag(second?.code),
        loadFlag(third?.code),
      ]);

      const drawText = (
        text: string,
        x: number,
        y: number,
        size: number,
        color = "#e5e7eb",
        align: CanvasTextAlign = "left",
        weight = "400"
      ) => {
        ctx.fillStyle = color;
        ctx.font = `${weight} ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = align;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(text, x, y);
      };

      const topOffset = 200;
      const titleY = topOffset + 55;
      const subtitleY = titleY + 60;
      const rowYStart = subtitleY + 110;
      const rowGap = 150;

      drawText(
        "YOUR TOP COUNTRY MATCHES",
        80,
        topOffset,
        42,
        "#f9fafb",
        "left",
        "700"
      );

      drawText(
        "Relomatcher",
        width - 80,
        topOffset,
        38,
        "#e5e7eb",
        "right",
        "600"
      );

      drawText(
        "Find your best country match.",
        80,
        titleY,
        60,
        "#f9fafb",
        "left",
        "700"
      );

      drawText(
        "My top 3 matches:",
        80,
        subtitleY,
        38,
        "#e5e7eb",
        "left",
        "500"
      );

      const drawRow = (
        idxLabel: string,
        name: string,
        score: number | null,
        y: number,
        highlight: boolean,
        flagImg?: HTMLImageElement | null
      ) => {
        const cardX = 80;
        const cardY = y - 75;
        const cardW = width - 160;
        const cardH = 120;
        const radius = 32;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cardX + radius, cardY);
        ctx.lineTo(cardX + cardW - radius, cardY);
        ctx.quadraticCurveTo(
          cardX + cardW,
          cardY,
          cardX + cardW,
          cardY + radius
        );
        ctx.lineTo(cardX + cardW, cardY + cardH - radius);
        ctx.quadraticCurveTo(
          cardX + cardW,
          cardY + cardH,
          cardX + cardW - radius,
          cardY + cardH
        );
        ctx.lineTo(cardX + radius, cardY + cardH);
        ctx.quadraticCurveTo(
          cardX,
          cardY + cardH,
          cardX,
          cardY + cardH - radius
        );
        ctx.lineTo(cardX, cardY + radius);
        ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
        ctx.closePath();

        ctx.fillStyle = highlight
          ? "rgba(15,23,42,0.98)"
          : "rgba(15,23,42,0.96)";
        ctx.fill();

        ctx.lineWidth = highlight ? 3 : 2;
        ctx.strokeStyle = highlight ? "#fbbf24" : "#4b5563";
        ctx.stroke();
        ctx.restore();

        const badgeX = cardX + 70;
        const badgeY = y - 15;
        const badgeR = 34;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = highlight ? "#fbbf24" : "#111827";
        ctx.fill();
        drawText(
          idxLabel,
          badgeX,
          badgeY + 12,
          30,
          highlight ? "#111827" : "#e5e7eb",
          "center",
          "700"
        );

        let textStartX = badgeX + 70;
        if (flagImg) {
          const flagH = 46;
          const flagW = (flagImg.width / flagImg.height) * flagH;
          const textBaselineY = y - 8;
          const flagY = textBaselineY - flagH / 2 + 4;
          const flagX = badgeX + 70;
          ctx.drawImage(flagImg, flagX, flagY, flagW, flagH);
          textStartX = flagX + flagW + 20;
        }

        drawText(name, textStartX, y - 8, 38, "#f9fafb", "left", "600");

        if (score != null && !Number.isNaN(score)) {
          drawText(
            `${score.toFixed(1)}/10`,
            cardX + cardW - 60,
            y - 6,
            34,
            "#fbbf24",
            "right",
            "700"
          );
        }
      };

      const s1 =
        typeof first?.totalScore === "number" ? first.totalScore : null;
      const s2 =
        typeof second?.totalScore === "number" ? second.totalScore : null;
      const s3 =
        typeof third?.totalScore === "number" ? third.totalScore : null;

      if (first) {
        drawRow("#1", first.name, s1, rowYStart, true, flag1 || undefined);
      }
      if (second) {
        drawRow(
          "#2",
          second.name,
          s2,
          rowYStart + rowGap,
          false,
          flag2 || undefined
        );
      }
      if (third) {
        drawRow(
          "#3",
          third.name,
          s3,
          rowYStart + rowGap * 2,
          false,
          flag3 || undefined
        );
      }

      const ctaBoxHeight = 230;
      const ctaBoxY = height - ctaBoxHeight - 260;

      ctx.fillStyle = "rgba(15,23,42,0.96)";
      ctx.beginPath();
      const ctaRadius = 40;
      const ctaX = 80;
      const ctaW = width - 160;

      ctx.moveTo(ctaX + ctaRadius, ctaBoxY);
      ctx.lineTo(ctaX + ctaW - ctaRadius, ctaBoxY);
      ctx.quadraticCurveTo(
        ctaX + ctaW,
        ctaBoxY,
        ctaX + ctaW,
        ctaBoxY + ctaRadius
      );
      ctx.lineTo(ctaX + ctaW, ctaBoxY + ctaBoxHeight - ctaRadius);
      ctx.quadraticCurveTo(
        ctaX + ctaW,
        ctaBoxY + ctaBoxHeight,
        ctaX + ctaW - ctaRadius,
        ctaBoxY + ctaBoxHeight
      );
      ctx.lineTo(ctaX + ctaRadius, ctaBoxY + ctaBoxHeight);
      ctx.quadraticCurveTo(
        ctaX,
        ctaBoxY + ctaBoxHeight,
        ctaX,
        ctaBoxY + ctaBoxHeight - ctaRadius
      );
      ctx.lineTo(ctaX, ctaBoxY + ctaRadius);
      ctx.quadraticCurveTo(ctaX, ctaBoxY, ctaX + ctaRadius, ctaBoxY);
      ctx.closePath();
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fbbf24";
      ctx.stroke();

      drawText(
        "Want to know your matches?",
        width / 2,
        ctaBoxY + 80,
        40,
        "#f9fafb",
        "center",
        "600"
      );

      drawText(
        "Take your quiz on",
        width / 2,
        ctaBoxY + 135,
        34,
        "#e5e7eb",
        "center",
        "500"
      );

      drawText(
        "www.relomatcher.com",
        width / 2,
        ctaBoxY + 190,
        46,
        "#fbbf24",
        "center",
        "800"
      );

      const dataUrl = canvas.toDataURL("image/png");
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "relomatcher-story.png", {
        type: "image/png",
      });

      const navAny = navigator as any;

      if (navAny.share && navAny.canShare && navAny.canShare({ files: [file] })) {
        await navAny.share({
          files: [file],
          title: "My Relomatcher matches",
          text:
            "My top country matches from Relomatcher. Take your quiz on www.relomatcher.com and find yours.",
        });
        setSavedOnce(true);
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "relomatcher-story.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSavedOnce(true);
      }
    } catch (e) {
      console.error("Failed to generate/share story image", e);
      alert("Could not generate the image. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Hidden container – only the bottom "Share your results" button triggers this.
  return (
    <div className="hidden">
      <button
        type="button"
        data-share-story-button
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Generating story image..." : "Share / save story image"}
        {savedOnce && " (Done) "}
      </button>
    </div>
  );
}
