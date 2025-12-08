"use client";

import React from "react";
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

// Country list for autocomplete
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
  const reasons = (data.reasons ?? []) as RelocationReasonId[];
  const languagesSpoken = data.languagesSpoken || [];
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  // NEW: collapsible "My profile"
  const [collapsed, setCollapsed] = React.useState(false);

  // NEW: mobile-friendly custom country suggestion instead of <datalist>
  const [countryQuery, setCountryQuery] = React.useState(
    data.currentCountry || ""
  );
  const [showCountryDropdown, setShowCountryDropdown] =
    React.useState<boolean>(false);

  const filteredCountries = React.useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS.slice(0, 15);
    return COUNTRY_OPTIONS.filter((c) =>
      c.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [countryQuery]);

  const handleCountrySelect = (country: string) => {
    setCountryQuery(country);
    onUpdate({ currentCountry: country });
    setShowCountryDropdown(false);
  };

  // "knobs" – numeric sliders stored on the profile
  const anyData = data as any;
  const taxImportance =
    typeof anyData.taxImportance === "number" ? anyData.taxImportance : 7;
  const colImportance =
    typeof anyData.colImportance === "number" ? anyData.colImportance : 7;
  const climateImportance =
    typeof anyData.climateImportance === "number"
      ? anyData.climateImportance
      : 7;

  const isLastStep = currentStep === totalSteps - 1;

  const hasReason = (key: RelocationReasonId) => reasons.includes(key);

  const toggleReason = (key: RelocationReasonId) => {
    const exists = reasons.includes(key);
    const next: RelocationReasonId[] = exists
      ? reasons.filter((r) => r !== key)
      : [...reasons, key];
    onUpdate({ reasons: next });
  };

  const setReason = (key: RelocationReasonId, enabled: boolean) => {
    const without = reasons.filter((r) => r !== key);
    const next: RelocationReasonId[] = enabled ? [...without, key] : without;
    onUpdate({ reasons: next });
  };

  const setExclusiveReason = (
    groupKeys: RelocationReasonId[],
    chosenKey: RelocationReasonId | null
  ) => {
    const withoutGroup = reasons.filter((r) => !groupKeys.includes(r));
    const next: RelocationReasonId[] = chosenKey
      ? [...withoutGroup, chosenKey]
      : withoutGroup;
    onUpdate({ reasons: next });
  };

  const toggleLanguage = (lang: string) => {
    const exists = languagesSpoken.includes(lang);
    const next = exists
      ? languagesSpoken.filter((l) => l !== lang)
      : [...languagesSpoken, lang];
    onUpdate({ languagesSpoken: next });
  };

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();

    let error: string | null = null;

    if (currentStep === 0) {
      if (!data.currentCountry || !data.ageRange) {
        error =
          "Please tell us where you're based and your age range before continuing.";
      } else if (!COUNTRY_OPTIONS.includes(data.currentCountry)) {
        error = "Please pick your current country from the suggestion list.";
      }
    } else if (currentStep === 1) {
      const hasLang = languagesSpoken.length > 0;
      const hasImportance = (
        [
          "language_must_have",
          "language_nice_to_have",
          "language_flexible",
        ] as RelocationReasonId[]
      ).some((r) => reasons.includes(r));
      if (!hasLang) {
        error =
          "Please select at least one language you can live your daily life in.";
      } else if (!hasImportance) {
        error =
          "Please tell us how important it is that your new country uses one of these languages.";
      }
    } else if (currentStep === 2) {
      const taxMatters = hasReason("lower_taxes");
      const taxNotPriority = hasReason("tax_not_important");
      const colMatters = hasReason("lower_cost_of_living");
      const colNotPriority = hasReason("col_not_important");

      if (!taxMatters && !taxNotPriority) {
        error =
          "Please tell us if paying lower taxes than you do today matters to you or not.";
      } else if (!colMatters && !colNotPriority) {
        error =
          "Please tell us if a lower cost of living is a priority for you or not.";
      }
    } else if (currentStep === 3) {
      const anySafetyIntensity = (
        [
          "safety_importance_high",
          "safety_importance_medium",
          "safety_not_important",
        ] as RelocationReasonId[]
      ).some((r) => reasons.includes(r));

      if (!anySafetyIntensity) {
        error =
          "Please tell us how important safety and stability are for you.";
      } else {
        const safetyNotImportant = hasReason("safety_not_important");
        if (!safetyNotImportant) {
          const anySafetyFollowup = (
            [
              "personal_safety",
              "personal_safety_low_priority",
              "political_stability",
              "political_stability_low_priority",
              "low_corruption",
              "low_corruption_low_priority",
            ] as RelocationReasonId[]
          ).some((r) => reasons.includes(r));
          if (!anySafetyFollowup) {
            error =
              "Please choose at least one thing you care about inside safety (street, politics or institutions).";
          }
        }
      }
    } else if (currentStep === 4) {
      const climateMatters = hasReason("better_weather");
      const climateNotPriority = hasReason("climate_dont_care");
      const climatePrefChosen = (
        [
          "climate_pref_cold",
          "climate_pref_mild",
          "climate_pref_warm",
        ] as RelocationReasonId[]
      ).some((r) => reasons.includes(r));

      if (!climateMatters && !climateNotPriority) {
        error =
          "Please tell us if climate and weather matter to you or not.";
      } else if (climateMatters && !climatePrefChosen) {
        error = "Please choose what kind of climate sounds best for you.";
      }
    } else if (currentStep === 5) {
      const anyHealth = (
        [
          "healthcare_strong_public",
          "healthcare_mixed",
          "healthcare_private",
          "healthcare_not_important",
        ] as RelocationReasonId[]
      ).some((r) => reasons.includes(r));
      if (!anyHealth) {
        error =
          "Please choose what kind of healthcare system sounds best to you.";
      }
    } else if (currentStep === 6) {
      const anyLgbt = (
        ["lgbt_full_rights", "lgbt_friendly", "lgbt_dont_care"] as RelocationReasonId[]
      ).some((r) => reasons.includes(r));
      if (!anyLgbt) {
        error =
          "Please choose how much LGBTQ+ rights matter where you live.";
      }
    } else if (currentStep === 7) {
      const anyCulture = (
        [
          "culture_northern_europe",
          "culture_mediterranean",
          "culture_north_america",
          "culture_latin_america",
          "culture_asia",
          "culture_not_important",
        ] as RelocationReasonId[]
      ).some((r) => reasons.includes(r));
      if (!anyCulture) {
        error =
          "Please tell us which cultures you feel pulled to, or that you don't mind.";
      }
    } else if (currentStep === 8) {
      const devCareYes = hasReason("development_care_yes");
      const devCareSome = hasReason("development_care_some");
      const devNotImportant = hasReason("development_not_important");
      const caresDev = devCareYes || devCareSome;

      if (!devCareYes && !devCareSome && !devNotImportant) {
        error =
          "Please tell us how much you care about how developed the country feels.";
      } else if (caresDev) {
        const anyDevDetail = (
          [
            "dev_public_transport",
            "dev_digital_services",
            "dev_infrastructure_clean",
            "dev_everyday_services",
          ] as RelocationReasonId[]
        ).some((r) => reasons.includes(r));
        if (!anyDevDetail) {
          error =
            "Please choose at least one thing that matters to you here (transport, digital services, or how things look and work).";
        }
      }
    }

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);

    if (isLastStep) {
      // IMPORTANT: collapse the profile tab after clicking "See my matches"
      setCollapsed(true);
      onSubmit();
    } else {
      onNext();
    }
  }

  let stepContent: React.ReactNode = null;

  //
  // STEP 0 – Basics
  //
  if (currentStep === 0) {
    stepContent = (
      <SectionCard
        emoji="🧭"
        title="First, a few basics"
        subtitle="We start with simple details so we can compare new places to where you live now."
      >
        <div className="space-y-1">
          <Label>Where are you currently based?</Label>
          <div className="relative w-full">
            <input
              type="text"
              autoComplete="off"
              className="w-full max-w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="Start typing your country…"
              value={countryQuery}
              onFocus={() => setShowCountryDropdown(true)}
              onChange={(e) => {
                const value = e.target.value;
                setCountryQuery(value);
                onUpdate({ currentCountry: value });
                setShowCountryDropdown(true);
              }}
            />
            {showCountryDropdown && filteredCountries.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredCountries.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="block w-full px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCountrySelect(c);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            We won&apos;t suggest {data.currentCountry || "your current country"} as a
            match.
          </p>
        </div>

        <div className="space-y-1">
          <Label>How old are you?</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["18–24", "25–29", "30–34", "35–39", "40–49", "50+"].map(
              (range) => (
                <ChoiceCard
                  key={range}
                  label={range}
                  selected={data.ageRange === range}
                  onClick={() => onUpdate({ ageRange: range })}
                />
              )
            )}
          </div>
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 1 – Languages
  //
  else if (currentStep === 1) {
    const langGroup: RelocationReasonId[] = [
      "language_must_have",
      "language_nice_to_have",
      "language_flexible",
    ];
    const langMust = hasReason("language_must_have");
    const langNice = hasReason("language_nice_to_have");
    const langFlexible = hasReason("language_flexible");

    stepContent = (
      <SectionCard
        emoji="🗣️"
        title="Languages"
        subtitle="Places where you can speak easily will feel more like home."
      >
        <div className="space-y-1">
          <Label>Which languages can you live your daily life in?</Label>
          <p className="text-[11px] text-slate-500 mb-1">
            Work, friends, and basic paperwork. Pick all that apply.
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
          <Label>
            How important is it that your new country uses one of these languages a
            lot?
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ChoiceCard
              label="Very important – I want to rely on my languages"
              selected={langMust}
              onClick={() => {
                setExclusiveReason(langGroup, "language_must_have");
              }}
            />
            <ChoiceCard
              label="Helpful, but not critical"
              selected={langNice}
              onClick={() => {
                setExclusiveReason(langGroup, "language_nice_to_have");
              }}
            />
            <DoesntMatterCard
              selected={langFlexible}
              onClick={() => {
                setExclusiveReason(langGroup, "language_flexible");
              }}
            >
              I don&apos;t really mind – I can adapt
            </DoesntMatterCard>
          </div>
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 2 – Money (taxes + cost of living) with sliders
  //
  else if (currentStep === 2) {
    const taxMatters = hasReason("lower_taxes");
    const taxNotPriority = hasReason("tax_not_important");

    const colMatters = hasReason("lower_cost_of_living");
    const colNotPriority = hasReason("col_not_important");

    const handleTaxPriority = (matters: boolean) => {
      const without = reasons.filter(
        (r) => !["lower_taxes", "tax_not_important"].includes(r)
      );
      const base: RelocationReasonId[] = without;
      if (matters) {
        onUpdate({
          reasons: [...base, "lower_taxes"],
          taxImportance: taxImportance || 7,
        } as any);
      } else {
        onUpdate({
          reasons: [...base, "tax_not_important"],
          taxImportance: 0,
        } as any);
      }
    };

    const handleColPriority = (matters: boolean) => {
      const without = reasons.filter(
        (r) => !["lower_cost_of_living", "col_not_important"].includes(r)
      );
      const base: RelocationReasonId[] = without;
      if (matters) {
        onUpdate({
          reasons: [...base, "lower_cost_of_living"],
          colImportance: colImportance || 7,
        } as any);
      } else {
        onUpdate({
          reasons: [...base, "col_not_important"],
          colImportance: 0,
        } as any);
      }
    };

    stepContent = (
      <SectionCard
        emoji="💸"
        title="Money priorities"
        subtitle="We only ask how much you care, not how much you earn."
      >
        {/* Taxes */}
        <div className="space-y-2">
          <Label>
            Does paying lower taxes than you do today matter to you?
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ChoiceCard
              label="Yes, it matters"
              selected={taxMatters}
              onClick={() => handleTaxPriority(true)}
            />
            <DoesntMatterCard
              selected={taxNotPriority}
              onClick={() => handleTaxPriority(false)}
            >
              Not a priority for me
            </DoesntMatterCard>
          </div>

          {taxMatters && (
            <div className="mt-2 space-y-1">
              <p className="text-[11px] text-slate-600">
                How hard should we optimise for lower taxes?{" "}
                <span className="font-semibold text-amber-600">
                  {taxImportance}/10
                </span>
              </p>
              <input
                type="range"
                min={1}
                max={10}
                value={taxImportance || 7}
                onChange={(e) =>
                  onUpdate({
                    taxImportance: Number(e.target.value),
                  } as any)
                }
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 = small bonus if taxes are lower</span>
                <span>10 = we strongly prioritise low-tax realistic options</span>
              </div>
            </div>
          )}
        </div>

        {/* Cost of living */}
        <div className="space-y-2 pt-3">
          <Label>
            Does having a lower cost of living than{" "}
            {data.currentCountry || "where you live now"} matter to you?
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ChoiceCard
              label="Yes, it matters"
              selected={colMatters}
              onClick={() => handleColPriority(true)}
            />
            <DoesntMatterCard
              selected={colNotPriority}
              onClick={() => handleColPriority(false)}
            >
              Not a priority for me
            </DoesntMatterCard>
          </div>

          {colMatters && (
            <div className="mt-2 space-y-1">
              <p className="text-[11px] text-slate-600">
                How hard should we optimise for cheaper everyday life?{" "}
                <span className="font-semibold text-amber-600">
                  {colImportance}/10
                </span>
              </p>
              <input
                type="range"
                min={1}
                max={10}
                value={colImportance || 7}
                onChange={(e) =>
                  onUpdate({
                    colImportance: Number(e.target.value),
                  } as any)
                }
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 = small bonus if it&apos;s cheaper</span>
                <span>10 = we heavily reward cheaper destinations</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 3 – Safety & stability
  //
  else if (currentStep === 3) {
    const safetyGroup: RelocationReasonId[] = [
      "safety_importance_high",
      "safety_importance_medium",
      "safety_not_important",
    ];
    const safetyHigh = hasReason("safety_importance_high");
    const safetyMedium = hasReason("safety_importance_medium");
    const safetyNone = hasReason("safety_not_important");

    const caresSafety = safetyHigh || safetyMedium;

    const safetyPersonal = hasReason("personal_safety");
    const safetyPersonalLow = hasReason("personal_safety_low_priority");
    const safetyPolitical = hasReason("political_stability");
    const safetyPoliticalLow = hasReason("political_stability_low_priority");
    const safetyCorruption = hasReason("low_corruption");
    const safetyCorruptionLow = hasReason("low_corruption_low_priority");

    const streetGroup: RelocationReasonId[] = [
      "personal_safety",
      "personal_safety_low_priority",
    ];
    const politicsGroup: RelocationReasonId[] = [
      "political_stability",
      "political_stability_low_priority",
    ];
    const corruptionGroup: RelocationReasonId[] = [
      "low_corruption",
      "low_corruption_low_priority",
    ];

    stepContent = (
      <SectionCard
        emoji="🛡️"
        title="Safety & stability"
        subtitle="This includes safety in the street, politics and how serious institutions feel."
      >
        <div className="space-y-1">
          <Label>How important is safety and stability for you?</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ChoiceCard
              label="Very important – I want a safe, calm place"
              selected={safetyHigh}
              onClick={() => {
                const without = reasons.filter((r) => !safetyGroup.includes(r));
                const next: RelocationReasonId[] = [
                  ...without,
                  "safety_importance_high",
                  "safety_stability_priority",
                ];
                onUpdate({ reasons: next });
              }}
            />
            <ChoiceCard
              label="Somewhat important – I prefer safe, but can trade off"
              selected={safetyMedium}
              onClick={() => {
                const without = reasons.filter((r) => !safetyGroup.includes(r));
                const next: RelocationReasonId[] = [
                  ...without,
                  "safety_importance_medium",
                  "safety_stability_priority",
                ];
                onUpdate({ reasons: next });
              }}
            />
            <DoesntMatterCard
              selected={safetyNone}
              onClick={() => {
                const without = reasons.filter(
                  (r) =>
                    ![
                      ...safetyGroup,
                      "safety_stability_priority",
                      "personal_safety",
                      "personal_safety_low_priority",
                      "political_stability",
                      "political_stability_low_priority",
                      "low_corruption",
                      "low_corruption_low_priority",
                    ].includes(r)
                );
                const next: RelocationReasonId[] = [
                  ...without,
                  "safety_not_important",
                ];
                onUpdate({ reasons: next });
              }}
            >
              Not a big factor for me
            </DoesntMatterCard>
          </div>
        </div>

        {caresSafety && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label>Street safety</Label>
              <p className="text-[11px] text-slate-500 mb-1">
                Walking at night, public transport, general feeling on the street.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  label="I prefer low crime and a calm street feeling"
                  selected={safetyPersonal}
                  onClick={() =>
                    setExclusiveReason(streetGroup, "personal_safety")
                  }
                />
                <DoesntMatterCard
                  selected={safetyPersonalLow}
                  onClick={() =>
                    setExclusiveReason(
                      streetGroup,
                      "personal_safety_low_priority"
                    )
                  }
                >
                  I can handle a bit more edge
                </DoesntMatterCard>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Politics</Label>
              <p className="text-[11px] text-slate-500 mb-1">
                Protests, news drama, changes of government.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  label="I prefer calmer, more stable politics"
                  selected={safetyPolitical}
                  onClick={() =>
                    setExclusiveReason(politicsGroup, "political_stability")
                  }
                />
                <DoesntMatterCard
                  selected={safetyPoliticalLow}
                  onClick={() =>
                    setExclusiveReason(
                      politicsGroup,
                      "political_stability_low_priority"
                    )
                  }
                >
                  I can live with noise if life is good
                </DoesntMatterCard>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Institutions & corruption</Label>
              <p className="text-[11px] text-slate-500 mb-1">
                How fair and &quot;serious&quot; the system feels (offices, police, courts).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  label="I want low corruption and working institutions"
                  selected={safetyCorruption}
                  onClick={() =>
                    setExclusiveReason(corruptionGroup, "low_corruption")
                  }
                />
                <DoesntMatterCard
                  selected={safetyCorruptionLow}
                  onClick={() =>
                    setExclusiveReason(
                      corruptionGroup,
                      "low_corruption_low_priority"
                    )
                  }
                >
                  I accept some chaos if the upside is strong
                </DoesntMatterCard>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    );
  }
  //
  // STEP 4 – Climate & weather (with slider)
  //
  else if (currentStep === 4) {
    const climateMatters = hasReason("better_weather");
    const climateNotPriority = hasReason("climate_dont_care");

    const climateCold = hasReason("climate_pref_cold");
    const climateMild = hasReason("climate_pref_mild");
    const climateWarm = hasReason("climate_pref_warm");

    const selectClimatePriority = (matters: boolean) => {
      if (matters) {
        const without = reasons.filter((r) => r !== "climate_dont_care");
        const base: RelocationReasonId[] = without.includes("better_weather")
          ? without
          : [...without, "better_weather"];
        onUpdate({
          reasons: base,
          climateImportance: climateImportance || 7,
        } as any);
      } else {
        const without = reasons.filter(
          (r) =>
            ![
              "better_weather",
              "climate_pref_cold",
              "climate_pref_mild",
              "climate_pref_warm",
            ].includes(r)
        );
        const next: RelocationReasonId[] = [...without, "climate_dont_care"];
        onUpdate({
          reasons: next,
          climateImportance: 0,
        } as any);
      }
    };

    const selectClimatePref = (pref: "cold" | "mild" | "warm") => {
      if (!climateMatters) {
        // ensure "matters" is true when they pick a climate
        selectClimatePriority(true);
      }
      let base = reasons.filter(
        (r) =>
          ![
            "climate_pref_cold",
            "climate_pref_mild",
            "climate_pref_warm",
            "climate_dont_care",
          ].includes(r)
      );
      if (pref === "cold") base.push("climate_pref_cold");
      if (pref === "mild") base.push("climate_pref_mild");
      if (pref === "warm") base.push("climate_pref_warm");
      if (!base.includes("better_weather")) base.push("better_weather");
      onUpdate({ reasons: base });
    };

    stepContent = (
      <SectionCard
        emoji="🌦️"
        title="Climate & weather"
        subtitle="We match your answer with typical climate in different cities."
      >
        {/* Does climate matter? */}
        <div className="space-y-1">
          <Label>
            Does the climate and weather in your next country matter to you?
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ChoiceCard
              label="Yes, it matters"
              selected={climateMatters}
              onClick={() => selectClimatePriority(true)}
            />
            <DoesntMatterCard
              selected={climateNotPriority}
              onClick={() => selectClimatePriority(false)}
            >
              Not a priority – I can live with different climates
            </DoesntMatterCard>
          </div>
        </div>

        {/* Climate preference only if it matters */}
        {climateMatters && (
          <>
            <div className="space-y-1 pt-2">
              <Label>What kind of climate sounds best for you?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  label="❄️ Mostly cold – real winters, jackets, dark evenings"
                  selected={climateCold}
                  onClick={() => selectClimatePref("cold")}
                />
                <ChoiceCard
                  label="🌤️ Mild mix – real seasons but not very extreme"
                  selected={climateMild}
                  onClick={() => selectClimatePref("mild")}
                />
                <ChoiceCard
                  label="☀️ Mostly warm – a lot of sun, very light winters"
                  selected={climateWarm}
                  onClick={() => selectClimatePref("warm")}
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <Label>
                How important is it that your new place fits this climate?
              </Label>
              <p className="text-[11px] text-slate-600">
                We use this to decide how hard to avoid places with the opposite
                weather.{" "}
                <span className="font-semibold text-amber-600">
                  {climateImportance}/10
                </span>
              </p>
              <input
                type="range"
                min={1}
                max={10}
                value={climateImportance || 7}
                onChange={(e) =>
                  onUpdate({
                    climateImportance: Number(e.target.value),
                  } as any)
                }
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 = nice bonus if it matches</span>
                <span>10 = we strongly avoid the opposite climate</span>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    );
  }
  //
  // STEP 5 – Healthcare
  //
  else if (currentStep === 5) {
    const healthGroup: RelocationReasonId[] = [
      "healthcare_strong_public",
      "healthcare_mixed",
      "healthcare_private",
      "healthcare_not_important",
    ];

    const strongPublic = hasReason("healthcare_strong_public");
    const mixedSystem = hasReason("healthcare_mixed");
    const mostlyPrivate = hasReason("healthcare_private");
    const healthcareNoPref = hasReason("healthcare_not_important");

    stepContent = (
      <SectionCard
        emoji="⚕️"
        title="Healthcare"
        subtitle="We care about how it feels in real life, not legal details."
      >
        <div className="space-y-1">
          <Label>What kind of healthcare system sounds best to you?</Label>
          <p className="text-[11px] text-slate-500 mb-1">
            From more public to more private.
          </p>
          <div className="grid grid-cols-1 gap-2">
            <ChoiceCard
              label="🇪🇺 Strong public system with low extra payments"
              selected={strongPublic}
              onClick={() =>
                setExclusiveReason(healthGroup, "healthcare_strong_public")
              }
            />
            <ChoiceCard
              label="🩺 Mix – public / basic cover + strong private options"
              selected={mixedSystem}
              onClick={() =>
                setExclusiveReason(healthGroup, "healthcare_mixed")
              }
            />
            <ChoiceCard
              label="💊 Mostly private – good quality, more out-of-pocket"
              selected={mostlyPrivate}
              onClick={() =>
                setExclusiveReason(healthGroup, "healthcare_private")
              }
            />
            <DoesntMatterCard
              selected={healthcareNoPref}
              onClick={() =>
                setExclusiveReason(healthGroup, "healthcare_not_important")
              }
            >
              I don&apos;t really mind, it&apos;s not a priority
            </DoesntMatterCard>
          </div>
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 6 – LGBTQ+ rights
  //
  else if (currentStep === 6) {
    const lgbtGroup: RelocationReasonId[] = [
      "lgbt_full_rights",
      "lgbt_friendly",
      "lgbt_dont_care",
    ];
    const lgbtFull = hasReason("lgbt_full_rights");
    const lgbtFriendly = hasReason("lgbt_friendly");
    const lgbtDontCare = hasReason("lgbt_dont_care");

    stepContent = (
      <SectionCard
        emoji="🏳️‍🌈"
        title="LGBTQ+ rights"
        subtitle="This can fully exclude some countries if you say it matters."
      >
        <div className="space-y-1">
          <Label>How much do LGBTQ+ rights matter where you live?</Label>
          <div className="grid grid-cols-1 gap-2">
            <ChoiceCard
              label="It matters: I want strong, modern LGBT protections"
              selected={lgbtFull}
              onClick={() => {
                const without = reasons.filter((r) => !lgbtGroup.includes(r));
                const next: RelocationReasonId[] = [
                  ...without,
                  "better_lgbtq",
                  "lgbt_full_rights",
                ];
                onUpdate({ reasons: next });
              }}
            />
            <ChoiceCard
              label="It matters: I want clearly LGBT-friendly places, but I’m a bit flexible"
              selected={lgbtFriendly}
              onClick={() => {
                const without = reasons.filter((r) => !lgbtGroup.includes(r));
                const next: RelocationReasonId[] = [
                  ...without,
                  "better_lgbtq",
                  "lgbt_friendly",
                ];
                onUpdate({ reasons: next });
              }}
            />
            <DoesntMatterCard
              selected={lgbtDontCare}
              onClick={() => {
                const without = reasons.filter(
                  (r) => ![...lgbtGroup, "better_lgbtq"].includes(r)
                );
                const next: RelocationReasonId[] = [
                  ...without,
                  "lgbt_dont_care",
                ];
                onUpdate({ reasons: next });
              }}
            >
              It doesn&apos;t really matter to me
            </DoesntMatterCard>
          </div>
        </div>
      </SectionCard>
    );
  }
  //
  // STEP 7 – Culture & vibe
  //
  else if (currentStep === 7) {
    const cultureNorth = hasReason("culture_northern_europe");
    const cultureSouth = hasReason("culture_mediterranean");
    const cultureNA = hasReason("culture_north_america");
    const cultureLatAm = hasReason("culture_latin_america");
    const cultureAsia = hasReason("culture_asia");
    const cultureNoPref = hasReason("culture_not_important");
    const cultureMust = hasReason("culture_must_have");

    const anyCulture =
      cultureNorth || cultureSouth || cultureNA || cultureLatAm || cultureAsia;

    const toggleCulture = (key: RelocationReasonId) => {
      if (key === "culture_not_important") {
        const without = reasons.filter(
          (r) =>
            ![
              "culture_northern_europe",
              "culture_mediterranean",
              "culture_north_america",
              "culture_latin_america",
              "culture_asia",
              "culture_not_important",
              "culture_must_have",
            ].includes(r)
        );
        const next: RelocationReasonId[] = [...without, "culture_not_important"];
        onUpdate({ reasons: next });
      } else {
        const withoutNot = reasons.filter(
          (r) => r !== "culture_not_important"
        );
        const exists = withoutNot.includes(key);
        const next: RelocationReasonId[] = exists
          ? withoutNot.filter((r) => r !== key)
          : [...withoutNot, key];
        onUpdate({ reasons: next });
      }
    };

    stepContent = (
      <SectionCard
        emoji="🎭"
        title="Culture & vibe"
        subtitle="Think about daily life, social style, and general feeling of the place."
      >
        <div className="space-y-1">
          <Label>Which cultures do you feel pulled to?</Label>
          <p className="text-[11px] text-slate-500 mb-1">
            You can pick more than one, or say you don&apos;t mind.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ChoiceCard
              label="🇩🇰 Northern Europe – calm, organized, more private"
              selected={cultureNorth}
              onClick={() => toggleCulture("culture_northern_europe")}
            />
            <ChoiceCard
              label="🇮🇹 Mediterranean / Southern Europe – social, warm, later evenings"
              selected={cultureSouth}
              onClick={() => toggleCulture("culture_mediterranean")}
            />
            <ChoiceCard
              label="🇺🇸 North American big-city feel"
              selected={cultureNA}
              onClick={() => toggleCulture("culture_north_america")}
            />
            <ChoiceCard
              label="🇲🇽 Latin America – very lively and social"
              selected={cultureLatAm}
              onClick={() => toggleCulture("culture_latin_america")}
            />
            <ChoiceCard
              label="🇹🇭 / 🇯🇵 / 🇰🇷 Asian mix – modern with strong traditions"
              selected={cultureAsia}
              onClick={() => toggleCulture("culture_asia")}
            />
            <DoesntMatterCard
              selected={cultureNoPref}
              onClick={() => toggleCulture("culture_not_important")}
            >
              I don&apos;t really mind the cultural style
            </DoesntMatterCard>
          </div>
        </div>

        {anyCulture && (
          <div className="space-y-1">
            <Label>Is this kind of culture a must-have?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ChoiceCard
                label="Yes – I want to really connect with the culture"
                selected={cultureMust}
                onClick={() => setReason("culture_must_have", true)}
              />
              <ChoiceCard
                label="No – it’s a bonus, but not a strict rule"
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
  // STEP 8 – Development & infrastructure
  //
  else if (currentStep === 8) {
    const devCareYes = hasReason("development_care_yes");
    const devCareSome = hasReason("development_care_some");
    const devNotImportant = hasReason("development_not_important");
    const caresDev = devCareYes || devCareSome;

    const devPublic = hasReason("dev_public_transport");
    const devDigital = hasReason("dev_digital_services");
    const devInfra = hasReason("dev_infrastructure_clean");
    const devServices = hasReason("dev_everyday_services");

    const toggleDevDetail = (key: RelocationReasonId) => {
      const exists = reasons.includes(key);
      const without = reasons.filter((r) => r !== key);
      const next: RelocationReasonId[] = exists ? without : [...without, key];
      onUpdate({ reasons: next });
    };

    stepContent = (
      <SectionCard
        emoji="🏙️"
        title="Development & infrastructure"
        subtitle="Think about roads, services, public transport and how smooth daily life feels."
      >
        <div className="space-y-1">
          <Label>Do you care about how developed your next country feels?</Label>
          <div className="grid grid-cols-1 gap-2">
            <ChoiceCard
              label="Yes – I want a clearly developed country"
              selected={devCareYes}
              onClick={() => {
                const without = reasons.filter(
                  (r) =>
                    ![
                      "development_care_yes",
                      "development_care_some",
                      "development_not_important",
                    ].includes(r)
                );
                const next: RelocationReasonId[] = [
                  ...without,
                  "development_care_yes",
                ];
                onUpdate({ reasons: next });
              }}
            />
            <ChoiceCard
              label="Somewhat – I prefer decent standards but I’m flexible"
              selected={devCareSome}
              onClick={() => {
                const without = reasons.filter(
                  (r) =>
                    ![
                      "development_care_yes",
                      "development_care_some",
                      "development_not_important",
                    ].includes(r)
                );
                const next: RelocationReasonId[] = [
                  ...without,
                  "development_care_some",
                ];
                onUpdate({ reasons: next });
              }}
            />
            <DoesntMatterCard
              selected={devNotImportant}
              onClick={() => {
                const without = reasons.filter(
                  (r) =>
                    ![
                      "development_care_yes",
                      "development_care_some",
                      "development_not_important",
                      "dev_public_transport",
                      "dev_digital_services",
                      "dev_infrastructure_clean",
                      "dev_everyday_services",
                    ].includes(r)
                );
                const next: RelocationReasonId[] = [
                  ...without,
                  "development_not_important",
                ];
                onUpdate({
                  reasons: next,
                });
              }}
            >
              I don&apos;t really mind this, as long as other things are good
            </DoesntMatterCard>
          </div>
        </div>

        {caresDev && (
          <div className="space-y-1">
            <Label>What parts of this matter most to you?</Label>
            <p className="text-[11px] text-slate-500 mb-1">
              Pick all that sound important. We’ll match you to cities that fit
              this better.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ChoiceCard
                label="🚆 Reliable public transport and easy to get around without a car"
                selected={devPublic}
                onClick={() => toggleDevDetail("dev_public_transport")}
              />
              <ChoiceCard
                label="📱 Good digital services (apps, online payments, online government)"
                selected={devDigital}
                onClick={() => toggleDevDetail("dev_digital_services")}
              />
              <ChoiceCard
                label="🧹 Relatively clean, maintained streets and buildings"
                selected={devInfra}
                onClick={() => toggleDevDetail("dev_infrastructure_clean")}
              />
              <ChoiceCard
                label="📦 Easy everyday services (deliveries, shops, cafes, coworking)"
                selected={devServices}
                onClick={() => toggleDevDetail("dev_everyday_services")}
              />
            </div>
          </div>
        )}
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
        title="Check your profile"
        subtitle="If something looks wrong, you can go back and change it before we show matches."
      >
        <div className="space-y-3 text-[11px] text-slate-800">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-semibold mb-1">
              Basics
            </p>
            <ul className="space-y-0.5">
              <li>
                <span className="font-semibold text-slate-900">
                  Current country:
                </span>{" "}
                {data.currentCountry || "Not specified"}
              </li>
              <li>
                <span className="font-semibold text-slate-900">Age:</span>{" "}
                {data.ageRange || "Not specified"}
              </li>
              <li>
                <span className="font-semibold text-slate-900">
                  Languages you can live in:
                </span>{" "}
                {languagesSpoken.length > 0
                  ? languagesSpoken.join(", ")
                  : "Not specified"}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-semibold mb-1">
              Things we will focus on
            </p>
            <ul className="space-y-0.5 text-slate-800">
              {hasReason("lower_taxes") && (
                <li>• You care about lower taxes.</li>
              )}
              {hasReason("lower_cost_of_living") && (
                <li>• You want a lower cost of living.</li>
              )}
              {hasReason("better_weather") && (
                <li>• You have a preferred climate.</li>
              )}
              {hasReason("better_lgbtq") && (
                <li>• LGBTQ+ rights matter to you.</li>
              )}
              {hasReason("language_must_have") && (
                <li>• You want to rely on one of your languages.</li>
              )}
              {hasReason("safety_stability_priority") && (
                <li>• Safety and stability are important to you.</li>
              )}
              {hasReason("healthcare_strong_public") && (
                <li>• You prefer strong public healthcare.</li>
              )}
              {hasReason("healthcare_mixed") && (
                <li>• You like a mix of public and private healthcare.</li>
              )}
              {hasReason("healthcare_private") && (
                <li>• You are okay with mostly private healthcare.</li>
              )}
              {hasReason("culture_must_have") && (
                <li>• You want to really connect with the local culture.</li>
              )}
              {hasReason("development_care_yes") && (
                <li>• You want a clearly developed country.</li>
              )}
              {hasReason("development_care_some") && (
                <li>
                  • You prefer decent standards but accept some rough edges.
                </li>
              )}
              {hasReason("development_not_important") && (
                <li>
                  • You are flexible about how developed the country feels.
                </li>
              )}
              {hasReason("dev_public_transport") && (
                <li>
                  • Public transport and moving without a car matter to you.
                </li>
              )}
              {hasReason("dev_digital_services") && (
                <li>
                  • You care about good digital services (apps, online
                  services).
                </li>
              )}
              {hasReason("dev_infrastructure_clean") && (
                <li>
                  • You like cleaner, more maintained streets and buildings.
                </li>
              )}
              {hasReason("dev_everyday_services") && (
                <li>
                  • You want easy everyday services and modern city life.
                </li>
              )}
              {reasons.length === 0 && (
                <li>• You did not mark any strong priorities yet.</li>
              )}
            </ul>
          </div>

          <p className="text-[11px] text-slate-600">
            When you click{" "}
            <span className="font-semibold text-slate-900">
              See my matches
            </span>
            , we&apos;ll use this profile to rank countries and also show strong
            options we had to reject because of your hard rules.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className="w-full max-w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-3.5 sm:px-4 sm:py-4 shadow-[0_18px_40px_rgba(0,0,0,0.08)] space-y-4 font-sans text-slate-900 overflow-x-hidden"
    >
      {/* Collapsible header for the existing profile form */}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs rounded-full bg-slate-900 text-slate-50 px-2 py-0.5">
            My profile
          </span>
          <span className="text-[11px] text-slate-500 truncate">
            Step {currentStep + 1} of {totalSteps} · Tap to{" "}
            {collapsed ? "expand" : "collapse"}.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="ml-2 flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-900"
        >
          <span>{collapsed ? "Show" : "Hide"}</span>
          <span>{collapsed ? "▼" : "▲"}</span>
        </button>
      </div>

      {/* Only show the actual step content + nav when not collapsed */}
      {!collapsed && (
        <>
          {stepContent}

          {validationError && (
            <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {validationError}
            </p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 mt-2">
            <button
  type="button"
  onClick={onBack}
  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-300 text-slate-700 bg-white hover:border-slate-400 hover:bg-slate-50 transition-colors"
>
  ← Back
</button>

            <div className="flex items-center gap-3">
              <p className="hidden xs:block text-[11px] text-slate-500">
                Step {currentStep + 1} of {totalSteps}
              </p>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold tracking-wide
                       bg-amber-400 text-slate-950 border border-transparent
                       shadow-[0_10px_25px_rgba(0,0,0,0.25)]
                       transition-all duration-150
                       hover:bg-amber-300 hover:shadow-[0_14px_30px_rgba(0,0,0,0.3)] hover:-translate-y-0.5
                       active:translate-y-0 active:scale-[0.97]
                       focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-1 focus:ring-offset-white"
              >
                {isLastStep ? "🔥 See my matches" : "Continue"}
              </button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}

/* ---------- UI helpers ---------- */

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
        <div className="h-8 w-8 flex items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-lg shrink-0">
          {emoji}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-[11px] text-slate-600">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-slate-900 mb-0.5 tracking-tight">
      {children}
    </p>
  );
}

/** Clickable answer card with clear states + hover/select animation */
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
        w-full
        transition-all duration-150 ease-out font-medium
        ${
          selected
            ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md scale-[1.02]"
            : "bg-white text-slate-900 border-slate-300 hover:border-amber-400 hover:bg-amber-50 hover:shadow-sm hover:-translate-y-0.5"
        }`}
    >
      <div
        className={`mt-[2px] h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all duration-150 flex-shrink-0
          ${
            selected
              ? "border-slate-950 bg-slate-50"
              : "border-slate-400 bg-white group-hover:border-amber-400"
          }`}
      >
        {selected && (
          <span className="block h-2 w-2 rounded-full bg-slate-950" />
        )}
      </div>
      <span className="leading-snug pr-1 break-words">{label}</span>
    </button>
  );
}

/** “Doesn’t matter / not a priority” card */
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
        w-full
        transition-all duration-150 ease-out
        ${
          selected
            ? "bg-slate-900 text-slate-50 border-slate-900 shadow-md scale-[1.03]"
            : "bg-white text-slate-700 border-slate-300 border-dashed hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-sm"
        }`}
    >
      <div
        className={`mt-[2px] h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0
          ${
            selected
              ? "bg-slate-50 text-slate-950"
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-900 group-hover:text-slate-50"
          }`}
      >
        ×
      </div>

      <div className="leading-snug break-words">
        <span className="font-semibold mr-1 uppercase tracking-[0.14em] text-[10px]">
          Not a priority:
        </span>
        <span className="text-[11px]">{children}</span>
      </div>
    </button>
  );
}

export default AdaptiveQuizForm;
