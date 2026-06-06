"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MatchResult } from "@/lib/scoring/types";
import type { Tier } from "@/lib/scoring/types";
import { FACTORS } from "@/lib/factors";

export interface CountryCardProps {
  match: MatchResult;
  rank?: number;
  moonshot?: boolean;
  defaultExpanded?: boolean;
}

const TIER_BADGE: Record<Tier, { emoji: string; label: string; color: string }> = {
  easy:      { emoji: "🟢", label: "Easy",      color: "#16a34a" },
  doable:    { emoji: "🟡", label: "Doable",    color: "#ca8a04" },
  hard:      { emoji: "🟠", label: "Hard",       color: "#ea580c" },
  very_hard: { emoji: "🔴", label: "Very hard",  color: "#dc2626" },
};

// SVG ring dimensions
const RING_R = 38;
const RING_CX = 50;
const RING_CY = 50;
const RING_STROKE = 7;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

interface RingProps {
  pct: number;        // 0–100
  isMoonshot: boolean;
  label: string;
}

function FitRing({ pct, isMoonshot, label }: RingProps) {
  const [animated, setAnimated] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Small delay so the card entrance animation plays first
    rafRef.current = requestAnimationFrame(() => {
      setTimeout(() => setAnimated(true), 180);
    });
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const offset = animated
    ? CIRCUMFERENCE * (1 - pct / 100)
    : CIRCUMFERENCE;

  return (
    <div className="relo-card__ring-wrap" aria-label={label}>
      <svg
        viewBox="0 0 100 100"
        className="relo-card__ring-svg"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke={isMoonshot ? "rgba(255,107,53,0.15)" : "rgba(26,16,64,0.08)"}
          strokeWidth={RING_STROKE}
        />
        {/* Fill */}
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            transformOrigin: "50% 50%",
            transform: "rotate(-90deg)",
            transition: animated ? "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)" : "none",
          }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor="#f7931e" />
          </linearGradient>
        </defs>
        <text
          x="50"
          y="47"
          textAnchor="middle"
          className="relo-card__ring-pct"
          fill="#1a1040"
          fontSize="20"
          fontWeight="700"
          fontFamily="'Playfair Display', Georgia, serif"
        >
          {pct}
        </text>
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="9"
          fontWeight="500"
          fontFamily="'DM Sans', system-ui, sans-serif"
        >
          {isMoonshot ? "raw fit" : "% fit"}
        </text>
      </svg>
    </div>
  );
}

export default function CountryCard({
  match,
  rank,
  moonshot = false,
  defaultExpanded = false,
}: CountryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const displayPct = Math.round(moonshot ? match.rawFit : match.fit);
  const badge = TIER_BADGE[match.tier];

  // Sort breakdown by score descending; map to FACTORS for label/emoji
  const factorMap = Object.fromEntries(FACTORS.map((f) => [f.id, f]));
  const breakdown = [...match.breakdown]
    .sort((a, b) => b.score - a.score)
    .map((b) => ({
      ...b,
      label: factorMap[b.id]?.label ?? b.id,
      emoji: factorMap[b.id]?.emoji ?? "•",
    }));

  const ringLabel = moonshot
    ? `${displayPct}% raw fit (moonshot)`
    : `${displayPct}% fit`;

  return (
    <article className={`relo-card${moonshot ? " relo-card--moonshot" : ""}${rank === 1 ? " relo-card--hero" : ""}`}>
      {/* Header row */}
      <div className="relo-card__header">
        <div className="relo-card__ring-col">
          <FitRing pct={displayPct} isMoonshot={moonshot} label={ringLabel} />
        </div>

        <div className="relo-card__meta">
          {/* Rank / moonshot label */}
          <div className="relo-card__rank-row">
            {moonshot ? (
              <span className="relo-card__moon-badge">🌙 Moonshot</span>
            ) : rank != null ? (
              <span className="relo-card__rank-chip">#{rank}</span>
            ) : null}
          </div>

          {/* Country name */}
          <h3 className="relo-card__name">{match.country.name}</h3>

          {/* Short note */}
          {match.country.shortNote && (
            <p className="relo-card__shortnote">{match.country.shortNote}</p>
          )}

          {/* Feasibility badge + reason */}
          <div className="relo-card__feasibility">
            <span
              className="relo-card__tier-badge"
              style={{ color: badge.color }}
            >
              {badge.emoji} {badge.label}
            </span>
            <span className="relo-card__reason">{match.reason}</span>
          </div>
        </div>
      </div>

      {/* Tradeoff */}
      {match.tradeoff && (
        <div className="relo-card__tradeoff">
          <span className="relo-card__tradeoff-icon" aria-hidden="true">⚠️</span>
          <span className="relo-card__tradeoff-label">Heads up: </span>
          {match.tradeoff}
        </div>
      )}

      {/* Optional warm blurb */}
      {match.note && (
        <p className="relo-card__note">{match.note}</p>
      )}

      {/* Collapsible breakdown */}
      {breakdown.length > 0 && (
        <div className="relo-card__breakdown-section">
          <button
            className="relo-card__expand-btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={`breakdown-${match.country.code}`}
          >
            <span>{expanded ? "Hide breakdown" : "Why this match?"}</span>
            <span
              className="relo-card__chevron"
              aria-hidden="true"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              ▾
            </span>
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                id={`breakdown-${match.country.code}`}
                className="relo-card__breakdown"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="relo-card__breakdown-inner">
                  {breakdown.map((b) => (
                    <div key={b.id} className="relo-card__factor-row">
                      <span className="relo-card__factor-label">
                        {b.emoji} {b.label}
                      </span>
                      <div className="relo-card__factor-bar-wrap">
                        <motion.div
                          className="relo-card__factor-bar"
                          initial={{ width: 0 }}
                          animate={{ width: `${(b.score / 10) * 100}%` }}
                          transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
                        />
                      </div>
                      <span className="relo-card__factor-score">
                        {b.score.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        .relo-card {
          background: #ffffff;
          border: 1.5px solid #e8e4f0;
          border-radius: 20px;
          padding: 1.25rem 1.25rem 0.75rem;
          font-family: 'DM Sans', system-ui, sans-serif;
          box-shadow: 0 2px 16px rgba(26,16,64,0.06), 0 1px 4px rgba(26,16,64,0.04);
          transition: box-shadow 0.2s;
          overflow: hidden;
        }
        .relo-card--hero {
          border-color: #f7c5a8;
          box-shadow: 0 4px 32px rgba(255,107,53,0.12), 0 1px 4px rgba(26,16,64,0.04);
        }
        .relo-card--moonshot {
          background: linear-gradient(135deg, #fff8f5 0%, #fff3ec 100%);
          border-color: rgba(255,107,53,0.28);
          box-shadow: 0 4px 24px rgba(255,107,53,0.10), 0 1px 4px rgba(26,16,64,0.04);
        }

        /* Header layout */
        .relo-card__header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .relo-card__ring-col {
          flex-shrink: 0;
        }
        .relo-card__ring-wrap {
          width: 80px;
          height: 80px;
        }
        .relo-card__ring-svg {
          width: 80px;
          height: 80px;
          display: block;
        }
        .relo-card__meta {
          flex: 1;
          min-width: 0;
          padding-top: 0.15rem;
        }

        /* Rank / moonshot */
        .relo-card__rank-row {
          margin-bottom: 0.2rem;
        }
        .relo-card__rank-chip {
          display: inline-block;
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: white;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 0.15rem 0.55rem;
          border-radius: 100px;
          text-transform: uppercase;
        }
        .relo-card__moon-badge {
          display: inline-block;
          background: rgba(255,107,53,0.12);
          color: #c2410c;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.15rem 0.6rem;
          border-radius: 100px;
          letter-spacing: 0.04em;
        }

        /* Name */
        .relo-card__name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1040;
          margin: 0 0 0.2rem;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Short note */
        .relo-card__shortnote {
          font-size: 0.78rem;
          color: #9ca3af;
          margin: 0 0 0.4rem;
          line-height: 1.35;
        }

        /* Feasibility */
        .relo-card__feasibility {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          margin-top: 0.1rem;
        }
        .relo-card__tier-badge {
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .relo-card__reason {
          font-size: 0.76rem;
          color: #6b7280;
          line-height: 1.4;
        }

        /* Tradeoff */
        .relo-card__tradeoff {
          margin: 0.9rem 0 0;
          padding: 0.6rem 0.85rem;
          background: rgba(234,88,12,0.06);
          border-left: 3px solid #f7931e;
          border-radius: 0 8px 8px 0;
          font-size: 0.8rem;
          color: #7c3a0c;
          line-height: 1.45;
        }
        .relo-card__tradeoff-icon { margin-right: 0.3rem; }
        .relo-card__tradeoff-label { font-weight: 700; }

        /* Note blurb */
        .relo-card__note {
          margin: 0.75rem 0 0;
          font-size: 0.82rem;
          color: #4b5563;
          line-height: 1.55;
          font-style: italic;
          padding: 0 0.1rem;
        }

        /* Breakdown */
        .relo-card__breakdown-section {
          margin-top: 0.9rem;
          border-top: 1px solid #f0edf8;
          padding-top: 0.5rem;
        }
        .relo-card__expand-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: none;
          border: none;
          padding: 0.45rem 0.1rem;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: #ff6b35;
          cursor: pointer;
          min-height: 44px;
          text-align: left;
          letter-spacing: 0.01em;
        }
        .relo-card__expand-btn:focus-visible {
          outline: 2px solid #ff6b35;
          outline-offset: 2px;
          border-radius: 6px;
        }
        .relo-card__chevron {
          font-size: 1rem;
          transition: transform 0.2s ease;
          display: inline-block;
          line-height: 1;
        }
        .relo-card__breakdown-inner {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          padding: 0.4rem 0.1rem 0.6rem;
        }
        .relo-card__factor-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .relo-card__factor-label {
          font-size: 0.76rem;
          color: #4b5563;
          min-width: 130px;
          flex-shrink: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .relo-card__factor-bar-wrap {
          flex: 1;
          height: 5px;
          background: rgba(26,16,64,0.07);
          border-radius: 100px;
          overflow: hidden;
        }
        .relo-card__factor-bar {
          height: 100%;
          background: linear-gradient(90deg, #ff6b35, #f7931e);
          border-radius: 100px;
        }
        .relo-card__factor-score {
          font-size: 0.72rem;
          font-weight: 700;
          color: #9ca3af;
          min-width: 2rem;
          text-align: right;
        }
      `}</style>
    </article>
  );
}
