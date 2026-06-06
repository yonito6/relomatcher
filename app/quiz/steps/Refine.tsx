"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizData } from "@/lib/types";
import type { FactorId, Rating, ClimatePref, CulturePref } from "@/lib/scoring/types";
import { FACTORS } from "@/lib/factors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefineProps {
  data: QuizData;
  update: (values: Partial<QuizData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const INTENSITY_OPTIONS: { value: Rating; label: string; desc: string }[] = [
  { value: "nice",      label: "Nice to have", desc: "A bonus, not a dealbreaker" },
  { value: "important", label: "Important",     desc: "Matters, but I can flex a bit" },
  { value: "must",      label: "Must-have",     desc: "Non-negotiable for me" },
];

const CLIMATE_OPTIONS: { value: ClimatePref; label: string; emoji: string; desc: string }[] = [
  { value: "warm", label: "Warm",  emoji: "☀️", desc: "Sunshine, heat, beach weather" },
  { value: "mild", label: "Mild",  emoji: "🌤️", desc: "Four seasons, comfortable temps" },
  { value: "cold", label: "Cold",  emoji: "❄️", desc: "Crisp air, snow, cosy winters" },
];

const CULTURE_OPTIONS: { value: CulturePref; label: string; emoji: string }[] = [
  { value: "northern_europe",  label: "Northern Europe",  emoji: "🇸🇪" },
  { value: "western_europe",   label: "Western Europe",   emoji: "🇩🇪" },
  { value: "southern_europe",  label: "Southern Europe",  emoji: "🇮🇹" },
  { value: "mediterranean",    label: "Mediterranean",    emoji: "🌊" },
  { value: "north_america",    label: "North America",    emoji: "🗽" },
  { value: "latin_america",    label: "Latin America",    emoji: "💃" },
  { value: "asia",             label: "Asia",             emoji: "🏯" },
  { value: "oceania",          label: "Oceania",          emoji: "🦘" },
  { value: "middle_east",      label: "Middle East",      emoji: "🕌" },
  { value: "post_soviet",      label: "Post-Soviet",      emoji: "🏔️" },
  { value: "other",            label: "Other / Open",     emoji: "🌐" },
];

// Filter factors are safety, lgbt, healthcare — warn that "must" means a hard filter
const FILTER_FACTOR_IDS = new Set<FactorId>(["safety", "lgbt", "healthcare"]);

// ─── Segmented intensity control ─────────────────────────────────────────────

interface IntensityControlProps {
  factorId: FactorId;
  value: Rating;
  isFilter: boolean;
  onChange: (id: FactorId, val: Rating) => void;
}

function IntensityControl({ factorId, value, isFilter, onChange }: IntensityControlProps) {
  return (
    <div className="relo-refine__intensity">
      {INTENSITY_OPTIONS.map((opt) => (
        <motion.button
          key={opt.value}
          className={`relo-refine__intensity-btn ${value === opt.value ? "is-active" : ""} ${
            opt.value === "must" && isFilter ? "relo-refine__intensity-btn--must-filter" : ""
          }`}
          onClick={() => onChange(factorId, opt.value)}
          aria-pressed={value === opt.value}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {opt.label}
        </motion.button>
      ))}
      {value === "must" && isFilter && (
        <motion.p
          className="relo-refine__filter-note"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          ⚠️ Countries that don&apos;t meet your bar will be filtered out
        </motion.p>
      )}
    </div>
  );
}

// ─── Main Refine component ────────────────────────────────────────────────────

export default function Refine({ data, update, onNext, onBack }: RefineProps) {
  // Build initial ratings from swipe output (default: "important" for kept factors)
  function buildInitialRatings(): Partial<Record<FactorId, Rating>> {
    const base = data.factorRatings ?? {};
    const result: Partial<Record<FactorId, Rating>> = {};
    for (const f of FACTORS) {
      const existing = base[f.id];
      if (existing && existing !== "dont_care") {
        result[f.id] = existing; // already has a real rating
      } else if (existing === "dont_care") {
        // skip
      }
      // factors not in factorRatings at all: not kept
    }
    return result;
  }

  const [ratings, setRatings] = useState<Partial<Record<FactorId, Rating>>>(buildInitialRatings);
  const [climatePref, setClimatePref] = useState<ClimatePref | undefined>(data.climatePref);
  const [culturePref, setCulturePref] = useState<CulturePref | undefined>(data.culturePref);

  // Kept factors: those that are NOT dont_care in the original swipe output
  const keptFactors = FACTORS.filter((f) => {
    const swipeRating = data.factorRatings?.[f.id];
    return swipeRating !== undefined && swipeRating !== "dont_care";
  });

  const keptWeather = keptFactors.some((f) => f.id === "weather");
  const keptCulture = keptFactors.some((f) => f.id === "culture");

  function handleRatingChange(id: FactorId, val: Rating) {
    setRatings((prev) => ({ ...prev, [id]: val }));
  }

  function handleContinue() {
    // Build final factorRatings: kept factors use refined ratings, rejected keep dont_care
    const finalRatings: Partial<Record<FactorId, Rating>> = { ...data.factorRatings };
    for (const f of keptFactors) {
      finalRatings[f.id] = ratings[f.id] ?? "important";
    }
    update({
      factorRatings: finalRatings,
      climatePref: keptWeather ? climatePref : undefined,
      culturePref: keptCulture ? culturePref : undefined,
    });
    onNext();
  }

  // Edge case: nothing was kept
  if (keptFactors.length === 0) {
    return (
      <div className="relo-refine">
        <motion.div
          className="relo-refine__empty"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relo-refine__empty-emoji">🤔</div>
          <h2 className="relo-refine__empty-title">You skipped everything</h2>
          <p className="relo-refine__empty-sub">
            Go back and keep at least one thing you care about — we need something to work with!
          </p>
          <button className="relo-refine__back-btn" onClick={onBack}>
            ← Back to swipe
          </button>
        </motion.div>
        <RefineStyles />
      </div>
    );
  }

  return (
    <div className="relo-refine">
      <motion.div
        className="relo-refine__inner"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="relo-refine__header">
          <div className="relo-refine__header-icon">🎛️</div>
          <h2 className="relo-refine__title">How much does each matter?</h2>
          <p className="relo-refine__subtitle">
            Set the intensity for the {keptFactors.length} factor
            {keptFactors.length !== 1 ? "s" : ""} you kept.
          </p>
        </div>

        {/* Factor intensity list */}
        <div className="relo-refine__factors">
          {keptFactors.map((factor, i) => (
            <motion.div
              key={factor.id}
              className="relo-refine__factor-row"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relo-refine__factor-label">
                <span className="relo-refine__factor-emoji" aria-hidden="true">{factor.emoji}</span>
                <span className="relo-refine__factor-name">{factor.label}</span>
                {FILTER_FACTOR_IDS.has(factor.id) && (
                  <span className="relo-refine__filter-badge" title="Filter factor — must-have applies a hard floor">
                    filter
                  </span>
                )}
              </div>
              <IntensityControl
                factorId={factor.id}
                value={ratings[factor.id] ?? "important"}
                isFilter={FILTER_FACTOR_IDS.has(factor.id)}
                onChange={handleRatingChange}
              />
            </motion.div>
          ))}
        </div>

        {/* Climate sub-question */}
        <AnimatePresence>
          {keptWeather && (
            <motion.div
              className="relo-refine__sub-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relo-refine__sub-header">
                <span className="relo-refine__sub-emoji">🌦️</span>
                <div>
                  <div className="relo-refine__sub-title">What climate do you want?</div>
                  <div className="relo-refine__sub-hint">Pick the one that feels most like you</div>
                </div>
              </div>
              <div className="relo-refine__climate-options">
                {CLIMATE_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.value}
                    className={`relo-refine__climate-btn ${climatePref === opt.value ? "is-selected" : ""}`}
                    onClick={() => setClimatePref(climatePref === opt.value ? undefined : opt.value)}
                    aria-pressed={climatePref === opt.value}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="relo-refine__climate-emoji" aria-hidden="true">{opt.emoji}</span>
                    <span className="relo-refine__climate-label">{opt.label}</span>
                    <span className="relo-refine__climate-desc">{opt.desc}</span>
                    {climatePref === opt.value && (
                      <motion.span
                        className="relo-refine__climate-check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Culture sub-question */}
        <AnimatePresence>
          {keptCulture && (
            <motion.div
              className="relo-refine__sub-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relo-refine__sub-header">
                <span className="relo-refine__sub-emoji">🌍</span>
                <div>
                  <div className="relo-refine__sub-title">Which vibe feels like home?</div>
                  <div className="relo-refine__sub-hint">Optional — skip if you&apos;re open to everything</div>
                </div>
              </div>
              <div className="relo-refine__culture-grid">
                {CULTURE_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.value}
                    className={`relo-refine__culture-btn ${culturePref === opt.value ? "is-selected" : ""}`}
                    onClick={() => setCulturePref(culturePref === opt.value ? undefined : opt.value)}
                    aria-pressed={culturePref === opt.value}
                    whileTap={{ scale: 0.93 }}
                  >
                    <span aria-hidden="true">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav */}
        <div className="relo-refine__nav">
          <button className="relo-refine__back-btn" onClick={onBack}>
            ← Back
          </button>
          <motion.button
            className="relo-refine__next-btn"
            onClick={handleContinue}
            whileHover={{ scale: 1.03, boxShadow: "0 16px 48px rgba(255,107,53,0.35)" }}
            whileTap={{ scale: 0.97 }}
          >
            See My Matches →
          </motion.button>
        </div>
      </motion.div>

      <RefineStyles />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function RefineStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

      .relo-refine {
        min-height: 100dvh;
        background: #fafaf8;
        font-family: 'DM Sans', system-ui, sans-serif;
        padding: 1.5rem 1.25rem 3rem;
        display: flex;
        flex-direction: column;
      }

      .relo-refine__inner {
        max-width: 460px;
        width: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      /* Header */
      .relo-refine__header {
        text-align: center;
        padding: 0.25rem 0 1.5rem;
      }

      .relo-refine__header-icon {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      .relo-refine__title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.85rem;
        font-weight: 700;
        color: #1a1040;
        margin: 0 0 0.4rem;
        letter-spacing: -0.02em;
      }

      .relo-refine__subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      }

      /* Factors list */
      .relo-refine__factors {
        display: flex;
        flex-direction: column;
        gap: 0;
        margin-bottom: 1.25rem;
      }

      .relo-refine__factor-row {
        padding: 1rem 0;
        border-bottom: 1px solid #f3f4f6;
      }

      .relo-refine__factor-row:last-child {
        border-bottom: none;
      }

      .relo-refine__factor-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.65rem;
      }

      .relo-refine__factor-emoji {
        font-size: 1.3rem;
        flex-shrink: 0;
      }

      .relo-refine__factor-name {
        font-size: 0.9rem;
        font-weight: 600;
        color: #1a1040;
      }

      .relo-refine__filter-badge {
        font-size: 0.62rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #f7931e;
        background: rgba(247,147,30,0.1);
        border: 1px solid rgba(247,147,30,0.2);
        padding: 0.1rem 0.45rem;
        border-radius: 100px;
        flex-shrink: 0;
      }

      /* Intensity segmented control — flex-wrap so the 3 buttons share a row
         and the optional filter-note wraps below them as a full-width item */
      .relo-refine__intensity {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: flex-start;
      }

      .relo-refine__intensity-btn {
        flex: 1;
        min-width: 0;
        padding: 0.5rem 0.5rem;
        border-radius: 10px;
        border: 1.5px solid #e5e7eb;
        background: #ffffff;
        font-size: 0.78rem;
        font-weight: 500;
        font-family: inherit;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.18s;
        white-space: nowrap;
        touch-action: manipulation;
        min-height: 44px;
        text-align: center;
      }

      .relo-refine__intensity-btn:hover:not(.is-active) {
        border-color: #ff6b35;
        color: #ff6b35;
        background: #fff7f4;
      }

      .relo-refine__intensity-btn.is-active {
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        border-color: transparent;
        color: #ffffff;
        font-weight: 700;
        box-shadow: 0 3px 12px rgba(255,107,53,0.3);
      }

      .relo-refine__intensity-btn--must-filter.is-active {
        background: linear-gradient(135deg, #f7931e, #e07010);
      }

      .relo-refine__filter-note {
        width: 100%;
        flex-basis: 100%;
        font-size: 0.72rem;
        color: #e07010;
        margin: 0;
        line-height: 1.4;
        overflow: hidden;
      }

      /* Sub-sections (climate / culture) */
      .relo-refine__sub-section {
        background: #ffffff;
        border: 1.5px solid #f3f4f6;
        border-radius: 16px;
        padding: 1.1rem 1rem 1.25rem;
        margin-bottom: 1rem;
        overflow: hidden;
      }

      .relo-refine__sub-header {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        margin-bottom: 0.85rem;
      }

      .relo-refine__sub-emoji {
        font-size: 1.5rem;
        flex-shrink: 0;
        margin-top: 0.05rem;
      }

      .relo-refine__sub-title {
        font-size: 0.92rem;
        font-weight: 600;
        color: #1a1040;
        margin-bottom: 0.1rem;
      }

      .relo-refine__sub-hint {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      /* Climate buttons */
      .relo-refine__climate-options {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .relo-refine__climate-btn {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.75rem 0.9rem;
        border: 1.5px solid #e5e7eb;
        border-radius: 12px;
        background: #fafaf8;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        transition: all 0.18s;
        position: relative;
        touch-action: manipulation;
        min-height: 44px;
      }

      .relo-refine__climate-btn:hover:not(.is-selected) {
        border-color: #ff6b35;
        background: #fff7f4;
      }

      .relo-refine__climate-btn.is-selected {
        border-color: #ff6b35;
        background: linear-gradient(135deg, rgba(255,107,53,0.06), rgba(247,147,30,0.04));
        box-shadow: 0 2px 12px rgba(255,107,53,0.12);
      }

      .relo-refine__climate-emoji {
        font-size: 1.3rem;
        flex-shrink: 0;
      }

      .relo-refine__climate-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1a1040;
        min-width: 44px;
      }

      .relo-refine__climate-desc {
        font-size: 0.75rem;
        color: #9ca3af;
        flex: 1;
      }

      .relo-refine__climate-check {
        position: absolute;
        right: 0.9rem;
        color: #ff6b35;
        font-weight: 700;
        font-size: 1rem;
      }

      /* Culture grid */
      .relo-refine__culture-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.4rem;
      }

      .relo-refine__culture-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        padding: 0.6rem 0.3rem;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: #fafaf8;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.18s;
        font-size: 0.7rem;
        color: #6b7280;
        font-weight: 500;
        text-align: center;
        touch-action: manipulation;
        min-height: 60px;
      }

      .relo-refine__culture-btn span:first-child {
        font-size: 1.3rem;
      }

      .relo-refine__culture-btn:hover:not(.is-selected) {
        border-color: #ff6b35;
        color: #ff6b35;
        background: #fff7f4;
      }

      .relo-refine__culture-btn.is-selected {
        border-color: #ff6b35;
        background: linear-gradient(135deg, rgba(255,107,53,0.1), rgba(247,147,30,0.07));
        color: #c44b1c;
        font-weight: 700;
        box-shadow: 0 2px 10px rgba(255,107,53,0.18);
      }

      /* Nav */
      .relo-refine__nav {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.25rem;
        padding-top: 0.5rem;
      }

      .relo-refine__back-btn {
        flex-shrink: 0;
        padding: 0.85rem 1.2rem;
        border: 1.5px solid #e5e7eb;
        border-radius: 100px;
        background: white;
        font-size: 0.875rem;
        font-family: inherit;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.15s;
        touch-action: manipulation;
      }

      .relo-refine__back-btn:hover {
        border-color: #9ca3af;
        color: #374151;
      }

      .relo-refine__next-btn {
        flex: 1;
        padding: 0.85rem 1.2rem;
        border-radius: 100px;
        border: none;
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        font-size: 0.9rem;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(255,107,53,0.3);
        transition: all 0.25s;
        touch-action: manipulation;
      }

      /* Empty state */
      .relo-refine__empty {
        max-width: 380px;
        width: 100%;
        margin: auto;
        background: white;
        border-radius: 24px;
        border: 1.5px solid #e5e7eb;
        padding: 2.5rem 2rem;
        text-align: center;
        box-shadow: 0 8px 40px rgba(0,0,0,0.06);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }

      .relo-refine__empty-emoji {
        font-size: 3rem;
      }

      .relo-refine__empty-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.6rem;
        font-weight: 700;
        color: #1a1040;
        margin: 0;
      }

      .relo-refine__empty-sub {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.55;
      }
    `}</style>
  );
}
