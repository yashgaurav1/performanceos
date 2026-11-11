# POLISH_PROMPT - PerformanceOS: Final Quality Pass

## Role
You are the principal product engineer and design lead for PerformanceOS. You hold yourself to the craft standard of Apple, Linear and Whoop: precise, consistent, honest, fast. You verify everything you change. You never claim something works without evidence.

## Objective
Take the live site (https://osperformance.vercel.app) from "good" to "flawless": fix every known defect, remove every inconsistency, make every number trustworthy, replace every placeholder with real product visuals, and complete SEO/AEO, without adding anything the owner must supply.

## Context you must read first
`MASTER_PROMPT.md`, `REDESIGN_SPEC.md`, `LANDING_COPY.md`, `IMAGE_PROMPTS.md`, `REDESIGN_LOG.md`, `ASSET_MAPPING.md`, `ASSETS_TODO.md`, `DATA_TO_VERIFY.md` (whichever exist). They describe the design system and decisions already made. This file overrides them where they conflict.

## Hard constraints
1. **No owner-supplied assets.** There will be no founder photo, no manual screenshots, no manual video. Everything visual must come from files already in `public/`, or be produced by you from the real app (section B). Never show a placeholder, initials avatar or empty frame on the public site.
2. **Nothing fake.** No invented users, ratings, reviews, testimonials, statistics, awards or press logos. No AI-generated imagery of the app UI.
3. **Don't break the app.** Auth, Firestore data, the AI coach, meal scanning, offline sync and all API routes must work exactly as before. Change data logic only where a task below requires it, and log why.
4. **No technology names** anywhere a user can see (Gemini, Firebase, Firestore, Vercel, Next.js, SQLite, Supabase, OpenFoodFacts, model names, latency numbers). Nutrition sources (IFCT 2017, ICMR-NIN) are allowed on content pages.
5. **Brand:** always "PerformanceOS". Title separator: " · ". Footer: `© 2026 PerformanceOS. All rights reserved. · Designed by Yash Gaurav` (name links to https://www.linkedin.com/in/yash-gaurav/).
6. **Process:** work on branch `polish`. After each section: `npm run build` → fix all errors → commit → push. Never wait on a long-running dev server.

---

## A. Data integrity (do first; everything else depends on it)

**A1. One source of truth.** Create `data/foods.ts` as the only place food nutrition lives. Every surface (landing scan demo, `/calories/*`, guides, calculators, `llms.txt`, JSON-LD) must import from it. Delete every hard-coded calorie/macro value elsewhere.

**A2. Standard portions.** Define once and use everywhere: katori = 150 ml; phulka = 35 g each; standard thali = 26 cm; tablespoon = 15 ml; teaspoon oil = 5 g.

**A3. Cooked dishes are calculated, not looked up.** IFCT 2017 lists raw ingredients, not cooked dishes. For each cooked dish, store a recipe (ingredient → grams, including oil/ghee) and compute kcal/protein/carbs/fat per 100 g and per portion from IFCT 2017 raw values. On each food page show: "Calculated from IFCT 2017 ingredient values" plus the recipe as a small table. Never state that IFCT lists the cooked dish.

**A4. Unverified values.** If you are not certain of an IFCT value, set `verified: false` and list it in `DATA_TO_VERIFY.md` with the exact ingredient and value used. Do not invent precision (round kcal to the nearest 5, macros to 0.5 g).

**A5. Landing consistency.** The landing demo numbers must now match the food pages exactly. Recheck the totals: the sum of the items = the total card. Brand-wide numbers stay: burn 2,550 kcal · target 2,000 kcal · deficit 550 kcal · goal −0.5 kg/week · protein 180 g.

**Acceptance:** a script `scripts/check-consistency.mjs` that renders/reads every food value used on the landing, food pages and guides and fails if any two disagree. It must pass.

---

## B. Real product visuals, generated automatically

**B1. Capture real screenshots with Playwright** against the deployed demo (or a production build running locally):
- Device: iPhone 14 Pro viewport (393×852), deviceScaleFactor 3, dark mode.
- Log in via the demo flow. If the demo account has fewer than 30 days of realistic data, seed it first through the existing data layer (consistent with the brand numbers in A5).
- Capture into `public/images/screens/`: `today.png`, `scan-result.png`, `trend.png`, `coach.png` (with a real, fully rendered coach answer), `train.png`, `focus.png`, `budget.png`, `goals.png`.
- Hide any transient UI (toasts, dev buttons, cookie banners) before capture. No personal data, emails or IDs visible.

**B2. Capture a hero recording with Playwright `recordVideo`:** the meal-scan flow on the demo account (open Eat → scan the sample `meal-paneer.jpg` → items appear → macros fill → saved), 6-8 seconds. Convert with `ffmpeg-static` to `public/video/hero.mp4` (H.264, `-preset veryfast`, CRF 26, 720px wide, no audio), `hero.webm` and `hero-poster.jpg`. Each ≤ 2 MB.

**B3. Fallback if capture is impossible** (log the exact reason): render the hero phone and bento visuals using the **real app components** with the seeded demo data (the same React components the app uses), not hand-drawn mockups.

**B4. Placement:**
- Hero phone: `hero.mp4/.webm` (autoplay, muted, loop, playsInline, poster). Falls back to `screens/scan-result.png`.
- Trend section (desktop): `screens/trend.png` beside the SVG chart.
- Coach section (desktop): `screens/coach.png`.
- Bento tiles: `train`, `focus`, `budget`, `goals` screenshots, cropped to the top ~55% and fading into the tile.
- Run the image pipeline (`npm run assets`) on all new files.

**Acceptance:** no coded "fake phone" UI remains on the landing page; every phone frame shows a real capture or real components.

---

## C. Remove person-dependent elements

**C1.** Delete the founder section from the landing page. Merge its trust message into the Privacy section as one line: "Designed and built independently by Yash Gaurav."
**C2.** Author boxes on guides, food pages, /science and tools: "Written by Yash Gaurav · Designer of PerformanceOS", with the PerformanceOS logo mark as the avatar (no initials circle, no photo).
**C3.** `/about`: keep it text-led (mission, how PerformanceOS works, privacy, contact), with `lifestyle-desk.jpg` as the header. No portrait.
**C4.** JSON-LD `Person`: keep name, `jobTitle`, and `sameAs` with the LinkedIn URL only. Remove the GitHub URL unless it returns HTTP 200.

---

## D. Conversion and UX defects

**D1.** Every "Try the live demo" button starts the demo session directly and lands on `/today`. No stop on `/login`. Show a brief loading state on the button while the session starts; on failure, show a clear inline error with a retry.
**D2.** Login page: replace "athlete@performance-os.local · demo" with "Demo account · Ayush". No internal emails or IDs anywhere in the UI.
**D3.** Scan demo: labels and tab subtitles use proper display names from `data/foods.ts` (Phulka, Paneer bhurji, Kachumber salad, Chicken biryani, Boiled eggs, Mint raita, Oats, Banana, Almonds, Whey). Never truncate to the first word.
**D4.** Mobile meal tabs: no visible scrollbar and no cut-off cards. Three compact chips that fit a 360px width (icon + short name).
**D5.** Coach demo: render the whole reply, with no inner scroll container on any screen size.
**D6.** Trend section: on mobile (tabs), the subtitle reads "Tap through the three steps to see how PerformanceOS turns daily weigh-ins into a trend you can trust." The desktop scroll version keeps "Scroll to see…".
**D7.** Bento: render illustrations at ≥ 72px or replace them in tiles with Lucide icons (stroke 1.5); keep illustrations for larger placements only.
**D8.** Remove the "PERSONAL OS" mono sub-label everywhere (header, footer, login). No monospace font anywhere in the UI.

---

## E. App quality (logged-in experience)

**E1. Coach:** markdown rendered (`react-markdown` + `remark-gfm`, Tailwind Typography `prose-invert`). Wait for auth readiness before any AI call; on 401 refresh the ID token once and retry. Send disabled until ready.
**E2.** Replace any dollar-based AI spend meter with "Coach usage this month" as a simple progress bar, without currency.
**E3. Empty states** on Eat, Train and Study/Focus use `illus/empty-meals.png`, `illus/empty-workouts.png` and `illus/empty-focus.png` + one sentence + one primary action.
**E4. Loading:** skeletons that match the final layout; no full-page spinners.
**E5. Settings:** Account, **Export my data** (downloads all of the user's data as a JSON file) and **Delete account** (typed confirmation; deletes the user's Firestore data and auth user via a server route that verifies the ID token). Build them if missing.
**E6.** After logging a meal, set or focus session: toast + `navigator.vibrate(10)` where supported.
**E7.** `not-found.tsx` and `error.tsx` use `illus/404.png` and a calm message with a link home.

---

## F. SEO and AEO completion

**F1. Structured data** (only true information; validate each as JSON):
- `/calories/[food]`: `Recipe` with `nutrition` (`NutritionInformation` per portion), `recipeIngredient`, `recipeYield`, `author`.
- `/tools/*`: `WebApplication` (`applicationCategory: "HealthApplication"`, `offers` price 0).
- `/guides/*`: `Article` (already present) + sources.
- `/faq` and landing: `FAQPage` matching the visible text exactly.
- All content pages: `BreadcrumbList`.

**F2. Sources:** every guide ends with a "Sources" list of real, citable references (ICMR-NIN 2020 Dietary Guidelines, IFCT 2017, and peer-reviewed papers you can name with authors and year). If you cannot name a source precisely, don't list it.

**F3. Answer-first check:** every content page's first paragraph under each question-style H2 answers it directly in 40-60 words.

**F4. Open Graph images:** JPG, 1200×630, ≤ 300 KB, one per page type, generated with `next/og` on `illus/og-base.png`.

**F5. Metadata:** unique title (≤ 60 characters) and description (≤ 155) on every indexable page; separator " · ". `sitemap.xml` includes every indexable page with accurate `lastModified`; app routes stay `noindex` and disallowed in `robots.txt`.

**F6. Internal linking:** each food page links to 3 related dishes, 1 guide and 1 tool; each guide links to 2 guides, 2 food pages and 1 tool; the landing links to /science, /guides and /faq.

**F7. `llms.txt`:** regenerate from current pages and `data/foods.ts` (no hard-coded numbers).

---

## G. Performance and accessibility budgets

- Lighthouse mobile ≥ 95 on Performance, Accessibility, Best Practices and SEO for `/`, `/science`, one guide, one food page and one tool.
- LCP < 2.0 s, CLS < 0.05, INP < 200 ms (mobile, Lighthouse simulated).
- No image request wider than needed: correct `sizes` everywhere (no 3840w requests on mobile).
- Hero video lazy-starts after first paint; poster is the LCP element.
- Contrast ≥ 4.5:1 for all text; visible `:focus-visible` rings; tabs, accordion and sliders fully keyboard-operable; zero serious or critical axe issues.
- `prefers-reduced-motion`: no motion, final states shown.

---

## H. Verification gates (all must pass before merge)

Run each and save the output to `REDESIGN_LOG.md`:

1. `npm run build`: zero errors.
2. `node scripts/check-consistency.mjs`: passes.
3. Playwright test suite `tests/e2e.spec.ts`, run against the `polish` preview URL:
   - The landing demo button lands on `/today` within 8 s.
   - Scan demo: each of the 3 tabs shows the correct item names and totals.
   - Coach: sending a message returns a rendered reply (no raw `###`/`**`).
   - Settings: export downloads a JSON file.
   - No horizontal scroll at 360, 390, 768, 1280 and 1440px.
   - The 404 page renders the illustration.
4. Text scan of the built HTML and of `app/` + `components/`: zero user-visible banned tech words, zero "performanceos" (lowercase), zero "athlete@".
5. `npx lighthouse` (mobile) on the five pages in G: scores recorded; all ≥ 95 (or explain any external blocker).
6. `@axe-core/cli` on `/` and one content page: zero serious or critical issues.
7. JSON-LD on 6 page types parses as valid JSON and matches visible content; list the URLs for Google's Rich Results Test.
8. `curl` the landing, one food page and one guide: the H1, first answer paragraph and footer are present in the server HTML.

## I. Release

- If **all** gates pass: merge `polish` into `main`, wait for the production deploy, re-run gates 3 (landing + demo flow only), 4 and 8 against https://osperformance.vercel.app, and record the results.
- If **any** gate fails and you cannot fix it: do not merge. Report what failed and why.

## J. Final report (output to the owner)

A concise summary at the top of `REDESIGN_LOG.md`, and printed to the owner:
1. Merged to production: yes/no
2. Lighthouse scores per page
3. Gate results (pass/fail with one-line evidence each)
4. Items in `DATA_TO_VERIFY.md` (count + where)
5. Decisions you made on your own and why
6. Anything left that needs the owner (expected: only domain purchase and Search Console setup)
