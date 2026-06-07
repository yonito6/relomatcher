"use client";

import { motion } from "framer-motion";

interface HookProps {
  onStart: () => void;
}

export default function Hook({ onStart }: HookProps) {
  return (
    <div className="relo-hook">
      {/* Animated background blobs */}
      <div className="relo-hook__bg" aria-hidden="true">
        <motion.div
          className="relo-hook__blob relo-hook__blob--1"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relo-hook__blob relo-hook__blob--2"
          animate={{ scale: [1, 1.2, 1], rotate: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="relo-hook__blob relo-hook__blob--3"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <motion.div
        className="relo-hook__content"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <motion.img
          src="/logo.png"
          alt="Relomatcher"
          className="relo-hook__logo"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Globe */}
        <motion.div
          className="relo-hook__globe"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          🌍
        </motion.div>

        {/* Badge */}
        <motion.div
          className="relo-hook__badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="relo-hook__badge-dot" />
          The dating app for your next country
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="relo-hook__headline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Swipe your way
          <br />
          <span className="relo-hook__headline-accent">to your next home.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          className="relo-hook__sub"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Answer a few fun questions. We&apos;ll match you with the countries that
          actually fit&nbsp;your life — like Tinder, but for relocation.
        </motion.p>

        {/* Social proof row */}
        <motion.div
          className="relo-hook__proof"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <span className="relo-hook__proof-avatars">🇮🇱🇺🇸🇬🇧🇦🇺🇨🇦</span>
          <span className="relo-hook__proof-text">
            Join explorers already matched
          </span>
        </motion.div>

        {/* CTA */}
        <motion.button
          className="relo-hook__cta"
          onClick={onStart}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.75, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.04, boxShadow: "0 20px 60px rgba(255,107,53,0.45)" }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="relo-hook__cta-icon">✈️</span>
          Find My Country Match
          <motion.span
            className="relo-hook__cta-arrow"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            →
          </motion.span>
        </motion.button>

        <motion.p
          className="relo-hook__disclaimer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Free · 2 minutes · No sign-up needed
        </motion.p>

        {/* Feature pills */}
        <motion.div
          className="relo-hook__pills"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          {["🌦️ Climate match", "💸 Tax optimised", "🛡️ Safety scored", "🎉 Vibe checked"].map(
            (pill, i) => (
              <motion.span
                key={pill}
                className="relo-hook__pill"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 + i * 0.08 }}
              >
                {pill}
              </motion.span>
            )
          )}
        </motion.div>
      </motion.div>

      <style>{`
        .relo-hook {
          position: relative;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: linear-gradient(145deg, #0f0c29 0%, #1a1040 40%, #24243e 100%);
          padding: 2rem 1.25rem;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .relo-hook__bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .relo-hook__blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
        }

        .relo-hook__blob--1 {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, #ff6b35, #f7931e);
          top: -80px;
          right: -80px;
        }

        .relo-hook__blob--2 {
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, #7b2ff7, #f107a3);
          bottom: -60px;
          left: -60px;
        }

        .relo-hook__blob--3 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, #00d2ff, #3a7bd5);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .relo-hook__content {
          position: relative;
          z-index: 1;
          max-width: 420px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .relo-hook__logo {
          width: 200px;
          max-width: 70%;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 6px 24px rgba(0, 0, 0, 0.35));
        }

        .relo-hook__globe {
          font-size: 4.5rem;
          line-height: 1;
          filter: drop-shadow(0 8px 32px rgba(255, 107, 53, 0.5));
        }

        .relo-hook__badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 100px;
          padding: 0.35rem 0.9rem;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          text-transform: uppercase;
        }

        .relo-hook__badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ff6b35;
          box-shadow: 0 0 8px #ff6b35;
          flex-shrink: 0;
          animation: relo-pulse 2s infinite;
        }

        @keyframes relo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.4); }
        }

        .relo-hook__headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.1rem, 7vw, 3rem);
          font-weight: 700;
          line-height: 1.15;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .relo-hook__headline-accent {
          background: linear-gradient(90deg, #ff6b35, #f7931e, #ffd700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .relo-hook__sub {
          font-size: 1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.65);
          margin: 0;
          max-width: 340px;
        }

        .relo-hook__proof {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .relo-hook__proof-avatars {
          font-size: 1.1rem;
          letter-spacing: -0.1em;
        }

        .relo-hook__proof-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        .relo-hook__cta {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd700 100%);
          color: #1a0f00;
          font-size: 1rem;
          font-weight: 700;
          font-family: 'DM Sans', system-ui, sans-serif;
          padding: 1rem 2rem;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          box-shadow: 0 12px 40px rgba(255, 107, 53, 0.35), 0 2px 0 rgba(255,255,255,0.2) inset;
          width: 100%;
          max-width: 320px;
          justify-content: center;
          letter-spacing: 0.01em;
          position: relative;
          overflow: hidden;
        }

        .relo-hook__cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
          border-radius: 100px;
        }

        .relo-hook__cta-icon {
          font-size: 1.1rem;
        }

        .relo-hook__cta-arrow {
          font-size: 1.1rem;
          display: inline-block;
        }

        .relo-hook__disclaimer {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.35);
          margin: -0.25rem 0 0;
        }

        .relo-hook__pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          justify-content: center;
          margin-top: 0.25rem;
        }

        .relo-hook__pill {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 100px;
          padding: 0.3rem 0.75rem;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 500;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
