# PERFORMANCEOS: SYSTEM CONSTITUTION & ENGINEERING LAWS

This file describes the app **as it is**. If code and this file disagree, fix one of them in the same PR.
Plans and history live in `docs/ROADMAP.md` and `docs/archive/`.

## 1. Product
**PerformanceOS** is a mobile-first PWA: Today (day score, Big 3), Train (offline gym logger), Eat (AI photo
food logger), Coach (AI weekly review + chat), Focus/Study (Pomodoro + analytics), Money (expense ledger,
budgets) and Goals. Live at https://osperformance.vercel.app. Reference bar: MacroFactor. Calm, data-dense,
honest numbers, trend-first charts.

## 2. Design tokens (source of truth: `src/app/globals.css`)
* **Surfaces:** background `#0C0C0D`, cards `#151517`, borders `rgba(255,255,255,0.08)`.
* **Brand / primary action:** orange `--color-accent` `#FF5533`. Use it for primary buttons, active nav and brand marks only.
* **Status colours** (never use the brand colour to mean good or bad):
  * Good / hit target / under budget / PR: emerald
  * Watch / uncertain / pace warning: amber `#F5B841`
  * Bad / over budget / stalled: a red that is visibly different from the brand orange
  * No data: neutral grey
* **Macros:** protein `#FF7A59`, carbs `#F5B841`, fat `#3CC8C0`.
* **Type:** Satoshi (display), Inter (UI). Every number, weight, rep, macro, timer, %, score and currency uses
  tabular figures via the `.num` utility.
* **Ergonomics:** tap targets ≥ 44×44 px. Bottom nav (`/today`, `/train`, `/eat`, `/coach`) + centre `+` Omni-Logger.
  `/study`, `/money`, `/goals` via the top bar and desktop sidebar. No horizontal scroll.

## 3. Stack
* **Framework:** Next.js 15 (App Router), React 19, TypeScript (`strict`, `noUncheckedIndexedAccess`, no `any`).
* **UI:** Tailwind CSS v4, primitives in `src/components/ui`, Radix Dialog / vaul Drawer, lucide-react, recharts.
* **Data:** **Dexie (IndexedDB) is the client source of truth.** Writes go through `src/lib/db/repo.ts` → Dexie,
  and are mirrored to **Cloud Firestore** at `users/{uid}/...` by the Firebase client SDK
  (`src/lib/firebase/firestore-sync.ts`). Firestore rules (`firestore.rules`) lock every path to its owner.
* **Auth:** Firebase Auth only (Google, email/password). There is no other login system.
* **No demo / guest mode.** Every user signs in. `src/lib/demo/` is a local-development seeding tool only
  (developer drawer, dev builds); it never uploads anything. `src/lib/db/local-owner.ts` wipes local data when
  the signed-in account changes and on sign-out. Firestore writes are skipped when nobody is signed in.
* **Google sign-in & email links** are served from our own domain: `next.config.ts` proxies `/__/auth/*` to
  `<project>.firebaseapp.com` and serves `/__/firebase/init.json` from `/api/firebase-init`. On hosts listed in
  `NEXT_PUBLIC_AUTH_SELF_HOSTED_HOSTS` (default `osperformance.vercel.app`) the auth domain is the site itself.
  Phones and installed apps use redirect sign-in; desktop uses a popup. Password reset links open `/auth/action`.
* **Assistant** (`src/components/assistant/`): the `+` button. Clear commands are parsed on-device by
  `src/lib/math/assistant-intents.ts` and run by `run-action.ts` (works offline). Everything else goes to
  `/api/ai/coach`, which streams `{ type: "action" }` events the client validates (`src/lib/ai/assistant-actions.ts`)
  and runs through the same executor. The server never writes user data.
* **App shell** waits only for Firebase to restore the session from IndexedDB, never for an API call.
* **Server:** Firebase Admin (`src/lib/firebaseAdmin.ts`) is used only by API routes for AI, account sync and account deletion.
* **AI:** Gemini via `@google/genai` and the Vercel AI SDK (`ai`, `@ai-sdk/google` | `@ai-sdk/openai`). zod v4 at every boundary.
* **PWA:** Serwist (`src/app/sw.ts`). **Tests:** Vitest (unit), Playwright (`tests/e2e.spec.ts`).
* **Package manager:** npm (`package-lock.json`).

Not used, do not reintroduce: Prisma/SQLite, Supabase, custom password auth, server routes that duplicate client writes.

## 4. API routes (`src/app/api`)
| Route | Purpose |
|---|---|
| `ai/coach` | Assistant/coach chat (streams). Actions are executed by the client; the server only reads. |
| `ai/vision/meal` | Photo → meal estimate with kcal range. |
| `ai/weekly-review` | Weekly review from client-built telemetry. |
| `auth/firebase` | Upsert `users/{uid}` profile after sign-in (uid from verified token). |
| `auth/me`, `auth/logout` | Session helpers. |
| `firebase-init` | Firebase web config for the self-hosted sign-in helper (`/__/firebase/init.json`). |
| `user/delete-account` | Deletes `users/{uid}` recursively, meal photos, `ai_usage/{uid}` and the Auth user. |
| `health`, `backend/status` | Ops / developer drawer. |

## 5. Non-negotiable rules
1. **Identity comes only from a verified Firebase ID token.** Use `verifyServerAuth` / `guardAiRequest`
   (`src/lib/ai/server-auth.ts`). Never trust a uid from a header or body. In production, callers without a
   valid token get 401.
2. **Every AI route calls `guardAiRequest(req, endpoint)` before the model**: App Check → identity →
   monthly spend cap (`ai_usage/{uid}`, server-only) → durable Firestore rate limit (`rate_limits/*`).
   Record cost with `recordSpend`. The in-memory limiter in `src/lib/rate-limiter.ts` is a burst guard only.
3. **Idempotent client UUIDs:** every client-created record uses `crypto.randomUUID()`.
4. **Pure math** (scoring, 1RM, overload, stall, nutrition, pomodoro, study, budget) lives in zero-dependency TS
   in `src/lib/math/` with Vitest tests before it is wired into React.
5. **Honest AI uncertainty:** never show a single fake-precise calorie number from a photo. Store and render
   `kcal_low`, `kcal_point`, `kcal_high` (e.g. `640 kcal ± 85`).
6. **Money is integer minor units** (`amount_minor`, paise/cents). Never floats.
7. **Verification gate** after every change: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`. Fix everything.
8. Before deleting code, prove it is unused (grep imports and route URLs).

## 6. Directory structure
```
src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/{today,train,eat,coach,goals,study,money,settings}/
│   ├── api/                      # see section 4
│   ├── about/ science/ guides/ faq/ calories/ tools/   # marketing + SEO pages
│   ├── page.tsx                  # landing page
│   └── manifest.ts sw.ts sitemap.ts robots.ts opengraph-image.tsx
├── components/{ui,shell,today,train,eat,goals,coach,study,money,marketing,motion,pwa,settings,tools,content}/
├── data/                         # static content (FAQs, foods, guides, demo fixtures)
├── lib/
│   ├── db/        # dexie.ts (schema), repo.ts (writes), hooks.ts, hydrator.ts, sync.ts
│   ├── firebase/  # client, config, auth-context, firestore-sync, storage-client, app-check
│   ├── ai/        # server-auth (guard), prompts, schemas, models, cost, telemetry builders, client helpers
│   ├── math/      # pure domain math + tests
│   ├── demo/      # demo dataset + seed
│   └── hooks/
├── types/database.types.ts
└── middleware.ts                  # security headers + burst limiter
```
