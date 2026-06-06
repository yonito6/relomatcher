"use client";

// TODO(Task 11): full implementation — rich country card for swipe deck and results

import type { MatchResult } from "@/lib/scoring/types";

interface CountryCardProps {
  match: MatchResult;
  rank?: number;
  moonshot?: boolean;
}

export default function CountryCard({ match, rank, moonshot }: CountryCardProps) {
  return (
    <div className="relo-country-card">
      <div className="relo-country-card__rank">
        {moonshot ? "🌙" : rank != null ? `#${rank}` : null}
      </div>
      <div className="relo-country-card__body">
        <strong className="relo-country-card__name">{match.country.name}</strong>
        <span className="relo-country-card__fit">{Math.round(match.fit)}% fit</span>
        <span className="relo-country-card__tier">{match.tier}</span>
        {match.tradeoff && (
          <p className="relo-country-card__tradeoff">{match.tradeoff}</p>
        )}
      </div>
      <style>{`
        .relo-country-card {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          padding: 1rem 1.25rem;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .relo-country-card__rank {
          font-size: 1.2rem;
          min-width: 2rem;
          text-align: center;
          padding-top: 0.1rem;
        }
        .relo-country-card__body {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .relo-country-card__name { font-size: 0.95rem; font-weight: 700; color: #1a1040; }
        .relo-country-card__fit { font-size: 0.8rem; color: #ff6b35; font-weight: 600; }
        .relo-country-card__tier { font-size: 0.75rem; color: #9ca3af; text-transform: capitalize; }
        .relo-country-card__tradeoff { font-size: 0.78rem; color: #6b7280; margin: 0.25rem 0 0; line-height: 1.4; }
      `}</style>
    </div>
  );
}
