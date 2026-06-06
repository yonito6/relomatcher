# ReloMatcher 10X Redesign — Design Spec

**Date:** 2026-06-06
**Status:** Approved for planning
**Project:** ReloMatcher (`C:\Projects\relomatcher`, GitHub `yonito6/relomatcher`)
**Stack:** Next.js 16 (app router), React 19.2, Tailwind 4, TypeScript, OpenAI SDK, Stripe, @react-pdf/renderer, @vercel/og

## 1. Goal & Strategy

ReloMatcher matches a person to the countries that fit them best. Today it is a 3-step quiz over a hand-tuned 48-country database with a weighted numeric scorer, an LGBT hard-disqualify rule, and an optional OpenAI rerank. This redesign makes it dramatically better on two axes: **match accuracy/honesty** and **a fun, mobile-first, retention-driven experience**.

**Business model (locked): "both, sequenced."** The free quiz is a viral, shareable hook (top of funnel). A paid **deep relocation report** (the existing Stripe + PDF machinery) converts serious users. Affiliates (money transfer, international health insurance, immigration help) are a later layer and are **out of scope** for this redesign.

**Moat — three things ChatGPT/NomadList do poorly:**
1. **Passport-aware feasibility** — can this person *actually* move there, and how hard is it?
2. **Income-aware reality** — what they'd keep / afford, not just "nice lifestyle."
3. **Honest tradeoffs + a gorgeous shareable result** — show what they give up, with credible reasons.

The fun animated UI is the wedge that pulls people in; trust and retention come from results being specific-to-them and actionable.

## 2. Scope

**In scope:**
- New scoring engine (rating-based factor weights, filters vs differentiators, money bundling).
- Feasibility tier model derived from passport(s).
- New mobile-first quiz flow (6 acts) with the A+C priority elicitation.
- New results screen: top 3 + one moonshot, difficulty badges, honest tradeoffs, share card, paid-report upsell.
- Cleanup of known repo issues (junk files, broken `ResultsPanel` reference, debug payload dump).

**Out of scope (explicitly):**
- Real visa/immigration data source (a "soon" fast-follow; v1 uses the approximate tier model).
- Data-grounding of all country scores against external indices (immediate fast-follow after v1; v1 ships on current numbers, with hard-filter factors sanity-checked).
- Affiliate integrations, accounts/auth, saved-history persistence beyond local/session storage, i18n.
- Changes to the Stripe checkout or PDF report internals beyond wiring the new upsell entry point.

## 3. Factors & Roles

Ten factors are presented to the user as a swipe deck. Each is classified by the role it plays in scoring so the match feels personal, not generic.

| Factor | Role | DB fields used |
|---|---|---|
| 🌦️ Weather/climate | Differentiator (+ sub-question: warm/mild/cold) | cold/mild/warmClimateScore |
| 🛡️ Safety & stability | Filter/floor (must-have → hard filter) | safetyScore |
| 🏳️‍🌈 LGBTQ+ acceptance | Filter/floor (must-have → hard filter) | lgbtScore |
| 🗣️ Language ease | Differentiator | englishScore + user languages |
| 💼 Jobs & income opportunity | Differentiator | incomeGrowthScore, remoteFriendlyScore |
| 💸 Cost of living | Differentiator (money bundle) | costOfLivingScore |
| 🧾 Low taxes | Differentiator (money bundle) | taxScore, netIncomePercentTypical |
| 🏥 Healthcare | Filter/floor (soft) | healthcareScore |
| 🌍 Culture & vibe | Differentiator (+ sub-question: region) | cultureClusters |
| 🎉 Social life & community | Differentiator | socialSceneScore, expatSceneScore |

**Rationale for roles:**
- **Filters/floors** (safety, LGBTQ+, healthcare): nearly everyone wants these, so they have low discriminating power. Used as minimum floors and, when marked must-have, hard filters — not big rankers. This prevents the engine from pushing everyone toward the same handful of rich, safe countries.
- **Money bundle** (cost of living + taxes): these correlate. They are combined into one "money fit" contribution so a money-minded user does not double-count affordability and drown out their other answers. The contribution is weighted by how strongly the user rated each of the two.
- **Differentiators** drive the actual ranking and make a user's top 3 distinct from another user's.

## 4. Priority Elicitation (A+C)

**Model (A):** every factor the user keeps gets a rating that maps to a weight:

| Rating | Meaning | Effect |
|---|---|---|
| Don't care | swiped left, or not kept | weight 0 — factor dropped entirely |
| Nice to have | kept, low priority | low weight |
| Important | kept, high priority | high weight |
| Must-have | kept, non-negotiable | hard filter (filter/floor factors) or heaviest weight (differentiators) |

**Interaction (C):** presented as a swipe deck. Swipe left = Don't care, swipe right = matters. Factors swiped right go to a quick refine pass where the user sets Nice / Important / Must-have. Sub-questions appear only for kept factors that need them (weather → warm/mild/cold; culture → preferred region cluster).

Weight mapping (concrete): Nice = 1, Important = 2.5, Must-have differentiator = 4. Floors use the rating to set the minimum acceptable score and the hard-filter trigger rather than a ranking weight. These constants live in one place and are tunable.

**Multi-field factors:** a factor backed by two DB dimensions (Jobs & income → `incomeGrowthScore` + `remoteFriendlyScore`; Social life → `socialSceneScore` + `expatSceneScore`) collapses to a single country score = the mean of its dimensions, and the user's single rating applies one weight to that combined score. Taxes uses `taxScore` combined with `netIncomePercentTypical` (normalized to 0–10) the same way. This keeps each factor exactly one voice in the weighted average.

## 5. Scoring Engine

Replaces the current reason-flag tangle in `app/api/quiz/route.ts` with a single, testable scoring module (e.g. `lib/scoring/`).

**Per country:**
1. **Hard filters:** if any must-have filter/floor factor (e.g. LGBTQ+, safety) has a country score below its threshold, the country is disqualified with a human reason. **Graceful fallback:** if hard filters would empty the candidate set so that fewer than 3 countries remain, relax must-have floors to soft heavy penalties so the user always gets a top 3 (with a note that no country fully met a non-negotiable).
2. **Fit score (0–100):** weighted average over kept factors only. Money bundle contributes once. Filters/floors contribute a small bounded amount above their floor so meeting them isn't over-rewarded.
3. **Feasibility adjustment:** a soft nudge (small bounded penalty for harder tiers) — never a silent hide. Default ranking favors achievable countries; the engine still surfaces exactly one "moonshot" (highest-fit country regardless of difficulty) when it isn't already in the achievable top 3.

**Output per result:** country, fit % (0–100), feasibility tier + reason, one honest tradeoff line (the country's weakest dimension among the user's kept factors), and the supporting per-factor breakdown for transparency.

**AI rerank:** kept but demoted to optional polish only. The numeric engine is the source of truth and must produce correct, deterministic results with `OPENAI_API_KEY` absent. AI may only rewrite the human-facing notes/tradeoff phrasing, never reorder past the hard rules. Controlled by existing fast-mode/no-key fallbacks.

## 6. Feasibility Tier Model (approximate)

Derived from `passportCountry` (+ optional `secondPassportCountry`) and the optional "rights you already hold" tap. No interrogation.

- **Passport strength buckets:** EU/EEA; strong (US/UK/CA/AU/NZ/JP/etc.); mid; weak. Bucketing table lives in `lib/feasibility/`.
- **Country openness:** each country gets a coarse openness level (e.g. nomad-visa availability / general long-stay accessibility), stored alongside the country record or in a small companion map. **Authoring these ~48 coarse openness values is in-scope content work for this redesign** (it is net-new data, distinct from the out-of-scope real visa database).
- **Special case:** an EU/EEA passport (or declared EU/EEA rights) → every EU/EEA country is 🟢 Easy (freedom of movement).
- **Tier = f(passport bucket, country openness) →** 🟢 Easy / 🟡 Doable / 🟠 Hard / 🔴 Very hard, each with a one-line reason.

Framed in UI as "estimated difficulty — confirm the exact pathway in your report." Wrongness here is the embarrassing kind, so the EU special case and the strong-passport visa-free assumptions must be sanity-checked against reality for v1.

## 7. The Journey (6 acts, mobile-first)

Every screen is designed to pull the user forward with a constant "we're closing in on your country" feeling.

1. **Hook** — "Find your country in 60 seconds. Swipe what you care about." No signup, free.
2. **Quick basics** — passport, optional monthly income + currency, one skippable "EU/EEA · US/UK/CA/AU · None" tap. Minimal; powers feasibility + income reality.
3. **Swipe deck** — the 10 factor cards, swipe matters / don't care, springy animations, progress bar.
4. **Refine** — for kept factors only: Nice / Important / Must-have, plus the smart sub-questions.
5. **The reveal** — suspense loading: "Scanning 48 countries… ruling out the ones that don't fit… narrowing to your top 3." The retention peak.
6. **Top 3 + moonshot** — each card: fit % + feasibility badge + one honest tradeoff. Actions: share card (uses existing OG image route), save, and **Unlock deep report** (existing Stripe checkout) — the conversion moment.

**Retention/animation requirements:** mobile-first and correct on small screens; spring/transition animations on swipes and step changes; progress framing that always implies imminent payoff; the reveal must build anticipation before results. Visual execution is delivered by the `frontend-design` skill during implementation.

## 8. Data Flow

`QuizData` (extended) → `POST /api/quiz` → scoring module:
- compute feasibility tier per country (from passport),
- apply hard filters (with graceful fallback),
- compute fit %, pick top 3 + one moonshot,
- attach tradeoff + breakdown + badges,
- optional AI note-polish,
→ response `{ topMatches (3), moonshot, disqualified, profileEcho }` → results screen. This new response shape replaces the current contract (`{ ok, message, simpleScore, bestMatch, topMatches, disqualifiedTop, receivedData }`); the API change and the new Results component tree must be built as a coordinated pair so the frontend never reads stale fields.

`QuizData` changes: replace the large `RelocationReasonId` flag union + scattered importance sliders with a structured `factorRatings: Record<FactorId, Rating>` map plus the sub-question answers (`climatePref`, `culturePref`) and the `mobilityRights` tap. Passport/income fields stay.

## 9. Components & Module Boundaries

- `lib/factors.ts` — factor definitions, roles, weight constants (single source of truth).
- `lib/scoring/` — pure scoring functions (filters, fit, money bundle, moonshot). No React, no fetch. Unit-testable in isolation.
- `lib/feasibility/` — passport buckets, country openness, tier function. Pure, unit-testable.
- `app/api/quiz/route.ts` — thin orchestrator: parse → call scoring → optional AI polish → respond.
- Quiz UI: `app/quiz/page.tsx` (state/flow) + step components (`Hook`, `Basics`, `SwipeDeck`, `Refine`, `Reveal`, `Results`). Each step is independently understandable and receives data + callbacks via props.
- Results: a dedicated `Results` component tree (replaces the missing/broken `ResultsPanel`). Country card is its own component.

Each unit answers: what it does, how it's used, what it depends on. Scoring and feasibility are pure and depend only on `QuizData` + the DB.

## 10. Error Handling & Edge Cases

- **Empty candidate set after hard filters** → graceful fallback (Section 5) so a top 3 always returns, with an honest note.
- **No passport given** → feasibility shows "unknown — tell us your passport for accuracy"; ranking proceeds without the feasibility nudge.
- **No income given** → income-reality lines are hidden, not faked.
- **No `OPENAI_API_KEY`** → numeric engine fully functional; AI polish skipped silently.
- **Tie / fewer than 3 qualifying** → fill from next-best with clear labeling.
- **Invalid/malformed POST body** → 400 with a clear message (existing pattern).

## 11. Testing

- Unit tests for `lib/scoring/` and `lib/feasibility/`: filter behavior, money bundling (no double-count), don't-care drop (weight 0), must-have hard filter + graceful fallback, moonshot selection, feasibility tiers including the EU special case.
- Golden-profile tests: a handful of fixed personas (e.g. LGBTQ+ EU-passport remote worker; budget warm-weather nomad; high-income low-tax seeker) asserting sensible, stable top 3s.
- Engine must be deterministic without AI.

## 12. Cleanup (part of this work)

- Delete junk files `m.name)` and `setCopied(false)` from repo root (verify they exist by their literal names first).
- Remove the debug payload `<pre>` dump from the quiz page.
- Resolve the broken `ResultsPanel`/`MatchCard` reference by implementing the new Results component tree.

## 13. Known Fast-Follows (not this spec)

- Ground all country scores in external indices (safety, cost, LGBTQ+, climate, tax).
- Real visa/immigration data source replacing the approximate tier model.
- Affiliate layer; saved accounts/history.
