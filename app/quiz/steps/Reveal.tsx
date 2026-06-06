"use client";

// TODO(Task 11): full implementation — suspenseful "calculating your matches" reveal with POST to /api/quiz

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { QuizData } from "@/lib/types";
import type { MatchResult } from "@/lib/scoring/types";

export type QuizApiResponse = {
  ok: boolean;
  message: string;
  top: MatchResult[];
  moonshot: MatchResult | null;
  disqualified: MatchResult[];
  relaxedFilters: boolean;
  receivedData: QuizData;
};

interface RevealProps {
  data: QuizData;
  onComplete: (results: QuizApiResponse) => void;
  onBack: () => void;
}

export default function Reveal({ data, onComplete, onBack }: RevealProps) {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dots, setDots] = useState(".");

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(id);
  }, []);

  // POST to API on mount
  useEffect(() => {
    let cancelled = false;

    async function submit() {
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed: ${res.status}`);
        }
        const json = (await res.json()) as QuizApiResponse;
        if (!cancelled) onComplete(json);
      } catch (err: unknown) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        }
      }
    }

    submit();
    return () => { cancelled = true; };
  }, [data, onComplete]);

  const messages = [
    "Scanning 40+ countries…",
    "Weighing your priorities…",
    "Checking feasibility…",
    "Running tax math…",
    "Finding your top 3…",
  ];

  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % messages.length), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relo-reveal">
      <motion.div
        className="relo-reveal__inner"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {status === "loading" ? (
          <>
            <motion.div
              className="relo-reveal__globe"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              🌍
            </motion.div>
            <h2 className="relo-reveal__title">Your matches are loading{dots}</h2>
            <motion.p
              key={msgIdx}
              className="relo-reveal__msg"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {messages[msgIdx]}
            </motion.p>
            <p className="relo-reveal__note">Full reveal animation — Task 11</p>
          </>
        ) : (
          <>
            <div className="relo-reveal__globe">⚠️</div>
            <h2 className="relo-reveal__title">Something went wrong</h2>
            <p className="relo-reveal__msg">{errorMsg}</p>
            <button className="relo-reveal__back" onClick={onBack}>← Go back</button>
          </>
        )}
      </motion.div>
      <style>{`
        .relo-reveal {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #0f0c29 0%, #1a1040 40%, #24243e 100%);
          padding: 2rem 1.25rem;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .relo-reveal__inner {
          text-align: center;
          max-width: 320px;
          width: 100%;
        }
        .relo-reveal__globe {
          font-size: 3.5rem;
          margin-bottom: 1.25rem;
          display: block;
        }
        .relo-reveal__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.75rem;
        }
        .relo-reveal__msg {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.6);
          margin: 0 0 0.75rem;
          min-height: 1.4em;
        }
        .relo-reveal__note {
          font-size: 0.7rem;
          color: #ff6b35;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-top: 1rem;
        }
        .relo-reveal__back {
          margin-top: 1.5rem;
          padding: 0.7rem 1.4rem;
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 100px;
          background: transparent;
          color: rgba(255,255,255,0.7);
          font-size: 0.875rem;
          cursor: pointer;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
