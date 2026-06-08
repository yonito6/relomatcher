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
    employed: { low: 0.18, mid: 0.28, high: 0.36 },
    selfEmployed: { low: 0.17, mid: 0.27, high: 0.37 },
    vat: 20,
    notes: "Income tax 20/40/45% + National Insurance; £12,570 personal allowance.",
    confidence: "high",
  },
  IE: {
    employed: { low: 0.18, mid: 0.3, high: 0.4 },
    selfEmployed: { low: 0.2, mid: 0.33, high: 0.43 },
    vat: 23,
    notes: "20%/40% bands + USC + PRSI; high marginal rate kicks in early.",
    confidence: "high",
  },
  FR: {
    employed: { low: 0.2, mid: 0.3, high: 0.41 },
    selfEmployed: { low: 0.22, mid: 0.34, high: 0.45 },
    remoteRegime: { rate: 0.22, label: "Micro-entrepreneur flat (~13–22% of turnover)", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 220_000 },
    vat: 20,
    notes: "High social charges; auto-entrepreneur scheme caps social+tax low for small turnover.",
    confidence: "high",
  },
  DE: {
    employed: { low: 0.22, mid: 0.33, high: 0.42 },
    selfEmployed: { low: 0.2, mid: 0.34, high: 0.44 },
    vat: 19,
    notes: "Progressive to 45% + solidarity + health/pension; freelancers skip some social if privately insured.",
    confidence: "high",
  },
  NL: {
    employed: { low: 0.22, mid: 0.34, high: 0.43 },
    selfEmployed: { low: 0.18, mid: 0.3, high: 0.42 },
    remoteRegime: { rate: 0.27, label: "30% ruling (partial tax-free) for skilled migrants", appliesTo: ["employed"] },
    vat: 21,
    notes: "Box 1 up to 49.5%; self-employed deductions help; 30% ruling for qualifying expats.",
    confidence: "high",
  },
  BE: {
    employed: { low: 0.26, mid: 0.4, high: 0.48 },
    selfEmployed: { low: 0.25, mid: 0.4, high: 0.5 },
    vat: 21,
    notes: "Among the highest effective rates in the EU; communes add surcharge.",
    confidence: "high",
  },
  LU: {
    employed: { low: 0.18, mid: 0.3, high: 0.4 },
    selfEmployed: { low: 0.2, mid: 0.32, high: 0.42 },
    vat: 17,
    notes: "Lowest VAT in the EU; progressive income tax to 42% + surcharges.",
    confidence: "medium",
  },
  CH: {
    employed: { low: 0.12, mid: 0.2, high: 0.28 },
    selfEmployed: { low: 0.14, mid: 0.22, high: 0.3 },
    vat: 8.1,
    notes: "Low federal tax; canton/commune varies hugely (Zug low, Geneva high). Low VAT.",
    confidence: "medium",
  },
  AT: {
    employed: { low: 0.22, mid: 0.34, high: 0.43 },
    selfEmployed: { low: 0.22, mid: 0.35, high: 0.45 },
    vat: 20,
    notes: "Progressive to 55% top band; significant social insurance.",
    confidence: "high",
  },

  /* ----------------------------- Nordics ------------------------------- */
  DK: {
    employed: { low: 0.3, mid: 0.4, high: 0.48 },
    selfEmployed: { low: 0.3, mid: 0.42, high: 0.52 },
    remoteRegime: { rate: 0.32, label: "Researcher/expat 27% flat scheme (7 yrs)", appliesTo: ["employed"] },
    vat: 25,
    notes: "High income tax + 8% labour-market contribution; 25% VAT. Expat 27% scheme exists.",
    confidence: "high",
  },
  SE: {
    employed: { low: 0.27, mid: 0.34, high: 0.45 },
    selfEmployed: { low: 0.28, mid: 0.38, high: 0.5 },
    vat: 25,
    notes: "Municipal ~32% + state 20% over threshold; high employer/self social fees.",
    confidence: "high",
  },
  NO: {
    employed: { low: 0.25, mid: 0.32, high: 0.4 },
    selfEmployed: { low: 0.26, mid: 0.36, high: 0.45 },
    vat: 25,
    notes: "Flat-ish bracket tax + national insurance; wealth tax also applies.",
    confidence: "high",
  },
  FI: {
    employed: { low: 0.25, mid: 0.36, high: 0.46 },
    selfEmployed: { low: 0.26, mid: 0.38, high: 0.48 },
    vat: 25.5,
    notes: "Municipal + state progressive; among highest VAT in EU.",
    confidence: "high",
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
    employed: { low: 0.2, mid: 0.32, high: 0.43 },
    selfEmployed: { low: 0.2, mid: 0.34, high: 0.45 },
    remoteRegime: { rate: 0.2, label: "IFICI/'NHR 2.0' 20% flat on qualifying income", appliesTo: REMOTE_AND_SELF },
    vat: 23,
    notes: "Normal rates high (to 48%), but the new IFICI regime offers 20% flat for eligible skilled/remote workers.",
    confidence: "medium",
  },
  ES: {
    employed: { low: 0.19, mid: 0.31, high: 0.43 },
    selfEmployed: { low: 0.2, mid: 0.33, high: 0.45 },
    remoteRegime: { rate: 0.24, label: "Beckham law 24% flat (first €600k, 6 yrs)", appliesTo: ["employed", "remote_foreign"] },
    vat: 21,
    notes: "Progressive to ~47%; Beckham regime gives 24% flat to qualifying new arrivals incl. digital-nomad-visa holders.",
    confidence: "high",
  },
  IT: {
    employed: { low: 0.23, mid: 0.35, high: 0.45 },
    selfEmployed: { low: 0.15, mid: 0.27, high: 0.43 },
    remoteRegime: { rate: 0.15, label: "Regime forfettario 5–15% flat (turnover < €85k)", appliesTo: REMOTE_AND_SELF, maxAnnualRevenue: 90_000 },
    vat: 22,
    notes: "High normal IRPEF, but flat-tax 'forfettario' is excellent for small self-employed/freelancers.",
    confidence: "medium",
  },
  GR: {
    employed: { low: 0.18, mid: 0.3, high: 0.42 },
    selfEmployed: { low: 0.2, mid: 0.33, high: 0.44 },
    remoteRegime: { rate: 0.25, label: "50% income-tax exemption for new-resident workers (7 yrs)", appliesTo: ["employed", "remote_foreign"] },
    vat: 24,
    notes: "Progressive to 44% + solidarity; big 50% exemption for relocating professionals.",
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
    employed: { low: 0.15, mid: 0.25, high: 0.32 },
    selfEmployed: { low: 0.15, mid: 0.26, high: 0.33 },
    remoteRegime: { rate: 0.15, label: "Non-dom remittance basis / Nomad Residence 10% flat", appliesTo: REMOTE_AND_SELF },
    vat: 18,
    notes: "Foreign income taxed only if remitted; nomad permit holders pay 10% flat.",
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
    // ZUS (~PLN 1,575/mo ≈ $4.7k/yr) + 9% health on the scale path.
    selfEmployedSocial: { rate: 0.09, minAnnual: 4_700 },
    regimes: [
      {
        label: "Ryczałt 3% of revenue (goods) + ZUS",
        activities: ["ecommerce"],
        basis: "revenue",
        rate: 0.03,
        social: { rate: 0, minAnnual: 9_000 }, // ZUS + top-tier ryczałt health
        maxAnnualRevenue: 2_000_000, // ~€2M ryczałt ceiling
      },
      {
        label: "Ryczałt 8.5% of revenue (services) + ZUS",
        activities: ["freelancer"],
        basis: "revenue",
        rate: 0.085,
        social: { rate: 0, minAnnual: 8_500 },
        maxAnnualRevenue: 2_000_000,
      },
      {
        label: "19% flat tax on profit + ZUS/health",
        activities: ["freelancer", "ecommerce", "investor"],
        basis: "profit",
        rate: 0.19,
        social: { rate: 0.049, minAnnual: 6_000 }, // ZUS + 4.9% health
      },
    ],
    vat: 23,
    notes: "Ecommerce (goods) can use ryczałt ~3% of revenue (revenue ≤ €2M) — often the cheapest; otherwise 19% flat on profit. All add fixed ZUS + health. ZUS/health figures approximated.",
    confidence: "medium",
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
    employed: { low: 0.18, mid: 0.2, high: 0.22 },
    selfEmployed: { low: 0.18, mid: 0.2, high: 0.22 },
    vat: 22,
    notes: "Flat 20% income tax; corporate tax deferred until profits distributed (e-Residency friendly).",
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
