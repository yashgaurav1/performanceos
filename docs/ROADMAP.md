# Roadmap

The full upgrade plan is in [`PRO_UPGRADE_PROMPT.md`](PRO_UPGRADE_PROMPT.md). Each phase lands as one PR.

## Baseline (audit, 2026-11-12)
- Landing (desktop, warm): LCP ~5.9 s, CLS ~0.52, ~2.1 MB transferred, ~500 KB JS.
- 23 landing tap targets under 44 px. Demo data disagrees between Train, Coach and Today.

## Phase 0: One source of truth (done on `phase-0-single-source`)
**Stack:** Dexie → Firestore (client SDK) + Firebase Auth. Prisma, Supabase, root `lib/`, and the unused
`components/macrofactor` tree removed.

**API routes: 27 → 10.** Removed duplicate or unused routes (`ai-parse`, `check-in`, `coach/check-in`,
`telemetry`, `dashboard/telemetry`, `log/food`, `log/weight`, `food/search`, `ai/coach-chat`,
`ai/food-vision`, `auth/login`, `auth/register`, `auth/session`, `user/settings`) and the server write
routes that duplicated client writes (`food/log`, `money/transaction`, `study/log`, `weight/log`).

**Security fixes:**
- `/api/auth/login` returned success for any password; `/api/auth/register` let anyone create user docs. Both removed;
  the client no longer falls back to them.
- `x-athlete-uid` header was trusted as identity: anyone could read another user's 14-day data through the coach,
  write meals or targets into their account, or **delete their account** via `/api/user/delete-account`.
  Identity now comes only from a verified Firebase ID token.
- `/api/auth/firebase` let anyone overwrite any user's profile; it now takes uid/email from the verified token.
- The four removed server write routes had no auth header and wrote every user's meals, expenses, focus
  sessions and weigh-ins into the shared demo athlete's Firestore doc.
- `/api/ai/weekly-review` and `/api/ai-parse` called the model with no auth or limit; weekly review's spend cap
  trusted a client-sent number.

**AI cost control:** single `guardAiRequest` on every AI route. Durable Firestore rate limit
(`rate_limits/*`, transactional): signed-in users 30/h · 200/day per endpoint; guests 8/h · 25/day per IP and
60/h · 300/day combined. Monthly spend cap moved to server-only `ai_usage/{uid}` and now actually resets each month.
Demo coach can no longer write.

**Account deletion** now removes every subcollection under `users/{uid}` (it previously targeted collection names
that don't exist), meal photos in Storage, and reports failure instead of claiming success.

**Docs:** `CLAUDE.md` rewritten to match the code; old planning docs moved to `docs/archive/`.

**Still open from Phase 0:** deploy and verify against production Firebase (rate limit docs appear, the
demo still works, account deletion works end to end).

## Phase 1+: see `PRO_UPGRADE_PROMPT.md`
