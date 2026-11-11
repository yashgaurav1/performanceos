# PerformanceOS

Mobile-first PWA: **Today (day score, Big 3) · Train (offline gym logger) · Eat (AI photo food logger) ·
Coach (AI weekly review + chat) · Focus (Pomodoro) · Money (budget ledger) · Goals**.

Live: https://osperformance.vercel.app · Engineering rules: [`CLAUDE.md`](CLAUDE.md) (copied to `.cursorrules`) ·
Plan: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

With no Firebase env vars the app runs locally on IndexedDB only (demo and local data, no sign-in or cloud sync).

| Env var | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client: auth + Firestore sync |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Firebase Admin for API routes (token checks, rate limits, account deletion) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Photo logging, coach, weekly review |
| `ENFORCE_APP_CHECK` | `true` to reject AI calls without a valid App Check token |

Deploy `firestore.rules` and `storage.rules` with the Firebase CLI.

## Scripts
`npm run typecheck` · `npm run lint` · `npm run test` · `npm run build`

## Architecture
- **Local-first writes:** `src/lib/db/repo.ts` writes to Dexie for instant UI (`useLiveQuery`) and mirrors to
  Firestore `users/{uid}/...` via the Firebase client SDK. Client UUIDs everywhere.
- **Auth:** Firebase Auth only. The demo uses anonymous sign-in plus a shared read-only demo athlete.
- **AI routes** (`src/app/api/ai/*`) all pass through `guardAiRequest`: verified identity, server-side monthly
  spend cap (`ai_usage/{uid}`) and a durable Firestore rate limit shared by every serverless instance.
- **Pure math** in `src/lib/math/`, covered by Vitest.
