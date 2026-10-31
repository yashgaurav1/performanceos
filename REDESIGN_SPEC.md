# PerformanceOS — Redesign + SEO/AEO Spec

Read this whole file before changing anything. Work phase by phase. After each phase: `npm run build`, fix errors, commit, push.

All visible text comes from `LANDING_COPY.md`. Never show technology names (Gemini, Firebase, Vercel, Next.js, etc.) anywhere a user can see them.

---

## Phase 1 — Design system

### Fonts
- Headings: **Satoshi** (self-host from fontshare.com, weights 700 and 900) via `next/font/local`.
- Body and UI: **Inter** via `next/font/google`, `display: swap`.
- Numbers: Inter with `font-variant-numeric: tabular-nums`.
- Remove GeistMono and every `font-mono` class from the landing page and app UI.

### Type scale (mobile → desktop)
| Token | Size | Line-height | Tracking |
|---|---|---|---|
| display (H1) | 44px → 72px | 1.05 | -0.02em |
| h2 | 32px → 48px | 1.1 | -0.015em |
| h3 | 20px → 24px | 1.3 | -0.01em |
| body | 17px → 18px | 1.6 | 0 |
| small | 15px | 1.5 | 0 |
| label | 13px, uppercase, 600 | 1.2 | 0.08em |

### Colors (CSS variables in `globals.css`)
```
--bg: #0C0C0D;        /* warm near-black */
--surface: #151517;
--surface-2: #1C1C1F;
--border: rgba(255,255,255,0.08);
--text: #F5F5F4;
--muted: #A1A1AA;
--accent: <keep current orange>;   /* ONLY primary buttons + one highlight per section */
--protein: #FF7A59;   /* coral */
--carbs: #F5B841;     /* amber */
--fat: #3CC8C0;       /* teal */
--kcal: #F5F5F4;
```
Macro colors must be identical on every chart, ring, chip and illustration, in the landing page and the app.

### Spacing, shape, depth
- 8px spacing grid. Section padding: 96px mobile, 160px desktop.
- Radius: 12px (small), 20px (cards), 32px (large panels).
- Depth: soft shadows + a subtle noise texture overlay (2–3% opacity). Remove most glows, border-beams and neon effects.
- Max content width 1200px; text blocks max 640px.

---

## Phase 2 — Visual assets

### Rule: real photos prove, illustrations decorate
- **Real photography** for: hero background, the photo-logging demo, the final CTA. These must look like real food a real person ate.
- **Illustrations** for: food icons, section accents, empty states, 404 page, Open Graph images, small decorative spots.
- Never use an illustration inside the scan demo. Never use stock photos of people.

### Folder structure (owner provides files — full list and usage in IMAGE_PROMPTS.md and MASTER_PROMPT.md)
```
public/images/photos/      hero-thali.jpg, meal-paneer.jpg, meal-biryani.jpg, meal-oats.jpg, meal-dal-rice.jpg, meal-dosa.jpg, meal-poha.jpg, cta-phone-plate.jpg, lifestyle-desk.jpg
public/images/illus/       trend, coach, train, focus, money, goals, privacy, offline, scan, empty-meals, empty-workouts, empty-focus, 404, og-base (.png)
public/images/icons/food/  roti, rice, dal, paneer, biryani, idli, dosa, egg, chicken, banana, oats, whey, salad, curd, chana, poha (.png)
public/images/screens/     today, scan-result, trend, coach, train, focus, budget, goals (.png)
public/images/founder.jpg
public/video/hero-raw.mp4  (optional; compress to hero.mp4 + hero.webm + hero-poster.jpg)
```
If a file is missing, use a neutral placeholder block and add the filename to `ASSETS_TODO.md`. Do not generate fake photos.

### Illustration style (for any illustration created or commissioned)
Flat editorial illustration. Simple geometric shapes, no outlines, no faces or eyes on food, no 3D, no clay, no gradients except one soft highlight. Palette limited to: #FF7A59, #F5B841, #3CC8C0, #F5F5F4 and #1C1C1F, on a dark #0C0C0D background. Subtle grain texture. Indian food subjects (roti, katori of dal, paneer, biryani, idli, banana, eggs, oats bowl, whey scoop). Consistent 3/4 top-down angle, consistent lighting from the top-left. Calm, premium, appetizing.

Image-model prompt template (keep identical for every image so the set matches):
> "Flat editorial illustration of [SUBJECT], simple geometric shapes, no outlines, no faces, limited palette of coral #FF7A59, amber #F5B841, teal #3CC8C0, off-white #F5F5F4, on a dark #0C0C0D background, subtle grain texture, soft top-left light, 3/4 top-down view, centered, generous empty space, premium minimal style."

### Image technical rules
- Always `next/image` with explicit width/height, correct `sizes`, AVIF/WebP, `placeholder="blur"`.
- Each photo ≤ 200 KB. Hero video ≤ 2 MB, muted, loop, playsInline, with poster.
- Only the hero image/video loads eagerly (`priority`); everything else lazy.
- Every image has a descriptive `alt` (e.g. "Overhead photo of paneer bhurji with two phulkas and salad on a steel thali").

---

## Phase 3 — Page structure (landing `/`)

8 sections, in this order. Each section answers one visitor question. Total mobile height under 7,000px.

| # | Visitor question | Section | Visual |
|---|---|---|---|
| 1 | What is this? | Hero | Real hero video in an iPhone frame (Magic UI), over a blurred real food photo |
| 2 | Does it work on my food? | Photo logging demo | Real food photos as tabs; detected items animate in over the photo with labels; sliders adjust grams |
| 3 | Why is it smarter? | Trend | One clean SVG chart: daily weigh-ins (dots) vs trend (line). Pin only on ≥1024px; on mobile, plain stacked steps |
| 4 | Will it help me? | AI coach | 3 scenario tabs with the sample conversations; a real coach screenshot on desktop |
| 5 | What else does it do? | Bento grid | 4 tiles (Train, Focus, Money, Goals), each with a cropped real screenshot + one illustration accent |
| 6 | Who made this, can I trust it? | Founder + privacy | `founder.jpg`, a 3-sentence note (placeholder for owner), then 4 privacy points |
| 7 | Any catches? | FAQ | Accordion, all answers present in the HTML |
| 8 | Let me try | Final CTA | Real photo of a hand holding a phone over a plate |

Delete: the comparison table, the feature marquee, technology logos, decorative-only sections.

Footer: logo + tagline, links (Science, Guides, Privacy, Terms), `© 2026 PerformanceOS. All rights reserved. · Designed by Yash Gaurav` (name links to LinkedIn).

### Motion rules
- Fade-up on enter, once, ≤ 600ms, 40–80ms stagger. Count-up numbers when visible.
- No infinite decorative animation except the hero video.
- No scroll pinning below 1024px.
- Respect `prefers-reduced-motion` (show final states instantly).
- Text must exist in the server HTML. Animations may start at `opacity: 0` but must never remove or delay text from the HTML.

---

## Phase 4 — Technical SEO

1. **Server rendering:** the landing page and all content pages are Server Components. All copy, FAQ answers and headings must appear in the initial HTML (verify with `curl`). Client components only for interactive pieces.
2. **Metadata (Next.js Metadata API)** in `app/layout.tsx` and each page:
   - `metadataBase` = production URL (env `NEXT_PUBLIC_SITE_URL`).
   - Unique `title` (≤ 60 characters) and `description` (≤ 155 characters) per page.
   - `alternates.canonical` on every page.
   - `openGraph` and `twitter` (summary_large_image) with titles, descriptions, images.
   - `<html lang="en-IN">`.
3. **Open Graph images:** generate with `next/og` (`opengraph-image.tsx`) using the brand fonts, colors and one illustration. One per page type.
4. **`app/sitemap.ts`:** all public pages with `lastModified`. **`app/robots.ts`:** allow all public pages; disallow `/api/`, `/today`, `/eat`, `/train`, `/study`, `/money`, `/goals`, `/coach`, `/settings`, `/admin`, `/login`. Explicitly allow AI crawlers: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended. Include the sitemap URL.
5. **App pages** (`/today`, `/eat`, etc.): `robots: { index: false }`.
6. **Semantic HTML:** exactly one `<h1>` per page, no skipped heading levels, `<main>`, `<nav>`, `<footer>`, `<section aria-labelledby>`. Buttons are `<button>`, links are `<a>`.
7. **Core Web Vitals targets (mobile):** LCP < 2.5s, CLS < 0.1, INP < 200ms. Lighthouse mobile ≥ 90 for Performance, SEO, Accessibility and Best Practices.
8. **Accessibility:** contrast ≥ 4.5:1 for body text, visible focus rings, keyboard-navigable tabs/accordion, alt text everywhere.
9. **`public/llms.txt`:** a plain-text summary of PerformanceOS (what it is, who it's for, key features, links to /science, /guides, /faq, /privacy).
10. Add `public/manifest.webmanifest` and app icons (PWA-ready).

---

## Phase 5 — Structured data (JSON-LD)

Render as `<script type="application/ld+json">` in Server Components. Use only true information. No fake ratings, reviews or user counts.

- **Home:** `WebSite`, `Organization` (name PerformanceOS, logo, url, `founder` → Person), `Person` (Yash Gaurav, `sameAs`: LinkedIn and GitHub URLs), `SoftwareApplication` (`applicationCategory: "HealthApplication"`, `operatingSystem: "Web, Android, iOS"`, `offers` with price 0 if free, `featureList`).
- **FAQ section and /faq page:** `FAQPage` with every question and answer, matching the visible text exactly.
- **Guide articles:** `Article` with `author` (Person), `datePublished`, `dateModified`, `image`. Add `BreadcrumbList` on all content pages.
- Validate everything with Google's Rich Results Test before shipping.

---

## Phase 6 — AEO (answer engine optimization) content

Goal: when someone asks ChatGPT, Perplexity or Google "how many calories in paneer bhurji" or "best calorie tracker for Indian food," PerformanceOS is the source they cite.

### Writing pattern for every content page
- H2 phrased as the exact question people ask.
- The first 40–60 words below it answer the question directly and completely, in one paragraph.
- Then detail: a table, steps or an example.
- A "Sources" list at the bottom (ICMR-NIN / IFCT 2017, WHO, peer-reviewed papers) and a visible "Last updated: <date>".
- Author box: "Written by Yash Gaurav" linking to /about.
- Medical disclaimer at the bottom of every health page: "This is general information, not medical advice. Consult a doctor or registered dietitian for personal guidance."

### Pages to create
1. **`/science`** — How targets are calculated (trend weight, estimated burn, daily target), the full maths in plain English with worked examples.
2. **`/faq`** — All FAQs (expanded beyond the landing page to about 15).
3. **`/about`** — Founder story, why PerformanceOS exists, contact.
4. **`/guides`** hub + first 6 articles:
   - Why does my weight change every day?
   - How to calculate your daily calorie burn (TDEE) — with calculator
   - How much protein do you need? (by goal and body weight) — with calculator
   - How to count calories in Indian home food without a scale
   - Calories in roti, rice, dal and common Indian staples
   - How to break a weight-loss plateau
5. **`/calories/[food]`** — programmatic pages for 50 common Indian dishes (paneer bhurji, dal tadka, chicken biryani, masala dosa, poha, idli, rajma chawal…). Each page: per-portion table (katori, plate, piece), per 100 g, macros, a "lighter version" tip, a related-dishes list and a "Snap it with PerformanceOS" CTA. Data from IFCT 2017 / ICMR-NIN with the source cited. Each page must be useful on its own: no thin or duplicated text.
6. **Free tools** (high link and AI-citation value): `/tools/tdee-calculator`, `/tools/protein-calculator`, `/tools/calorie-deficit-calculator`. Server-rendered explanation + client calculator.

Internal linking: every guide links to 2–3 related guides, the matching food pages and the relevant tool; the landing page links to /science, /guides and /faq.

---

## Phase 7 — Launch checklist (owner does these, outside the code)

- Custom domain (e.g. performanceos.app or .in) connected in Vercel; redirect the .vercel.app URL to it. Update `NEXT_PUBLIC_SITE_URL`.
- Google Search Console + Bing Webmaster Tools: verify, submit the sitemap. Enable IndexNow in Bing.
- Same brand name, description and logo on LinkedIn, GitHub README, Product Hunt and any other listing (AI engines connect these into one entity).
- Run PageSpeed Insights and the Rich Results Test on the live site.

---

## Definition of done
- [ ] No technology names visible anywhere in the UI
- [ ] Lighthouse mobile ≥ 90 on all four scores
- [ ] All copy present in the server HTML (`curl` check)
- [ ] Rich Results Test passes for FAQPage, SoftwareApplication, Article
- [ ] sitemap.xml, robots.txt and llms.txt live
- [ ] Mobile landing height < 7,000px, no horizontal scroll at 375px
- [ ] Every image has alt text; every page has a unique title, description, canonical and OG image
- [ ] Footer reads "Designed by Yash Gaurav"
