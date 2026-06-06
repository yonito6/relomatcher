"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizData } from "@/lib/types";
import type { QuizApiResponse } from "./Reveal";
import CountryCard from "./CountryCard";

interface ResultsProps {
  results: QuizApiResponse;
  profile: QuizData;
  onRestart: () => void;
}

export default function Results({ results, profile: _profile, onRestart }: ResultsProps) {
  const top = results.top ?? [];
  const moonshot = results.moonshot ?? null;

  const [realisticOnly, setRealisticOnly] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const filteredTop = realisticOnly
    ? top.filter((m) => m.tier === "easy" || m.tier === "doable")
    : top;
  const showMoonshot = !realisticOnly && moonshot != null;
  const realisticEmpty = realisticOnly && filteredTop.length === 0;

  // Build share URL
  function buildShareUrl(): string {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams();
    const slice = top.slice(0, 3);
    slice.forEach((m, i) => {
      params.set(`c${i + 1}`, encodeURIComponent(m.country.name));
      params.set(`s${i + 1}`, String((m.fit / 10).toFixed(1)));
    });
    return `${base}/api/share-story?${params.toString()}`;
  }

  async function handleShare() {
    const url = buildShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // user dismissed — no-op
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2500);
      } catch {
        setShareState("error");
        setTimeout(() => setShareState("idle"), 2500);
      }
    }
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? "Couldn't start checkout — please try again.");
      }
      window.location.href = body.url;
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong.");
      setCheckoutLoading(false);
    }
  }

  // Empty guard
  if (top.length === 0) {
    return (
      <div className="relo-results">
        <div className="relo-results__inner">
          <div className="relo-results__empty-state">
            <div className="relo-results__empty-icon">🌍</div>
            <h2 className="relo-results__empty-title">No matches found</h2>
            <p className="relo-results__empty-body">
              Your requirements are quite specific. Try relaxing a few must-haves and we&rsquo;ll find you somewhere great.
            </p>
            <button className="relo-results__restart" onClick={onRestart}>
              ↺ Start over
            </button>
          </div>
        </div>
        <ResultsStyles />
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 28 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.52, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    }),
  };

  return (
    <div className="relo-results">
      <div className="relo-results__inner">
        {/* Header */}
        <motion.div
          className="relo-results__header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="relo-results__eyebrow">Your relocation matches</p>
          <h2 className="relo-results__title">Your top {top.length > 1 ? `${top.length} countries` : "country"}</h2>
          <p className="relo-results__subtitle">
            Ranked by feasibility-adjusted fit — honest scores, real visa context.
          </p>
        </motion.div>

        {/* Relaxed filters banner */}
        {results.relaxedFilters && (
          <motion.div
            className="relo-results__relaxed-banner"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <span className="relo-results__relaxed-icon">ℹ️</span>
            <span>
              We loosened a couple of your must-haves to find these — nothing matched all of them perfectly.
            </span>
          </motion.div>
        )}

        {/* Realistic toggle */}
        <motion.div
          className="relo-results__toggle-row"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <label className="relo-results__toggle-label" htmlFor="realistic-toggle">
            Only realistic moves
          </label>
          <button
            id="realistic-toggle"
            role="switch"
            aria-pressed={realisticOnly}
            aria-label="Only realistic moves — filter to easy and doable tiers"
            className={`relo-results__toggle${realisticOnly ? " relo-results__toggle--on" : ""}`}
            onClick={() => setRealisticOnly((v) => !v)}
          >
            <span className="relo-results__toggle-thumb" />
          </button>
        </motion.div>

        {/* Cards list */}
        <div className="relo-results__cards">
          <AnimatePresence mode="popLayout">
            {realisticEmpty ? (
              <motion.div
                key="realistic-empty"
                className="relo-results__realistic-empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="relo-results__realistic-empty-icon">🌍</span>
                <p>
                  All your top matches are a stretch to move to — flip this off to see them.
                </p>
              </motion.div>
            ) : (
              filteredTop.map((m, i) => (
                <motion.div
                  key={m.country.code}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -12 }}
                  layout
                >
                  <CountryCard
                    match={m}
                    rank={top.indexOf(m) + 1}
                    moonshot={false}
                    defaultExpanded={i === 0}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Moonshot section */}
        {showMoonshot && (
          <motion.div
            className="relo-results__moonshot-section"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relo-results__moonshot-header">
              <span className="relo-results__moonshot-icon">🌙</span>
              <div>
                <div className="relo-results__moonshot-title">A bold moonshot</div>
                <div className="relo-results__moonshot-desc">
                  This one is a stretch — but if you can make it work, the lifestyle match is exceptional.
                </div>
              </div>
            </div>
            <CountryCard match={moonshot!} moonshot={true} defaultExpanded={false} />
          </motion.div>
        )}

        {/* Share button */}
        <motion.div
          className="relo-results__actions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.45 }}
        >
          <button
            className="relo-results__share-btn"
            onClick={handleShare}
            disabled={shareState === "copied"}
          >
            {shareState === "copied"
              ? "✓ Link copied!"
              : shareState === "error"
              ? "Couldn't copy — try again"
              : "↗ Share my results"}
          </button>
        </motion.div>

        {/* Unlock CTA */}
        <motion.div
          className="relo-results__cta-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relo-results__cta-card">
            <div className="relo-results__cta-badge">Deep report</div>
            <h3 className="relo-results__cta-title">
              Unlock your full relocation blueprint
            </h3>
            <p className="relo-results__cta-body">
              Real visa pathways, step-by-step tax strategy, banking setup, and a
              personalised action timeline — everything you need to actually move.
            </p>
            {checkoutError && (
              <p className="relo-results__cta-error">{checkoutError}</p>
            )}
            <button
              className="relo-results__cta-btn"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              aria-busy={checkoutLoading}
            >
              {checkoutLoading ? (
                <span className="relo-results__cta-spinner" aria-hidden="true" />
              ) : null}
              {checkoutLoading ? "Preparing your report…" : "Get my deep report →"}
            </button>
          </div>
        </motion.div>

        {/* Restart */}
        <motion.div
          className="relo-results__footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.65 }}
        >
          <button className="relo-results__restart" onClick={onRestart}>
            ↺ Start over
          </button>
        </motion.div>
      </div>
      <ResultsStyles />
    </div>
  );
}

function ResultsStyles() {
  return (
    <style>{`
      .relo-results {
        min-height: 100dvh;
        background: #fafaf8;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: calc(52px + 1.5rem) 1.25rem 3.5rem;
        font-family: 'DM Sans', system-ui, sans-serif;
        box-sizing: border-box;
      }
      .relo-results__inner {
        max-width: 480px;
        width: 100%;
      }

      /* Header */
      .relo-results__header {
        text-align: center;
        margin-bottom: 1.5rem;
      }
      .relo-results__eyebrow {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #ff6b35;
        margin: 0 0 0.4rem;
      }
      .relo-results__title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 2rem;
        font-weight: 700;
        color: #1a1040;
        margin: 0 0 0.5rem;
        line-height: 1.15;
      }
      .relo-results__subtitle {
        font-size: 0.85rem;
        color: #9ca3af;
        margin: 0;
        line-height: 1.5;
      }

      /* Relaxed filters banner */
      .relo-results__relaxed-banner {
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
        background: #fff8f0;
        border: 1.5px solid #fde4c5;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        font-size: 0.82rem;
        color: #7c4a00;
        line-height: 1.5;
        margin-bottom: 1.1rem;
      }
      .relo-results__relaxed-icon { flex-shrink: 0; }

      /* Toggle */
      .relo-results__toggle-row {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.6rem;
        margin-bottom: 1.1rem;
      }
      .relo-results__toggle-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        user-select: none;
      }
      .relo-results__toggle {
        position: relative;
        width: 44px;
        height: 26px;
        background: #e5e7eb;
        border: none;
        border-radius: 100px;
        cursor: pointer;
        transition: background 0.2s;
        flex-shrink: 0;
        min-height: 44px;
        min-width: 44px;
        display: flex;
        align-items: center;
        padding: 0 2px;
      }
      .relo-results__toggle--on {
        background: linear-gradient(135deg, #ff6b35, #f7931e);
      }
      .relo-results__toggle:focus-visible {
        outline: 2px solid #ff6b35;
        outline-offset: 2px;
      }
      .relo-results__toggle-thumb {
        position: absolute;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        left: 3px;
        transition: left 0.2s cubic-bezier(0.34,1.56,0.64,1);
      }
      .relo-results__toggle--on .relo-results__toggle-thumb {
        left: calc(100% - 23px);
      }

      /* Cards */
      .relo-results__cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }
      .relo-results__realistic-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 2.5rem 1.5rem;
        background: white;
        border: 1.5px dashed #e5e7eb;
        border-radius: 16px;
        text-align: center;
      }
      .relo-results__realistic-empty-icon { font-size: 2rem; }
      .relo-results__realistic-empty p {
        font-size: 0.88rem;
        color: #6b7280;
        line-height: 1.55;
        margin: 0;
      }

      /* Moonshot section */
      .relo-results__moonshot-section {
        margin-top: 1.75rem;
        padding-top: 1.25rem;
        border-top: 1.5px dashed rgba(255,107,53,0.25);
      }
      .relo-results__moonshot-header {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 0.9rem;
      }
      .relo-results__moonshot-icon { font-size: 1.6rem; flex-shrink: 0; margin-top: 0.1rem; }
      .relo-results__moonshot-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: #1a1040;
        margin-bottom: 0.2rem;
      }
      .relo-results__moonshot-desc {
        font-size: 0.78rem;
        color: #9ca3af;
        line-height: 1.45;
      }

      /* Share + actions */
      .relo-results__actions {
        margin-top: 1.5rem;
        display: flex;
        justify-content: center;
      }
      .relo-results__share-btn {
        background: transparent;
        border: 1.5px solid #e8e4f0;
        border-radius: 100px;
        padding: 0.7rem 1.5rem;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 0.85rem;
        font-weight: 600;
        color: #1a1040;
        cursor: pointer;
        min-height: 44px;
        transition: border-color 0.15s, color 0.15s;
      }
      .relo-results__share-btn:hover:not(:disabled) {
        border-color: #ff6b35;
        color: #ff6b35;
      }
      .relo-results__share-btn:disabled {
        color: #16a34a;
        border-color: #16a34a;
      }

      /* CTA card */
      .relo-results__cta-wrap {
        margin-top: 1.75rem;
      }
      .relo-results__cta-card {
        background: linear-gradient(135deg, #1a1040 0%, #24243e 100%);
        border-radius: 20px;
        padding: 1.5rem 1.35rem;
        color: white;
      }
      .relo-results__cta-badge {
        display: inline-block;
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 0.18rem 0.6rem;
        border-radius: 100px;
        margin-bottom: 0.75rem;
      }
      .relo-results__cta-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.3rem;
        font-weight: 700;
        color: white;
        margin: 0 0 0.65rem;
        line-height: 1.25;
      }
      .relo-results__cta-body {
        font-size: 0.82rem;
        color: rgba(255,255,255,0.65);
        line-height: 1.6;
        margin: 0 0 1.1rem;
      }
      .relo-results__cta-error {
        font-size: 0.78rem;
        color: #fca5a5;
        margin: 0 0 0.75rem;
        line-height: 1.4;
      }
      .relo-results__cta-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 0.9rem 1.5rem;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        min-height: 52px;
        transition: opacity 0.15s, transform 0.15s;
        letter-spacing: 0.01em;
      }
      .relo-results__cta-btn:hover:not(:disabled) {
        opacity: 0.92;
        transform: translateY(-1px);
      }
      .relo-results__cta-btn:disabled {
        opacity: 0.7;
        cursor: default;
      }
      .relo-results__cta-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.35);
        border-top-color: white;
        border-radius: 50%;
        animation: relo-spin 0.7s linear infinite;
      }
      @keyframes relo-spin {
        to { transform: rotate(360deg); }
      }

      /* Footer */
      .relo-results__footer {
        display: flex;
        justify-content: center;
        margin-top: 1.75rem;
      }
      .relo-results__restart {
        background: transparent;
        border: 1.5px solid #e5e7eb;
        border-radius: 100px;
        padding: 0.7rem 1.75rem;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 0.85rem;
        color: #9ca3af;
        cursor: pointer;
        min-height: 44px;
        transition: border-color 0.15s, color 0.15s;
      }
      .relo-results__restart:hover { border-color: #ff6b35; color: #ff6b35; }

      /* Empty state */
      .relo-results__empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 4rem 1.5rem 3rem;
        gap: 0.75rem;
      }
      .relo-results__empty-icon { font-size: 2.5rem; }
      .relo-results__empty-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1040;
        margin: 0;
      }
      .relo-results__empty-body {
        font-size: 0.88rem;
        color: #6b7280;
        line-height: 1.55;
        max-width: 300px;
        margin: 0;
      }
    `}</style>
  );
}
