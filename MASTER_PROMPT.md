# MASTER PROMPT — PerformanceOS Full Redesign

You are the lead designer and engineer of PerformanceOS. Your standard is the craft level of Apple, Linear, Oura and Whoop: restraint, precision, real product, nothing fake, nothing noisy. Every pixel, word and millisecond is intentional.

Execute this whole document, phase by phase. Do not skip steps. Do not stop to ask questions unless something is destructive or truly ambiguous; otherwise make the most reasonable decision and record it in `REDESIGN_LOG.md`.

---

## 0. Sources of truth (in priority order)

1. **This file** (`MASTER_PROMPT.md`)
2. **`REDESIGN_SPEC.md`**: design system, structure, SEO, structured data, AEO content
3. **`LANDING_COPY.md`**: every word of user-visible copy
4. **`IMAGE_PROMPTS.md`**: what each image is (for alt text and context)

If two files disagree, the higher one wins. Never invent marketing claims, numbers, users, ratings or testimonials.

---

## 1. Ground rules

- Work on a new git branch **`redesign`**. Push it so Vercel creates a preview URL. Do NOT merge to `main`; the owner merges after review.
- **Do not break the app.** Auth, Firestore reads/writes, the AI coach, meal scanning, offline sync and all API routes must keep working exactly as now. Change presentation, not data logic. If a data-layer change is truly required, log it in `REDESIGN_LOG.md`.
- Never show technology names anywhere a user can see (Gemini, Firebase, Firestore, Vercel, Next.js, SQLite, Supabase, OpenFoodFacts, model names, latency numbers, "server managed"). The only exception is citing nutrition sources (IFCT 2017, ICMR-NIN) on content pages.
- Brand name is always **PerformanceOS**.
- Footer on every page: `© 2026 PerformanceOS. All rights reserved. · Designed by Yash Gaurav` (name links to the owner's LinkedIn).
- After each phase: `npm run build` → fix every error and warning you introduced → commit with a clear message → push.

---

## 2. Phase 0 — Audit (no code changes)

1. List all routes, layouts and shared components. List every place a technology name appears in the UI.
2. Inventory `public/images/**` and `public/video/**` against the asset map in section 4. Write `ASSETS_TODO.md` listing anything missing. For a missing asset, use a tasteful neutral placeholder (surface-coloured box with the correct aspect ratio) — never a broken image, never an invented photo.
3. Open and look at each provided image before using it, so placements, crops and alt text match what is actually in it.
4. Save the audit to `REDESIGN_LOG.md`.

---

## 3. Phase 1 — Asset pipeline

1. Add a Node script `scripts/optimize-images.mjs` using `sharp`:
   - Keep originals in `assets-src/` (git-ignored if > 5 MB total; otherwise commit).
   - Output to the same `public/` paths: photos as AVIF + WebP + a JPG fallback at widths 640/1024/1600/2400 (only up to the source width); illustrations and icons as WebP + PNG at 512/1024.
   - Strip metadata. Targets: photos ≤ 200 KB at 1600px, illustrations ≤ 80 KB, icons ≤ 30 KB.
2. Generate blur placeholders (tiny base64) for every photo and screenshot into `lib/blur-data.ts`.
3. If `public/video/hero-raw.mp4` exists, use `ffmpeg-static` to create `hero.mp4` (H.264, `-preset veryfast`, CRF 26, 720px wide, no audio), `hero.webm` (VP9) and `hero-poster.jpg` (first clear frame). Each video ≤ 2 MB.
4. Add `npm run assets` to run the pipeline.
5. All images in code use `next/image` with explicit `width`/`height` or `fill` + `sizes`, `placeholder="blur"`, and the alt text from section 4. Only the hero media gets `priority`.

---

## 4. Asset map — what goes where

| File | Where it's used | How | Alt text |
|---|---|---|---|
| `photos/hero-thali.jpg` | Landing hero background | Full-bleed, `object-cover`, blurred 20–28px, dark overlay so text contrast ≥ 7:1, slight scale on load (1.04 → 1, 1.2s) | "" (decorative) |
| `video/hero.mp4/.webm` + `hero-poster.jpg` | Hero, inside the phone frame | `autoPlay muted loop playsInline`, poster shown first. If missing, show `screens/scan-result.png` instead | "PerformanceOS scanning a plate of Indian food and showing calories and macros" |
| `photos/meal-paneer.jpg` | Scan demo, tab 1 + `/calories/paneer-bhurji` | Square, rounded 20px. Detected-item labels animate onto the photo at the real positions of each item | "Overhead photo of paneer bhurji, two phulkas and kachumber salad on a steel thali" |
| `photos/meal-biryani.jpg` | Scan demo, tab 2 + `/calories/chicken-biryani` | Same as above | "Overhead photo of chicken biryani with boiled egg halves and mint raita" |
| `photos/meal-oats.jpg` | Scan demo, tab 3 + protein guide | Same as above | "Overhead photo of oats with banana, crushed almonds and a scoop of whey" |
| `photos/meal-dal-rice.jpg` | `/calories/dal-tadka`, Indian-food guide hero | Article hero, 16:9 crop | "Steamed rice with dal tadka and aloo gobi on a steel plate" |
| `photos/meal-dosa.jpg` | `/calories/masala-dosa` | Article hero | "Masala dosa with sambar and coconut chutney" |
| `photos/meal-poha.jpg` | `/calories/poha` | Article hero | "A bowl of kanda poha with peanuts and lemon" |
| `photos/cta-phone-plate.jpg` | Final CTA section | Right half on desktop, top on mobile, rounded 32px | "Hand holding a phone above a plate of food, about to log the meal" |
| `photos/lifestyle-desk.jpg` | `/about` page header and the Focus/Money bento tile background (dimmed) | `object-cover` with overlay | "Calm desk with a notebook, water and a snack in the evening" |
| `illus/trend.png` | Trend section accent; `/science` header | Small (160–220px), floating, subtle parallax ≤ 12px on desktop only | "" (decorative) |
| `illus/coach.png` | Coach section accent | Same | "" |
| `illus/scan.png` | Scan demo section header accent; `/guides` hub card | Same | "" |
| `illus/train.png` / `focus.png` / `money.png` / `goals.png` | Bento tile icons (top-left, 64px) and the matching app nav empty states | Icon size, no animation | "" |
| `illus/privacy.png` / `offline.png` | Privacy section, beside the 4 points | 120px | "" |
| `illus/empty-meals.png` | App: Eat page with no meals today | Centered, 160px, with one helpful line + primary button "Log your first meal" | "" |
| `illus/empty-workouts.png` | App: Train page with no workouts | Same pattern | "" |
| `illus/empty-focus.png` | App: Study/Focus with no sessions | Same pattern | "" |
| `illus/404.png` | `app/not-found.tsx` | Centered, 240px, headline "This page wandered off.", link home | "" |
| `illus/og-base.png` | Background for all `opengraph-image.tsx` files | Headline and page title drawn on the empty left side with `next/og` in Satoshi | — |
| `icons/food/*.png` | Scan demo item rows (32px), `/calories/[food]` headers (96px) and related-dish cards, `/guides` lists | Rounded 12px tile | Food name, e.g. "Roti" |
| `screens/scan-result.png` | Hero fallback; scan section on desktop (secondary) | Inside the phone frame | "PerformanceOS meal scan result with items, grams and macros" |
| `screens/today.png` | Bento hero tile; `/about` | Phone frame, slight tilt on desktop only | "PerformanceOS Today screen with calorie ring and macros" |
| `screens/trend.png` | Trend section (desktop, beside the SVG chart) | Phone frame | "30-day weight trend in PerformanceOS" |
| `screens/coach.png` | Coach section (desktop) | Phone frame | "PerformanceOS coach answering a question about food and training" |
| `screens/train.png` / `focus.png` / `budget.png` / `goals.png` | Bento tiles | Cropped to the top 55% inside the tile, fading into the tile background | Describe each screen in one line |
| `founder.jpg` | Founder section; `/about`; Article author boxes (48px circle) | 4:5, rounded 24px | "Yash Gaurav, designer of PerformanceOS" |

Phone frame: one reusable `<PhoneFrame>` component (modern iPhone silhouette, 40px corner radius, thin bezel, subtle reflection, soft shadow). The same component is used everywhere.

---

## 5. Phase 2 — Design system

Implement `REDESIGN_SPEC.md` Phase 1 exactly (Satoshi + Inter, type scale, colour tokens, macro colours, spacing, radii, depth), then build these primitives in `components/ui/` and use only them:

`Section`, `Container`, `Eyebrow`, `Heading`, `Lead`, `Button` (primary / secondary / ghost; sizes sm/md/lg), `Card`, `Chip`, `MacroChip`, `MacroRing`, `PhoneFrame`, `Reveal` (fade-up on enter), `CountUp`, `Tabs`, `Accordion`, `Slider`, `Skeleton`, `EmptyState`, `Toast`.

**Craft details (non-negotiable):**
- Headings use `text-wrap: balance`; paragraphs `text-wrap: pretty`. No single-word last lines in headlines.
- Buttons: hover lifts 1px with a slightly stronger shadow; active scales to 0.98; 150ms ease-out. Disabled is clearly disabled.
- Focus: a 2px accent ring with 2px offset on every interactive element, visible only for keyboard (`:focus-visible`).
- Touch targets ≥ 44×44px. Respect iOS safe areas (`env(safe-area-inset-*)`).
- Sticky nav: transparent over the hero, becomes `--surface` with a hairline border and backdrop blur after 24px of scroll.
- Anchor links scroll smoothly and land with the heading visible below the sticky nav (`scroll-margin-top`).
- Numbers: `Intl.NumberFormat('en-IN')` everywhere (₹1,150 · 2,000 kcal). Units have a thin space before them and use the muted colour.
- Icons: one library only (Lucide), stroke width 1.5, sizes 16/20/24.
- Text selection colour uses the accent at 30% opacity. Custom thin scrollbar on desktop.
- Every image box reserves its aspect ratio (zero layout shift).
- `prefers-reduced-motion`: all motion off, final states shown instantly.
- `theme-color` meta = `#0C0C0D`. Favicon set + Apple touch icon + `manifest.webmanifest` from the existing logo.

---

## 6. Phase 3 — Landing page

Rebuild `/` exactly as `REDESIGN_SPEC.md` Phase 3 (8 sections), with copy from `LANDING_COPY.md` and assets from section 4.

Specific direction:
1. **Hero:** on desktop, a two-column layout (text left, phone right). On mobile: text first, phone below, hero ≤ 1.3 screens tall. The headline's second line "Your coach does the math." gets the accent colour on "math." only. Under the buttons: the line "No sign-up needed for the demo · Works offline".
2. **Scan demo:** the three real photos as tabs (thumbnails with food icons). On tab change, crossfade the photo (250ms), then labels pop onto the photo one by one (80ms stagger), then the item list and totals count up. The sliders change grams and recalculate live. The labels sit at each item's real position on the photo; define the coordinates in `data/scan-demo.ts` after looking at each image.
3. **Trend:** an SVG chart built from `data/trend-demo.ts` (30 days, 78.2 → 75.8 kg, realistic ±0.8 kg daily noise). On desktop, scroll draws the trend line through the dots; on mobile, it animates once on enter. Three steps beside or below it.
4. **Coach:** three scenario tabs; messages type in (fast, 12ms per character, skippable on click); the coach reply renders as clean formatted text.
5. **Bento:** asymmetric grid on desktop (Train large, then Focus, Money, Goals); a single column on mobile. Each tile has an illustration icon, a title, one line and the cropped real screenshot.
6. **Founder + privacy:** founder photo with a 3-sentence note (placeholder text for the owner, marked `TODO(owner)` in code), then the 4 privacy points with illustrations.
7. **FAQ:** accordion, first item open, all answers in server HTML.
8. **Final CTA:** headline, two buttons, `cta-phone-plate.jpg`.

Remove every section and element not in this list.

---

## 7. Phase 4 — Technical SEO + structured data

Implement `REDESIGN_SPEC.md` Phases 4 and 5 completely: Server Components for content, Metadata API per page, canonicals, `lang="en-IN"`, OG images via `next/og` on `og-base.png`, `sitemap.ts`, `robots.ts` (allow AI crawlers, block app routes and `/api/`), `noindex` on app routes, `llms.txt`, manifest, and JSON-LD (WebSite, Organization, Person, SoftwareApplication, FAQPage, Article, BreadcrumbList) using only true information.

Production URL comes from `NEXT_PUBLIC_SITE_URL` (default `https://osperformance.vercel.app` until a custom domain is set).

---

## 8. Phase 5 — AEO content

Implement `REDESIGN_SPEC.md` Phase 6 using the writing pattern there (question as H2 → 40–60-word direct answer → detail → sources → last updated → author box → disclaimer).

Build in this order: `/science`, `/faq` (15 questions), `/about`, the three `/tools/*` calculators, `/guides` hub + the six guides, then `/calories/[food]`.

**Nutrition data rules:**
- All food values live in one file, `data/foods.ts`, each entry with `source` (e.g. "IFCT 2017") and `portionNotes`.
- Only use values you can attribute to IFCT 2017 / ICMR-NIN or a clearly cited source. If you are not certain of a value, set `verified: false` and list it in `DATA_TO_VERIFY.md`. Pages with unverified values show nothing different publicly, but the owner must check that list before merging.
- Start `/calories/[food]` with 10 dishes, those with matching photos or icons first: paneer bhurji, chicken biryani, dal tadka, masala dosa, poha, roti, idli, boiled eggs, oats with banana, curd rice. Each page must be genuinely useful on its own: portion table (piece, katori, plate, 100 g), macros, one lighter-version tip, 3 related dishes, CTA to the app.

---

## 9. Phase 6 — App UI refresh

Apply the same design system to every app route (`/login`, `/today`, `/eat`, `/train`, `/study`, `/money`, `/goals`, `/coach`, `/settings`) **without changing data logic**:

1. Fonts, colour tokens and macro colours identical to the landing page. Remove `font-mono` from all UI text.
2. Apply `LANDING_COPY.md` section 15 (remove tech names, "telemetry", "neural", "engine", the AI-spend dollar meter → "Coach usage this month" bar).
3. Empty states use the matching illustration + one sentence + one primary action.
4. Loading states use `Skeleton` components that match the final layout. No spinners on full pages.
5. Coach: markdown rendered with `react-markdown` + `remark-gfm`, styled with the type scale; wait for auth before sending; retry once on 401 with a refreshed token.
6. Bottom navigation on mobile with clear active state; sidebar on desktop.
7. Success feedback after logging (meal, set, focus session): a toast plus `navigator.vibrate(10)` where supported.
8. Settings: Account, Data export (download all of the user's data as a file), Delete account (with confirmation). If export or delete doesn't exist yet, build it using the existing data layer.
9. Login page: clean card, Google button, email option, "Explore the demo" secondary card. No configuration indicators.
10. `app/not-found.tsx` and `app/error.tsx` designed with the 404 illustration and a calm message.

---

## 10. Phase 7 — Quality assurance (prove it, don't assume it)

Run and fix until everything passes:

1. `npm run build` with zero errors.
2. Lighthouse (mobile) on `/`, `/science`, one guide and one food page via `npx lighthouse <preview-url> --form-factor=mobile --output=json`: Performance, Accessibility, Best Practices and SEO all **≥ 95** (minimum 90 if an external factor blocks it; explain why in the log).
3. `curl -s <preview-url>/ | grep` for the H1, each FAQ question and the footer line, proving they're in server HTML.
4. Check the JSON-LD is valid JSON and matches the visible content. List the URLs for the owner to test in Google's Rich Results Test.
5. Open `/sitemap.xml`, `/robots.txt` and `/llms.txt` on the preview and paste their contents into the log.
6. Check at widths 360, 390, 768, 1280 and 1440: no horizontal scroll, no overlapping text, images crisp, mobile landing height under 7,000px.
7. Search the built HTML and the `app/` + `components/` source for banned tech words and "performanceos" (lowercase): zero user-visible hits.
8. Run an accessibility check (`@axe-core/cli` or Playwright + axe) on `/`: zero serious or critical issues.
9. Test the app flows on the preview: demo login → Today → log a meal by photo → Coach question → Train log → Settings export. All work.

---

## 11. Final report

When everything is done, write a short summary at the top of `REDESIGN_LOG.md` and tell the owner:
- The preview URL
- Lighthouse scores per page
- What's left in `ASSETS_TODO.md` and `DATA_TO_VERIFY.md`
- Where the `TODO(owner)` items are (founder note, LinkedIn URL, GitHub URL)
- Anything you decided on your own and why

Then stop. Do not merge to `main`.
