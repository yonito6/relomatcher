"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizData } from "@/lib/types";
import type { MobilityRights } from "@/lib/scoring/types";
import { COUNTRIES } from "@/lib/countriesDb";

// All country names from the DB + common origins not in DB
const DB_NAMES = COUNTRIES.map((c) => c.name);
const EXTRA_ORIGINS = [
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia",
  "Azerbaijan", "Bangladesh", "Belarus", "Bolivia", "Bosnia", "Brazil",
  "Cambodia", "Cameroon", "Chile", "China", "Colombia", "Congo",
  "Croatia", "Cuba", "Ecuador", "Egypt", "El Salvador", "Ethiopia",
  "Ghana", "Guatemala", "Honduras", "Hungary", "India", "Indonesia",
  "Iran", "Iraq", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Lebanon",
  "Libya", "Lithuania", "Morocco", "Moldova", "Mongolia", "Myanmar",
  "Nepal", "Nicaragua", "Nigeria", "North Korea", "Oman",
  "Pakistan", "Palestine", "Panama", "Paraguay", "Peru", "Philippines",
  "Qatar", "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia",
  "Slovakia", "Slovenia", "Somalia", "South Africa", "Sri Lanka", "Sudan",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Tunisia", "Turkey",
  "Turkmenistan", "Uganda", "Ukraine", "Uruguay", "Uzbekistan",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];
const ALL_COUNTRIES = Array.from(new Set([...DB_NAMES, ...EXTRA_ORIGINS])).sort();

const CURRENCIES = [
  { code: "USD", label: "USD – US Dollar" },
  { code: "EUR", label: "EUR – Euro" },
  { code: "GBP", label: "GBP – British Pound" },
  { code: "ILS", label: "ILS – Israeli Shekel" },
  { code: "CAD", label: "CAD – Canadian Dollar" },
  { code: "AUD", label: "AUD – Australian Dollar" },
  { code: "CHF", label: "CHF – Swiss Franc" },
  { code: "JPY", label: "JPY – Japanese Yen" },
  { code: "AED", label: "AED – UAE Dirham" },
  { code: "SGD", label: "SGD – Singapore Dollar" },
  { code: "BRL", label: "BRL – Brazilian Real" },
  { code: "MXN", label: "MXN – Mexican Peso" },
  { code: "INR", label: "INR – Indian Rupee" },
  { code: "RON", label: "RON – Romanian Leu" },
  { code: "BGN", label: "BGN – Bulgarian Lev" },
  { code: "GEL", label: "GEL – Georgian Lari" },
  { code: "THB", label: "THB – Thai Baht" },
  { code: "TRY", label: "TRY – Turkish Lira" },
  { code: "PLN", label: "PLN – Polish Zloty" },
  { code: "HUF", label: "HUF – Hungarian Forint" },
];

const COMMON_LANGUAGES = [
  "English", "Spanish", "French", "Portuguese", "German", "Italian",
  "Hebrew", "Arabic", "Russian", "Mandarin", "Japanese", "Hindi",
  "Dutch", "Polish", "Turkish", "Korean", "Swedish", "Norwegian",
  "Danish", "Greek", "Romanian", "Hungarian", "Czech",
];

interface BasicsProps {
  data: QuizData;
  update: (values: Partial<QuizData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Basics({ data, update, onNext, onBack }: BasicsProps) {
  const [passportSearch, setPassportSearch] = useState(data.passportCountry ?? "");
  const [passportOpen, setPassportOpen] = useState(false);
  const [secondSearch, setSecondSearch] = useState(data.secondPassportCountry ?? "");
  const [secondOpen, setSecondOpen] = useState(false);
  const [showSecond, setShowSecond] = useState(!!data.secondPassportCountry);
  const [langInput, setLangInput] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const passportRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  const languages: string[] = data.languagesSpoken ?? [];
  const mobilityRights = data.mobilityRights;

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (passportRef.current && !passportRef.current.contains(e.target as Node)) {
        setPassportOpen(false);
      }
      if (secondRef.current && !secondRef.current.contains(e.target as Node)) {
        setSecondOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function filteredCountries(search: string) {
    if (!search.trim()) return ALL_COUNTRIES.slice(0, 8);
    const q = search.toLowerCase();
    return ALL_COUNTRIES.filter((c) => c.toLowerCase().startsWith(q))
      .concat(ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(q) && !c.toLowerCase().startsWith(q)))
      .slice(0, 8);
  }

  function selectPassport(country: string) {
    update({ passportCountry: country });
    setPassportSearch(country);
    setPassportOpen(false);
  }

  function selectSecond(country: string) {
    update({ secondPassportCountry: country });
    setSecondSearch(country);
    setSecondOpen(false);
  }

  function toggleLanguage(lang: string) {
    const current = languages;
    if (current.includes(lang)) {
      update({ languagesSpoken: current.filter((l) => l !== lang) });
    } else {
      update({ languagesSpoken: [...current, lang] });
    }
  }

  function addCustomLang() {
    const trimmed = langInput.trim();
    if (trimmed && !languages.includes(trimmed)) {
      update({ languagesSpoken: [...languages, trimmed] });
    }
    setLangInput("");
    setLangOpen(false);
  }

  function setMobility(val: MobilityRights | undefined) {
    update({ mobilityRights: mobilityRights === val ? undefined : val });
  }

  const canProceed = !!data.passportCountry && (languages.length > 0);

  const mobilityOptions: { value: MobilityRights; label: string; emoji: string; desc: string }[] = [
    { value: "eu_eea", label: "EU / EEA rights", emoji: "🇪🇺", desc: "I hold an EU or EEA passport or residency" },
    { value: "strong_passport", label: "US · UK · CA · AU", emoji: "✈️", desc: "I hold a US, UK, Canadian or Australian passport" },
    { value: "none", label: "None of these", emoji: "🪪", desc: "Skip this — I'll get matched on other factors" },
  ];

  return (
    <div className="relo-basics">
      <motion.div
        className="relo-basics__inner"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="relo-basics__header">
          <div className="relo-basics__icon">🪪</div>
          <h2 className="relo-basics__title">The quick essentials</h2>
          <p className="relo-basics__subtitle">
            Just enough to find countries that are actually realistic for you.
          </p>
        </div>

        {/* ── Passport ── */}
        <div className="relo-basics__section">
          <label className="relo-basics__label">
            Which passport do you travel on?
            <span className="relo-basics__required">*</span>
          </label>
          <div className="relo-basics__dropdown-wrap" ref={passportRef}>
            <div
              className={`relo-basics__dropdown-input ${passportOpen ? "is-open" : ""}`}
              onClick={() => setPassportOpen(true)}
            >
              <input
                type="text"
                placeholder="Search your country…"
                value={passportSearch}
                onChange={(e) => {
                  setPassportSearch(e.target.value);
                  update({ passportCountry: "" });
                  setPassportOpen(true);
                }}
                onFocus={() => setPassportOpen(true)}
                className="relo-basics__text-input"
              />
              <span className="relo-basics__dropdown-chevron">{passportOpen ? "▲" : "▼"}</span>
            </div>
            <AnimatePresence>
              {passportOpen && (
                <motion.ul
                  className="relo-basics__dropdown-list"
                  initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                  transition={{ duration: 0.18 }}
                  style={{ transformOrigin: "top" }}
                >
                  {filteredCountries(passportSearch).map((c) => (
                    <li key={c} className="relo-basics__dropdown-item" onMouseDown={() => selectPassport(c)}>
                      {c}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Second passport ── */}
        <div className="relo-basics__section">
          <div className="relo-basics__row-header">
            <label className="relo-basics__label">Second passport?</label>
            <button
              className="relo-basics__toggle-btn"
              onClick={() => {
                setShowSecond(!showSecond);
                if (showSecond) {
                  update({ secondPassportCountry: undefined });
                  setSecondSearch("");
                }
              }}
            >
              {showSecond ? "− Remove" : "+ Add"}
            </button>
          </div>
          <AnimatePresence>
            {showSecond && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
              >
                <div className="relo-basics__dropdown-wrap" ref={secondRef}>
                  <div
                    className={`relo-basics__dropdown-input ${secondOpen ? "is-open" : ""}`}
                    onClick={() => setSecondOpen(true)}
                  >
                    <input
                      type="text"
                      placeholder="Search second passport country…"
                      value={secondSearch}
                      onChange={(e) => {
                        setSecondSearch(e.target.value);
                        update({ secondPassportCountry: undefined });
                        setSecondOpen(true);
                      }}
                      onFocus={() => setSecondOpen(true)}
                      className="relo-basics__text-input"
                    />
                    <span className="relo-basics__dropdown-chevron">{secondOpen ? "▲" : "▼"}</span>
                  </div>
                  <AnimatePresence>
                    {secondOpen && (
                      <motion.ul
                        className="relo-basics__dropdown-list"
                        initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                        transition={{ duration: 0.18 }}
                        style={{ transformOrigin: "top" }}
                      >
                        {filteredCountries(secondSearch).map((c) => (
                          <li key={c} className="relo-basics__dropdown-item" onMouseDown={() => selectSecond(c)}>
                            {c}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!showSecond && (
            <p className="relo-basics__hint">Some destinations give a real edge to dual citizens.</p>
          )}
        </div>

        {/* ── Monthly income ── */}
        <div className="relo-basics__section">
          <label className="relo-basics__label">Monthly income (optional)</label>
          <p className="relo-basics__hint">Helps us assess tax efficiency and cost of living fit.</p>
          <div className="relo-basics__income-row">
            <input
              type="number"
              placeholder="e.g. 5000"
              className="relo-basics__income-input"
              value={data.monthlyIncome ?? ""}
              onChange={(e) => update({ monthlyIncome: e.target.value ? Number(e.target.value) : "" })}
            />
            <select
              className="relo-basics__currency-select"
              value={data.incomeCurrency ?? "USD"}
              onChange={(e) => update({ incomeCurrency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Languages ── */}
        <div className="relo-basics__section">
          <label className="relo-basics__label">
            Languages you speak
            <span className="relo-basics__required">*</span>
          </label>
          <p className="relo-basics__hint">Tap all that apply — shapes language ease scores.</p>

          <div className="relo-basics__lang-chips">
            {COMMON_LANGUAGES.map((lang) => (
              <motion.button
                key={lang}
                className={`relo-basics__chip ${languages.includes(lang) ? "is-selected" : ""}`}
                onClick={() => toggleLanguage(lang)}
                whileTap={{ scale: 0.92 }}
              >
                {languages.includes(lang) && <span className="relo-basics__chip-check">✓ </span>}
                {lang}
              </motion.button>
            ))}
            {/* Custom lang add */}
            <div className="relo-basics__chip-add-wrap">
              {langOpen ? (
                <motion.div
                  className="relo-basics__chip-add-input-row"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="Language…"
                    value={langInput}
                    onChange={(e) => setLangInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCustomLang(); if (e.key === "Escape") { setLangOpen(false); setLangInput(""); }}}
                    className="relo-basics__chip-add-input"
                  />
                  <button className="relo-basics__chip-add-btn" onClick={addCustomLang}>+</button>
                </motion.div>
              ) : (
                <button className="relo-basics__chip relo-basics__chip--add" onClick={() => setLangOpen(true)}>
                  + Other
                </button>
              )}
            </div>
          </div>

          {/* Custom language tags */}
          {languages.filter((l) => !COMMON_LANGUAGES.includes(l)).length > 0 && (
            <div className="relo-basics__custom-langs">
              {languages.filter((l) => !COMMON_LANGUAGES.includes(l)).map((lang) => (
                <span key={lang} className="relo-basics__custom-tag">
                  {lang}
                  <button onClick={() => toggleLanguage(lang)} className="relo-basics__custom-tag-remove">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Mobility rights ── */}
        <div className="relo-basics__section">
          <label className="relo-basics__label">Travel / residency perks? <span className="relo-basics__optional">(skip if unsure)</span></label>
          <p className="relo-basics__hint">Unlocks countries where entry is genuinely easy for you.</p>
          <div className="relo-basics__mobility-options">
            {mobilityOptions.map((opt) => (
              <motion.button
                key={opt.value}
                className={`relo-basics__mobility-btn ${mobilityRights === opt.value ? "is-selected" : ""}`}
                onClick={() => setMobility(opt.value)}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relo-basics__mobility-emoji">{opt.emoji}</span>
                <span className="relo-basics__mobility-content">
                  <strong>{opt.label}</strong>
                  <span>{opt.desc}</span>
                </span>
                {mobilityRights === opt.value && (
                  <motion.span
                    className="relo-basics__mobility-check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Nav ── */}
        <div className="relo-basics__nav">
          <button className="relo-basics__back-btn" onClick={onBack}>
            ← Back
          </button>
          <motion.button
            className={`relo-basics__next-btn ${canProceed ? "is-ready" : ""}`}
            onClick={canProceed ? onNext : undefined}
            whileHover={canProceed ? { scale: 1.03 } : {}}
            whileTap={canProceed ? { scale: 0.97 } : {}}
          >
            {canProceed ? "Next →" : "Passport + language needed"}
          </motion.button>
        </div>
      </motion.div>

      <style>{`
        .relo-basics {
          min-height: 100dvh;
          background: #fafaf8;
          font-family: 'DM Sans', system-ui, sans-serif;
          padding: 1.5rem 1.25rem 3rem;
          display: flex;
          flex-direction: column;
        }

        .relo-basics__inner {
          max-width: 460px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .relo-basics__header {
          text-align: center;
          padding: 0.5rem 0 1.5rem;
        }

        .relo-basics__icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .relo-basics__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.85rem;
          font-weight: 700;
          color: #1a1040;
          margin: 0 0 0.4rem;
          letter-spacing: -0.02em;
        }

        .relo-basics__subtitle {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .relo-basics__section {
          margin-bottom: 1.6rem;
        }

        .relo-basics__label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1a1040;
          margin-bottom: 0.3rem;
        }

        .relo-basics__required {
          color: #ff6b35;
          margin-left: 2px;
        }

        .relo-basics__optional {
          font-weight: 400;
          color: #9ca3af;
          font-size: 0.8rem;
        }

        .relo-basics__hint {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0 0 0.6rem;
          line-height: 1.4;
        }

        .relo-basics__row-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.3rem;
        }

        .relo-basics__row-header .relo-basics__label {
          margin-bottom: 0;
        }

        .relo-basics__toggle-btn {
          font-size: 0.75rem;
          font-weight: 600;
          color: #ff6b35;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }

        /* Dropdown */
        .relo-basics__dropdown-wrap {
          position: relative;
        }

        .relo-basics__dropdown-input {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 0 0.75rem;
          transition: border-color 0.18s;
          cursor: text;
        }

        .relo-basics__dropdown-input.is-open,
        .relo-basics__dropdown-input:focus-within {
          border-color: #ff6b35;
          box-shadow: 0 0 0 3px rgba(255,107,53,0.12);
        }

        .relo-basics__text-input {
          flex: 1;
          padding: 0.7rem 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.9rem;
          color: #1a1040;
          font-family: inherit;
        }

        .relo-basics__dropdown-chevron {
          font-size: 0.6rem;
          color: #9ca3af;
          pointer-events: none;
        }

        .relo-basics__dropdown-list {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          z-index: 100;
          list-style: none;
          padding: 0.25rem 0;
          margin: 0;
          max-height: 220px;
          overflow-y: auto;
        }

        .relo-basics__dropdown-item {
          padding: 0.55rem 0.85rem;
          font-size: 0.875rem;
          color: #1a1040;
          cursor: pointer;
          transition: background 0.12s;
        }

        .relo-basics__dropdown-item:hover {
          background: #fff7f4;
          color: #ff6b35;
        }

        /* Income */
        .relo-basics__income-row {
          display: flex;
          gap: 0.5rem;
        }

        .relo-basics__income-input {
          flex: 1;
          padding: 0.7rem 0.75rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.9rem;
          font-family: inherit;
          color: #1a1040;
          background: #ffffff;
          outline: none;
          transition: border-color 0.18s;
        }

        .relo-basics__income-input:focus {
          border-color: #ff6b35;
          box-shadow: 0 0 0 3px rgba(255,107,53,0.12);
        }

        .relo-basics__currency-select {
          padding: 0.7rem 0.6rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.85rem;
          font-family: inherit;
          color: #1a1040;
          background: #ffffff;
          outline: none;
          cursor: pointer;
          min-width: 72px;
          transition: border-color 0.18s;
        }

        .relo-basics__currency-select:focus {
          border-color: #ff6b35;
        }

        /* Language chips */
        .relo-basics__lang-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .relo-basics__chip {
          padding: 0.4rem 0.8rem;
          border-radius: 100px;
          border: 1.5px solid #e5e7eb;
          background: #ffffff;
          font-size: 0.8rem;
          font-family: inherit;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .relo-basics__chip.is-selected {
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          border-color: transparent;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 2px 12px rgba(255,107,53,0.3);
        }

        .relo-basics__chip:hover:not(.is-selected) {
          border-color: #ff6b35;
          color: #ff6b35;
        }

        .relo-basics__chip-check {
          font-size: 0.7rem;
        }

        .relo-basics__chip--add {
          border-style: dashed;
          color: #9ca3af;
        }

        .relo-basics__chip--add:hover {
          border-color: #ff6b35;
          color: #ff6b35;
        }

        .relo-basics__chip-add-wrap {
          display: flex;
          align-items: center;
        }

        .relo-basics__chip-add-input-row {
          display: flex;
          gap: 0.3rem;
        }

        .relo-basics__chip-add-input {
          padding: 0.4rem 0.7rem;
          border: 1.5px solid #ff6b35;
          border-radius: 100px;
          font-size: 0.8rem;
          font-family: inherit;
          color: #1a1040;
          outline: none;
          width: 120px;
        }

        .relo-basics__chip-add-btn {
          padding: 0.4rem 0.7rem;
          background: #ff6b35;
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: inherit;
        }

        .relo-basics__custom-langs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.5rem;
        }

        .relo-basics__custom-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.7rem;
          background: rgba(255,107,53,0.1);
          border: 1px solid rgba(255,107,53,0.25);
          border-radius: 100px;
          font-size: 0.78rem;
          color: #c44b1c;
          font-weight: 600;
        }

        .relo-basics__custom-tag-remove {
          background: none;
          border: none;
          color: #c44b1c;
          cursor: pointer;
          font-size: 1rem;
          padding: 0;
          line-height: 1;
          font-family: inherit;
        }

        /* Mobility */
        .relo-basics__mobility-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .relo-basics__mobility-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0.9rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: all 0.18s;
          position: relative;
        }

        .relo-basics__mobility-btn:hover:not(.is-selected) {
          border-color: #ff6b35;
          background: #fff7f4;
        }

        .relo-basics__mobility-btn.is-selected {
          border-color: #ff6b35;
          background: linear-gradient(135deg, rgba(255,107,53,0.06), rgba(247,147,30,0.06));
          box-shadow: 0 2px 12px rgba(255,107,53,0.15);
        }

        .relo-basics__mobility-emoji {
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .relo-basics__mobility-content {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .relo-basics__mobility-content strong {
          font-size: 0.875rem;
          color: #1a1040;
          font-weight: 600;
        }

        .relo-basics__mobility-content span {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .relo-basics__mobility-check {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #ff6b35;
          font-weight: 700;
          font-size: 1rem;
        }

        /* Nav */
        .relo-basics__nav {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
          padding-top: 1rem;
        }

        .relo-basics__back-btn {
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
        }

        .relo-basics__back-btn:hover {
          border-color: #9ca3af;
          color: #374151;
        }

        .relo-basics__next-btn {
          flex: 1;
          padding: 0.85rem 1.2rem;
          border-radius: 100px;
          border: none;
          background: #e5e7eb;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: inherit;
          color: #9ca3af;
          cursor: not-allowed;
          transition: all 0.25s;
        }

        .relo-basics__next-btn.is-ready {
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: white;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(255,107,53,0.3);
        }
      `}</style>
    </div>
  );
}
