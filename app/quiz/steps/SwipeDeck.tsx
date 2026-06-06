"use client";

// TODO(Task 10): full implementation — swipe deck for factor rating elicitation

import { motion } from "framer-motion";
import type { QuizData } from "@/lib/types";

interface SwipeDeckProps {
  data: QuizData;
  update: (values: Partial<QuizData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function SwipeDeck({ onNext, onBack }: SwipeDeckProps) {
  return (
    <div className="relo-placeholder">
      <motion.div
        className="relo-placeholder__card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relo-placeholder__icon">🃏</div>
        <h2 className="relo-placeholder__title">What matters to you?</h2>
        <p className="relo-placeholder__sub">
          Swipe to rate what you care about. Coming together…
        </p>
        <p className="relo-placeholder__note">Full swipe deck — Task 10</p>
        <div className="relo-placeholder__nav">
          <button className="relo-placeholder__back" onClick={onBack}>← Back</button>
          <button className="relo-placeholder__next" onClick={onNext}>Skip (placeholder) →</button>
        </div>
      </motion.div>
      <PlaceholderStyles />
    </div>
  );
}

function PlaceholderStyles() {
  return (
    <style>{`
      .relo-placeholder {
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fafaf8;
        padding: 2rem 1.25rem;
        font-family: 'DM Sans', system-ui, sans-serif;
      }
      .relo-placeholder__card {
        max-width: 400px;
        width: 100%;
        background: white;
        border-radius: 24px;
        border: 1.5px solid #e5e7eb;
        padding: 2.5rem 2rem;
        text-align: center;
        box-shadow: 0 8px 40px rgba(0,0,0,0.06);
      }
      .relo-placeholder__icon { font-size: 3rem; margin-bottom: 1rem; }
      .relo-placeholder__title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.6rem;
        font-weight: 700;
        color: #1a1040;
        margin: 0 0 0.5rem;
      }
      .relo-placeholder__sub {
        font-size: 0.9rem;
        color: #6b7280;
        margin: 0 0 0.75rem;
        line-height: 1.5;
      }
      .relo-placeholder__note {
        font-size: 0.7rem;
        color: #ff6b35;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin: 0 0 1.5rem;
      }
      .relo-placeholder__nav {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
      }
      .relo-placeholder__back {
        padding: 0.7rem 1.2rem;
        border: 1.5px solid #e5e7eb;
        border-radius: 100px;
        background: white;
        font-size: 0.875rem;
        color: #6b7280;
        cursor: pointer;
        font-family: inherit;
      }
      .relo-placeholder__next {
        padding: 0.7rem 1.4rem;
        border-radius: 100px;
        border: none;
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
      }
    `}</style>
  );
}
