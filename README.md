# performanceos

Mobile-first PWA: **Day Score · Study OS (Pomodoro) · Offline Gym Logger · AI Photo Food Tracker · Budget Ledger · Goals/Big-3 · AI Weekly Coach**.
Design language "Obsidian Telemetry" (see `CLAUDE.md` · also copied to `.cursorrules`).

## Quick start

```bash
pnpm install
cp .env.example .env.local     # everything is optional
pnpm dev                        # http://localhost:3000 → /today
```

With no env vars the app runs in **Local-Only mode**: all data lives in IndexedDB on the device, no login.
Open **Settings → Load 6-week demo data** to see every chart populated.

| Env var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enables auth + cloud sync |
| `GOOGLE_GENERATIVE_AI_API_KEY` (or `OPENAI_API_KEY` + `AI_PROVIDER=openai`) | Food vision, weekly review, coach chat |
| `AI_MONTHLY_CAP_USD` / `NEXT_PUBLIC_AI_MONTHLY_CAP_USD` | Spend cap (default $2.00) |

### Supabase
1. Create a project, then run `supabase/migrations/0001_command_center_schema.sql` (SQL editor or `supabase db push`).
   It creates all tables, indexes, RLS with `(select auth.uid())`, the Big-3 trigger, the exercise seed and the private `meal-photos` bucket.
2. Add `<site>/auth/callback` to Auth → URL configuration redirect URLs.

## Scripts
`pnpm typecheck` · `pnpm lint` · `pnpm test` (Vitest, 72 tests) · `pnpm build`

## Architecture
- **Local-first writes** (`src/lib/db/repo.ts`): Dexie write + `syncQueue` entry in one transaction → instant UI via `useLiveQuery` → debounced, FIFO, idempotent `upsert` to Supabase (`src/lib/db/sync.ts`) on `online`, tab-visible, every 30s and after writes. Client UUIDs everywhere.
- **Pure math** (`src/lib/math/`): day score, e1RM/PRs/double-progression/stall attribution/fractional volume, nutrition uncertainty, goal pace, Pomodoro state machine, study analytics, budget (integer paise).
- **Day Score** is recomputed on every write that feeds it; daily `study_hours` / `active_recall_mins` are derived from study sessions so Study OS and score never disagree.
- **Focus timer** is timestamp-based and persisted in `localStorage`; a headless engine completes phases, logs sessions and beeps even if the app was closed mid-block.
- **AI** (`src/app/api/ai/*`): `generateObject` for vision + weekly review, `streamText` for coach chat. Telemetry is pre-computed in TS (`build-weekly-telemetry.ts`). Signed-in: server queries Supabase and caches reviews (re-viewing costs $0.00). Local-only: client sends zod-validated telemetry. Every call is costed into `ai_runs_ledger`.

## Notes / deliberate deviations from the build prompts
- Stall class `MICROMICRO_LOAD_STALL` is named `MICRO_LOAD_STALL` (typo in spec).
- Volume zones: spec left 18-20 sets undefined → labelled `upper_zone`.
- 28 exercises seeded (spec asked for ~25) to cover side/rear delts, glutes and core.
- Pinned to Next.js 15.5, AI SDK v5, Zod 4, Tailwind 4 for API stability.
- Added modules beyond the prompts: **/study** (Pomodoro, subjects, recall ratio, 12-week heatmap, streaks) and **/money** (inline expense entry `120 chai @canteen`, category budgets, pace line, projections, weekly/monthly trends, top merchants).
