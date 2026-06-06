// Coarse long-stay / residency openness estimates per spec Section 6.
// Values are approximate and will be replaced by real visa data in a future task.
// 2 = nomad-visa / long-stay friendly
// 1 = normal / moderate
// 0 = restrictive long-stay for ordinary foreigners

export const OPENNESS: Record<string, 0 | 1 | 2> = {
  // North America
  US: 1,
  CA: 1,
  MX: 2,  // accessible long-stay / temporary resident routes

  // British Isles
  GB: 1,
  IE: 1,

  // Western Europe
  FR: 1,
  DE: 1,
  NL: 1,
  BE: 1,
  LU: 1,
  CH: 1,
  AT: 1,

  // Nordic / EEA
  DK: 1,
  SE: 1,
  NO: 1,
  FI: 1,
  IS: 1,

  // Southern Europe (several have golden-visa / digital-nomad routes)
  PT: 2,  // anchor: nomad-visa / D8 digital nomad visa, golden visa
  ES: 2,  // digital nomad visa (Beckham law + nomad route)
  IT: 2,  // digital-nomad visa (2024+), several long-stay routes
  GR: 2,  // digital nomad visa + golden visa
  CY: 2,  // fast-track residency + golden visa
  MT: 2,  // digital nomad visa + residency programs

  // Central / Eastern Europe
  CZ: 2,  // freelance / long-stay routes accessible
  PL: 1,
  HU: 1,
  RO: 1,
  BG: 1,
  HR: 2,  // Digital Nomad Visa (Digitalni nomad)
  EE: 2,  // e-Residency + Digital Nomad Visa
  LV: 1,
  LT: 1,

  // Post-Soviet / Caucasus
  GE: 2,  // 365-day visa-free for most + easy residency

  // Middle East
  IL: 1,
  AE: 0,  // anchor: employer-tied visa; no general long-stay for ordinary foreigners

  // Asia-Pacific (strict long-stay)
  SG: 0,  // work permit required; no general long-stay route
  JP: 0,  // strict work/residence permit system
  KR: 0,  // strict residence permit; digital nomad visa very limited
  HK: 0,  // strict; no general long-stay route
  TW: 1,  // Gold Card program is accessible for skilled workers
  TH: 2,  // LTR visa + SMART visa; accessible long-stay routes
  MY: 2,  // MM2H long-stay program
  VN: 0,  // no proper long-stay/nomad visa; tourist extensions only

  // Oceania
  AU: 1,
  NZ: 1,

  // Latin America
  CR: 2,  // Rentista + digital nomad visa
  PA: 2,  // Friendly Nations Visa + pensionado
  UY: 2,  // relatively straightforward residency
};

// EU/EEA country codes — used by feasibilityTier for freedom-of-movement check.
// Note: code-based (not name-based) so it matches CountryRecord.code directly.
export const EU_EEA_CODES = new Set<string>([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR",
  "HU","IS","IE","IT","LV","LI","LT","LU","MT","NL","NO","PL",
  "PT","RO","SK","SI","ES","SE",
]);
