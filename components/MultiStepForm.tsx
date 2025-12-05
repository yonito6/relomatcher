"use client";

import React from "react";
import type { QuizData } from "@/lib/types";

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

// Full-ish country list for autocomplete
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
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Republic of the Congo",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
  "Other / not listed",
];

// Widely used languages in relocation hotspots
const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "Portuguese",
  "French",
  "German",
  "Italian",
  "Dutch",
  "Greek",
  "Romanian",
  "Bulgarian",
  "Polish",
  "Czech",
  "Hungarian",
  "Russian",
  "Ukrainian",
  "Turkish",
  "Arabic",
  "Hebrew",
  "Thai",
  "Chinese (Mandarin)",
  "Japanese",
  "Korean",
];

function AdaptiveQuizForm({
  currentStep,
  totalSteps,
  data,
  originCurrencyLabel,
  onUpdate,
  onNext,
  onBack,
  onSubmit,
}: Props) {
  const reasons = data.reasons || [];
  const languagesSpoken = data.languagesSpoken || [];

  const isLastStep = currentStep === totalSteps - 1;

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLastStep) {
      onSubmit();
    } else {
      onNext();
    }
  }

  // --- helper: reasons ---
  const hasReason = (key: string) => reasons.includes(key);

  const toggleReason = (key: string) => {
    const next = hasReason(key)
      ? reasons.filter((r) => r !== key)
      : [...reasons, key];
    onUpdate({ reasons: next });
  };

  const setReason = (key: string, enabled: boolean) => {
    const without = reasons.filter((r) => r !== key);
    onUpdate({ reasons: enabled ? [...without, key] : without });
  };

  // Languages multi-select
  const toggleLanguage = (lang: string) => {
    const exists = languagesSpoken.includes(lang);
    const next = exists
      ? languagesSpoken.filter((l) => l !== lang)
      : [...languagesSpoken, lang];
    onUpdate({ languagesSpoken: next });
  };

  // --- validation for specific steps (for now: LGBT step must have a choice) ---
  const isStepValid = (step: number): boolean => {
    if (step === 6) {
      // Step 6 = LGBT step – require one of these flags
      return (
        hasReason("lgbt_full_rights") ||
        hasReason("lgbt_friendly") ||
        hasReason("lgbt_dont_care")
      );
    }
    // You can add more validations later if you want.
    return true;
  };

  const stepValid = isStepValid(currentStep);

  let stepContent: React.ReactNode = null;

  //
  // STEP 0 – Basics: current country + age
  //
  if (currentStep === 0) {
    stepContent = (
      <SectionCard
        emoji="🧭"
        title="Who are we matching?"
        subtitle="We’ll start with simple basics so we can compare countries to your current situation."
      >
        {/* Current country with autocomplete */}
        <div className="space-y-1">
          <Label>Where are you currently based?</Label>
          <input
            list="country-list"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            placeholder="Start typing your country…"
            value={data.currentCountry || ""}
            onChange={(e) =>
              onUpdate({
                currentCountry: e.target.value,
              })
            }
          />
          <datalist id="country-list">
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <p className="text-[11px] text-slate-500">
            We’ll compare options to the costs, climate and lifestyle of{" "}
            {data.currentCountry || "your current country"}.
          </p>
        </div>

        {/* Age */}
        <div className="space-y-1">
          <Label>How old are you?</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["18–24", "25–29", "30–34", "35–39", "40–49", "50+"].map((range) => (
              <ChoiceCard
                key={range}
                label={range}
                selected={data.ageRange === range}
                onClick={() => onUpdate({ ageRange: range })}
              />
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 1 – Languages
  //
  else if (currentStep === 1) {
    const langMustHave = hasReason("language_must_have");
    const langNice = hasReason("language_nice_to_have");
    const langFlexible = hasReason("language_flexible");

    stepContent = (
      <SectionCard
        emoji="🗣️"
        title="Languages you can live in"
        subtitle="Places where you can work, make friends and handle bureaucracy in a language you’re comfortable with will always feel easier."
      >
        <div className="space-y-1">
          <Label>Which languages can you comfortably live in day-to-day?</Label>
          <p className="text-[11px] text-slate-500 mb-1">
            Pick all the languages where you&apos;d be okay doing things like work,
            friendships and paperwork.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGE_OPTIONS.map((lang) => (
              <ChoiceCard
                key={lang}
                label={lang}
                selected={languagesSpoken.includes(lang)}
                onClick={() => toggleLanguage(lang)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>How important is it that your new country uses one of these?</Label>
          <p className="text-[11px] text-slate-500 mb-1">
            For example, if you picked English or Spanish – do you need one of them to be
            widely used in daily life?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ChoiceCard
              label="It’s a must that I can rely on one of my languages"
              selected={langMustHave}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        !["language_must_have", "language_nice_to_have", "language_flexible"].includes(
                          r
                        )
                    ),
                    "language_must_have",
                  ],
                });
              }}
            />
            <ChoiceCard
              label="It’s a nice bonus, but not critical"
              selected={langNice}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        !["language_must_have", "language_nice_to_have", "language_flexible"].includes(
                          r
                        )
                    ),
                    "language_nice_to_have",
                  ],
                });
              }}
            />
            <DoesntMatterCard
              selected={langFlexible}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        !["language_must_have", "language_nice_to_have", "language_flexible"].includes(
                          r
                        )
                    ),
                    "language_flexible",
                  ],
                });
              }}
            >
              I don&apos;t really mind – I can adapt if needed
            </DoesntMatterCard>
          </div>
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 2 – Money priorities (tax + cost of living)
  //
  else if (currentStep === 2) {
    const caresTaxes = hasReason("lower_taxes");
    const caresCOL = hasReason("lower_cost_of_living");
    const taxMust = hasReason("tax_must_have");
    const colMust = hasReason("cost_of_living_must_have");

    stepContent = (
      <SectionCard
        emoji="💸"
        title="Money priorities"
        subtitle="We’re not asking how much you earn – only how much you care about lowering taxes and monthly costs."
      >
        {/* Taxes */}
        <div className="space-y-1">
          <Label>Are lower taxes an important part of why you’d move?</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ChoiceCard
              label="Yes – paying less tax is a big reason"
              selected={caresTaxes}
              onClick={() => setReason("lower_taxes", !caresTaxes)}
            />
            <DoesntMatterCard
              selected={!caresTaxes}
              onClick={() => {
                setReason("lower_taxes", false);
                setReason("tax_must_have", false);
              }}
            >
              I don&apos;t really mind the tax level
            </DoesntMatterCard>
          </div>

          {caresTaxes && (
            <div className="mt-2">
              <p className="text-[11px] text-slate-500 mb-1">
                Is having clearly lower taxes a must-have, or would you trade that for
                other things (like vibe or LGBT rights)?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  label="It’s a must-have for me"
                  selected={taxMust}
                  onClick={() => setReason("tax_must_have", true)}
                />
                <ChoiceCard
                  label="It’s important, but I can trade it off"
                  selected={caresTaxes && !taxMust}
                  onClick={() => setReason("tax_must_have", false)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cost of living */}
        <div className="space-y-1">
          <Label>
            How important is a lower cost of living than{" "}
            {data.currentCountry || "your current country"}?
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ChoiceCard
              label="Very important – I want cheaper day-to-day life"
              selected={caresCOL}
              onClick={() => setReason("lower_cost_of_living", !caresCOL)}
            />
            <DoesntMatterCard
              selected={!caresCOL}
              onClick={() => {
                setReason("lower_cost_of_living", false);
                setReason("cost_of_living_must_have", false);
              }}
            >
              I don&apos;t really mind, other things matter more
            </DoesntMatterCard>
          </div>

          {caresCOL && (
            <div className="mt-2">
              <p className="text-[11px] text-slate-500 mb-1">
                Is having noticeably lower living costs a hard requirement?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  label="Yes, it’s a must-have"
                  selected={colMust}
                  onClick={() => setReason("cost_of_living_must_have", true)}
                />
                <ChoiceCard
                  label="No, it’s just a nice bonus"
                  selected={caresCOL && !colMust}
                  onClick={() => setReason("cost_of_living_must_have", false)}
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 3 – Safety & stability (gate + follow-ups)
  //
  else if (currentStep === 3) {
    const safetyOverall = hasReason("safety_stability_priority");
    const safetyPersonal = hasReason("personal_safety");
    const safetyPolitical = hasReason("political_stability");
    const safetyCorruption = hasReason("low_corruption");

    stepContent = (
      <SectionCard
        emoji="🛡️"
        title="Safety & stability"
        subtitle="Let’s break this into things people actually worry about: street safety, politics and how serious institutions feel."
      >
        {/* Gate: do you care at all? */}
        <div className="space-y-1">
          <Label>Is safety & stability a priority for your move?</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ChoiceCard
              label="Yes – I care about safety & stability"
              selected={safetyOverall}
              onClick={() => setReason("safety_stability_priority", true)}
            />
            <DoesntMatterCard
              selected={!safetyOverall}
              onClick={() => {
                setReason("safety_stability_priority", false);
                setReason("personal_safety", false);
                setReason("political_stability", false);
                setReason("low_corruption", false);
              }}
            >
              I&apos;m relatively flexible about this
            </DoesntMatterCard>
          </div>
        </div>

        {safetyOverall && (
          <div className="space-y-3 pt-1">
            {/* Personal safety */}
            <div className="space-y-1">
              <Label>Personal safety – day-to-day feeling in the streets</Label>
              <p className="text-[11px] text-slate-500 mb-1">
                Think: walking home at night, using public transport, how tense or calm it feels.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  label="I strongly prefer low street crime & a calm day-to-day feeling"
                  selected={safetyPersonal}
                  onClick={() => setReason("personal_safety", !safetyPersonal)}
                />
                <DoesntMatterCard
                  selected={!safetyPersonal}
                  onClick={() => setReason("personal_safety", false)}
                >
                  I&apos;m okay with a bit more edge if other things are great
                </DoesntMatterCard>
              </div>
            </div>

            {/* Political stability */}
            <div className="space-y-1">
              <Label>Political stability</Label>
              <p className="text-[11px] text-slate-500 mb-1">
                Elections, protests, government changes – do you care how calm this is?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  label="I prefer relatively stable politics and low drama"
                  selected={safetyPolitical}
                  onClick={() =>
                    setReason("political_stability", !safetyPolitical)
                  }
                />
                <DoesntMatterCard
                  selected={!safetyPolitical}
                  onClick={() => setReason("political_stability", false)}
                >
                  I can live with political noise
                </DoesntMatterCard>
              </div>
            </div>

            {/* Institutions / corruption */}
            <div className="space-y-1">
              <Label>Institutions & corruption</Label>
              <p className="text-[11px] text-slate-500 mb-1">
                How much do you care about things like bureaucracy, fairness and how
                &quot;serious&quot; the system feels?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  label="I want relatively low corruption and functioning institutions"
                  selected={safetyCorruption}
                  onClick={() => setReason("low_corruption", !safetyCorruption)}
                />
                <DoesntMatterCard
                  selected={!safetyCorruption}
                  onClick={() => setReason("low_corruption", false)}
                >
                  I accept some chaos if the benefits are good
                </DoesntMatterCard>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    );
  }
  //
  // STEP 4 – Climate
  //
  else if (currentStep === 4) {
    const prefersCold = hasReason("prefer_cold_climate");
    const prefersMild = hasReason("prefer_mild_climate");
    const prefersWarm = hasReason("prefer_warm_climate");
    const climateMust = hasReason("climate_must_have");
    const noClimatePref =
      !prefersCold && !prefersMild && !prefersWarm && !climateMust;

    stepContent = (
      <SectionCard
        emoji="🌦️"
        title="Climate & weather"
        subtitle="We’ll treat your climate preference seriously – especially if you mark it as a must-have."
      >
        <div className="space-y-1">
          <Label>What kind of climate do you prefer?</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ChoiceCard
              label="❄️ Mostly cold – real winters, jackets, cozy apartments"
              selected={prefersCold}
              onClick={() => {
                setReason("prefer_cold_climate", !prefersCold);
                setReason("better_weather", true);
              }}
            />
            <ChoiceCard
              label="🌤️ Mild mix – real seasons but not too extreme"
              selected={prefersMild}
              onClick={() => {
                setReason("prefer_mild_climate", !prefersMild);
                setReason("better_weather", true);
              }}
            />
            <ChoiceCard
              label="☀️ Mostly warm – lots of sun, light winters or none"
              selected={prefersWarm}
              onClick={() => {
                setReason("prefer_warm_climate", !prefersWarm);
                setReason("better_weather", true);
              }}
            />
            <DoesntMatterCard
              selected={noClimatePref}
              onClick={() => {
                setReason("prefer_cold_climate", false);
                setReason("prefer_mild_climate", false);
                setReason("prefer_warm_climate", false);
                setReason("better_weather", false);
                setReason("climate_must_have", false);
              }}
            >
              I don&apos;t really mind the climate
            </DoesntMatterCard>
          </div>
        </div>

        {(prefersCold || prefersMild || prefersWarm) && (
          <div className="space-y-1">
            <Label>Is this climate preference a must-have?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ChoiceCard
                label="Yes – I don’t want the opposite climate"
                selected={climateMust}
                onClick={() => setReason("climate_must_have", true)}
              />
              <ChoiceCard
                label="Not strictly – I can trade it off"
                selected={!climateMust}
                onClick={() => setReason("climate_must_have", false)}
              />
            </div>
          </div>
        )}
      </SectionCard>
    );
  }
  //
  // STEP 5 – Healthcare
  //
  else if (currentStep === 5) {
    const strongPublic = hasReason("healthcare_strong_public");
    const mixedSystem = hasReason("healthcare_mixed");
    const mostlyPrivate = hasReason("healthcare_private");
    const healthcareNoPref = hasReason("healthcare_not_important");

    stepContent = (
      <SectionCard
        emoji="⚕️"
        title="Healthcare system"
        subtitle="We’re talking about how the system feels in practice – not tiny legal details."
      >
        <div className="space-y-1">
          <Label>What kind of healthcare system sounds best to you?</Label>
          <p className="text-[11px] text-slate-500 mb-1">
            Sorted from more comprehensive to more out-of-pocket.
          </p>
          <div className="grid grid-cols-1 gap-2">
            <ChoiceCard
              label="🇪🇺 Strong public system with low out-of-pocket costs (e.g. Western Europe, Canada)"
              selected={strongPublic}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        ![
                          "healthcare_strong_public",
                          "healthcare_mixed",
                          "healthcare_private",
                          "healthcare_not_important",
                        ].includes(r)
                    ),
                    "healthcare_strong_public",
                  ],
                });
              }}
            />
            <ChoiceCard
              label="🩺 Mixed system – mandatory insurance / public base + strong private options"
              selected={mixedSystem}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        ![
                          "healthcare_strong_public",
                          "healthcare_mixed",
                          "healthcare_private",
                          "healthcare_not_important",
                        ].includes(r)
                    ),
                    "healthcare_mixed",
                  ],
                });
              }}
            />
            <ChoiceCard
              label="💊 Mostly private – good quality but more out-of-pocket / insurance-driven"
              selected={mostlyPrivate}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        ![
                          "healthcare_strong_public",
                          "healthcare_mixed",
                          "healthcare_private",
                          "healthcare_not_important",
                        ].includes(r)
                    ),
                    "healthcare_private",
                  ],
                });
              }}
            />
            <DoesntMatterCard
              selected={healthcareNoPref}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        ![
                          "healthcare_strong_public",
                          "healthcare_mixed",
                          "healthcare_private",
                          "healthcare_not_important",
                        ].includes(r)
                    ),
                    "healthcare_not_important",
                  ],
                });
              }}
            >
              I don&apos;t really mind – other things matter more
            </DoesntMatterCard>
          </div>
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 6 – LGBTQ+ rights (must pick one)
  //
  else if (currentStep === 6) {
    const lgbtFull = hasReason("lgbt_full_rights");
    const lgbtFriendly = hasReason("lgbt_friendly");
    const lgbtDontCare = hasReason("lgbt_dont_care");

    stepContent = (
      <SectionCard
        emoji="🏳️‍🌈"
        title="LGBTQ+ rights"
        subtitle="We’ll take this very seriously if you say you care – especially for countries where the legal situation is risky."
      >
        <div className="space-y-1">
          <Label>How much do LGBTQ+ rights matter for your day-to-day life?</Label>
          <div className="grid grid-cols-1 gap-2">
            <ChoiceCard
              label="It matters to me: I want full, modern LGBT protections"
              selected={lgbtFull}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        !["lgbt_full_rights", "lgbt_friendly", "lgbt_dont_care"].includes(
                          r
                        )
                    ),
                    "better_lgbtq",
                    "lgbt_full_rights",
                  ],
                });
              }}
            />
            <ChoiceCard
              label="It matters to me: clearly LGBT-friendly is enough, I’m a bit flexible"
              selected={lgbtFriendly}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        !["lgbt_full_rights", "lgbt_friendly", "lgbt_dont_care"].includes(
                          r
                        )
                    ),
                    "better_lgbtq",
                    "lgbt_friendly",
                  ],
                });
              }}
            />
            <DoesntMatterCard
              selected={lgbtDontCare}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        !["lgbt_full_rights", "lgbt_friendly", "lgbt_dont_care", "better_lgbtq"].includes(
                          r
                        )
                    ),
                    "lgbt_dont_care",
                  ],
                });
              }}
            >
              It doesn&apos;t really matter to me
            </DoesntMatterCard>
          </div>
          {!stepValid && (
            <p className="mt-1 text-[11px] text-rose-500">
              Please choose one of the options above before continuing.
            </p>
          )}
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 7 – Culture
  //
  else if (currentStep === 7) {
    const cultureNorth = hasReason("culture_northern_europe");
    const cultureSouth = hasReason("culture_mediterranean");
    const cultureNA = hasReason("culture_north_america");
    const cultureLatAm = hasReason("culture_latin_america");
    const cultureAsia = hasReason("culture_asia");
    const cultureNoPref = hasReason("culture_not_important");
    const cultureMust = hasReason("culture_must_have");
    const pickedSome =
      cultureNorth || cultureSouth || cultureNA || cultureLatAm || cultureAsia;

    stepContent = (
      <SectionCard
        emoji="🎭"
        title="Culture & vibe"
        subtitle="This is about the everyday ‘feel’ of the place – how people behave, social norms, and rhythm of life."
      >
        <div className="space-y-1">
          <Label>What kind of culture are you most drawn to?</Label>
          <p className="text-[11px] text-slate-500 mb-1">
            You can pick more than one if you like a mix.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ChoiceCard
              label="🇩🇰 Northern European – organized, low-drama, more reserved"
              selected={cultureNorth}
              onClick={() => setReason("culture_northern_europe", !cultureNorth)}
            />
            <ChoiceCard
              label="🇮🇹 Mediterranean / Southern European – warm, social, late evenings"
              selected={cultureSouth}
              onClick={() => setReason("culture_mediterranean", !cultureSouth)}
            />
            <ChoiceCard
              label="🇺🇸 North American big-city vibe (US / Canada style)"
              selected={cultureNA}
              onClick={() => setReason("culture_north_america", !cultureNA)}
            />
            <ChoiceCard
              label="🇲🇽 Latin American – lively, loud, super social"
              selected={cultureLatAm}
              onClick={() => setReason("culture_latin_america", !cultureLatAm)}
            />
            <ChoiceCard
              label="🇹🇭 / 🇯🇵 / 🇰🇷 Asian mix – modern but with strong traditions"
              selected={cultureAsia}
              onClick={() => setReason("culture_asia", !cultureAsia)}
            />
            <DoesntMatterCard
              selected={cultureNoPref}
              onClick={() => {
                setReason("culture_northern_europe", false);
                setReason("culture_mediterranean", false);
                setReason("culture_north_america", false);
                setReason("culture_latin_america", false);
                setReason("culture_asia", false);
                setReason("culture_not_important", true);
                setReason("culture_must_have", false);
              }}
            >
              I don&apos;t really mind the cultural style
            </DoesntMatterCard>
          </div>
        </div>

        {pickedSome && (
          <div className="space-y-1">
            <Label>Is this cultural vibe a must-have?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ChoiceCard
                label="Yes – I want to strongly connect to the culture"
                selected={cultureMust}
                onClick={() => setReason("culture_must_have", true)}
              />
              <ChoiceCard
                label="Not strictly – I’m open as long as other things fit"
                selected={!cultureMust}
                onClick={() => setReason("culture_must_have", false)}
              />
            </div>
          </div>
        )}
      </SectionCard>
    );
  }
  //
  // STEP 8 – Development level broken into smaller questions
  //
  else if (currentStep === 8) {
    const devHigh = hasReason("development_high");
    const devMid = hasReason("development_mid");
    const devDev = hasReason("development_developing");
    const devNoPref = hasReason("development_not_important");

    stepContent = (
      <SectionCard
        emoji="🏙️"
        title="How ‘finished’ do you want things to feel?"
        subtitle="Think infrastructure, services, and how smooth or ‘rough around the edges’ life feels."
      >
        {/* Infrastructure polish */}
        <div className="space-y-1">
          <Label>Infrastructure & services</Label>
          <p className="text-[11px] text-slate-500 mb-1">
            How polished do you want things like public transport, bureaucracy and
            services to feel?
          </p>
          <div className="grid grid-cols-1 gap-2">
            <ChoiceCard
              label="I prefer highly developed countries – everything mostly works and is predictable"
              selected={devHigh}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        ![
                          "development_high",
                          "development_mid",
                          "development_developing",
                          "development_not_important",
                        ].includes(r)
                    ),
                    "development_high",
                  ],
                });
              }}
            />
            <ChoiceCard
              label="I’m happy with solid but imperfect infrastructure – a few rough edges are fine"
              selected={devMid}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        ![
                          "development_high",
                          "development_mid",
                          "development_developing",
                          "development_not_important",
                        ].includes(r)
                    ),
                    "development_mid",
                  ],
                });
              }}
            />
          </div>
        </div>

        {/* Openness to developing-country tradeoffs */}
        <div className="space-y-1">
          <Label>
            Are you open to more &quot;developing&quot; vibes if the upside is great
            (taxes, weather, lifestyle)?
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ChoiceCard
              label="Yes – I’m okay with more chaos if the upside is strong"
              selected={devDev}
              onClick={() => {
                setReason("development_developing", !devDev);
                setReason("development_not_important", false);
              }}
            />
            <DoesntMatterCard
              selected={devNoPref}
              onClick={() => {
                onUpdate({
                  reasons: [
                    ...reasons.filter(
                      (r) =>
                        ![
                          "development_high",
                          "development_mid",
                          "development_developing",
                          "development_not_important",
                        ].includes(r)
                    ),
                    "development_not_important",
                  ],
                });
              }}
            >
              I don&apos;t really mind – I care more about other things
            </DoesntMatterCard>
          </div>
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 9 – Review profile
  //
  else if (currentStep === 9) {
    stepContent = (
      <SectionCard
        emoji="📋"
        title="Quick profile check"
        subtitle="Here’s a simple summary of what you told us so far. If something looks off, go back and tweak it before we match you."
      >
        <div className="space-y-3 text-[11px] text-slate-700">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold mb-1">
              Basics
            </p>
            <ul className="space-y-0.5">
              <li>
                <span className="font-semibold">Current country:</span>{" "}
                {data.currentCountry || "Not specified"}
              </li>
              <li>
                <span className="font-semibold">Age:</span>{" "}
                {data.ageRange || "Not specified"}
              </li>
              <li>
                <span className="font-semibold">Languages you can live in:</span>{" "}
                {languagesSpoken.length > 0
                  ? languagesSpoken.join(", ")
                  : "Not specified"}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold mb-1">
              Priorities we’ll optimize for
            </p>
            <ul className="space-y-0.5">
              {hasReason("lower_taxes") && (
                <li>• You care about lower taxes{hasReason("tax_must_have") ? " (must-have)" : ""}.</li>
              )}
              {hasReason("lower_cost_of_living") && (
                <li>
                  • You want a lower cost of living
                  {hasReason("cost_of_living_must_have") ? " (must-have)" : ""}.
                </li>
              )}
              {(hasReason("prefer_cold_climate") ||
                hasReason("prefer_mild_climate") ||
                hasReason("prefer_warm_climate")) && (
                <li>
                  • You have a preferred climate
                  {hasReason("climate_must_have") ? " (must-have)" : ""}.
                </li>
              )}
              {hasReason("better_lgbtq") && (
                <li>• LGBTQ+ rights are important to you.</li>
              )}
              {hasReason("language_must_have") && (
                <li>• You want to rely on one of your languages day-to-day.</li>
              )}
              {hasReason("safety_stability_priority") && (
                <li>• Safety & stability are a priority for you.</li>
              )}
              {hasReason("healthcare_strong_public") && (
                <li>• You prefer a strong public healthcare system.</li>
              )}
              {hasReason("healthcare_mixed") && (
                <li>• You like a mixed public/private healthcare model.</li>
              )}
              {hasReason("healthcare_private") && (
                <li>• You&apos;re okay with mostly private healthcare.</li>
              )}
              {hasReason("culture_must_have") && (
                <li>• You want to strongly connect with the local culture.</li>
              )}
              {hasReason("development_high") && (
                <li>• You prefer highly developed, predictable infrastructure.</li>
              )}
              {hasReason("development_developing") && (
                <li>• You&apos;re open to more developing-country vibes for upside.</li>
              )}
              {/* fallback if nothing */}
              {reasons.length === 0 && (
                <li>• You haven&apos;t flagged any strong priorities yet.</li>
              )}
            </ul>
          </div>

          <p className="text-[11px] text-slate-500">
            If this looks good, hit <span className="font-semibold">See my matches</span>.
            We&apos;ll avoid suggesting your current country as a match and focus on new
            places that fit this profile.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] space-y-4"
    >
      {stepContent}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 0}
          className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 text-slate-700 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:bg-slate-50 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-slate-500">
            Step {currentStep + 1} of {totalSteps}
          </p>
          <button
            type="submit"
            disabled={!stepValid}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition
              ${
                stepValid
                  ? "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md active:scale-[0.98]"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
          >
            {isLastStep ? "See my matches" : "Continue"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ---------- Small UI helpers ---------- */

function SectionCard({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 flex items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-lg">
          {emoji}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-slate-800 mb-0.5">{children}</p>
  );
}

/** Clickable answer card with clearer border + hover & select animation */
function ChoiceCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-start gap-2 text-left text-[11px] px-3.5 py-2.5 rounded-2xl border
        transition-all duration-150 ease-out
        ${
          selected
            ? "bg-amber-500 text-white border-amber-500 shadow-lg scale-[1.02]"
            : "bg-white text-slate-700 border-slate-300 hover:border-amber-400 hover:bg-amber-50/60 hover:shadow-md hover:-translate-y-0.5"
        }`}
    >
      {/* Left check indicator */}
      <div
        className={`mt-[2px] h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all duration-150
          ${
            selected
              ? "border-white bg-white/20"
              : "border-slate-300 bg-slate-50 group-hover:border-amber-400"
          }`}
      >
        {selected && <span className="block h-2 w-2 rounded-full bg-white" />}
      </div>

      {/* Text */}
      <span className="leading-snug pr-1">{label}</span>
    </button>
  );
}

/** “Doesn’t matter / not a priority” card – bold and obvious when active */
function DoesntMatterCard({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-start gap-2 text-left text-[11px] px-3.5 py-2.5 rounded-2xl border
        transition-all duration-150 ease-out
        ${
          selected
            ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.03]"
            : "bg-white text-slate-600 border-slate-400 border-dashed hover:border-slate-900 hover:bg-slate-900/90 hover:text-white hover:-translate-y-0.5 hover:shadow-md"
        }`}
    >
      {/* Icon area */}
      <div
        className={`mt-[2px] h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
          ${
            selected
              ? "bg-white text-slate-900"
              : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-slate-900"
          }`}
      >
        ×
      </div>

      <div className="leading-snug">
        <span className="font-semibold mr-1">Not a priority:</span>
        <span>{children}</span>
      </div>
    </button>
  );
}

export default AdaptiveQuizForm;
