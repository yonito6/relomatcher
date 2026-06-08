// lib/tax/data.ts
// Per-country tax profiles, keyed by ISO code (matches lib/countriesDb.ts).
//
// Each RateCurve point is an APPROXIMATE all-in effective rate (personal income
// tax + mandatory employee/self-employed social & health contributions) for a
// mid-income relocator, at ~$30k / ~$75k / ~$150k gross/yr.
// Special regimes capture real schemes useful to remote / foreign-income earners.
// These are researched estimates, NOT tax advice. confidence reflects how stable
// / well-known the figures are.

import type { TaxProfile, EarnerType } from "@/lib/tax/types";

const REMOTE_ONLY: EarnerType[] = ["remote_foreign"];
const REMOTE_AND_SELF: EarnerType[] = ["remote_foreign", "self_employed"];

export const TAX_PROFILES: Record<string, TaxProfile> = {
  /* --------------------------- North America --------------------------- */
  US: {
    employed: { low: 0.18, mid: 0.26, high: 0.33 },
    selfEmployed: { low: 0.22, mid: 0.3, high: 0.37 },
    vat: 7, // avg combined sales tax; varies by state
    notes: "Federal + state + payroll/self-employment tax; varies widely by state (TX/FL have no state income tax).",
    confidence: "medium",
  },
  CA: {
    employed: { low: 0.19, mid: 0.28, high: 0.36 },
    selfEmployed: { low: 0.21, mid: 0.31, high: 0.4 },
    vat: 13,
    notes: "Federal + provincial income tax + CPP/EI. Province matters a lot.",
    confidence: "medium",
  },
  MX: {
    employed: { low: 0.12, mid: 0.2, high: 0.3 },
    selfEmployed: { low: 0.1, mid: 0.18, high: 0.3 },
    remoteRegime: { rate: 0.1, label: "RESICO small-business ~1–2.5% + low brackets", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 200_000 },
    vat: 16,
    notes: "Progressive ISR up to 35%; RESICO regime is very low for small self-employed.",
    confidence: "medium",
  },

  /* ------------------------ Western / North Europe --------------------- */
  GB: {
    // Verified 2026: PA £12,570; 20%/40%/45% at £50,270/£125,140. NI: employee
    // 8% (PT→UEL), self-employed Class 4 6% then 2%. GBP≈$1.27 USD-equiv.
    employed: { low: 0.18, mid: 0.28, high: 0.36 },
    selfEmployed: { low: 0.17, mid: 0.27, high: 0.37 },
    brackets: [
      { upTo: 15_964, rate: 0 },
      { upTo: 63_843, rate: 0.2 },
      { upTo: 158_928, rate: 0.4 },
      { upTo: Infinity, rate: 0.45 },
    ],
    standardSocial: { rate: 0.08, capIncome: 63_843 },
    selfEmployedSocial: { rate: 0.06, capIncome: 63_843 },
    regimes: [],
    vat: 20,
    notes: "Income tax 20/40/45% + National Insurance; £12,570 personal allowance.",
    confidence: "high",
  },
  IE: {
    // Verified 2026: 20% to €44,000 then 40%; USC 0.5/2/3/8%; PRSI 4.2%.
    // Self-employed +3% USC surcharge over €100k. EUR≈$1.08 USD-equiv.
    employed: { low: 0.18, mid: 0.3, high: 0.4 },
    selfEmployed: { low: 0.2, mid: 0.33, high: 0.43 },
    brackets: [
      { upTo: 47_520, rate: 0.2 },
      { upTo: Infinity, rate: 0.4 },
    ],
    standardSocial: { rate: 0.085 },
    selfEmployedSocial: { rate: 0.095 },
    regimes: [],
    vat: 23,
    notes: "20%/40% bands + USC + PRSI; high marginal rate kicks in early.",
    confidence: "medium",
  },
  FR: {
    // Verified 2026: 0/11/30/41/45% at €11,600/29,579/84,577/181,917.
    // Micro-entrepreneur + versement libératoire = flat % of turnover (URSSAF
    // social + 1–1.7% income tax). Caps €188.7k goods / €77.7k services.
    employed: { low: 0.2, mid: 0.3, high: 0.41 },
    selfEmployed: { low: 0.22, mid: 0.34, high: 0.45 },
    brackets: [
      { upTo: 12_528, rate: 0 },
      { upTo: 31_945, rate: 0.11 },
      { upTo: 91_343, rate: 0.3 },
      { upTo: 196_470, rate: 0.41 },
      { upTo: Infinity, rate: 0.45 },
    ],
    standardSocial: { rate: 0.22, capIncome: 200_000 },
    selfEmployedSocial: { rate: 0.22, capIncome: 200_000 },
    regimes: [
      { label: "Micro-entrepreneur goods (versement libératoire): ~13.3% of turnover", activities: ["ecommerce"], basis: "revenue", rate: 0.133, maxAnnualRevenue: 203_796 },
      { label: "Micro-entrepreneur services (versement libératoire): ~22.9% of turnover", activities: ["freelancer"], basis: "revenue", rate: 0.229, maxAnnualRevenue: 83_916 },
    ],
    vat: 20,
    notes: "High social charges; auto-entrepreneur scheme caps social+tax low for small turnover.",
    confidence: "high",
  },
  DE: {
    // Verified 2026: Grundfreibetrag €12,348; marginal 14→42% to €69,878,
    // 42% to €277,825, 45% above. Social ~20% capped (~€90k); freelancers pay
    // own health (~14% capped). EUR≈$1.08 USD-equiv.
    employed: { low: 0.22, mid: 0.33, high: 0.42 },
    selfEmployed: { low: 0.2, mid: 0.34, high: 0.44 },
    brackets: [
      { upTo: 13_336, rate: 0 },
      { upTo: 18_838, rate: 0.14 },
      { upTo: 73_960, rate: 0.3 },
      { upTo: 300_051, rate: 0.42 },
      { upTo: Infinity, rate: 0.45 },
    ],
    standardSocial: { rate: 0.2, capIncome: 97_000 },
    selfEmployedSocial: { rate: 0.14, capIncome: 97_000 },
    regimes: [],
    vat: 19,
    notes: "Progressive to 45% + solidarity + health/pension; freelancers skip some social if privately insured.",
    confidence: "medium",
  },
  NL: {
    // Verified 2026: Box 1 35.75% to €38,883, 37.56% to €78,426, 49.50% above
    // (first band already bundles national insurance). ZVW healthcare ~4.85%
    // capped. 30% ruling leaves ~30% of salary tax-free for skilled migrants.
    employed: { low: 0.22, mid: 0.34, high: 0.43 },
    selfEmployed: { low: 0.18, mid: 0.3, high: 0.42 },
    brackets: [
      { upTo: 41_994, rate: 0.3575 },
      { upTo: 84_700, rate: 0.3756 },
      { upTo: Infinity, rate: 0.495 },
    ],
    standardSocial: { rate: 0.0485, capIncome: 81_000 },
    selfEmployedSocial: { rate: 0.0532, capIncome: 81_000 },
    regimes: [
      { label: "30% ruling: ~30% of salary tax-free (5 yrs)", activities: ["employed"], basis: "profit", rate: 0.34 },
    ],
    vat: 21,
    notes: "Box 1 up to 49.5%; self-employed deductions help; 30% ruling for qualifying expats.",
    confidence: "medium",
  },
  BE: {
    // Verified 2026: 25/40/45/50% (tax-free €11,180; bands €16,720/29,510/
    // 51,070) + ~7% communal. ONSS employee 13.07%; self-employed 20.5%
    // (reduced above €75k). EUR≈$1.08 USD-equiv.
    employed: { low: 0.26, mid: 0.4, high: 0.48 },
    selfEmployed: { low: 0.25, mid: 0.4, high: 0.5 },
    brackets: [
      { upTo: 12_074, rate: 0 },
      { upTo: 18_058, rate: 0.25 },
      { upTo: 31_871, rate: 0.4 },
      { upTo: 55_156, rate: 0.45 },
      { upTo: Infinity, rate: 0.5 },
    ],
    standardSocial: { rate: 0.1307 },
    selfEmployedSocial: { rate: 0.205, capIncome: 81_026 },
    regimes: [],
    vat: 21,
    notes: "Among the highest effective rates in the EU; communes add surcharge.",
    confidence: "high",
  },
  LU: {
    // Verified 2026: 0% to €13,230, 8→42% (top from €234,871), 23 brackets +
    // 7–9% employment-fund surcharge. CNS+pension employee 12.95% (cap 5× min
    // wage); self-employed ~24% capped. EUR≈$1.08 USD-equiv.
    employed: { low: 0.18, mid: 0.3, high: 0.4 },
    selfEmployed: { low: 0.2, mid: 0.32, high: 0.42 },
    brackets: [
      { upTo: 14_288, rate: 0 },
      { upTo: 27_000, rate: 0.12 },
      { upTo: 48_600, rate: 0.3 },
      { upTo: 118_800, rate: 0.39 },
      { upTo: Infinity, rate: 0.42 },
    ],
    standardSocial: { rate: 0.1295, capIncome: 151_000 },
    selfEmployedSocial: { rate: 0.24, capIncome: 151_000 },
    regimes: [],
    vat: 17,
    notes: "Lowest VAT in the EU; progressive income tax to 42% + surcharges.",
    confidence: "medium",
  },
  CH: {
    // Verified 2026: federal 0–11.5% + canton/commune varies HUGELY (Zug/
    // Schwyz ~10–15pp lower than Geneva/Vaud). Modeled as a moderate canton;
    // low-tax cantons keep far more. AHV uncapped: employee ~6.4%, self-
    // employed ~10%. CHF≈$1.10 USD-equiv. confidence low (canton spread).
    employed: { low: 0.12, mid: 0.2, high: 0.28 },
    selfEmployed: { low: 0.14, mid: 0.22, high: 0.3 },
    brackets: [
      { upTo: 35_000, rate: 0.04 },
      { upTo: 110_000, rate: 0.16 },
      { upTo: 350_000, rate: 0.26 },
      { upTo: Infinity, rate: 0.33 },
    ],
    standardSocial: { rate: 0.064 },
    selfEmployedSocial: { rate: 0.1 },
    regimes: [],
    vat: 8.1,
    notes: "Low federal tax; canton/commune varies hugely (Zug low, Geneva high). Low VAT.",
    confidence: "low",
  },
  AT: {
    // Verified 2026: 0/20/30/40/48/50/55% (tax-free €13,541; bands €21,992/
    // 36,458/70,365/104,859/1M). Social employee ~18% capped €83,160; SVS
    // self-employed ~26% capped. EUR≈$1.08 USD-equiv.
    employed: { low: 0.22, mid: 0.34, high: 0.43 },
    selfEmployed: { low: 0.22, mid: 0.35, high: 0.45 },
    brackets: [
      { upTo: 14_624, rate: 0 },
      { upTo: 23_751, rate: 0.2 },
      { upTo: 39_375, rate: 0.3 },
      { upTo: 75_994, rate: 0.4 },
      { upTo: 113_248, rate: 0.48 },
      { upTo: 1_080_000, rate: 0.5 },
      { upTo: Infinity, rate: 0.55 },
    ],
    standardSocial: { rate: 0.18, capIncome: 89_813 },
    selfEmployedSocial: { rate: 0.26, capIncome: 89_813 },
    regimes: [],
    vat: 20,
    notes: "Progressive to 55% top band; significant social insurance.",
    confidence: "high",
  },

  /* ----------------------------- Nordics ------------------------------- */
  DK: {
    // Verified 2026: AM-bidrag 8% (off gross) + bottom 12.01% + municipal ~25%
    // + top tax (intermediate 7.5% from DKK 641,200, top 7.5% from 777,900,
    // top-top 5% from 2,592,700). Effective marginals folded in. DKK≈$0.145.
    employed: { low: 0.3, mid: 0.4, high: 0.48 },
    selfEmployed: { low: 0.3, mid: 0.42, high: 0.52 },
    brackets: [
      { upTo: 7_482, rate: 0 },
      { upTo: 92_974, rate: 0.42 },
      { upTo: 112_796, rate: 0.49 },
      { upTo: 375_942, rate: 0.56 },
      { upTo: Infinity, rate: 0.6 },
    ],
    standardSocial: { rate: 0 },
    selfEmployedSocial: { rate: 0 },
    regimes: [],
    vat: 25,
    notes: "High income tax + 8% labour-market contribution; 25% VAT. Expat 27% scheme exists.",
    confidence: "high",
  },
  SE: {
    // Verified 2026: municipal ~32% (flat) + state 20% above SEK 660,400
    // (~$63,398). Employees pay little social directly (employer 31.42%);
    // self-employed egenavgifter ~29%. SEK≈$0.096 USD-equiv.
    employed: { low: 0.27, mid: 0.34, high: 0.45 },
    selfEmployed: { low: 0.28, mid: 0.38, high: 0.5 },
    brackets: [
      { upTo: 2_500, rate: 0 },
      { upTo: 63_398, rate: 0.32 },
      { upTo: Infinity, rate: 0.52 },
    ],
    standardSocial: { rate: 0.07, capIncome: 57_600 },
    selfEmployedSocial: { rate: 0.2897, capIncome: 57_600 },
    regimes: [],
    vat: 25,
    notes: "Municipal ~32% + state 20% over threshold; high employer/self social fees.",
    confidence: "high",
  },
  NO: {
    // Verified 2026: 22% flat ordinary + trinnskatt steps (1.7/4/13.7/16.8/
    // 17.8%) + trygdeavgift 7.6% employee / 10.8% self. Marginals folded in.
    // NOK≈$0.092 USD-equiv. (Wealth tax also applies, not modeled.)
    employed: { low: 0.25, mid: 0.32, high: 0.4 },
    selfEmployed: { low: 0.26, mid: 0.36, high: 0.45 },
    brackets: [
      { upTo: 10_000, rate: 0 },
      { upTo: 20_801, rate: 0.296 },
      { upTo: 29_284, rate: 0.313 },
      { upTo: 66_705, rate: 0.336 },
      { upTo: 90_169, rate: 0.433 },
      { upTo: 134_982, rate: 0.464 },
      { upTo: Infinity, rate: 0.474 },
    ],
    standardSocial: { rate: 0 },
    selfEmployedSocial: { rate: 0.032 },
    regimes: [],
    vat: 25,
    notes: "Flat-ish bracket tax + national insurance; wealth tax also applies.",
    confidence: "high",
  },
  FI: {
    // Verified 2026: state progressive (~12.6→44.25%) + municipal ~6–11%
    // (Helsinki 5.84%); combined top ~52%. Employee TyEL+unemployment ~8.2%;
    // self-employed YEL 24.4%. EUR≈$1.08 USD-equiv.
    employed: { low: 0.25, mid: 0.36, high: 0.46 },
    selfEmployed: { low: 0.26, mid: 0.38, high: 0.48 },
    brackets: [
      { upTo: 21_000, rate: 0.2 },
      { upTo: 56_000, rate: 0.37 },
      { upTo: 95_000, rate: 0.45 },
      { upTo: 162_000, rate: 0.49 },
      { upTo: Infinity, rate: 0.52 },
    ],
    standardSocial: { rate: 0.082 },
    selfEmployedSocial: { rate: 0.244, capIncome: 200_000 },
    regimes: [],
    vat: 25.5,
    notes: "Municipal + state progressive; among highest VAT in EU.",
    confidence: "medium",
  },
  IS: {
    employed: { low: 0.26, mid: 0.36, high: 0.44 },
    selfEmployed: { low: 0.28, mid: 0.38, high: 0.46 },
    vat: 24,
    notes: "Two/three-band system + municipal; high cost economy.",
    confidence: "medium",
  },

  /* -------------------------- Southern Europe -------------------------- */
  PT: {
    // Progressive IRS to 48%. IFICI ("NHR 2.0") = 20% flat on qualifying
    // self-employment/employment income in high-value/innovation activities —
    // NOT general ecommerce-goods selling. Self-employed social ~21.4% on 70%
    // of income (effective ~15%, capped ~12 IAS). EUR≈$1.08.
    employed: { low: 0.2, mid: 0.32, high: 0.43 },
    selfEmployed: { low: 0.2, mid: 0.34, high: 0.45 },
    brackets: [
      { upTo: 8_640, rate: 0.13 },
      { upTo: 23_760, rate: 0.26 },
      { upTo: 43_200, rate: 0.37 },
      { upTo: 86_400, rate: 0.45 },
      { upTo: Infinity, rate: 0.48 },
    ],
    selfEmployedSocial: { rate: 0.1498, capIncome: 81_000 },
    regimes: [
      {
        label: "IFICI / NHR 2.0: 20% flat on qualifying income (innovation/services)",
        activities: ["freelancer", "investor"],
        basis: "profit",
        rate: 0.2,
        social: { rate: 0.1498, capIncome: 81_000 },
      },
    ],
    vat: 23,
    notes: "Normal IRS is high (to 48%). The IFICI/'NHR 2.0' regime gives 20% flat — but only for high-value/innovation activities and skilled professionals, NOT general ecommerce-goods selling. Self-employed also pay ~15% social (capped).",
    confidence: "medium",
  },
  ES: {
    // Progressive IRPF 19–47%. Beckham law = 24% flat on the first €600k for
    // qualifying EMPLOYEES / skilled migrants (most self-employed & ecommerce
    // are excluded). Autónomo social = income-based RETA quota (~31%, capped).
    // EUR≈$1.08.
    employed: { low: 0.19, mid: 0.31, high: 0.43 },
    selfEmployed: { low: 0.2, mid: 0.33, high: 0.45 },
    brackets: [
      { upTo: 13_500, rate: 0.19 },
      { upTo: 21_600, rate: 0.24 },
      { upTo: 37_800, rate: 0.3 },
      { upTo: 64_800, rate: 0.37 },
      { upTo: 324_000, rate: 0.45 },
      { upTo: Infinity, rate: 0.47 },
    ],
    standardSocial: { rate: 0.0635, capIncome: 63_600 },
    selfEmployedSocial: { rate: 0.314, capIncome: 63_600, minAnnual: 2_900 },
    regimes: [
      {
        label: "Beckham law: 24% flat (skilled employees, first €600k, 6 yrs)",
        activities: ["employed", "investor"],
        basis: "profit",
        rate: 0.24,
        maxAnnualIncome: 648_000,
      },
    ],
    vat: 21,
    notes: "Progressive IRPF to 47%. Beckham regime gives 24% flat to qualifying employees / highly-skilled migrants (incl. some digital-nomad-visa holders) — but traditional freelancers and ecommerce sellers are generally excluded and pay full IRPF + autónomo social.",
    confidence: "high",
  },
  IT: {
    // High IRPEF (23/35/43%). Regime forfettario = 15% (5% first 5 yrs) on a
    // PROFITABILITY COEFFICIENT of revenue (≈40% goods, ≈78% services) → ~6%
    // of revenue for ecommerce, ~12% for services; turnover cap €85k. INPS is
    // NOT reduced by forfettario. EUR≈$1.08.
    employed: { low: 0.23, mid: 0.35, high: 0.45 },
    selfEmployed: { low: 0.15, mid: 0.27, high: 0.43 },
    brackets: [
      { upTo: 30_240, rate: 0.23 },
      { upTo: 54_000, rate: 0.35 },
      { upTo: Infinity, rate: 0.43 },
    ],
    selfEmployedSocial: { rate: 0.2623, capIncome: 130_000, minAnnual: 4_300 },
    regimes: [
      {
        label: "Regime forfettario 15% (ecommerce/goods, turnover < €85k)",
        activities: ["ecommerce"],
        basis: "revenue",
        rate: 0.06, // 15% of ~40% coefficient
        social: { rate: 0.1, minAnnual: 4_300 },
        maxAnnualRevenue: 91_800,
      },
      {
        label: "Regime forfettario 15% (services, turnover < €85k)",
        activities: ["freelancer"],
        basis: "revenue",
        rate: 0.117, // 15% of ~78% coefficient
        social: { rate: 0.1, minAnnual: 4_300 },
        maxAnnualRevenue: 91_800,
      },
    ],
    vat: 22,
    notes: "High normal IRPEF (to 43%), but the flat-tax 'forfettario' is excellent for SMALL self-employed (turnover < €85k): ~6% of revenue for goods, ~12% for services + INPS. Above €85k turnover the regime is lost.",
    confidence: "medium",
  },
  GR: {
    // Progressive 9–44% (top band from €60k in 2026). EFKA self-employed social
    // is tiered (~€2.6k–€7k/yr), capped. New residents / digital-nomad-visa
    // holders get a 50% income-tax exemption for 7 yrs (halves taxable income).
    // EUR≈$1.08.
    employed: { low: 0.18, mid: 0.3, high: 0.42 },
    selfEmployed: { low: 0.2, mid: 0.33, high: 0.44 },
    brackets: [
      { upTo: 10_800, rate: 0.09 },
      { upTo: 21_600, rate: 0.2 },
      { upTo: 32_400, rate: 0.26 },
      { upTo: 43_200, rate: 0.34 },
      { upTo: 64_800, rate: 0.39 },
      { upTo: Infinity, rate: 0.44 },
    ],
    selfEmployedSocial: { rate: 0.1, capIncome: 60_000, minAnnual: 2_800 },
    regimes: [
      {
        // The exemption halves taxable income; ~16% flat is an approximation of
        // the resulting effective rate across typical incomes.
        label: "50% new-resident exemption (7 yrs): ~½ taxable income",
        activities: ["employed", "freelancer", "ecommerce", "investor"],
        basis: "profit",
        rate: 0.16,
        social: { rate: 0.1, capIncome: 60_000, minAnnual: 2_800 },
      },
    ],
    vat: 24,
    notes: "Progressive 9–44% + EFKA social. Relocating professionals / digital-nomad-visa holders can get a 50% income-tax exemption for 7 years (the ~16% figure approximates the effective rate after halving taxable income). A separate €100k flat-tax non-dom regime exists for the wealthy.",
    confidence: "medium",
  },
  CY: {
    // Progressive PIT 0/20/25/30/35% (tax-free up to €22k from 2026). Non-dom
    // status = 0% tax on dividends, so the classic structure is a Cyprus company
    // (12.5% corporate) + 0%-tax dividends, with only ~2.65% GHS (capped at the
    // first €180k of income ⇒ max ~€4,770/yr). EUR≈$1.08.
    employed: { low: 0.1, mid: 0.18, high: 0.27 },
    selfEmployed: { low: 0.12, mid: 0.2, high: 0.3 },
    brackets: [
      { upTo: 23_760, rate: 0 },
      { upTo: 34_560, rate: 0.2 },
      { upTo: 45_360, rate: 0.25 },
      { upTo: 77_760, rate: 0.3 },
      { upTo: Infinity, rate: 0.35 },
    ],
    standardSocial: { rate: 0.114, capIncome: 70_000 }, // employee SI 8.8% + GHS 2.65%
    selfEmployedSocial: { rate: 0.206, capIncome: 70_000 }, // self SI ~16.6% + GHS 4%
    regimes: [
      {
        label: "Non-dom: Cyprus company 12.5% + 0% dividend tax (GHS only)",
        activities: ["ecommerce", "freelancer", "investor"],
        basis: "profit",
        rate: 0.125,
        social: { rate: 0.0265, capIncome: 194_400, maxAnnual: 5_150 }, // 2.65% GHS capped at €180k
      },
    ],
    vat: 19,
    notes: "First €22k tax-free, then 20–35% PIT. Non-dom status = 0% tax on dividends, so the common setup is a Cyprus company (12.5% corporate) paying dividends taxed only by ~2.65% GHS (capped ~€4,770/yr). Strong for company owners.",
    confidence: "medium",
  },
  MT: {
    // Progressive 0–35%. Non-dom remittance basis: foreign-source income is
    // taxed ONLY if remitted to Malta; a €5,000 minimum tax applies when foreign
    // income ≥ €35k. Self-employed social (Class 2) = 15%, capped ~€2,908/yr.
    // EUR≈$1.08.
    employed: { low: 0.15, mid: 0.25, high: 0.32 },
    selfEmployed: { low: 0.15, mid: 0.26, high: 0.33 },
    brackets: [
      { upTo: 12_960, rate: 0 },
      { upTo: 17_280, rate: 0.15 },
      { upTo: 64_800, rate: 0.25 },
      { upTo: Infinity, rate: 0.35 },
    ],
    selfEmployedSocial: { rate: 0.15, capIncome: 31_400 },
    regimes: [
      {
        label: "Non-dom remittance basis: €5,000 min tax on unremitted foreign income",
        activities: ["ecommerce", "freelancer", "investor"],
        basis: "profit",
        rate: 0,
        social: { rate: 0, minAnnual: 5_400 }, // €5,000 flat minimum tax
      },
    ],
    vat: 18,
    notes: "Progressive 0–35% on Maltese-source/remitted income. Under non-dom status, foreign-source income kept OUTSIDE Malta is untaxed (only a €5,000 minimum tax if foreign income ≥ €35k) — great if you don't remit, but money you bring in to live on is taxed normally.",
    confidence: "medium",
  },

  /* --------------------- Central & Eastern Europe ---------------------- */
  CZ: {
    employed: { low: 0.2, mid: 0.25, high: 0.3 },
    selfEmployed: { low: 0.12, mid: 0.16, high: 0.23 },
    remoteRegime: { rate: 0.12, label: "60/40 lump-sum expense + flat-tax scheme for freelancers", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 90_000 },
    vat: 21,
    notes: "15%/23% income tax; freelancers use 60% flat expense deduction → very low effective rate.",
    confidence: "high",
  },
  PL: {
    // Employed stays on the blended legacy curve; non-employed uses the verified
    // regimes below (ryczałt by activity, 19% flat, all + fixed ZUS/health).
    employed: { low: 0.17, mid: 0.24, high: 0.3 },
    selfEmployed: { low: 0.12, mid: 0.17, high: 0.23 },
    // PIT scale (income tax only): ~30k PLN tax-free, 12% to 120k PLN, 32% above,
    // +4% solidarity over ~1M PLN. In USD-equiv (PLN≈$0.25).
    brackets: [
      { upTo: 7_500, rate: 0 },
      { upTo: 30_000, rate: 0.12 },
      { upTo: 250_000, rate: 0.32 },
      { upTo: Infinity, rate: 0.36 },
    ],
    // Scale path: big ZUS social (1,926.76 PLN/mo ≈ $5.8k/yr) + 9% health (min
    // base = minimum wage). PLN≈$0.25. 2026 ZUS figures verified.
    selfEmployedSocial: { rate: 0.09, minAnnual: 7_000 },
    regimes: [
      {
        label: "Ryczałt 3% of revenue (goods) + ZUS",
        activities: ["ecommerce"],
        basis: "revenue",
        rate: 0.03,
        // Ryczałt ZUS+health top revenue band (>PLN 300k rev) = 3,422 PLN/mo ≈
        // $10.3k/yr. Smaller-revenue sellers pay less ($7.3k–$8.3k).
        social: { rate: 0, minAnnual: 10_300 },
        maxAnnualRevenue: 2_000_000, // ~€2M ryczałt ceiling
      },
      {
        label: "Ryczałt 8.5% of revenue (services) + ZUS",
        activities: ["freelancer"],
        basis: "revenue",
        rate: 0.085,
        social: { rate: 0, minAnnual: 10_300 },
        maxAnnualRevenue: 2_000_000,
      },
      {
        label: "19% flat tax on profit + ZUS/health",
        activities: ["freelancer", "ecommerce", "investor"],
        basis: "profit",
        rate: 0.19,
        social: { rate: 0.049, minAnnual: 6_500 }, // big ZUS + 4.9% health
      },
    ],
    vat: 23,
    notes: "Ecommerce (goods) can use ryczałt ~3% of revenue (revenue ≤ €2M) — often the cheapest; otherwise 19% flat on profit. All add fixed ZUS (~$5.8k/yr) + health. Ryczałt ZUS+health is revenue-banded (~$7.3k–$10.3k/yr); high-revenue sellers hit the top band. 2026 figures verified.",
    confidence: "high",
  },
  HU: {
    employed: { low: 0.28, mid: 0.3, high: 0.33 },
    selfEmployed: { low: 0.15, mid: 0.2, high: 0.25 },
    remoteRegime: { rate: 0.15, label: "KATA-style / flat-rate small business schemes", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 80_000 },
    vat: 27,
    notes: "Flat 15% PIT (low!) but high social contributions; highest VAT in the world at 27%.",
    confidence: "medium",
  },
  RO: {
    // PFA self-employed: flat 10% PIT on net profit + capped health (CASS 10% up
    // to ~72 min wages ≈ $64k base). Micro-company (SRL) route: 1% of revenue
    // while turnover ≤ €100k (cap cut from €250k in 2026) + 10% on dividends.
    // RON≈$0.22, EUR≈$1.08.
    employed: { low: 0.2, mid: 0.25, high: 0.3 },
    selfEmployed: { low: 0.1, mid: 0.12, high: 0.14 },
    brackets: [{ upTo: Infinity, rate: 0.1 }],
    selfEmployedSocial: { rate: 0.1, capIncome: 64_000, minAnnual: 3_500 },
    regimes: [
      {
        label: "Micro-company 1% of revenue (≤ €100k) + 10% dividend",
        activities: ["ecommerce", "freelancer"],
        basis: "revenue",
        rate: 0.01,
        social: { rate: 0.1, capIncome: 64_000 }, // ~10% dividend on profit; capIncome proxies the CASS cap
        maxAnnualRevenue: 108_000,
      },
    ],
    vat: 19,
    notes: "Flat 10% income tax. PFA self-employed: 10% on net profit + capped health (CASS). Micro-company (SRL) route: 1% of revenue while turnover ≤ €100k (cap cut from €250k in 2026) plus 10% on dividends — one of the lowest in the EU for small businesses.",
    confidence: "medium",
  },
  BG: {
    // Flat 10% PIT. Social security is charged only up to a low maximum insurable
    // income (~€2,112/mo ⇒ ~$27.4k/yr), so a high earner pays very little social
    // and the all-in rate trends toward ~10%. EUR≈$1.08.
    employed: { low: 0.15, mid: 0.18, high: 0.2 },
    selfEmployed: { low: 0.1, mid: 0.13, high: 0.16 },
    brackets: [{ upTo: Infinity, rate: 0.1 }],
    standardSocial: { rate: 0.1378, capIncome: 27_400 },
    selfEmployedSocial: { rate: 0.278, capIncome: 27_400 },
    regimes: [], // verified flat-tax country; flat 10% + capped social IS the model
    vat: 20,
    notes: "Flat 10% income tax — lowest headline rate in the EU. Social contributions are capped at a low maximum insurable income (~€2,112/mo), so a high earner's all-in rate trends toward ~10%.",
    confidence: "high",
  },
  HR: {
    employed: { low: 0.2, mid: 0.28, high: 0.34 },
    selfEmployed: { low: 0.12, mid: 0.18, high: 0.26 },
    remoteRegime: { rate: 0.0, label: "Digital Nomad Visa: foreign income tax-exempt", appliesTo: REMOTE_ONLY },
    vat: 25,
    notes: "20/30% PIT; the digital-nomad residence permit exempts foreign-sourced income.",
    confidence: "medium",
  },
  EE: {
    // Flat 22% PIT (2026), €700/mo tax-free. The famous route: an Estonian OÜ
    // (e-Residency) pays 0% on RETAINED profit, 22% only on distribution. A
    // sole-proprietor (FIE) instead pays 22% + 33% social tax. EUR≈$1.08.
    employed: { low: 0.18, mid: 0.2, high: 0.22 },
    selfEmployed: { low: 0.18, mid: 0.2, high: 0.22 },
    brackets: [
      { upTo: 9_000, rate: 0 },
      { upTo: Infinity, rate: 0.22 },
    ],
    standardSocial: { rate: 0.016 }, // employee unemployment; 33% social tax is employer-side
    selfEmployedSocial: { rate: 0.33 }, // FIE sole-proprietor social tax
    regimes: [
      {
        label: "Estonian OÜ: 0% on retained, 22% on distributed profit",
        activities: ["ecommerce", "freelancer", "investor"],
        basis: "profit",
        rate: 0.22,
      },
    ],
    vat: 24,
    notes: "Flat 22% income tax (€700/mo tax-free). Corporate tax is deferred until profits are distributed, so an e-Residency OÜ pays 0% on retained profit and 22% on dividends — no social tax on distributions. Sole-proprietor (FIE) route is heavier (22% + 33% social).",
    confidence: "high",
  },
  LV: {
    employed: { low: 0.21, mid: 0.27, high: 0.31 },
    selfEmployed: { low: 0.15, mid: 0.2, high: 0.28 },
    vat: 21,
    notes: "Progressive 20/23/31% + mandatory social; micro-business regime available.",
    confidence: "medium",
  },
  LT: {
    employed: { low: 0.2, mid: 0.25, high: 0.3 },
    selfEmployed: { low: 0.1, mid: 0.15, high: 0.2 },
    remoteRegime: { rate: 0.1, label: "Individual-activity certificate ~5–15% effective", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 120_000 },
    vat: 21,
    notes: "20%/32% PIT; self-employed 'individual activity' regime is very low for small income.",
    confidence: "medium",
  },
  GE: {
    // 20% flat PIT for individuals; territorial. Small Business Status taxes 1%
    // of turnover up to ₾500k (~$185k) then 3% just above; status is LOST above
    // the cap, reverting to 20% on profit. GEL≈$0.37.
    employed: { low: 0.2, mid: 0.2, high: 0.2 },
    selfEmployed: { low: 0.01, mid: 0.01, high: 0.2 },
    brackets: [{ upTo: Infinity, rate: 0.2 }],
    selfEmployedSocial: { rate: 0 }, // 2% pension; foreigners typically exempt
    regimes: [
      {
        label: "Small Business Status: 1% of turnover (≤ ₾500k)",
        activities: ["ecommerce", "freelancer"],
        basis: "revenue",
        rate: 0.01,
        maxAnnualRevenue: 185_000,
      },
      {
        label: "3% of turnover (small-business slice over ₾500k)",
        activities: ["ecommerce", "freelancer"],
        basis: "revenue",
        rate: 0.03,
        maxAnnualRevenue: 700_000,
      },
    ],
    vat: 18,
    notes: "Territorial system + 20% flat PIT. Individual-entrepreneur Small Business Status taxes 1% of turnover up to ₾500k (~$185k), 3% just above; status is lost above the cap, reverting to 20% on profit. One of the best for small online/self-employed.",
    confidence: "high",
  },

  /* ------------------------- Middle East / Other ----------------------- */
  IL: {
    employed: { low: 0.18, mid: 0.3, high: 0.42 },
    selfEmployed: { low: 0.2, mid: 0.33, high: 0.46 },
    vat: 18,
    notes: "Progressive to 50% incl. surtax + Bituach Leumi; new-immigrant (Oleh) 10-yr foreign-income exemption.",
    confidence: "high",
  },
  AE: {
    // No personal income tax. A natural person's BUSINESS profit faces 9%
    // corporate tax only on the slice above AED 375k (~$101k USD-equiv), and
    // only once turnover tops AED 1M. Small Business Relief = 0% while turnover
    // ≤ AED 3M (through end-2026). AED≈$0.27.
    employed: { low: 0.0, mid: 0.0, high: 0.0 },
    selfEmployed: { low: 0.0, mid: 0.0, high: 0.09 },
    brackets: [
      { upTo: 101_000, rate: 0 },
      { upTo: Infinity, rate: 0.09 },
    ],
    selfEmployedSocial: { rate: 0 }, // no social security for expats
    regimes: [
      { label: "0% personal income tax", activities: ["investor"], basis: "profit", rate: 0 },
      {
        label: "Small Business Relief: 0% (turnover ≤ AED 3M, until end-2026)",
        activities: ["ecommerce", "freelancer"],
        basis: "profit",
        rate: 0,
        maxAnnualRevenue: 810_000, // AED 3M
      },
    ],
    vat: 5,
    notes: "No personal income tax. A natural person's business profit faces 9% corporate tax only above AED 375k (~$101k) and only once turnover tops AED 1M; Small Business Relief gives 0% while turnover ≤ AED 3M (through 2026). 5% VAT.",
    confidence: "high",
  },

  /* ------------------------------- Asia -------------------------------- */
  SG: {
    employed: { low: 0.05, mid: 0.1, high: 0.16 },
    selfEmployed: { low: 0.05, mid: 0.11, high: 0.17 },
    vat: 9,
    notes: "Low progressive rates (to 24% only at very high income); territorial — foreign income often untaxed.",
    confidence: "high",
  },
  JP: {
    employed: { low: 0.2, mid: 0.3, high: 0.4 },
    selfEmployed: { low: 0.2, mid: 0.32, high: 0.43 },
    vat: 10,
    notes: "National + local 10% inhabitant tax + social insurance; progressive to 45%.",
    confidence: "medium",
  },
  KR: {
    employed: { low: 0.15, mid: 0.26, high: 0.36 },
    selfEmployed: { low: 0.16, mid: 0.28, high: 0.4 },
    vat: 10,
    notes: "Progressive to 45% + local surtax + national pension/health.",
    confidence: "medium",
  },
  HK: {
    employed: { low: 0.08, mid: 0.13, high: 0.15 },
    selfEmployed: { low: 0.08, mid: 0.13, high: 0.15 },
    vat: 0,
    notes: "Salaries tax capped at 15% standard rate; territorial, no VAT/sales tax.",
    confidence: "high",
  },
  TW: {
    employed: { low: 0.08, mid: 0.16, high: 0.27 },
    selfEmployed: { low: 0.1, mid: 0.18, high: 0.3 },
    vat: 5,
    notes: "Progressive to 40%; foreign-sourced income largely outside the net for residents. Low VAT.",
    confidence: "medium",
  },
  TH: {
    employed: { low: 0.08, mid: 0.17, high: 0.26 },
    selfEmployed: { low: 0.08, mid: 0.18, high: 0.28 },
    remoteRegime: { rate: 0.0, label: "Foreign income not remitted same year often untaxed (LTR visa 0%)", appliesTo: REMOTE_ONLY },
    vat: 7,
    notes: "Progressive to 35%; remittance rules + LTR visa can make foreign income tax-light.",
    confidence: "medium",
  },
  MY: {
    employed: { low: 0.08, mid: 0.18, high: 0.26 },
    selfEmployed: { low: 0.08, mid: 0.18, high: 0.28 },
    remoteRegime: { rate: 0.0, label: "Foreign-sourced income exemption (extended) / DE Rantau nomad pass", appliesTo: REMOTE_ONLY },
    vat: 8, // SST
    notes: "Progressive to 30%; foreign-sourced personal income generally exempt for individuals.",
    confidence: "medium",
  },
  VN: {
    employed: { low: 0.1, mid: 0.2, high: 0.3 },
    selfEmployed: { low: 0.07, mid: 0.1, high: 0.15 },
    vat: 10,
    notes: "Progressive to 35% for employment; business individuals taxed ~ a few % of revenue.",
    confidence: "low",
  },

  /* ----------------------------- Oceania ------------------------------- */
  AU: {
    employed: { low: 0.18, mid: 0.27, high: 0.36 },
    selfEmployed: { low: 0.18, mid: 0.28, high: 0.38 },
    vat: 10,
    notes: "Progressive to 45% + 2% Medicare levy; $18,200 tax-free threshold.",
    confidence: "high",
  },
  NZ: {
    employed: { low: 0.16, mid: 0.24, high: 0.32 },
    selfEmployed: { low: 0.16, mid: 0.25, high: 0.33 },
    vat: 15,
    notes: "Progressive to 39%; no social-security payroll tax, no capital gains tax.",
    confidence: "high",
  },

  /* -------------------------- Latin America ---------------------------- */
  CR: {
    employed: { low: 0.1, mid: 0.16, high: 0.22 },
    selfEmployed: { low: 0.1, mid: 0.17, high: 0.24 },
    remoteRegime: { rate: 0.0, label: "Digital Nomad Visa: foreign income tax-exempt", appliesTo: REMOTE_ONLY },
    vat: 13,
    notes: "Territorial system — only Costa Rica-source income taxed; nomad visa confirms 0% on foreign income.",
    confidence: "medium",
  },
  PA: {
    employed: { low: 0.08, mid: 0.15, high: 0.22 },
    selfEmployed: { low: 0.08, mid: 0.15, high: 0.24 },
    remoteRegime: { rate: 0.0, label: "Territorial: foreign-source income 0%", appliesTo: REMOTE_ONLY },
    vat: 7,
    notes: "Strict territorial taxation — income earned abroad is not taxed in Panama.",
    confidence: "high",
  },
  UY: {
    employed: { low: 0.1, mid: 0.2, high: 0.28 },
    selfEmployed: { low: 0.12, mid: 0.22, high: 0.3 },
    remoteRegime: { rate: 0.0, label: "Tax holiday on foreign income for new residents (up to 11 yrs)", appliesTo: REMOTE_ONLY },
    vat: 22,
    notes: "IRPF progressive to 36%; new residents get a multi-year exemption on foreign investment income.",
    confidence: "medium",
  },

  /* ------------------ Europe (completing the map) ---------------------- */
  SK: {
    employed: { low: 0.2, mid: 0.25, high: 0.3 },
    selfEmployed: { low: 0.15, mid: 0.2, high: 0.28 },
    vat: 20,
    notes: "19/25% income tax + social/health; 60% flat-expense lump sum helps freelancers.",
    confidence: "medium",
  },
  SI: {
    employed: { low: 0.22, mid: 0.34, high: 0.45 },
    selfEmployed: { low: 0.15, mid: 0.25, high: 0.4 },
    remoteRegime: { rate: 0.2, label: "Normalised-expense lump-sum scheme for sole traders", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 65_000 },
    vat: 22,
    notes: "Steeply progressive to 50%, but the 'normirani' lump-sum regime is low for small turnover.",
    confidence: "medium",
  },
  RS: {
    employed: { low: 0.18, mid: 0.2, high: 0.22 },
    selfEmployed: { low: 0.1, mid: 0.13, high: 0.18 },
    remoteRegime: { rate: 0.1, label: "Flat-rate entrepreneur (paušalac) low fixed tax", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 55_000 },
    vat: 20,
    notes: "10% flat income tax; the lump-sum entrepreneur scheme is very low for IT/online work.",
    confidence: "medium",
  },
  ME: {
    employed: { low: 0.11, mid: 0.13, high: 0.15 },
    selfEmployed: { low: 0.1, mid: 0.13, high: 0.16 },
    vat: 21,
    notes: "Flat-ish 9–15% personal income tax — one of the lowest in Europe.",
    confidence: "medium",
  },
  AL: {
    employed: { low: 0.13, mid: 0.2, high: 0.23 },
    selfEmployed: { low: 0.05, mid: 0.1, high: 0.15 },
    remoteRegime: { rate: 0.0, label: "Small self-employed turnover often 0% income tax", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 60_000 },
    vat: 20,
    notes: "Up to 23% on salary; small freelancers/businesses can be effectively untaxed on income tax.",
    confidence: "low",
  },
  MK: {
    employed: { low: 0.1, mid: 0.1, high: 0.1 },
    selfEmployed: { low: 0.08, mid: 0.1, high: 0.1 },
    vat: 18,
    notes: "Flat 10% income tax; low social contributions. Very budget-friendly.",
    confidence: "medium",
  },
  BA: {
    employed: { low: 0.1, mid: 0.1, high: 0.1 },
    selfEmployed: { low: 0.1, mid: 0.1, high: 0.12 },
    vat: 17,
    notes: "Flat 10% income tax; modest VAT. Bureaucracy varies by entity (FBiH vs RS).",
    confidence: "low",
  },
  MD: {
    employed: { low: 0.12, mid: 0.12, high: 0.12 },
    selfEmployed: { low: 0.07, mid: 0.07, high: 0.12 },
    remoteRegime: { rate: 0.07, label: "IT Park residents ~7% single tax on turnover", appliesTo: REMOTE_AND_SELF },
    vat: 20,
    notes: "Flat 12% income tax; the Moldova IT Park offers a ~7% all-in turnover tax for tech.",
    confidence: "low",
  },
  UA: {
    employed: { low: 0.195, mid: 0.195, high: 0.195 },
    selfEmployed: { low: 0.05, mid: 0.06, high: 0.08 },
    remoteRegime: { rate: 0.05, label: "Simplified Group 3: 5% of turnover (+ Diia City for IT)", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 200_000 },
    vat: 20,
    notes: "18% PIT + 1.5% military levy on salary; the 5% simplified single tax is famous for freelancers.",
    confidence: "low",
  },
  TR: {
    employed: { low: 0.2, mid: 0.28, high: 0.36 },
    selfEmployed: { low: 0.18, mid: 0.27, high: 0.38 },
    remoteRegime: { rate: 0.0, label: "Service-export earnings can get major income-tax exemptions", appliesTo: REMOTE_AND_SELF },
    vat: 20,
    notes: "Progressive to 40% + high social premiums; exporters of services get partial exemptions. High inflation.",
    confidence: "low",
  },
  AD: {
    employed: { low: 0.0, mid: 0.05, high: 0.1 },
    selfEmployed: { low: 0.0, mid: 0.05, high: 0.1 },
    vat: 4.5,
    notes: "Max 10% income tax (0% under €24k), 4.5% VAT — among the lowest in Europe.",
    confidence: "medium",
  },
  MC: {
    employed: { low: 0.0, mid: 0.0, high: 0.0 },
    selfEmployed: { low: 0.0, mid: 0.0, high: 0.0 },
    remoteRegime: { rate: 0.0, label: "0% personal income tax (except French nationals)", appliesTo: ["employed", "self_employed", "remote_foreign"] },
    vat: 20,
    notes: "No personal income tax for residents (French citizens excepted by treaty).",
    confidence: "high",
  },
  LI: {
    employed: { low: 0.05, mid: 0.1, high: 0.18 },
    selfEmployed: { low: 0.06, mid: 0.12, high: 0.2 },
    vat: 8.1,
    notes: "Low national + communal income tax (to ~22.4% top) and very low VAT (Swiss system).",
    confidence: "medium",
  },

  /* ----------------------------- Latin America ------------------------- */
  BR: {
    employed: { low: 0.12, mid: 0.22, high: 0.28 },
    selfEmployed: { low: 0.14, mid: 0.24, high: 0.3 },
    vat: 17, // ICMS/ISS combined varies by state/municipality
    notes: "Progressive IRPF to 27.5% + INSS social security; lots of indirect tax.",
    confidence: "medium",
  },
  AR: {
    employed: { low: 0.17, mid: 0.27, high: 0.35 },
    selfEmployed: { low: 0.12, mid: 0.22, high: 0.32 },
    remoteRegime: { rate: 0.1, label: "Monotributo flat small-business regime", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 70_000 },
    vat: 21,
    notes: "High progressive tax, but Monotributo is a low flat regime for small earners. Figures volatile with inflation.",
    confidence: "low",
  },
  CL: {
    employed: { low: 0.08, mid: 0.16, high: 0.27 },
    selfEmployed: { low: 0.09, mid: 0.18, high: 0.28 },
    vat: 19,
    notes: "Global Complementary tax up to 40% but effective rates are moderate at mid incomes.",
    confidence: "medium",
  },
  CO: {
    employed: { low: 0.1, mid: 0.19, high: 0.3 },
    selfEmployed: { low: 0.1, mid: 0.2, high: 0.31 },
    vat: 19,
    notes: "Progressive up to 39% + health/pension contributions.",
    confidence: "medium",
  },
  EC: {
    employed: { low: 0.06, mid: 0.14, high: 0.25 },
    selfEmployed: { low: 0.07, mid: 0.15, high: 0.26 },
    vat: 15,
    notes: "Progressive up to 37%; uses US dollar so no currency risk. Estimates approximate.",
    confidence: "low",
  },

  /* -------------------------------- Asia ------------------------------- */
  ID: {
    employed: { low: 0.1, mid: 0.2, high: 0.3 },
    selfEmployed: { low: 0.1, mid: 0.2, high: 0.3 },
    remoteRegime: { rate: 0.0, label: "Remote-worker visa: foreign-source income exempt", appliesTo: REMOTE_ONLY },
    vat: 11,
    notes: "Progressive to 35%; the new remote-worker visa can exempt foreign-source income for qualifying nomads.",
    confidence: "medium",
  },
  PH: {
    employed: { low: 0.1, mid: 0.2, high: 0.3 },
    selfEmployed: { low: 0.08, mid: 0.15, high: 0.25 },
    remoteRegime: { rate: 0.08, label: "8% flat tax for small self-employed", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 55_000 },
    vat: 12,
    notes: "Progressive to 35%; small self-employed can elect a simple 8% flat tax.",
    confidence: "medium",
  },
  IN: {
    employed: { low: 0.08, mid: 0.18, high: 0.28 },
    selfEmployed: { low: 0.09, mid: 0.19, high: 0.29 },
    vat: 18, // GST standard rate
    notes: "New regime to 30% + 4% cess; presumptive schemes exist for small professionals.",
    confidence: "medium",
  },

  /* --------------------- Middle East / North Africa -------------------- */
  SA: {
    employed: { low: 0.0, mid: 0.0, high: 0.0 },
    selfEmployed: { low: 0.0, mid: 0.0, high: 0.0 },
    vat: 15,
    notes: "No personal income tax on individuals (expats pay 0% on salary).",
    confidence: "high",
  },
  QA: {
    employed: { low: 0.0, mid: 0.0, high: 0.0 },
    selfEmployed: { low: 0.0, mid: 0.0, high: 0.0 },
    vat: 0,
    notes: "No personal income tax and no VAT currently implemented.",
    confidence: "high",
  },
  BH: {
    employed: { low: 0.0, mid: 0.0, high: 0.0 },
    selfEmployed: { low: 0.0, mid: 0.0, high: 0.0 },
    vat: 10,
    notes: "No personal income tax; only social insurance for nationals.",
    confidence: "high",
  },
  MA: {
    employed: { low: 0.1, mid: 0.22, high: 0.32 },
    selfEmployed: { low: 0.1, mid: 0.2, high: 0.3 },
    remoteRegime: { rate: 0.05, label: "Auto-entrepreneur ~1–3% turnover tax (small)", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 50_000 },
    vat: 20,
    notes: "Progressive IR up to 38%; the auto-entrepreneur regime taxes only a tiny % of turnover.",
    confidence: "low",
  },

  /* --------------------- Caucasus / Central Asia ----------------------- */
  AM: {
    employed: { low: 0.2, mid: 0.2, high: 0.2 },
    selfEmployed: { low: 0.1, mid: 0.15, high: 0.2 },
    remoteRegime: { rate: 0.05, label: "Micro-business / turnover tax ~5%", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 290_000 },
    vat: 20,
    notes: "Flat 20% income tax; micro-business and IT regimes cut this sharply for small/self earners.",
    confidence: "medium",
  },
  KZ: {
    employed: { low: 0.1, mid: 0.1, high: 0.1 },
    selfEmployed: { low: 0.05, mid: 0.05, high: 0.05 },
    remoteRegime: { rate: 0.03, label: "Simplified declaration ~3% of turnover", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 200_000 },
    vat: 12,
    notes: "Flat 10% personal income tax; simplified 3% regime for small business.",
    confidence: "medium",
  },

  /* ----------------------- Africa / Indian Ocean ----------------------- */
  ZA: {
    employed: { low: 0.16, mid: 0.26, high: 0.35 },
    selfEmployed: { low: 0.17, mid: 0.27, high: 0.36 },
    vat: 15,
    notes: "Progressive up to 45% + UIF; foreign income can be partly exempt under the s10(1)(o)(ii) cap.",
    confidence: "high",
  },
  MU: {
    employed: { low: 0.1, mid: 0.13, high: 0.15 },
    selfEmployed: { low: 0.1, mid: 0.13, high: 0.15 },
    remoteRegime: { rate: 0.0, label: "Premium visa: unremitted foreign income exempt", appliesTo: REMOTE_ONLY },
    vat: 15,
    notes: "Flat 10–15% income tax; under the Premium nomad visa, foreign income not remitted to Mauritius is exempt.",
    confidence: "medium",
  },
};

/** Lookup a tax profile by country code (case-insensitive). */
export function taxProfileFor(code: string | undefined): TaxProfile | undefined {
  if (!code) return undefined;
  return TAX_PROFILES[code.toUpperCase()];
}
