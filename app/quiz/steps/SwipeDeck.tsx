"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import type { QuizData } from "@/lib/types";
import type { FactorId, FactorRatings } from "@/lib/scoring/types";
import { FACTORS } from "@/lib/factors";

// ─── Per-factor plain-language descriptions ───────────────────────────────────
const FACTOR_DESCRIPTIONS: Record<FactorId, string> = {
  weather:       "Sunshine, mild winters, the climate you actually enjoy",
  safety:        "Low crime, political stability, peace of mind on the street",
  lgbt:          "Open society, legal protections, welcoming communities",
  language:      "English widely spoken, expat life doesn't need a translator",
  jobs:          "Career growth, remote-friendly infrastructure, income upside",
  costOfLiving:  "Rent, food, and daily life that won't drain your savings",
  taxes:         "Keep more of what you earn — low income or flat-rate tax",
  healthcare:    "Quality hospitals, fast access, affordable without insurance nightmares",
  culture:       "Art, food, nightlife, architecture — the vibe that feeds your soul",
  social:        "Easy to make friends, expat scene, social life that clicks",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SwipeDeckProps {
  data: QuizData;
  update: (values: Partial<QuizData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type SwipeDecision = "kept" | "rejected";

// ─── Card variants (custom = "left" | "right" for exit direction) ─────────────

const cardVariants = {
  enter: { scale: 0.92, opacity: 0, y: 30 },
  center: { scale: 1, opacity: 1, y: 0 },
  exitRight: { x: 420, opacity: 0, rotate: 20, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
  exitLeft:  { x: -420, opacity: 0, rotate: -20, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};

// ─── Single draggable card ─────────────────────────────────────────────────────

interface CardProps {
  factorIndex: number;
  totalCards: number;
  stackDepth: number; // 0 = top, 1 = second, 2 = third
  exitDirection: "left" | "right";
  onSwipe: (direction: "left" | "right") => void;
}

function SwipeCard({ factorIndex, stackDepth, exitDirection, onSwipe }: CardProps) {
  const factor = FACTORS[factorIndex];
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  // Rotation tied to x offset: max ±18deg
  const rawRotate = useTransform(x, [-220, 0, 220], [-18, 0, 18]);
  const rotate = useSpring(rawRotate, { stiffness: 300, damping: 30 });

  // Opacity of the like/nope overlays
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0]);

  // Stack visual: cards behind are smaller and shifted down
  const stackScale = stackDepth === 0 ? 1 : stackDepth === 1 ? 0.94 : 0.88;
  const stackY = stackDepth === 0 ? 0 : stackDepth === 1 ? 14 : 26;
  const stackOpacity = stackDepth === 0 ? 1 : stackDepth === 1 ? 0.85 : 0.65;
  const stackZIndex = 10 - stackDepth;

  function handleDragEnd(_event: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    const threshold = 100;
    const velocityThreshold = 400;
    const { offset, velocity } = info;
    if (offset.x > threshold || velocity.x > velocityThreshold) {
      onSwipe("right");
    } else if (offset.x < -threshold || velocity.x < -velocityThreshold) {
      onSwipe("left");
    }
    isDragging.current = false;
  }

  if (stackDepth > 2) return null;

  // Background cards — not draggable, just visual stack
  if (stackDepth > 0) {
    return (
      <motion.div
        className="relo-swipe__card"
        style={{
          scale: stackScale,
          y: stackY,
          opacity: stackOpacity,
          zIndex: stackZIndex,
          position: "absolute",
          pointerEvents: "none",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="relo-swipe__card-emoji" aria-hidden="true">{factor.emoji}</div>
        <div className="relo-swipe__card-label">{factor.label}</div>
      </motion.div>
    );
  }

  // Top card — draggable
  return (
    <motion.div
      className="relo-swipe__card relo-swipe__card--top"
      style={{ x, rotate, zIndex: stackZIndex, position: "absolute" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragStart={() => { isDragging.current = true; }}
      onDragEnd={handleDragEnd}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit={exitDirection === "right" ? "exitRight" : "exitLeft"}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ cursor: "grab" }}
      whileDrag={{ cursor: "grabbing" }}
    >
      {/* NOPE stamp */}
      <motion.div
        className="relo-swipe__stamp relo-swipe__stamp--nope"
        style={{ opacity: nopeOpacity }}
        aria-hidden="true"
      >
        SKIP
      </motion.div>
      {/* KEEP stamp */}
      <motion.div
        className="relo-swipe__stamp relo-swipe__stamp--like"
        style={{ opacity: likeOpacity }}
        aria-hidden="true"
      >
        KEEP
      </motion.div>

      <div className="relo-swipe__card-emoji" aria-hidden="true">{factor.emoji}</div>
      <div className="relo-swipe__card-label">{factor.label}</div>
      <div className="relo-swipe__card-desc">{FACTOR_DESCRIPTIONS[factor.id]}</div>

      <div className="relo-swipe__card-hint">
        <span className="relo-swipe__hint-left">← skip</span>
        <span className="relo-swipe__hint-right">keep →</span>
      </div>
    </motion.div>
  );
}

// ─── Main SwipeDeck component ─────────────────────────────────────────────────

export default function SwipeDeck({ data, update, onNext, onBack }: SwipeDeckProps) {
  // Pre-seed from existing factorRatings if the user navigated back
  function buildInitialDecisions(): SwipeDecision[] {
    if (!data.factorRatings) return [];
    return FACTORS.map((f) => {
      const r = data.factorRatings?.[f.id];
      if (r === undefined) return undefined;
      return r === "dont_care" ? "rejected" : "kept";
    }).filter((d): d is SwipeDecision => d !== undefined);
  }

  const [decisions, setDecisions] = useState<SwipeDecision[]>(buildInitialDecisions);
  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);

  const currentIndex = decisions.length;
  const isDone = currentIndex >= FACTORS.length;
  const remaining = FACTORS.length - currentIndex;

  const handleSwipe = useCallback((direction: "left" | "right") => {
    if (isAnimating || isDone) return;
    setIsAnimating(true);
    setExitDirection(direction);
    const decision: SwipeDecision = direction === "right" ? "kept" : "rejected";
    const nextDecisions = [...decisions, decision];
    setDecisions(nextDecisions);

    // If last card, finalize
    if (nextDecisions.length >= FACTORS.length) {
      const ratings: FactorRatings = {};
      FACTORS.forEach((f, i) => {
        ratings[f.id] = nextDecisions[i] === "kept" ? "important" : "dont_care";
      });
      setTimeout(() => {
        update({ factorRatings: ratings });
        onNext();
      }, 420);
    } else {
      setTimeout(() => setIsAnimating(false), 380);
    }
  }, [decisions, isDone, isAnimating, update, onNext]);

  const handleUndo = useCallback(() => {
    if (decisions.length === 0 || isAnimating) return;
    setDecisions((prev) => prev.slice(0, -1));
  }, [decisions.length, isAnimating]);

  // Visible cards: current + up to 2 behind it
  const visibleCards = FACTORS.slice(currentIndex, currentIndex + 3);

  return (
    <div className="relo-swipe">
      {/* Header */}
      <motion.div
        className="relo-swipe__header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="relo-swipe__title">What matters to you?</h2>
        <p className="relo-swipe__subtitle">
          Swipe right to keep, left to skip. You can always refine after.
        </p>
      </motion.div>

      {/* Progress counter */}
      <motion.div
        className="relo-swipe__progress"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relo-swipe__progress-dots">
          {FACTORS.map((_, i) => (
            <motion.div
              key={i}
              className={`relo-swipe__dot ${
                i < currentIndex
                  ? decisions[i] === "kept"
                    ? "relo-swipe__dot--kept"
                    : "relo-swipe__dot--skipped"
                  : i === currentIndex
                  ? "relo-swipe__dot--active"
                  : "relo-swipe__dot--future"
              }`}
              animate={i === currentIndex ? { scale: [1, 1.35, 1] } : {}}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
            />
          ))}
        </div>
        <span className="relo-swipe__progress-label">
          {isDone ? "All done!" : `${currentIndex + 1} of ${FACTORS.length}`}
        </span>
      </motion.div>

      {/* Card deck arena */}
      <div className="relo-swipe__arena" aria-live="polite" aria-label={`Card ${currentIndex + 1} of ${FACTORS.length}: ${isDone ? "complete" : FACTORS[currentIndex]?.label}`}>
        <AnimatePresence custom={exitDirection} mode="popLayout">
          {!isDone && visibleCards.map((factor, stackIdx) => {
            const factorIndex = currentIndex + stackIdx;
            return (
              <SwipeCard
                key={factor.id}
                factorIndex={factorIndex}
                totalCards={FACTORS.length}
                stackDepth={stackIdx}
                exitDirection={exitDirection}
                onSwipe={handleSwipe}
              />
            );
          })}
          {isDone && (
            <motion.div
              key="done"
              className="relo-swipe__done-card"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="relo-swipe__done-emoji">🎉</div>
              <div className="relo-swipe__done-text">
                You kept <strong>{decisions.filter((d) => d === "kept").length}</strong> factor
                {decisions.filter((d) => d === "kept").length !== 1 ? "s" : ""}
              </div>
              <div className="relo-swipe__done-sub">Next you'll set how much each one matters</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <motion.div
        className="relo-swipe__actions"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {!isDone ? (
          <>
            <motion.button
              className="relo-swipe__action-btn relo-swipe__action-btn--nope"
              onClick={() => handleSwipe("left")}
              aria-label="Skip this factor"
              whileHover={{ scale: 1.08, boxShadow: "0 8px 28px rgba(107,114,128,0.25)" }}
              whileTap={{ scale: 0.93 }}
              disabled={isAnimating}
            >
              <span aria-hidden="true">✕</span>
            </motion.button>

            <button
              className="relo-swipe__undo-btn"
              onClick={handleUndo}
              disabled={decisions.length === 0 || isAnimating}
              aria-label="Undo last swipe"
            >
              ↩ undo
            </button>

            <motion.button
              className="relo-swipe__action-btn relo-swipe__action-btn--like"
              onClick={() => handleSwipe("right")}
              aria-label="Keep this factor"
              whileHover={{ scale: 1.08, boxShadow: "0 8px 28px rgba(255,107,53,0.4)" }}
              whileTap={{ scale: 0.93 }}
              disabled={isAnimating}
            >
              <span aria-hidden="true">♥</span>
            </motion.button>
          </>
        ) : (
          <motion.div
            className="relo-swipe__done-actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button className="relo-swipe__undo-btn" onClick={handleUndo} aria-label="Undo last swipe">
              ↩ undo last
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Remaining counter */}
      {!isDone && (
        <motion.p
          className="relo-swipe__remaining"
          key={remaining}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {remaining === 1 ? "Last one!" : `${remaining} left — you're almost there`}
        </motion.p>
      )}

      {/* Back nav */}
      <motion.button
        className="relo-swipe__back-btn"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ x: -2 }}
      >
        ← Back
      </motion.button>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .relo-swipe {
          min-height: 100dvh;
          background: #fafaf8;
          font-family: 'DM Sans', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1.25rem 2rem;
          overflow: hidden;
        }

        /* Header */
        .relo-swipe__header {
          text-align: center;
          margin-bottom: 1rem;
          max-width: 400px;
          width: 100%;
        }

        .relo-swipe__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.7rem, 5vw, 2.1rem);
          font-weight: 700;
          color: #1a1040;
          margin: 0 0 0.35rem;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .relo-swipe__subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        /* Progress dots */
        .relo-swipe__progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 1.25rem;
        }

        .relo-swipe__progress-dots {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .relo-swipe__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: background 0.25s, width 0.25s, border-radius 0.25s;
          flex-shrink: 0;
        }

        .relo-swipe__dot--future {
          background: #e5e7eb;
        }

        .relo-swipe__dot--active {
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          width: 20px;
          border-radius: 100px;
          box-shadow: 0 2px 8px rgba(255,107,53,0.4);
        }

        .relo-swipe__dot--kept {
          background: #ff6b35;
        }

        .relo-swipe__dot--skipped {
          background: #d1d5db;
        }

        .relo-swipe__progress-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #9ca3af;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Arena — stacking context */
        .relo-swipe__arena {
          position: relative;
          width: 100%;
          max-width: 360px;
          height: 340px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          flex-shrink: 0;
        }

        /* Card base */
        .relo-swipe__card {
          width: 100%;
          max-width: 320px;
          background: #ffffff;
          border-radius: 24px;
          border: 1.5px solid #f3f4f6;
          box-shadow:
            0 4px 24px rgba(26,16,64,0.08),
            0 1px 4px rgba(26,16,64,0.04);
          padding: 2.5rem 2rem 1.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          user-select: none;
          touch-action: pan-y;
          will-change: transform;
          position: absolute;
        }

        .relo-swipe__card--top {
          cursor: grab;
        }

        .relo-swipe__card--top:active {
          cursor: grabbing;
        }

        /* Stamp overlays */
        .relo-swipe__stamp {
          position: absolute;
          top: 1.25rem;
          padding: 0.3rem 0.75rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          pointer-events: none;
        }

        .relo-swipe__stamp--nope {
          left: 1.25rem;
          color: #6b7280;
          border: 3px solid #6b7280;
          transform: rotate(-12deg);
          transform-origin: left center;
        }

        .relo-swipe__stamp--like {
          right: 1.25rem;
          color: #ff6b35;
          border: 3px solid #ff6b35;
          transform: rotate(12deg);
          transform-origin: right center;
        }

        .relo-swipe__card-emoji {
          font-size: 4rem;
          line-height: 1;
          margin-bottom: 1rem;
          filter: drop-shadow(0 4px 12px rgba(255,107,53,0.2));
          pointer-events: none;
        }

        .relo-swipe__card-label {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.45rem;
          font-weight: 700;
          color: #1a1040;
          margin-bottom: 0.6rem;
          letter-spacing: -0.01em;
          pointer-events: none;
        }

        .relo-swipe__card-desc {
          font-size: 0.83rem;
          color: #6b7280;
          line-height: 1.55;
          max-width: 240px;
          margin-bottom: 1.25rem;
          pointer-events: none;
        }

        .relo-swipe__card-hint {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-size: 0.68rem;
          color: #d1d5db;
          font-weight: 500;
          letter-spacing: 0.02em;
          pointer-events: none;
        }

        .relo-swipe__hint-left { color: #d1d5db; }
        .relo-swipe__hint-right { color: #fcd3c0; }

        /* Done card */
        .relo-swipe__done-card {
          width: 100%;
          max-width: 320px;
          background: linear-gradient(135deg, rgba(255,107,53,0.07), rgba(247,147,30,0.05));
          border: 1.5px solid rgba(255,107,53,0.2);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .relo-swipe__done-emoji {
          font-size: 3.5rem;
          margin-bottom: 0.25rem;
        }

        .relo-swipe__done-text {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.3rem;
          color: #1a1040;
          font-weight: 700;
        }

        .relo-swipe__done-text strong {
          color: #ff6b35;
        }

        .relo-swipe__done-sub {
          font-size: 0.82rem;
          color: #6b7280;
          line-height: 1.5;
        }

        /* Action buttons */
        .relo-swipe__actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .relo-swipe__action-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid;
          background: white;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
          flex-shrink: 0;
          touch-action: manipulation;
        }

        .relo-swipe__action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .relo-swipe__action-btn--nope {
          border-color: #d1d5db;
          color: #6b7280;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .relo-swipe__action-btn--like {
          border-color: #ff6b35;
          color: #ff6b35;
          box-shadow: 0 2px 16px rgba(255,107,53,0.2);
        }

        .relo-swipe__undo-btn {
          background: none;
          border: none;
          font-size: 0.75rem;
          font-family: inherit;
          color: #9ca3af;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          border-radius: 100px;
          transition: color 0.15s;
          touch-action: manipulation;
        }

        .relo-swipe__undo-btn:hover:not(:disabled) {
          color: #6b7280;
        }

        .relo-swipe__undo-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .relo-swipe__done-actions {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Remaining label */
        .relo-swipe__remaining {
          font-size: 0.78rem;
          color: #9ca3af;
          font-weight: 500;
          text-align: center;
          margin: 0 0 1rem;
        }

        /* Back button */
        .relo-swipe__back-btn {
          background: none;
          border: none;
          font-size: 0.85rem;
          font-family: inherit;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          border-radius: 100px;
          transition: color 0.15s;
          touch-action: manipulation;
          margin-top: auto;
        }

        .relo-swipe__back-btn:hover {
          color: #6b7280;
        }

        /* Responsive tweak for small viewports */
        @media (max-height: 680px) {
          .relo-swipe__arena {
            height: 300px;
          }
          .relo-swipe__card {
            padding: 1.75rem 1.5rem 1.25rem;
          }
          .relo-swipe__card-emoji {
            font-size: 3rem;
            margin-bottom: 0.75rem;
          }
          .relo-swipe__card-desc {
            margin-bottom: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
