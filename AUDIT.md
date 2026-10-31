# System Persistence & Gemini AI Audit Report · performanceos

Comprehensive architectural audit cataloging every data persistence layer (Prisma/SQLite, IndexedDB, Cloud Firestore, Supabase) and every Gemini AI invocation point across the repository.

---

## 1. Prisma & SQLite Persistence Layer

### A. Core Configuration & Schema
- **Database Engine & File:** SQLite 3.45 backing `prisma/dev.db` (local dev) and `/tmp/dev.db` (serverless `/tmp` self-healing mirror on Vercel).
- **Prisma Client Singleton:** [`src/lib/prisma.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/prisma.ts)
  - Exports `prisma = new PrismaClient(...)`.
  - Implements `ensureDatabaseReady()`: raw SQLite DDL table self-healing bootstrap (`CREATE TABLE IF NOT EXISTS`) and default `Ayush` athlete seeding.
- **Relational Models:** Defined in [`prisma/schema.prisma`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/prisma/schema.prisma)
  1. `User`: Account identity, credentials (`passwordHash`), goal type (`CUT` / `MAINTAIN` / `BULK`), weekly rate target, and baseline macro targets (`currentTdeeKcal`, `targetCalories`, `targetProteinG`, `targetCarbsG`, `targetFatG`).
  2. `DailyTelemetry`: Daily physiological metrics keyed uniquely on `[userId, date]`. Stores `rawScaleWeightKg`, `ewmaTrendWeightKg`, aggregated macros (`totalCaloriesIn`, `totalProteinG`, `totalCarbsG`, `totalFatG`), `calculatedRollingTdeeKcal`, `adherenceScore`, `sleepHours`, `sleepQuality`, `subjectiveMood`, and `energyLevel`.
  3. `FoodLogEntry`: Individual meal item logs linked to `DailyTelemetry` and `User`. Stores `foodName`, `brandName`, `barcode`, `servingWeightG`, `caloriesKcal`, `proteinG`, `carbsG`, `fatG`, and `mealSlot` (`BREAKFAST` / `LUNCH` / `DINNER` / `SNACK`).
  4. `StudySessionLog`: Pomodoro focus blocks linked to `User`. Stores `subject`, `durationMinutes`, `mode`, and timestamp.
  5. `ExpenseTransaction`: Personal budget ledger entries linked to `User`. Stores `amount`, `category`, `paymentMethod`, `vendorOrWhere`, `note`, and `date`.
  6. `WeeklyCoachCheckIn`: Weekly MacroFactor check-in historical audit records. Stores `previousTdeeKcal`, `newTdeeKcal`, `tdeeDeltaKcal`, `previousTargetKcal`, `newTargetKcal`, new macro targets, and acceptance status.
  7. `DailyLog` (Compatibility Model): Stores legacy day-level telemetry and relations to `FoodItemLog`.
  8. `FoodItemLog` (Compatibility Model): Stores legacy food items.
  9. `WeeklyCheckIn` (Compatibility Model): Stores legacy weekly algorithm check-in recommendations.

### B. Prisma Write & Mutation Locations
- **[`src/lib/prisma.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/prisma.ts):**
  - Line 58-181: Raw SQLite bootstrap creating `User`, `DailyTelemetry`, `FoodLogEntry`, `StudySessionLog`, `ExpenseTransaction`, `WeeklyCoachCheckIn`, `DailyLog`.
  - Line 184-200: Schema migrations adding macro target columns.
  - Line 214-285: Default athlete seeding creating `User` (Ayush), 30 days of `DailyTelemetry` and `DailyLog`, and initial `WeeklyCoachCheckIn`.
- **[`prisma/seed.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/prisma/seed.ts):**
  - Line 10-30: Standalone deterministic seeding script populating `User`, `DailyTelemetry`, `DailyLog`, `FoodLogEntry`, `StudySessionLog`, `ExpenseTransaction`, and `WeeklyCoachCheckIn`.
- **[`src/app/api/auth/register/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/auth/register/route.ts):**
  - Line 56-70: `prisma.user.create` for new personal user accounts.
  - Line 90-121: `prisma.dailyTelemetry.create` and `prisma.dailyLog.create` seeding 30 days of initial historical baseline data.
  - Line 124-138: `prisma.weeklyCoachCheckIn.create` persisting initial coach check-in.
- **[`src/app/api/auth/demo/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/auth/demo/route.ts):**
  - Line 23-43: `prisma.user.create` or `prisma.user.update` ensuring the Ayush demo athlete exists.
- **[`src/app/api/auth/firebase/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/auth/firebase/route.ts):**
  - Line 41-55: `prisma.user.create` creating persistent backend user for authenticated Firebase accounts.
  - Line 74-122: Seeds 30 days of `DailyTelemetry`, `DailyLog`, and `WeeklyCoachCheckIn` for new Firebase accounts.
- **[`src/app/api/food/log/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/food/log/route.ts):**
  - Line 49-60: `tx.dailyTelemetry.create` (find or create daily row).
  - Line 63-77: `tx.foodLogEntry.create` logging meal item with macros.
  - Line 80-88: `tx.dailyTelemetry.update` incrementing calories, protein, carbs, and fat totals in an ACID transaction.
  - Line 96-131: Writes to backward-compatible `DailyLog` and `FoodItemLog`.
  - Line 172-186: `tx.foodLogEntry.delete` and `tx.dailyTelemetry.update` decrementing day totals.
- **[`src/app/api/log/food/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/log/food/route.ts):**
  - Line 47-58: `prisma.dailyLog.create`.
  - Line 61-73: `prisma.foodItemLog.create`.
  - Line 85-98: `prisma.dailyLog.update` with recalculated macro totals.
- **[`src/app/api/weight/log/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/weight/log/route.ts):**
  - Line 31-40: `prisma.dailyTelemetry.upsert` with scale weigh-in.
  - Line 43-53: `prisma.dailyLog.upsert`.
  - Line 74-89: Iterative `prisma.dailyTelemetry.update` and `prisma.dailyLog.update` recomputing EWMA trend weight and rolling TDEE across all user dates.
- **[`src/app/api/log/weight/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/log/weight/route.ts):**
  - Legacy weight log endpoint updating `DailyLog` scale and trend weights.
- **[`src/app/api/study/log/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/study/log/route.ts):**
  - Line 31-39: `prisma.studySessionLog.create` persisting completed study block.
- **[`src/app/api/money/transaction/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/money/transaction/route.ts):**
  - Line 33-43: `prisma.expenseTransaction.create` persisting expense record.
- **[`src/app/api/coach/check-in/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/coach/check-in/route.ts):**
  - Line 81-95: `tx.weeklyCoachCheckIn.create` persisting new expenditure calculation.
  - Line 97-108: `tx.weeklyCheckIn.create`.
  - Line 110-122: `tx.user.update` persisting newly adjusted target calories and macros.
- **[`src/app/api/check-in/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/check-in/route.ts):**
  - Legacy check-in route updating `WeeklyCheckIn` and `User`.
- **[`src/app/api/user/settings/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/user/settings/route.ts):**
  - Line 79-94: `prisma.user.update` updating profile name, goal type, and calorie/macro targets.

### C. Prisma Query & Read Locations
- **[`src/lib/auth-server.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/auth-server.ts):** `prisma.user.findUnique` (session token verification) and `prisma.user.findFirst` (Ayush demo fallback).
- **[`src/app/api/auth/login/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/auth/login/route.ts):** `prisma.user.findUnique` (password lookup).
- **[`src/app/api/auth/me/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/auth/me/route.ts):** Calls `getAuthenticatedUser()`.
- **[`src/app/api/dashboard/telemetry/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/dashboard/telemetry/route.ts):** Reads `DailyTelemetry` (with `foodEntries`), `StudySessionLog`, `ExpenseTransaction`, and `WeeklyCoachCheckIn`.
- **[`src/app/api/telemetry/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/telemetry/route.ts):** Reads `DailyTelemetry` for time-series charts.
- **[`src/app/api/user/settings/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/user/settings/route.ts):** `prisma.user.findUnique` for settings screen.
- **[`src/app/api/backend/status/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/backend/status/route.ts):** Queries `prisma.user.count()` and `prisma.dailyTelemetry.count()`.

---

## 2. Client IndexedDB Layer (Dexie)

### A. Database Architecture & Schema
- **Database Name:** `CommandCenterLocalDB`
- **Configuration & Table Definitions:** [`src/lib/db/dexie.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/db/dexie.ts)
  - Tables:
    1. `profile`: `"id"` (stores user target macros, sleep target, pomodoro settings, currency)
    2. `dailyLogs`: `"id, &log_date, sync_status"` (stores day scores, sleep metrics, weight, wins)
    3. `workouts`: `"id, log_date, sync_status"` (stores gym sessions, split name, total volume, PR count)
    4. `workoutSets`: `"id, workout_id, exercise_slug, completed_at, sync_status, [exercise_slug+completed_at]"` (stores individual sets, weights, reps, RIR, 1RM)
    5. `foodEntries`: `"id, log_date, sync_status"` (stores meals, food titles, calories, macros)
    6. `goalsTasks`: `"id, kind, scheduled_date, status, parent_goal_id, sync_status"` (stores Big-3 tasks, daily tasks, quarterly goals)
    7. `studySessions`: `"id, log_date, subject, sync_status"` (stores study logs, focus minutes, pomodoro counts)
    8. `expenses`: `"id, spent_on, category, sync_status"` (stores expenses, amounts, payment methods)
    9. `budgetCategories`: `"id, &category, sync_status"` (stores category-level budget limits)
    10. `weeklyReviews`: `"id, &week_start_date"` (stores cached AI weekly executive reviews)
    11. `aiLedger`: `"id, created_at, feature"` (stores local audit ledger of AI token usages and costs)
    12. `syncQueue`: `"++queue_id, table_name, record_id, operation, created_at, attempts"` (FIFO sync queue for remote flush)

### B. Dexie Write Locations
- **[`src/lib/db/repo.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/db/repo.ts):** Primary client write API; writes to IndexedDB and enqueues to `syncQueue`:
  - `recomputeDayScore`: updates `db.dailyLogs`
  - `patchDailyLog`: updates `db.dailyLogs` (sleep, mood, weight, friction)
  - `addWin` & `removeWin`: modifies `wins_list` in `db.dailyLogs`
  - `updateProfile`: updates `db.profile`
  - `addFoodEntry`: puts record into `db.foodEntries`
  - `deleteFoodEntry`: removes record from `db.foodEntries`
  - `startWorkout`: puts new workout into `db.workouts`
  - `logSet`: puts set into `db.workoutSets` and recalculates `db.workouts` volume/PR totals
  - `deleteSet`: deletes set from `db.workoutSets`
  - `finishWorkout`: updates `db.workouts` with end time and session RPE
  - `discardWorkout`: deletes workout and associated sets
  - `addTask`: puts task into `db.goalsTasks`
  - `setTaskStatus`: updates status (`todo` / `done`) in `db.goalsTasks`
  - `pinBigThree` & `swapBigThree`: updates `is_big_three` in `db.goalsTasks`
  - `rollTaskTo`: modifies `scheduled_date` in `db.goalsTasks`
  - `dropTask` & `deleteTask`: modifies/deletes task in `db.goalsTasks`
  - `addGoal` & `adjustGoalMetric`: manages quarterly goals in `db.goalsTasks`
  - `addStudySession`: puts session into `db.studySessions`
  - `rateStudySession`: updates rating in `db.studySessions`
  - `deleteStudySession`: deletes from `db.studySessions`
  - `addExpense`: puts expense into `db.expenses`
  - `deleteExpense`: deletes from `db.expenses`
  - `setCategoryBudget`: updates/deletes in `db.budgetCategories`
- **[`src/lib/db/hydrator.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/db/hydrator.ts):**
  - Line 43: `db.profile.put` updates local profile with backend targets.
  - Line 75: `db.dailyLogs.put` in transaction hydrates up to 90 days of backend telemetry into IndexedDB.
- **[`src/lib/demo/seed.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/demo/seed.ts):**
  - Line 20: Clears `dailyLogs`, `foodEntries`, `workouts`, `workoutSets`, `goalsTasks`, `studySessions`, `expenses`.
  - Line 21-46: `bulkPut` operations populating demo datasets into all local tables.
- **[`src/lib/ai/client.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/ai/client.ts):**
  - Line 8: `db.aiLedger.put` mirrors AI cost ledger rows locally.
- **[`src/lib/db/sync.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/db/sync.ts):**
  - Line 24: `db.syncQueue.add` queues outgoing operations.
  - Line 52-58: `db.syncQueue.delete` and status updates on local entity tables after remote flush.
- **[`src/lib/firebase/firestore-sync.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/firebase/firestore-sync.ts):**
  - Line 174: `localDb.profile.put` hydrates user profile from Cloud Firestore.
  - Line 211: `localDb.dailyLogs.put` hydrates daily logs from Cloud Firestore.
  - Line 225: `localDb.foodEntries.put` hydrates food entries from Cloud Firestore.
  - Line 240: `localDb.studySessions.put` hydrates study sessions from Cloud Firestore.
  - Line 255: `localDb.expenses.put` hydrates transactions from Cloud Firestore.

### C. Dexie Reactive Read Hooks
- **[`src/lib/db/hooks.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/db/hooks.ts):** Exposes `useLiveQuery` hooks (`useProfile`, `useDailyLog`, `useDailyLogsRange`, `useFoodEntries`, `useFoodRange`, `useWorkoutsRange`, `useActiveWorkout`, `useWorkoutSets`, `useAllSets`, `useAllWorkouts`, `useTasks`, `useStudySessions`, `useExpenses`, `useBudgetCategories`, `useSyncQueueCount`, `useSyncQueueErrors`, `useWeeklyReview`, `useAiLedgerSince`).

---

## 3. Cloud Firestore Persistence Layer

### A. Core Architecture & Rules
- **Configuration:** [`src/lib/firebase/config.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/firebase/config.ts) and [`src/lib/firebase/client.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/firebase/client.ts) (connects to project `performance-os-2230e` or runtime `cc:firebase_config`).
- **Security Rules:** [`firestore.rules`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/firestore.rules)
  - Scope: Scoped to authenticated user path `/databases/{database}/documents/users/{userId}`.
- **Document & Subcollection Hierarchy:**
  1. `/users/{userId}`: Root document for profile and macro targets.
  2. `/users/{userId}/dailyLogs/{date}`: Subcollection documents keyed by date `YYYY-MM-DD`.
  3. `/users/{userId}/foodEntries/{entryId}`: Subcollection documents keyed by entry UUID.
  4. `/users/{userId}/studySessions/{sessionId}`: Subcollection documents keyed by session UUID.
  5. `/users/{userId}/transactions/{expenseId}`: Subcollection documents keyed by expense UUID.

### B. Firestore Write & Sync Locations
- **[`src/lib/firebase/firestore-sync.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/firebase/firestore-sync.ts):**
  - Line 33-40: `saveProfileToFirestore` writes `setDoc(doc(db, "users", targetUid), patch, { merge: true })`.
  - Line 57-66: `saveDailyLogToFirestore` writes `setDoc(doc(db, "users", targetUid, "dailyLogs", date), patch, { merge: true })`.
  - Line 83-87: `saveFoodEntryToFirestore` writes `setDoc(doc(db, "users", targetUid, "foodEntries", entry.id), entry)`.
  - Line 104-105: `deleteFoodEntryFromFirestore` calls `deleteDoc(doc(db, "users", targetUid, "foodEntries", entryId))`.
  - Line 122-126: `saveStudySessionToFirestore` writes `setDoc(doc(db, "users", targetUid, "studySessions", session.id), session)`.
  - Line 143-147: `saveExpenseToFirestore` writes `setDoc(doc(db, "users", targetUid, "transactions", expense.id), expense)`.
- **[`src/lib/db/repo.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/db/repo.ts):** Calls Firestore persistence on every mutation:
  - Line 113: `saveDailyLogToFirestore(date, patch)`
  - Line 150: `saveProfileToFirestore(patch)`
  - Line 179: `saveFoodEntryToFirestore(rec)`
  - Line 209: `deleteFoodEntryFromFirestore(id)`
  - Line 471: `saveStudySessionToFirestore(rec)`
  - Line 529: `saveExpenseToFirestore(rec)`

### C. Firestore Read Locations
- **[`src/lib/firebase/firestore-sync.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/firebase/firestore-sync.ts):**
  - Line 170: `getDoc(doc(firestore, "users", targetUid))` loads user profile.
  - Line 200: `getDocs(collection(firestore, "users", targetUid, "dailyLogs"))` loads daily logs.
  - Line 220: `getDocs(collection(firestore, "users", targetUid, "foodEntries"))` loads food entries.
  - Line 235: `getDocs(collection(firestore, "users", targetUid, "studySessions"))` loads study sessions.
  - Line 250: `getDocs(collection(firestore, "users", targetUid, "transactions"))` loads expenses.
- **[`src/lib/firebase/auth-context.tsx`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/firebase/auth-context.tsx):**
  - Triggers `syncFirestoreWithLocalDB(user.uid)` upon successful sign-in.

---

## 4. Supabase Persistence Layer

### A. Configuration & Clients
- **Config & In-App Customization:** [`src/lib/supabase/config.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/supabase/config.ts) (reads env `NEXT_PUBLIC_SUPABASE_*` or runtime `cc:supabase_*`).
- **Browser Client:** [`src/lib/supabase/client.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/supabase/client.ts) (`createBrowserClient` via `@supabase/ssr`).
- **Server Client:** [`src/lib/supabase/server.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/supabase/server.ts) (`createServerClient` bound to request cookies).
- **Migration Schema:** [`supabase/migrations/0001_command_center_schema.sql`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/supabase/migrations/0001_command_center_schema.sql)
  - Tables: `profiles`, `daily_logs`, `food_entries`, `exercises`, `workouts`, `workout_sets`, `goals_tasks`, `study_sessions`, `expenses`, `budget_categories`, `ai_weekly_reviews`, `ai_runs_ledger`.

### B. Supabase Write Locations
- **[`src/lib/db/sync.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/db/sync.ts):**
  - Line 42: `supabase.from(item.table_name).delete().eq("id", item.record_id)` executes queued deletes.
  - Line 43: `supabase.from(item.table_name).upsert(toRemote(...), { onConflict })` executes queued upserts across all 11 synced tables.
- **[`src/lib/ai/cost-ledger.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/ai/cost-ledger.ts):**
  - Line 37: `auth.supabase.from("ai_runs_ledger").upsert(row, { onConflict: "id" })` records AI token consumption and cost.
- **[`src/app/api/ai/weekly-review/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/ai/weekly-review/route.ts):**
  - Line 128-131: `auth.supabase.from("ai_weekly_reviews").upsert(...)` caches completed weekly performance review.
- **[`src/app/auth/callback/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/auth/callback/route.ts):**
  - Line 18: `supabase.auth.exchangeCodeForSession(code)` stores Supabase session cookies.

### C. Supabase Read Locations
- **[`src/lib/ai/cost-ledger.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/ai/cost-ledger.ts):**
  - Line 15: Queries `ai_runs_ledger` for month-to-date dollar spend.
- **[`src/app/api/ai/weekly-review/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/ai/weekly-review/route.ts):**
  - Line 24: Checks `ai_weekly_reviews` cache for existing review.
- **[`src/lib/ai/build-weekly-telemetry.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/ai/build-weekly-telemetry.ts):**
  - Reads `daily_logs`, `food_entries`, `workouts`, `workout_sets`, `study_sessions`, `goals_tasks`, and `profiles` to build 7-day telemetry payload.
- **[`src/app/api/backend/status/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/backend/status/route.ts):**
  - Probes table access across all Supabase relations.
- **[`src/middleware.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/middleware.ts):**
  - Refreshes auth session using `supabase.auth.getUser()`.

---

## 5. Google Gemini AI Invocation Layer

Google Gemini is integrated directly using the official `@ai-sdk/google` provider (`createGoogleGenerativeAI`) in [`src/lib/ai/models.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/ai/models.ts).

### A. Model Provider & Key Resolution
- **Provider Initializer:** [`src/lib/ai/models.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/lib/ai/models.ts)
  - Primary Model ID: **`gemini-3.8-flash`** (fallback pricing mapped for `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`).
  - Method: `createGoogleGenerativeAI({ apiKey: googleKey })`.
  - Multi-Environment Key Extraction (`getGoogleApiKey`): checks `customKey` (from client request header `x-gemini-api-key`), `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `NEXT_PUBLIC_GEMINI_API_KEY`, and `GEMINI_KEY`.
  - Fallback Provider: OpenRouter routing `google/gemini-2.0-flash` or OpenAI `gpt-4o-mini`.

### B. Gemini Server-Side Execution Points

1. **AI Dietitian Coach Chat (Interactive Streaming):**
   - **File:** [`src/app/api/ai/coach-chat/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/ai/coach-chat/route.ts)
   - **Invocation:** Line 52-59:
     ```ts
     streamText({
       model: m.model, // Gemini model instance from getModel()
       system: coachSystemPrompt(...),
       messages: convertToModelMessages(messages),
       onFinish: async ({ totalUsage }) => { ... },
     })
     ```
   - **Payload:** User conversation turns (last 12 messages), today's live telemetry (`today_live`), and 7-day historical telemetry snapshot.
   - **Output:** Streams UI message protocol chunks to frontend, records token usage to `persistLedger`.

2. **Multimodal Meal Photo Vision Decomposition:**
   - **File:** [`src/app/api/ai/food-vision/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/ai/food-vision/route.ts)
   - **Invocation:** Line 93-107:
     ```ts
     generateObject({
       model: m.model,
       schema: FoodVisionEstimationSchema,
       system: FOOD_VISION_SYSTEM_PROMPT,
       temperature: 0.2,
       messages: [{
         role: "user",
         content: [
           { type: "text", text: ... },
           { type: "image", image: parsed.data.image_base64, mediaType: parsed.data.mime_type }
         ]
       }]
     })
     ```
   - **Payload:** User photo base64 string, MIME type, optional text hint.
   - **Output:** Structured JSON schema decomposing the plate into discrete items with weights, calories, protein, carbs, fat, and oil/gravy flags.

3. **Weekly Quantitative Performance Executive Review:**
   - **File:** [`src/app/api/ai/weekly-review/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/ai/weekly-review/route.ts)
   - **Invocation:** Line 118-124:
     ```ts
     generateObject({
       model: m.model,
       schema: WeeklyReviewSchema,
       system: WEEKLY_REVIEW_SYSTEM_PROMPT,
       temperature: 0.4,
       prompt: `<telemetry_json>\n${JSON.stringify(telemetry)}\n</telemetry_json>\nWrite this week's review.`
     })
     ```
   - **Payload:** Complete 7-day cross-domain telemetry JSON across sleep, nutrition, strength tonnage, study recall, and big-3 tasks.
   - **Output:** Structured JSON with grades, scorecard summaries, cross-domain physiological correlations, stalled lift diagnostics, and binary next-week protocols.

4. **Natural Language Food Text Parser:**
   - **File:** [`src/app/api/ai-parse/route.ts`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/app/api/ai-parse/route.ts)
   - **Invocation:** Line 138-144:
     ```ts
     generateObject({
       model: ai.model,
       schema: ParsedMealSchema,
       prompt: `Parse the following natural language food description into realistic food items with accurate gram weights and macronutrients: "${text}"`
     })
     ```
   - **Payload:** Free-form text (e.g. `"200g chicken breast and 150g jasmine rice"`).
   - **Output:** Structured array of items with gram weights, calories, protein, carbs, and fat.

### C. Client-Side Triggers & Key Injection
- **[`src/components/coach/coach-chat-drawer.tsx`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/components/coach/coach-chat-drawer.tsx):**
  - Line 43: Calls `/api/ai/coach-chat` with `useChat` and injects `x-gemini-api-key` header from `localStorage`.
- **[`src/components/eat/photo-scanner-drawer.tsx`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/components/eat/photo-scanner-drawer.tsx):**
  - Line 49: Invokes `postJSON("/api/ai/food-vision", { image_base64, mime_type, hint })`.
- **[`src/components/coach/weekly-executive-brief.tsx`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/components/coach/weekly-executive-brief.tsx):**
  - Line 34: Invokes `postJSON("/api/ai/weekly-review", { week_start_date, end_date, telemetry })`.
- **[`src/components/macrofactor/speed-log-modal.tsx`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/components/macrofactor/speed-log-modal.tsx):**
  - Line 120: Fetches `/api/ai-parse` with natural language meal string.
- **[`src/components/coach/ai-key-modal.tsx`](file:///c:/Users/Yash%20Gaurav/Desktop/SHADOWFAX/command-center/src/components/coach/ai-key-modal.tsx):**
  - Line 46: Manages and saves custom user Gemini API key to `localStorage` under `custom_gemini_api_key`.

---

## 6. Architecture Summary Matrix

| Domain / Entity | Prisma / SQLite | Client IndexedDB (Dexie) | Cloud Firestore | Supabase (Optional Cloud Sync) |
|---|---|---|---|---|
| **User Identity & Auth** | `User` table in `dev.db` | `profile` store | `/users/{uid}` doc | `auth.users` / `profiles` |
| **Daily Telemetry & Day Score** | `DailyTelemetry` + `DailyLog` | `dailyLogs` store | `/users/{uid}/dailyLogs/{date}` | `daily_logs` table |
| **Nutrition & Meal Logs** | `FoodLogEntry` + `FoodItemLog` | `foodEntries` store | `/users/{uid}/foodEntries/{id}` | `food_entries` table |
| **Study Sessions** | `StudySessionLog` table | `studySessions` store | `/users/{uid}/studySessions/{id}` | `study_sessions` table |
| **Expense Transactions** | `ExpenseTransaction` table | `expenses` + `budgetCategories` | `/users/{uid}/transactions/{id}` | `expenses` + `budget_categories` |
| **Training & Workout Sets** | Computed in API / seeded | `workouts` + `workoutSets` | N/A (local-first) | `workouts` + `workout_sets` |
| **Goals & Big-3 Tasks** | N/A (client-first engine) | `goalsTasks` store | N/A (local-first) | `goals_tasks` table |
| **Weekly Reviews & Check-Ins**| `WeeklyCoachCheckIn` table | `weeklyReviews` store | N/A (algorithmic) | `ai_weekly_reviews` table |
| **AI Cost & Audit Ledger** | N/A (stateless token cost) | `aiLedger` store | N/A | `ai_runs_ledger` table |
