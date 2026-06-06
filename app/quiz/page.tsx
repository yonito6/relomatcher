"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { QuizData } from "@/lib/types";
import Hook from "./steps/Hook";
import Basics from "./steps/Basics";
import SwipeDeck from "./steps/SwipeDeck";
import Refine from "./steps/Refine";
import Reveal from "./steps/Reveal";
import Results from "./steps/Results";
import type { QuizApiResponse } from "./steps/Reveal";

// ─── Step machine ────────────────────────────────────────────────────────────

type Step = "hook" | "basics" | "swipe" | "refine" | "reveal" | "results";

const STEPS: Step[] = ["hook", "basics", "swipe", "refine", "reveal", "results"];

const STEP_LABELS: Record<Step, string> = {
  hook:    "Welcome",
  basics:  "The basics",
  swipe:   "What matters",
  refine:  "Fine-tune",
  reveal:  "Matching…",
  results: "Your matches",
};

// Progress-bar encouragement messages — always forward-momentum
const PROGRESS_MESSAGES: Partial<Record<Step, string>> = {
  basics:  "Getting warmer…",
  swipe:   "Narrowing it down…",
  refine:  "Almost there…",
  reveal:  "Finding your top 3…",
  results: "Here they are!",
};

const initialData: QuizData = {
  ageRange: undefined,
  currentCountry: undefined,
  familyStatus: undefined,
  relocatingWith: undefined,
  passportCountry: undefined,
  secondPassportCountry: undefined,
  monthlyIncome: undefined,
  incomeCurrency: "USD",
  languagesSpoken: [],
  factorRatings: undefined,
  climatePref: undefined,
  culturePref: undefined,
  mobilityRights: undefined,
};

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export default function QuizPage() {
  const [step, setStep] = useState<Step>("hook");
  const [data, setData] = useState<QuizData>(initialData);
  const [results, setResults] = useState<QuizApiResponse | null>(null);

  const update = useCallback((values: Partial<QuizData>) => {
    setData((prev) => ({ ...prev, ...values }));
  }, []);

  function next() {
    setStep((current) => {
      const idx = STEPS.indexOf(current);
      return STEPS[Math.min(idx + 1, STEPS.length - 1)];
    });
  }

  function back() {
    setStep((current) => {
      const idx = STEPS.indexOf(current);
      return STEPS[Math.max(idx - 1, 0)];
    });
  }

  function restart() {
    setData(initialData);
    setResults(null);
    setStep("hook");
  }

  const stepIndex = STEPS.indexOf(step);
  // Progress: hook = 0%, results = 100%
  const progressPct = step === "hook" ? 0 : Math.round(((stepIndex) / (STEPS.length - 1)) * 100);
  const showProgress = step !== "hook";
  const progressMsg = PROGRESS_MESSAGES[step];

  return (
    <div className="relo-quiz-root">
      {/* ── Progress bar (hidden on hook screen) ── */}
      <AnimatePresence>
        {showProgress && (
          <motion.div
            className="relo-quiz-progress"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            {/* Logo mark */}
            <div className="relo-quiz-progress__logo">
              <img
                src="https://i.ibb.co/d4D8806r/relomatcher.jpg"
                alt="Relomatcher"
                className="relo-quiz-progress__logo-img"
              />
            </div>

            {/* Step label + message */}
            <div className="relo-quiz-progress__info">
              <span className="relo-quiz-progress__step-label">
                {STEP_LABELS[step]}
              </span>
              {progressMsg && (
                <motion.span
                  key={step}
                  className="relo-quiz-progress__msg"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {progressMsg}
                </motion.span>
              )}
            </div>

            {/* Bar */}
            <div className="relo-quiz-progress__bar-wrap">
              <motion.div
                className="relo-quiz-progress__bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step content ── */}
      <div className={`relo-quiz-step-wrap ${showProgress ? "has-progress" : ""}`}>
        <AnimatePresence mode="wait">
          {step === "hook" && (
            <motion.div key="hook" className="relo-quiz-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Hook onStart={next} />
            </motion.div>
          )}
          {step === "basics" && (
            <motion.div key="basics" className="relo-quiz-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Basics data={data} update={update} onNext={next} onBack={back} />
            </motion.div>
          )}
          {step === "swipe" && (
            <motion.div key="swipe" className="relo-quiz-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <SwipeDeck data={data} update={update} onNext={next} onBack={back} />
            </motion.div>
          )}
          {step === "refine" && (
            <motion.div key="refine" className="relo-quiz-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Refine data={data} update={update} onNext={next} onBack={back} />
            </motion.div>
          )}
          {step === "reveal" && (
            <motion.div key="reveal" className="relo-quiz-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Reveal
                data={data}
                onComplete={(r) => {
                  setResults(r);
                  next();
                }}
                onBack={back}
              />
            </motion.div>
          )}
          {step === "results" && results && (
            <motion.div key="results" className="relo-quiz-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Results results={results} profile={data} onRestart={restart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .relo-quiz-root {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        /* Progress bar */
        .relo-quiz-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding: 0.6rem 1.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .relo-quiz-progress__logo {
          flex-shrink: 0;
        }

        .relo-quiz-progress__logo-img {
          height: 28px;
          width: auto;
          object-fit: contain;
          border-radius: 6px;
        }

        .relo-quiz-progress__info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
        }

        .relo-quiz-progress__step-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #1a1040;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          line-height: 1;
        }

        .relo-quiz-progress__msg {
          font-size: 0.7rem;
          color: #ff6b35;
          font-weight: 600;
          line-height: 1;
        }

        .relo-quiz-progress__bar-wrap {
          width: 80px;
          height: 4px;
          background: #f3f4f6;
          border-radius: 100px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .relo-quiz-progress__bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff6b35, #f7931e);
          border-radius: 100px;
        }

        /* Step wrapper — after the sticky progress bar */
        .relo-quiz-step-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .relo-quiz-step-wrap.has-progress {
          padding-top: 52px;
        }

        .relo-quiz-step {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .relo-quiz-step > * {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
