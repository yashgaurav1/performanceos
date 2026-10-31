# PERFORMANCEOS: SYSTEM CONSTITUTION & ENGINEERING LAWS

## 1. Product Vision & Aesthetic ("Obsidian Telemetry")
We are building **performanceos**, a mobile-first Personal performanceos (PWA) combining a Daily Tracker,
AI Vision Food Logger, Offline-First Gym Logger, Goals/Tasks Engine, **Study OS (Pomodoro + subject analytics)**,
**Budget Ledger (expenses, category budgets, spend trends)**, and an AI Weekly Performance Coach.

UI/UX reference: macrofactor.com · calm, data-dense, honest numbers, trend-first charts, zero clutter.

* **Theme:** Pure dark mode (`#090A0F` Carbon Obsidian background, `#12141C` elevated surface cards, `1px solid rgba(255,255,255,0.07)` borders).
* **Typography:** `Geist Sans` for UI labels; `Geist Mono` with `tabular-nums` MANDATORY on every number, weight, rep, macro, timer, percentage, score and currency amount (use the `.num` utility).
* **Semantic Accents:**
  * Primary / Focus / Study: Indigo `#6366F1`
  * Optimal / PR / Hit Target / Under Budget: Emerald `#10B981`
  * Uncertainty / Warning / Fat Allowance / Budget Pace Warning: Amber `#F59E0B`
  * Stalled Lift / Deficit / Strain / Over Budget: Coral `#F43F5E`
* **Mobile Ergonomics:** Minimum `44x44px` tap targets. Bottom navigation bar (`h-16`) with 4 primary routes
  (`/today`, `/train`, `/eat`, `/coach`) + center floating `+` Omni-Logger drawer. Secondary modules
  (`/study`, `/money`, `/goals`) are reachable from the mobile top bar and the desktop sidebar. Zero horizontal scroll bleed.

## 2. Core Tech Stack
* **Framework:** Next.js 15 (App Router), TypeScript (`strict: true`, `noUncheckedIndexedAccess`, no `any`).
* **Styling & UI:** Tailwind CSS v4, shadcn-style primitives in `src/components/ui` (Radix Dialog / vaul Drawer), `lucide-react`, `recharts`.
* **Backend & Auth:** Supabase (`@supabase/ssr`, Postgres, RLS, Storage bucket `meal-photos`).
* **Client State & Offline Sync:** TanStack Query v5 + `Dexie.js` (IndexedDB). Dexie is the client source of truth;
  every write goes to Dexie first, then into `syncQueue`, then is flushed to Supabase with idempotent `upsert`.
* **Local-Only Mode:** When `NEXT_PUBLIC_SUPABASE_URL` is unset the app runs fully on IndexedDB (no auth, no sync).
  AI routes then accept client-built telemetry (validated by zod) instead of querying Supabase.
* **Validation & AI:** `zod` v4 at all runtime boundaries; Vercel AI SDK v5 (`ai`, `@ai-sdk/google` | `@ai-sdk/openai`) with `generateObject` / `streamText`.
* **Testing:** Vitest for pure domain math.

## 3. Non-Negotiable Engineering Rules
1. **RLS Performance Rule:** Every Supabase table MUST enable RLS and wrap `auth.uid()` in a scalar subquery:
   `USING ((select auth.uid()) = user_id)` and `WITH CHECK ((select auth.uid()) = user_id)`.
2. **Idempotent Client UUIDs:** Every client-created record (`workout_sets`, `workouts`, `daily_logs`, `food_entries`,
   `goals_tasks`, `study_sessions`, `expenses`) MUST use `crypto.randomUUID()` so offline retries can `UPSERT` safely.
3. **Pure Math Separation:** All scoring, 1RM, overload, stalled-lift, nutrition, pomodoro, study and budget math lives in
   pure zero-dependency TS in `src/lib/math/` with Vitest tests before it is wired into React.
4. **Honest AI Uncertainty:** Never show a single fake-precision calorie integer from a photo. Always store and render
   `kcal_low`, `kcal_point`, `kcal_high` (e.g. `640 kcal ± 85`).
5. **Phase Verification Gate:** After any phase run `pnpm typecheck`, `pnpm lint`, `pnpm test`. Fix every error.
6. **Money is integer minor units:** Store expense amounts as integer paise/cents (`amount_minor`), never floats.

## 4. Directory Structure
```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx        # bottom nav + desktop sidebar + OmniLog sheet
│   │   ├── today/  train/  eat/  goals/  coach/
│   │   ├── study/            # Pomodoro, subject analytics, weekly study heatmap
│   │   └── money/            # Expense ledger, category budgets, spend trends
│   └── api/ai/{food-vision,weekly-review,coach-chat}/route.ts
├── components/{ui,shell,today,train,eat,goals,coach,study,money}/
├── lib/
│   ├── supabase/   # client.ts, server.ts, middleware.ts, config.ts
│   ├── db/         # dexie.ts (schema, sync queue), repo.ts (write helpers), hooks.ts
│   ├── math/       # day-score, gym-math, nutrition-math, goals-math, pomodoro, study-math, budget-math, stats
│   ├── ai/         # prompts.ts, schemas.ts, cost-ledger.ts, models.ts, compress-image.ts, build-weekly-telemetry.ts
│   └── validations/
└── types/database.types.ts
```
