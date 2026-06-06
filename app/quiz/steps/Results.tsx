"use client";

// TODO(Task 11): full implementation — top-3 results + moonshot cards

import { motion } from "framer-motion";
import type { QuizData } from "@/lib/types";
import type { MatchResult } from "@/lib/scoring/types";
import type { QuizApiResponse } from "./Reveal";

interface ResultsProps {
  results: QuizApiResponse;
  profile: QuizData;
  onRestart: () => void;
}

export default function Results({ results, profile: _profile, onRestart }: ResultsProps) {
  const top = results.top ?? [];
  const moonshot = results.moonshot;

  return (
    <div className="relo-results">
      <motion.div
        className="relo-results__inner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relo-results__header">
          <div className="relo-results__icon">🏆</div>
          <h2 className="relo-results__title">Your top matches</h2>
          <p className="relo-results__note">Full results cards — Task 11</p>
        </div>

        <div className="relo-results__list">
          {top.map((m: MatchResult, i: number) => (
            <div key={m.country.code} className="relo-results__item">
              <span className="relo-results__rank">#{i + 1}</span>
              <div className="relo-results__country">
                <strong>{m.country.name}</strong>
                <span>{Math.round(m.fit)}% fit · {m.tier}</span>
              </div>
            </div>
          ))}
          {moonshot && (
            <div className="relo-results__item relo-results__item--moonshot">
              <span className="relo-results__rank">🌙</span>
              <div className="relo-results__country">
                <strong>{moonshot.country.name}</strong>
                <span>Moonshot · {Math.round(moonshot.rawFit)}% raw fit</span>
              </div>
            </div>
          )}
          {top.length === 0 && (
            <p className="relo-results__empty">No matches found — try relaxing your requirements.</p>
          )}
        </div>

        <button className="relo-results__restart" onClick={onRestart}>
          ↺ Start over
        </button>
      </motion.div>
      <style>{`
        .relo-results {
          min-height: 100dvh;
          background: #fafaf8;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 2.5rem 1.25rem 3rem;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .relo-results__inner {
          max-width: 460px;
          width: 100%;
        }
        .relo-results__header { text-align: center; margin-bottom: 1.5rem; }
        .relo-results__icon { font-size: 3rem; }
        .relo-results__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1040;
          margin: 0.4rem 0 0.2rem;
        }
        .relo-results__note {
          font-size: 0.7rem;
          color: #ff6b35;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .relo-results__list { display: flex; flex-direction: column; gap: 0.75rem; }
        .relo-results__item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          padding: 1rem 1.1rem;
        }
        .relo-results__item--moonshot {
          border-color: rgba(255,107,53,0.3);
          background: rgba(255,107,53,0.04);
        }
        .relo-results__rank {
          font-size: 1.3rem;
          min-width: 2rem;
          text-align: center;
        }
        .relo-results__country { display: flex; flex-direction: column; gap: 0.15rem; }
        .relo-results__country strong { font-size: 0.95rem; color: #1a1040; }
        .relo-results__country span { font-size: 0.78rem; color: #9ca3af; }
        .relo-results__empty { text-align: center; color: #9ca3af; font-size: 0.9rem; padding: 2rem 0; }
        .relo-results__restart {
          display: block;
          margin: 2rem auto 0;
          padding: 0.8rem 2rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 100px;
          background: white;
          font-size: 0.875rem;
          color: #6b7280;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .relo-results__restart:hover { border-color: #ff6b35; color: #ff6b35; }
      `}</style>
    </div>
  );
}
