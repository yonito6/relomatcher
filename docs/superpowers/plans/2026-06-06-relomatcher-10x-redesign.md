# ReloMatcher 10X Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ReloMatcher's matching engine and quiz/results experience so the match is honest (passport-feasibility + income reality + filters-vs-differentiators) and the UI is a fun, mobile-first, retention-driven journey ending in a top-3 + one moonshot.

**Architecture:** Pure, unit-tested core (`lib/factors.ts`, `lib/scoring/`, `lib/feasibility/`) depending only on `QuizData` + the country DB. A thin API route orchestrates them and adds optional AI note-polish. A new mobile-first quiz flow (6 step components) and a Results component tree consume a new API contract. Built test-first for the logic; built with the frontend-design skill for the UI.

**Tech Stack:** Next.js 16 (app router), React 19, Tailwind 4, TypeScript, Vitest (new), OpenAI SDK (optional), Stripe + @react-pdf (existing, upsell entry only).

**Spec:** `docs/superpowers/specs/2026-06-06-relomatcher-10x-redesign-design.md`

---

## File Structure

**Create:**
- `vitest.config.ts` — test runner config.
- `lib/factors.ts` — factor definitions, roles (filter|differentiator), weight constants, multi-field mappings. Single source of truth.
- `lib/scoring/types.ts` — `FactorId`, `Rating`, `FactorRatings`, `Profile`, `CountryFit`, `MatchResult` types.
- `lib/scoring/score.ts` — pure scoring: per-country fit, money bundle, hard filters + graceful fallback, top-3 + moonshot selection.
- `lib/scoring/score.test.ts` — unit + golden-profile tests.
- `lib/feasibility/passport.ts` — passport→strength-bucket table + helper.
- `lib/feasibility/openness.ts` — per-country coarse openness level (~48 entries) + EU/EEA set.
- `lib/feasibility/tier.ts` — `feasibilityTier(profile, country)` → tier + reason.
- `lib/feasibility/tier.test.ts` — unit tests incl. EU freedom-of-movement special case.
- `app/quiz/steps/Hook.tsx`, `Basics.tsx`, `SwipeDeck.tsx`, `Refine.tsx`, `Reveal.tsx`, `Results.tsx`, `CountryCard.tsx` — step/results components.

**Modify:**
- `package.json` — add Vitest + scripts.
- `lib/types.tsx` — replace `RelocationReasonId` flag union + scattered sliders with `factorRatings`, `climatePref`, `culturePref`, `mobilityRights`; keep passport/income.
- `app/api/quiz/route.ts` — slim orchestrator using the new core; new response contract.
- `app/quiz/page.tsx` — drive the 6-step flow; remove debug `<pre>` dump; render new Results.

**Delete:**
- `m.name)`, `setCopied(false)` (junk, verify literal names first).

---

## Chunk 1: Test setup + factor model

### Task 1: Add Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Expected: added to devDependencies, no errors.

- [ ] **Step 2: Add test script to package.json**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

- [ ] **Step 4: Verify runner works**

Run: `npm test`
Expected: exits 0 with "No test files found" (or runs 0 tests).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

### Task 2: Factor definitions & weights

**Files:**
- Create: `lib/factors.ts`
- Create: `lib/scoring/types.ts`
- Test: `lib/factors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/factors.test.ts
import { describe, it, expect } from "vitest";
import { FACTORS, ratingWeight } from "@/lib/factors";

describe("factors", () => {
  it("has 10 factors with the agreed headline 5 present", () => {
    const ids = FACTORS.map((f) => f.id);
    expect(FACTORS).toHaveLength(10);
    for (const id of ["weather","safety","lgbt","language","jobs"]) {
      expect(ids).toContain(id);
    }
  });
  it("classifies safety/lgbt/healthcare as filters", () => {
    const role = (id: string) => FACTORS.find((f) => f.id === id)!.role;
    expect(role("safety")).toBe("filter");
    expect(role("lgbt")).toBe("filter");
    expect(role("healthcare")).toBe("filter");
    expect(role("weather")).toBe("differentiator");
  });
  it("maps ratings to weights (dont_care=0)", () => {
    expect(ratingWeight("dont_care")).toBe(0);
    expect(ratingWeight("nice")).toBe(1);
    expect(ratingWeight("important")).toBe(2.5);
    expect(ratingWeight("must")).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/factors.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write types**

```ts
// lib/scoring/types.ts
import type { CountryRecord, CultureCluster } from "@/lib/countriesDb";

export type FactorId =
  | "weather" | "safety" | "lgbt" | "language" | "jobs"
  | "costOfLiving" | "taxes" | "healthcare" | "culture" | "social";
export type Rating = "dont_care" | "nice" | "important" | "must";
export type FactorRole = "filter" | "differentiator";
export type FactorRatings = Partial<Record<FactorId, Rating>>;
export type ClimatePref = "warm" | "mild" | "cold";
export type CulturePref = CultureCluster;
export type MobilityRights = "eu_eea" | "strong_passport" | "none";

// feasibility (single source of truth for Tier — tier.ts imports this)
export type Tier = "easy" | "doable" | "hard" | "very_hard";

// scoring result shapes (used by score.ts, the API contract, and the UI)
export type Breakdown = { id: FactorId; score: number; weight: number; combined?: boolean };
export type CountryFit = { fit: number; breakdown: Breakdown[] };
export type MatchResult = {
  country: CountryRecord;
  fit: number;            // 0–100, feasibility-adjusted for ranking
  rawFit: number;         // 0–100, before feasibility nudge (used for moonshot)
  tier: Tier;
  reason: string;         // feasibility reason (one line)
  tradeoff: string;       // honest weakest-kept-factor line
  note?: string;          // optional AI-polished blurb
  breakdown: Breakdown[];
  moonshot?: boolean;
};
```

- [ ] **Step 4: Write factors**

```ts
// lib/factors.ts
import type { FactorId, FactorRole, Rating } from "@/lib/scoring/types";

export type FactorDef = {
  id: FactorId;
  label: string;
  emoji: string;
  role: FactorRole;
  /** Numeric DB fields this factor reads; multi-field factors average them (0–10). Empty when `derived` is set. */
  fields: string[];
  /** Special resolver for non-numeric/derived scores. "climate" uses climatePref; "culture" uses culturePref + cultureClusters. */
  derived?: "climate" | "culture";
  /** for filters: minimum acceptable country score at each rating */
  floor?: Partial<Record<Rating, number>>;
};

export const FACTORS: FactorDef[] = [
  { id: "weather", label: "Weather", emoji: "🌦️", role: "differentiator", fields: [], derived: "climate" },
  { id: "safety", label: "Safety & stability", emoji: "🛡️", role: "filter", fields: ["safetyScore"], floor: { nice: 0, important: 5.5, must: 7 } },
  { id: "lgbt", label: "LGBTQ+ acceptance", emoji: "🏳️‍🌈", role: "filter", fields: ["lgbtScore"], floor: { nice: 0, important: 6, must: 7.5 } },
  { id: "language", label: "Language ease", emoji: "🗣️", role: "differentiator", fields: ["englishScore"] },
  { id: "jobs", label: "Jobs & income", emoji: "💼", role: "differentiator", fields: ["incomeGrowthScore","remoteFriendlyScore"] },
  { id: "costOfLiving", label: "Cost of living", emoji: "💸", role: "differentiator", fields: ["costOfLivingScore"] },
  { id: "taxes", label: "Low taxes", emoji: "🧾", role: "differentiator", fields: ["taxScore","netIncomePercentTypical"] },
  { id: "healthcare", label: "Healthcare", emoji: "🏥", role: "filter", fields: ["healthcareScore"], floor: { nice: 0, important: 5, must: 6.5 } },
  { id: "culture", label: "Culture & vibe", emoji: "🌍", role: "differentiator", fields: [], derived: "culture" },
  { id: "social", label: "Social life", emoji: "🎉", role: "differentiator", fields: ["socialSceneScore","expatSceneScore"] },
];

export function ratingWeight(r: Rating): number {
  switch (r) {
    case "dont_care": return 0;
    case "nice": return 1;
    case "important": return 2.5;
    case "must": return 4;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- lib/factors.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/factors.ts lib/scoring/types.ts lib/factors.test.ts
git commit -m "feat: factor model with roles and rating weights"
```

---

## Chunk 2: Feasibility

### Task 3: Passport buckets

**Files:**
- Create: `lib/feasibility/passport.ts`
- Test: `lib/feasibility/passport.test.ts`

- [ ] **Step 1: Failing test**

```ts
// lib/feasibility/passport.test.ts
import { describe, it, expect } from "vitest";
import { passportBucket } from "@/lib/feasibility/passport";

describe("passportBucket", () => {
  it("EU member -> eu_eea", () => expect(passportBucket("Germany")).toBe("eu_eea"));
  it("US -> strong", () => expect(passportBucket("United States")).toBe("strong"));
  it("unknown -> mid", () => expect(passportBucket("Atlantis")).toBe("mid"));
});
```

- [ ] **Step 2: Run, verify fail.** Run: `npm test -- lib/feasibility/passport.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/feasibility/passport.ts
export type PassportBucket = "eu_eea" | "strong" | "mid" | "weak";

const EU_EEA = new Set([
  "Austria","Belgium","Bulgaria","Croatia","Cyprus","Czechia","Denmark","Estonia",
  "Finland","France","Germany","Greece","Hungary","Iceland","Ireland","Italy",
  "Latvia","Liechtenstein","Lithuania","Luxembourg","Malta","Netherlands","Norway",
  "Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden",
]);
const STRONG = new Set([
  "United States","United Kingdom","Canada","Australia","New Zealand","Japan",
  "South Korea","Singapore","Switzerland",
]);

export function passportBucket(country?: string | null): PassportBucket {
  if (!country) return "mid";
  if (EU_EEA.has(country)) return "eu_eea";
  if (STRONG.has(country)) return "strong";
  return "mid";
}
export { EU_EEA };
```

- [ ] **Step 4: Run, verify pass.** Expected: PASS (3).

- [ ] **Step 5: Commit**

```bash
git add lib/feasibility/passport.ts lib/feasibility/passport.test.ts
git commit -m "feat: passport strength buckets"
```

### Task 4: Country openness + tier

**Files:**
- Create: `lib/feasibility/openness.ts` (one entry per country code in COUNTRIES; level 0–2 = closed/medium/open)
- Create: `lib/feasibility/tier.ts`
- Test: `lib/feasibility/tier.test.ts`

- [ ] **Step 1: Failing test**

```ts
// lib/feasibility/tier.test.ts
import { describe, it, expect } from "vitest";
import { feasibilityTier } from "@/lib/feasibility/tier";

const PT = { code: "PT", name: "Portugal" } as any;
const AE = { code: "AE", name: "United Arab Emirates" } as any;

describe("feasibilityTier", () => {
  it("EU passport into EU = easy via freedom of movement", () => {
    const t = feasibilityTier({ passportCountry: "Germany" } as any, PT);
    expect(t.tier).toBe("easy");
    expect(t.reason).toMatch(/freedom of movement/i);
  });
  it("declared eu_eea rights also = easy into EU", () => {
    const t = feasibilityTier({ mobilityRights: "eu_eea" } as any, PT);
    expect(t.tier).toBe("easy");
  });
  it("mid passport into a closed country = hard/very hard", () => {
    const t = feasibilityTier({ passportCountry: "Atlantis" } as any, AE);
    expect(["hard","very_hard"]).toContain(t.tier);
  });
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement openness** — author a coarse `OPENNESS: Record<string, 0|1|2>` with **one entry for every code in `COUNTRIES`** (the 48 codes already grepped: US,CA,MX,GB,IE,FR,DE,NL,BE,LU,CH,AT,DK,SE,NO,FI,IS,PT,ES,IT,GR,CY,MT,CZ,PL,HU,RO,BG,HR,EE,LV,LT,GE,IL,SG,JP,KR,HK,TW,TH,MY,VN,AU,NZ,AE,CR,PA,UY). Levels: nomad-visa/long-stay friendly = 2 (e.g. PT, EE, MX, CR, GE, TH, UY, PA, ES, HR); normal = 1; restrictive = 0 (e.g. AE, SG, HK strict long-stay; JP/KR harder). **Also define `EU_EEA_CODES`** as a `Set` of the EU/EEA *codes* (AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IS,IE,IT,LV,LI,LT,LU,MT,NL,NO,PL,PT,RO,SK,SI,ES,SE) — NOT a copy of the name-based set in passport.ts (a name copy would never match `c.code`). Add a sanity comment citing that values are estimates per spec Section 6.

- [ ] **Step 3b: Openness sanity test** — add `lib/feasibility/openness.test.ts` asserting (a) every `COUNTRIES` code has an `OPENNESS` entry, (b) anchor cases: `OPENNESS.PT === 2`, `OPENNESS.AE === 0`, and (c) `EU_EEA_CODES.has("PT")` true, `EU_EEA_CODES.has("AE")` false. Run → expect PASS.

- [ ] **Step 4: Implement tier**

```ts
// lib/feasibility/tier.ts
import { passportBucket } from "./passport";
import { OPENNESS, EU_EEA_CODES } from "./openness";
import type { CountryRecord } from "@/lib/countriesDb";
import type { QuizData } from "@/lib/types";
import type { Tier } from "@/lib/scoring/types"; // single source of truth

export type Feasibility = { tier: Tier; reason: string };

export function feasibilityTier(profile: QuizData, c: CountryRecord): Feasibility {
  const bucket = (profile as any).mobilityRights === "eu_eea"
    ? "eu_eea"
    : passportBucket(profile.passportCountry) === "eu_eea" ||
      passportBucket((profile as any).secondPassportCountry) === "eu_eea"
      ? "eu_eea" : passportBucket(profile.passportCountry);

  if (bucket === "eu_eea" && EU_EEA_CODES.has(c.code)) {
    return { tier: "easy", reason: "EU/EEA freedom of movement — you can live and work here." };
  }
  const open = OPENNESS[c.code] ?? 1;
  if (bucket === "strong") {
    return open >= 1
      ? { tier: "doable", reason: "Visa-free entry plus realistic long-stay/nomad routes for your passport." }
      : { tier: "hard", reason: "Limited long-stay options for your passport." };
  }
  // mid / weak
  if (open >= 2) return { tier: "doable", reason: "Has accessible long-stay/nomad visa routes." };
  if (open === 1) return { tier: "hard", reason: "Long-stay residency is possible but not easy for your passport." };
  return { tier: "very_hard", reason: "No easy long-stay route for your passport." };
}
```

- [ ] **Step 5: Run, verify pass.**

- [ ] **Step 6: Commit**

```bash
git add lib/feasibility/openness.ts lib/feasibility/tier.ts lib/feasibility/tier.test.ts
git commit -m "feat: feasibility tier model with EU freedom-of-movement"
```

---

## Chunk 3: Scoring engine

### Task 5: Per-country fit + money bundle + don't-care drop

**Files:**
- Create: `lib/scoring/score.ts`
- Test: `lib/scoring/score.test.ts`

- [ ] **Step 1: Failing test** (fit, money bundle counts once, dont_care dropped)

```ts
// lib/scoring/score.test.ts
import { describe, it, expect } from "vitest";
import { scoreCountry } from "@/lib/scoring/score";
import type { QuizData } from "@/lib/types";

const c = (over: any) => ({
  code: "X", name: "X", taxScore: 8, costOfLivingScore: 8, incomeGrowthScore: 5,
  remoteFriendlyScore: 6, safetyScore: 8, lifestyleScore: 7, lgbtScore: 8,
  englishScore: 7, healthcareScore: 7, socialSceneScore: 6, expatSceneScore: 6,
  warmClimateScore: 9, mildClimateScore: 6, coldClimateScore: 3,
  cultureClusters: ["southern_europe"], mainLanguages: ["English"],
  netIncomePercentTypical: 80, shortNote: "", ...over,
});

describe("scoreCountry", () => {
  it("drops dont_care factors (weight 0) and returns 0-100 fit", () => {
    const profile = { factorRatings: { weather: "must", taxes: "dont_care" } } as QuizData;
    const r = scoreCountry(profile, c({}));
    expect(r.fit).toBeGreaterThan(0);
    expect(r.fit).toBeLessThanOrEqual(100);
    expect(r.breakdown.find((b) => b.id === "taxes")).toBeUndefined();
  });
  it("money bundle (cost+taxes) contributes one combined voice", () => {
    const r = scoreCountry({ factorRatings: { costOfLiving: "important", taxes: "important" } } as QuizData, c({}));
    const money = r.breakdown.filter((b) => b.id === "costOfLiving" || b.id === "taxes");
    expect(money).toHaveLength(1); // collapsed
    expect(money[0].combined).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement `scoreCountry`** per spec Sections 3–5:
  - **Kept rule (explicit):** a factor is "kept" iff `factorRatings[id]` exists AND is not `"dont_care"`. Absent keys and `"dont_care"` are both dropped (weight 0, excluded from `breakdown`).
  - **Score resolution per factor** (all 0–10):
    - `derived: "climate"` (weather): pick by `profile.climatePref` → `warmClimateScore`/`mildClimateScore`/`coldClimateScore`; if no `climatePref`, mean the three present values.
    - `derived: "culture"` (culture): `10` if `country.cultureClusters` includes `profile.culturePref`, else a graded value (e.g. `5` for a same-continent/adjacent cluster, `2` otherwise); if no `culturePref`, neutral `6`.
    - `taxes`: mean of `taxScore` and `netIncomePercentTypical/10`.
    - other multi-field (`jobs`, `social`): mean of the listed numeric fields.
    - single-field: that field's value.
  - Collapse `costOfLiving`+`taxes` into one "money" contribution (mean of their resolved scores, weight = max of their two rating weights) flagged `combined: true`. Only include money if at least one of the two is kept.
  - Weighted average of kept differentiators (+ small bounded floor-meeting bonus for kept filters: `+0.5 * (score-floor)/(10-floor)` capped) → scale to 0–100.
  - Return `{ fit, breakdown }` where breakdown items are `{ id, score, weight, combined? }`. If no factors are kept, return `fit = 50` (neutral) with empty breakdown.

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Commit** `feat: per-country fit scoring with money bundling`

### Task 6: Hard filters + graceful fallback + ranking (top-3 + moonshot)

**Files:**
- Modify: `lib/scoring/score.ts` (add `rankCountries`)
- Test: `lib/scoring/score.test.ts` (add cases)

- [ ] **Step 1: Failing tests**

```ts
import { rankCountries } from "@/lib/scoring/score";
import { COUNTRIES } from "@/lib/countriesDb";

it("must-have LGBTQ+ disqualifies low-lgbt countries", () => {
  const out = rankCountries({ factorRatings: { lgbt: "must" } } as any, COUNTRIES);
  expect(out.top.every((m) => (m.country.lgbtScore ?? 0) >= 7.5)).toBe(true);
});
it("always returns up to 3 even if a must-have would empty the set", () => {
  const out = rankCountries({ factorRatings: { lgbt: "must", safety: "must" }, } as any,
    COUNTRIES.map((c) => ({ ...c, lgbtScore: 1, safetyScore: 1 })));
  expect(out.top.length).toBeGreaterThanOrEqual(1);
  expect(out.relaxedFilters).toBe(true);
});
it("selects exactly one moonshot outside the achievable top 3 when applicable", () => {
  const out = rankCountries({ factorRatings: { weather: "must" }, passportCountry: "Atlantis" } as any, COUNTRIES);
  expect(out.moonshot === null || out.top.find((t) => t.country.code === out.moonshot!.country.code)).toBeFalsy();
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement `rankCountries`:**
  - For each country: compute `scoreCountry` + `feasibilityTier`.
  - Apply must-have filter floors (Section 3). If qualifying < 3, set `relaxedFilters = true` and convert floors to heavy soft penalties so a top-3 still returns.
  - Apply feasibility soft penalty (bounded; easy=0 … very_hard=−N).
  - `top` = best 3 by adjusted fit. `moonshot` = highest raw-fit country not in `top` whose tier is harder than all of `top` (else null).
  - Return `{ top, moonshot, disqualified, relaxedFilters }` with tier + reason + one tradeoff line (lowest-scoring kept factor) attached to each.

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Add golden-profile tests** — 3 personas from spec Section 11. Assert *properties*, not exact code snapshots (constants are tunable): e.g. LGBTQ+ EU-passport persona → every `top` country has `lgbtScore >= 7.5` and `tier === "easy"`; budget warm-weather persona → top countries have high `warmClimateScore` and good `costOfLivingScore`; low-tax persona → top countries have high `taxScore`. Avoids brittle snapshots during tuning.

- [ ] **Step 6: Run full suite.** Run: `npm test` → all PASS.

- [ ] **Step 7: Commit** `feat: ranking with hard filters, fallback, feasibility, moonshot`

---

## Chunk 4: API + data model

### Task 7: New QuizData type

**Files:** Modify `lib/types.tsx`

- [ ] **Step 1:** Replace `RelocationReasonId` union + `taxImportance/colImportance/climateImportance/lgbtImportance` with:
```ts
import type { FactorRatings, ClimatePref, CulturePref, MobilityRights } from "@/lib/scoring/types";
export interface QuizData {
  ageRange?: string; currentCountry?: string; familyStatus?: string; relocatingWith?: string;
  passportCountry?: string; secondPassportCountry?: string;
  monthlyIncome?: string | number; incomeCurrency?: string; languagesSpoken?: string[];
  factorRatings?: FactorRatings; climatePref?: ClimatePref; culturePref?: CulturePref;
  mobilityRights?: MobilityRights;
}
```
- [ ] **Step 2:** Run `npx tsc --noEmit` → expect errors only in files that still import removed symbols (fixed in Task 8/9).
- [ ] **Step 3: Commit** `refactor: rating-based QuizData type`

### Task 8: Slim API route to new contract

**Files:** Modify `app/api/quiz/route.ts`

- [ ] **Step 1:** Replace the inline scorer with calls to `rankCountries`. New response:
```ts
type QuizApiResponse = {
  ok: boolean; message: string;
  top: MatchResult[];        // up to 3
  moonshot: MatchResult | null;
  disqualified: MatchResult[];
  relaxedFilters: boolean;
  receivedData: QuizData;
};
```
- [ ] **Step 2:** Keep AI as optional note-polish only (rewrites `tradeoff`/`note` strings; never reorders). Preserve no-key + `NEXT_PUBLIC_RM_FAST_MODE` fallbacks.
- [ ] **Step 3:** `npx tsc --noEmit` for this file → clean.
- [ ] **Step 4:** Manual: `curl` POST a sample profile, assert JSON has `top` (≤3) + `moonshot`.
- [ ] **Step 5: Commit** `feat: slim quiz API on new scoring core`

---

## Chunk 5: UI (frontend-design skill)

> Use the frontend-design skill for all visual work in this chunk. Mobile-first, animated (Framer Motion is acceptable to add), retention-framed per spec Section 7. Each step component is presentational, fed data + callbacks by `app/quiz/page.tsx`.

### Task 9: Flow shell + step routing

**Files:** Modify `app/quiz/page.tsx`; create `app/quiz/steps/*`

- [ ] **Step 1:** Read the frontend-design skill. Define the 6-step state machine (hook→basics→swipe→refine→reveal→results) with progress + back.
- [ ] **Step 2:** Remove the debug `<pre>` payload dump (lines ~269–278) and the broken `ResultsPanel` reference (line ~262 — the component is never defined, so the page does not currently compile). The old `components/AdaptiveQuizForm.tsx` and `components/MultiStepForm.tsx` emit the retired `reasons[]`/`RelocationReasonId` shape and are fully replaced by the new `app/quiz/steps/*` components — stop importing them here (deletion handled in Task 12).
- [ ] **Step 3:** Build `Hook` + `Basics` (passport, income, skippable mobilityRights tap) wired to `QuizData`.
- [ ] **Step 4:** Verify build: `npm run build` → success.
- [ ] **Step 5: Commit** `feat: mobile quiz flow shell + hook/basics steps`

### Task 10: Swipe deck + refine

**Files:** `app/quiz/steps/SwipeDeck.tsx`, `Refine.tsx`

- [ ] **Step 1:** `SwipeDeck` — 10 factor cards from `FACTORS`, swipe right=keep / left=dont_care, springy animation, progress.
- [ ] **Step 2:** `Refine` — for kept factors set Nice/Important/Must; sub-questions for weather (climatePref) + culture (culturePref).
- [ ] **Step 3:** Confirm `factorRatings` populates correctly (temporary on-screen echo or console).
- [ ] **Step 4:** `npm run build` → success.
- [ ] **Step 5: Commit** `feat: swipe deck + refine steps (A+C elicitation)`

### Task 11: Reveal + Results + CountryCard

**Files:** `app/quiz/steps/Reveal.tsx`, `Results.tsx`, `CountryCard.tsx`

- [ ] **Step 1:** `Reveal` — suspense loading animation ("Scanning 48… narrowing to your top 3") while POSTing to `/api/quiz`.
- [ ] **Step 2:** `CountryCard` — fit % ring, feasibility badge (🟢🟡🟠🔴 + reason), one honest tradeoff line, per-factor mini-breakdown.
- [ ] **Step 3:** `Results` — top 3 + the moonshot (labeled), "Only realistic moves" toggle (re-rank client-side by hiding harder tiers), share button (reuse `app/api/share-story`), and **Unlock deep report** button (reuse Stripe `create-checkout-session`).
- [ ] **Step 4:** End-to-end manual: complete the quiz on mobile viewport, confirm top-3 + moonshot + badges + tradeoffs render and the upsell button opens checkout.
- [ ] **Step 5:** `npm run build` → success.
- [ ] **Step 6: Commit** `feat: reveal + results + country cards with feasibility & upsell`

---

## Chunk 6: Cleanup & polish

### Task 12: Remove junk + final pass

- [ ] **Step 1:** Verify and delete `m.name)` and `setCopied(false)` if present (`git rm -- 'm.name)' 'setCopied(false)'`).
- [ ] **Step 2:** Grep for dead references to removed `RelocationReasonId`/old API fields (`simpleScore`, `bestMatch`, `disqualifiedTop`, `receivedData`, `taxImportance`, etc.) and remove. Delete now-unused `components/AdaptiveQuizForm.tsx` and `components/MultiStepForm.tsx` if nothing imports them (verify with grep first). Check `components/ResultsTabs.tsx` / `GenerateReportButton.tsx` consumers too.
- [ ] **Step 3:** `npm test` (all pass) + `npm run build` (success).
- [ ] **Step 4: Commit** `chore: remove junk files and dead references`

---

## Verification (whole plan)

- `npm test` → all unit + golden-profile tests pass; engine deterministic without `OPENAI_API_KEY`.
- `npm run build` → succeeds.
- Manual mobile run: hook → basics → swipe → refine → reveal → top-3 + moonshot with badges, tradeoffs, "realistic only" toggle, share, and report upsell.
- Use superpowers:requesting-code-review before declaring done.
