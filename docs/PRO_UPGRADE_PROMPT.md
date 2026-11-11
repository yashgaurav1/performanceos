# PerformanceOS: Pro Upgrade Prompt

Paste everything below the line into Claude Code (or any coding agent) at the repo root.

---

You are a senior product engineer and design lead taking **PerformanceOS** (https://osperformance.vercel.app, this repo) from "impressive side project" to "product a stranger would pay for". Work in phases. Do not start a phase until the previous one passes its acceptance checks. Do not add new features until Phase 3 is done.

## Ground truth (read before touching code)

An audit of the live site and repo on 2026-11-12 found:

- `CLAUDE.md` is **out of date**. It says Supabase + indigo `#6366F1` primary. The live app uses **Firebase (auth + Firestore) + Dexie**, and the brand accent is **orange `#FF4422`**. Prisma/SQLite, `supabase/migrations/`, and a duplicate root-level `lib/` folder (`lib/db/*`, `lib/firebaseAdmin.ts`, `lib/blur-data.ts`) are still in the tree. `AUDIT.md`, `MASTER_PROMPT.md`, `POLISH_PROMPT.md`, `REDESIGN_*.md` partly contradict each other.
- Typecheck passes; 92 Vitest tests pass. There are no meaningful end-to-end tests for the core flows.
- Landing page (desktop, warm load): **LCP ~5.9 s, CLS ~0.52**, ~2.1 MB transferred, ~500 KB JS. `hero.webm` is 582 KB. `meal-paneer.jpg` and `hero-thali.jpg` are each downloaded **twice** at `w=1920`. On first paint the hero is a blank dark screen until JS/animation runs.
- 23 links/buttons on the landing page are under 44x44 px. The hero CTA "Try the live demo" is not exposed as a link or button in the accessibility tree. Animated numbers (NumberFlow/odometer) render as empty text to screen readers and crawlers (e.g. " kcal", score dial).
- Demo data contradicts itself across screens: **Train** says "No hard sets in the last 7 days / No lifts logged yet" while **Coach** shows "Tonnage 7,960 kg · 5 sessions" and **Today** shows "Training 15/15". Train also shows a "Cloud synced" badge in demo mode.
- Today: the score dial briefly shows overlapping digits ("34" over "4 –") before settling on 81. Daily Big 3 shows "1/3 done" plus "Slot 2 open / Slot 3 open" *and* three filled tasks, with a large empty gap above them. Task titles repeat their tag ("... #training" then a "#training" chip). "Protein left 0 g" with "175 / 160 g".
- Eat: "Protein target HIT" and the Protein ring are rendered in the brand orange/red, which reads as a warning. On Coach, "2.36 g/kg protein" (a good number) is also red. The brand accent and the danger colour are visually the same, so the app can't tell users "good" from "bad".
- Copy leaks developer jargon into the UI: "PERFORMANCEOS DAILY STATS", "QUICK STAPLES · ZERO-LATENCY", "Weekly fractional sets", "Sunday audit · Weekly executive brief". Module names drift: Study/Focus, Money/Budget.
- API surface has duplicates and dead routes: `ai/coach` + `ai/coach-chat` (unused), `ai/vision/meal` + `ai/food-vision` (unused), `food/log` + `log/food`, `weight/log` + `log/weight`, `check-in` + `coach/check-in`, `telemetry` + `dashboard/telemetry` (unused), plus `auth/register`/`auth/login` (bcrypt) alongside Firebase auth.
- `src/lib/rate-limiter.ts` is an in-memory `Map`. On Vercel serverless every instance has its own map, so AI routes are effectively unrate-limited and the Gemini bill is exposed.

Verify each claim yourself before acting on it. If something is already fixed, say so and move on.

## Phase 0: One source of truth (architecture)

1. Decide the canonical stack: **Dexie (client source of truth) → sync queue → Firestore**, Firebase Auth. Write that down.
2. Delete what isn't that: Prisma (`prisma/`, `src/lib/prisma.ts`, deps), `supabase/` + `@supabase/*` deps (unless something live still needs them; prove it with grep), root-level `lib/`, bcrypt auth routes if Firebase auth covers login.
3. Collapse duplicate API routes to one per job; update all callers. Delete unused ones.
4. Rewrite `CLAUDE.md` to match reality (stack, folders, brand colour, rules). Move the other planning `.md` files into `docs/archive/` and keep one `docs/ROADMAP.md`.
5. Replace the in-memory rate limiter with a durable one (Upstash Redis / Vercel KV, or a Firestore counter) keyed on **user id**, with a per-user daily AI budget. Verify every AI route checks auth + limit + zod-validated input before calling the model.

**Accept when:** `npm run typecheck && npm run lint && npm run test && npm run build` all pass; `grep -ri "prisma\|supabase" src` returns nothing unexpected; route count is down and every remaining route has a caller.

## Phase 1: Data honesty (the trust layer)

1. Make demo mode derive every screen from **one** seeded dataset (`src/lib/demo/`). Train, Coach and Today must agree on sessions, tonnage and training score. Add a Vitest test that loads the demo seed and asserts cross-screen numbers match.
2. Demo mode must never show "Cloud synced". Show a clear, dismissible "Demo data · Sign in to keep your own" banner instead.
3. Fix Daily Big 3: three slots, filled ones render in their slot, empty ones show the placeholder, count matches. Strip the `#tag` from titles when it's shown as a chip.
4. Replace "0 g left" style dead-ends with signed states: "Protein: target hit (+15 g)", "Calories: 200 left", "Over by 120".
5. Kill the odometer start glitch: render the final value server/first-paint, animate only on change, and respect `prefers-reduced-motion`.

**Accept when:** a fresh demo session shows identical training numbers on Today, Train and Coach; the new consistency test passes.

## Phase 2: Design system that means something

1. Separate **brand** from **status**. Keep orange `#FF4422` for brand and primary actions only. Status colours: emerald = hit/good/under budget, amber = watch/uncertain, a distinct red/rose = over/stalled/bad, neutral grey = no data. Never use the brand colour to mean "bad" or "good".
2. Put all colours, radii, spacing and type sizes in CSS variables / Tailwind theme tokens in `globals.css`. Remove hard-coded hex values from components (`grep -rn "#[0-9A-Fa-f]\{6\}" src/components`).
3. Every number uses the mono tabular style. One card component, one section-header component, one empty-state component, used everywhere.
4. Rewrite UI copy in plain words a gym-goer would use. No "telemetry", "zero-latency", "fractional", "executive brief", "PerformanceOS daily stats". Pick one name per module (Focus *or* Study, Budget *or* Money) and use it in nav, page title, `<title>` and landing page.
5. Reference bar: MacroFactor, Linear, Whoop. Calm, dense, honest. Fewer glows and gradients; more hierarchy from size and weight.

**Accept when:** a screenshot of each of the 7 app screens at 375 px shows consistent cards, headers and colours, and no status is shown in the brand colour.

## Phase 3: Performance, accessibility, SEO

Targets on a mid-range Android over 4G (Lighthouse mobile):

- Landing: **LCP < 2.5 s, CLS < 0.1, INP < 200 ms, JS < 200 KB gzipped on first load**, total < 1 MB.
- App routes: interactive < 3 s, no layout shift when Dexie hydrates (reserve space with skeletons sized like the real content).

Do:
1. Render the hero headline, CTAs and phone mockup as static server HTML with final layout; animate after load. Replace the hero video with a poster image on mobile and lazy-load the video only on desktop when in view.
2. Fix duplicate image downloads; give every `next/image` correct `sizes`; only the LCP image gets `priority`.
3. Lazy-load below-the-fold sections (vision demo, scroll morph, coach demo, bento) with `next/dynamic`. Audit GSAP + Lenis + framer-motion: keep one animation library if you can.
4. Every interactive element is a real `<a>` or `<button>`, at least 44x44 px, with a visible focus ring. Animated numbers expose their final value via `aria-label` or visually hidden text. Decorative images get `alt=""`, meaningful ones get real alt text. Colour contrast AA.
5. Check the JSON-LD, sitemap, OG image and `llms.txt` still validate (`scripts/check-*.mjs`).

**Accept when:** Lighthouse mobile ≥ 90 for Performance, Accessibility, Best Practices, SEO on `/` and `/today`; numbers recorded in `docs/ROADMAP.md`.

## Phase 4: Product polish that makes it feel pro

1. **Onboarding:** after sign-in, a 60-second setup (goal, weight, height, activity, budget) that produces real targets and an empty-but-guided Today. No fake data for real users.
2. **Core loop speed:** logging a meal, a set and an expense each take ≤ 3 taps from Today. Add haptics (`navigator.vibrate`) and optimistic UI with undo toasts instead of confirm dialogs.
3. **Offline:** verify in DevTools offline mode that all 7 screens load and every write queues and syncs later. Show sync state honestly (queued count, last synced time).
4. **AI honesty:** photo results always show a range (`kcal_low/point/high`) and confidence; coach answers cite the user's actual numbers and link to the screen they came from; show a cost/usage meter per user.
5. **Data ownership:** working "Export all my data" (JSON + CSV) and "Delete account" that really removes Firestore + Storage data. The landing page promises both.
6. **Errors & empty states:** every screen has a designed loading, empty, error and offline state. Wire an error tracker (Sentry or similar) and basic product analytics that respect the privacy promise (no ad trackers).

## Phase 5: Tests that guard it

1. Playwright e2e for: landing → demo → each tab loads; log a meal; log a set; add an expense; complete a focus block; offline write then reconnect sync.
2. Keep pure math in `src/lib/math` with Vitest; add tests for any math touched above.
3. Add a GitHub Action that runs typecheck, lint, unit tests, build and Playwright on every PR, plus a Lighthouse CI budget on `/`.

## Working rules

- After every phase: run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, fix everything, then commit with a clear message. One phase = one PR.
- Before deleting anything, prove it's unused (grep for imports and route URLs).
- Take 375 px and 1440 px screenshots of changed screens before and after; put them in the PR description.
- If a requirement here conflicts with what you find in the code, stop and explain the conflict instead of guessing.
- At the end, write a short `docs/ROADMAP.md` entry: what changed, before/after metrics, what's still open.
