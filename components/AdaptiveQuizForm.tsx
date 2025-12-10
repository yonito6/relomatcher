"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { QuizData, RelocationReasonId } from "@/lib/types";

type Props = {
  currentStep: number;
  totalSteps: number;
  data: QuizData;
  originCurrencyLabel: string;
  onUpdate: (values: Partial<QuizData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
};

// Subset of RelocationReasonId we actually show as “headline” reasons
type PrimaryReasonId = Extract<
  RelocationReasonId,
  | "lower_taxes"
  | "lower_cost_of_living"
  | "better_weather"
  | "career_growth"
  | "remote_work"
  | "dev_public_transport"
  | "expat_community"
  | "social_life"
>;

// Country list for autocomplete (use your full list)
const COUNTRY_OPTIONS = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Estonia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Latvia",
  "Lebanon",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Malta",
  "Mexico",
  "Moldova",
  "Monaco",
  "Montenegro",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Vietnam",
];

// High-level reasons shown as checkboxes – all valid RelocationReasonId
const REASON_LABELS: Record<PrimaryReasonId, string> = {
  lower_taxes: "Lower taxes",
  lower_cost_of_living: "Lower cost of living",
  better_weather: "Better weather",
  career_growth: "Better career & income opportunities",
  remote_work: "Remote-work friendly",
  dev_public_transport: "Better public transport & infrastructure",
  expat_community: "Strong expat / international community",
  social_life: "Better lifestyle & social life",
};

const WORK_SITUATION_OPTIONS = [
  "Remote employee",
  "Remote freelancer / contractor",
  "Business owner",
  "Local employee",
  "Student",
  "Not working yet",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "Portuguese",
  "French",
  "German",
  "Italian",
  "Dutch",
  "Hebrew",
  "Arabic",
  "Russian",
  "Chinese (Mandarin)",
  "Japanese",
  "Korean",
  "Other",
];

const AGE_RANGES = [
  "18–24",
  "25–29",
  "30–34",
  "35–39",
  "40–44",
  "45–49",
  "50+",
];

const FAMILY_STATUS_OPTIONS = [
  "Single",
  "In a relationship (no kids)",
  "Married / long-term (no kids)",
  "Family with kids",
];

const RELOCATING_WITH_OPTIONS = [
  "Just me",
  "Partner",
  "Partner + kids",
  "Kids only",
  "Friends / co-founders",
];

const incomeCurrencyFallbackLabel = "your currency";

const AdaptiveQuizForm: React.FC<Props> = ({
  currentStep,
  totalSteps,
  data,
  originCurrencyLabel,
  onUpdate,
  onNext,
  onBack,
  onSubmit,
}) => {
  const [countryQuery, setCountryQuery] = useState("");
  const [passportCountryQuery, setPassportCountryQuery] = useState("");
  const [secondPassportCountryQuery, setSecondPassportCountryQuery] =
    useState("");

  // Did the user click "See my results" already?
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // For collapsing the "My profile" after submit
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(false);

  const progressPercent = useMemo(
    () => Math.round((currentStep / totalSteps) * 100),
    [currentStep, totalSteps]
  );

  const incomeCurrencyLabel =
    originCurrencyLabel || incomeCurrencyFallbackLabel;

  // Detect "fresh start" (restart quiz) and re-enable navigation buttons
  useEffect(() => {
    const looksLikeInitial =
      currentStep === 1 &&
      !data.ageRange &&
      !data.currentCountry &&
      !data.familyStatus &&
      !data.passportCountry &&
      !data.monthlyIncome &&
      (!data.reasons || data.reasons.length === 0);

    if (looksLikeInitial && hasSubmitted) {
      setHasSubmitted(false);
      setIsProfileCollapsed(false);
    }
  }, [currentStep, data, hasSubmitted]);

  const handleCheckboxToggle = (reason: RelocationReasonId) => {
    const currentReasons = data.reasons || [];
    const exists = currentReasons.includes(reason);
    const nextReasons = exists
      ? currentReasons.filter((r) => r !== reason)
      : [...currentReasons, reason];

    onUpdate({ reasons: nextReasons });
  };

  const handleWorkSituationToggle = (option: string) => {
    const current = data.workSituation || [];
    const exists = current.includes(option);
    const next = exists
      ? current.filter((w) => w !== option)
      : [...current, option];
    onUpdate({ workSituation: next });
  };

  const handleLanguageToggle = (lang: string) => {
    const current = data.languagesSpoken || [];
    const exists = current.includes(lang);
    const next = exists
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    onUpdate({ languagesSpoken: next });
  };

  const handleSubmitClick = () => {
    // mark as submitted → hide Next/Back
    setHasSubmitted(true);
    // collapse profile after submit
    setIsProfileCollapsed(true);
    onSubmit();
  };

  const filteredCurrentCountryOptions = useMemo(() => {
    if (!countryQuery.trim()) return COUNTRY_OPTIONS.slice(0, 8);
    const q = countryQuery.toLowerCase();
    return COUNTRY_OPTIONS.filter((c) => c.toLowerCase().includes(q)).slice(
      0,
      12
    );
  }, [countryQuery]);

  const filteredPassportCountryOptions = useMemo(() => {
    if (!passportCountryQuery.trim()) return COUNTRY_OPTIONS.slice(0, 8);
    const q = passportCountryQuery.toLowerCase();
    return COUNTRY_OPTIONS.filter((c) => c.toLowerCase().includes(q)).slice(
      0,
      12
    );
  }, [passportCountryQuery]);

  const filteredSecondPassportCountryOptions = useMemo(() => {
    if (!secondPassportCountryQuery.trim()) return COUNTRY_OPTIONS.slice(0, 8);
    const q = secondPassportCountryQuery.toLowerCase();
    return COUNTRY_OPTIONS.filter((c) => c.toLowerCase().includes(q)).slice(
      0,
      12
    );
  }, [secondPassportCountryQuery]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Basic profile</h2>
              <p className="text-sm text-slate-500">
                This helps us match you with countries that fit your stage of
                life.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Age range
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={data.ageRange || ""}
                  onChange={(e) => onUpdate({ ageRange: e.target.value })}
                >
                  <option value="">Select your age range</option>
                  {AGE_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Family status
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={data.familyStatus || ""}
                  onChange={(e) => onUpdate({ familyStatus: e.target.value })}
                >
                  <option value="">Select your situation</option>
                  {FAMILY_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Where are you now?
              </h2>
              <p className="text-sm text-slate-500">
                We use this to estimate tax and cost-of-living impact.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Current country
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Start typing your country..."
                value={data.currentCountry || countryQuery}
                onChange={(e) => {
                  setCountryQuery(e.target.value);
                  onUpdate({ currentCountry: e.target.value });
                }}
              />
              {filteredCurrentCountryOptions.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
                  {filteredCurrentCountryOptions.map((country) => (
                    <button
                      key={country}
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                      onClick={() => {
                        onUpdate({ currentCountry: country });
                        setCountryQuery(country);
                      }}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Who is relocating?</h2>
              <p className="text-sm text-slate-500">
                Are you moving solo or with others?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Relocating with
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={data.relocatingWith || ""}
                  onChange={(e) =>
                    onUpdate({ relocatingWith: e.target.value })
                  }
                >
                  <option value="">Select an option</option>
                  {RELOCATING_WITH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Passports & citizenship
              </h2>
              <p className="text-sm text-slate-500">
                This affects visas, tax rules and where you can easily live or
                work.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Main passport
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Start typing your passport country..."
                  value={data.passportCountry || passportCountryQuery}
                  onChange={(e) => {
                    setPassportCountryQuery(e.target.value);
                    onUpdate({ passportCountry: e.target.value });
                  }}
                />
                {filteredPassportCountryOptions.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
                    {filteredPassportCountryOptions.map((country) => (
                      <button
                        key={country}
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => {
                          onUpdate({ passportCountry: country });
                          setPassportCountryQuery(country);
                        }}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Second passport (optional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="If you have a second passport"
                  value={
                    data.secondPassportCountry || secondPassportCountryQuery
                  }
                  onChange={(e) => {
                    setSecondPassportCountryQuery(e.target.value);
                    onUpdate({ secondPassportCountry: e.target.value });
                  }}
                />
                {filteredSecondPassportCountryOptions.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
                    {filteredSecondPassportCountryOptions.map((country) => (
                      <button
                        key={country}
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => {
                          onUpdate({ secondPassportCountry: country });
                          setSecondPassportCountryQuery(country);
                        }}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Work situation</h2>
              <p className="text-sm text-slate-500">
                How you earn money will heavily influence your best countries.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {WORK_SITUATION_OPTIONS.map((option) => {
                const selected = data.workSituation?.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleWorkSituationToggle(option)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                      selected
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{option}</span>
                    <span
                      className={`h-4 w-4 rounded-full border ${
                        selected
                          ? "border-sky-500 bg-sky-500"
                          : "border-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Monthly income</h2>
              <p className="text-sm text-slate-500">
                Rough ranges are enough – this is just to compare your budget
                across countries.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Approximate monthly net income (
                  {incomeCurrencyLabel})
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder={`Your monthly income in ${incomeCurrencyLabel}`}
                  value={data.monthlyIncome || ""}
                  onChange={(e) => onUpdate({ monthlyIncome: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Income currency
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="USD, EUR, ILS..."
                  value={data.incomeCurrency || ""}
                  onChange={(e) => onUpdate({ incomeCurrency: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Languages you speak
              </h2>
              <p className="text-sm text-slate-500">
                We prioritize places where you can function in daily life.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {LANGUAGE_OPTIONS.map((lang) => {
                const selected = data.languagesSpoken?.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageToggle(lang)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                      selected
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{lang}</span>
                    <span
                      className={`h-4 w-4 rounded-full border ${
                        selected
                          ? "border-sky-500 bg-sky-500"
                          : "border-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        );

      // Taxes & cost-of-living importance
      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Taxes & cost of living priority
              </h2>
              <p className="text-sm text-slate-500">
                Tell us how much these money factors should influence your
                matches (1 = not important, 10 = absolutely key).
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Lower taxes</label>
                  <span className="text-xs text-slate-500">
                    {data.taxImportance ?? 5}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={data.taxImportance ?? 5}
                  onChange={(e) =>
                    onUpdate({ taxImportance: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Not important</span>
                  <span>Very important</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">
                    Lower cost of living
                  </label>
                  <span className="text-xs text-slate-500">
                    {data.colImportance ?? 5}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={data.colImportance ?? 5}
                  onChange={(e) =>
                    onUpdate({ colImportance: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Not important</span>
                  <span>Very important</span>
                </div>
              </div>
            </div>
          </div>
        );

      // Climate & LGBT importance
      case 9:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Climate & lifestyle priorities
              </h2>
              <p className="text-sm text-slate-500">
                Let us know how much climate and LGBT-friendliness matter to
                you. We&apos;ll bake this directly into your scores.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">
                    Climate & weather match
                  </label>
                  <span className="text-xs text-slate-500">
                    {data.climateImportance ?? 5}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={data.climateImportance ?? 5}
                  onChange={(e) =>
                    onUpdate({ climateImportance: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>I&apos;m flexible</span>
                  <span>Climate is critical</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">
                    LGBT-friendliness importance
                  </label>
                  <span className="text-xs text-slate-500">
                    {data.lgbtImportance ?? 5}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={data.lgbtImportance ?? 5}
                  onChange={(e) =>
                    onUpdate({ lgbtImportance: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Don&apos;t really care</span>
                  <span>Must be very LGBT-friendly</span>
                </div>
              </div>
            </div>
          </div>
        );

      // Final step: headline reasons
      case 10:
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Why do you want to relocate?
              </h2>
              <p className="text-sm text-slate-500">
                Pick as many as you like – this shapes how we score each
                country.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(Object.keys(REASON_LABELS) as PrimaryReasonId[]).map(
                (reason) => {
                  const selected = data.reasons?.includes(
                    reason as RelocationReasonId
                  );
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() =>
                        handleCheckboxToggle(reason as RelocationReasonId)
                      }
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                        selected
                          ? "border-sky-500 bg-sky-50"
                          : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{REASON_LABELS[reason]}</span>
                      <span
                        className={`h-4 w-4 rounded-md border ${
                          selected
                            ? "border-sky-500 bg-sky-500"
                            : "border-slate-300"
                        }`}
                      />
                    </button>
                  );
                }
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      {/* Top: Progress + “My profile” header that we collapse after submit */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Where should I relocate? – Quiz
            </span>
            <span className="text-xs font-medium text-slate-500">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Collapsible profile toggle – auto-collapsed after submit */}
        <button
          type="button"
          onClick={() => setIsProfileCollapsed((v) => !v)}
          className="hidden rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-sky-400 hover:text-sky-600 md:inline-flex md:items-center md:gap-1.5"
        >
          <span>{isProfileCollapsed ? "Show my profile" : "Hide my profile"}</span>
          <span className="text-slate-400">
            {isProfileCollapsed ? "▾" : "▴"}
          </span>
        </button>
      </div>

      {/* Form content – we just hide the inner content if collapsed, not the whole card */}
      <div className={isProfileCollapsed ? "hidden" : ""}>{renderStep()}</div>

      {/* Navigation buttons – ONLY hidden after clicking "See my results" */}
      {!hasSubmitted && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={currentStep === 1}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:border-slate-300 hover:bg-slate-50"
          >
            ← Back
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitClick}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              See my results 🚀
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdaptiveQuizForm;
