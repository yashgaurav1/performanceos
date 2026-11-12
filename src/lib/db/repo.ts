/**
 * Single Firestore Client Data Layer · performanceos
 * Direct Cloud Firestore writes with persistentLocalCache for offline support.
 * Synchronous local Dexie mirror for immediate zero-latency UI re-rendering.
 */
import { computeDayScore } from "@/lib/math/day-score";
import { dayOfWeek, toISODate } from "@/lib/math/dates";
import { bigThreeProgress, canPinBigThree, type Domain } from "@/lib/math/goals-math";
import { calculateEst1RM, evaluateSetPRs, isHardSet, workoutVolume, type SetType } from "@/lib/math/gym-math";
import { dailyStudyTotals, type StudyMode } from "@/lib/math/study-math";
import type { ExpenseCategory, PaymentMethod } from "@/lib/math/budget-math";
import type {
  DailyLog, Expense, FoodEntry, GoalTask, Profile, StudySession, SyncedTableName, TaskStatus, Win, Workout, WorkoutSet,
} from "@/types/database.types";
import { getDB, LOCAL_USER_ID, PROFILE_KEY, TABLE_MAP, type Local } from "./dexie";
import { enqueue, scheduleFlush } from "./sync";
import { isDemoMode } from "./firestore-client";
import { toast } from "@/components/ui/toast";
import {
  saveDailyLogToFirestore,
  saveProfileToFirestore,
  saveFoodEntryToFirestore,
  deleteFoodEntryFromFirestore,
  saveWorkoutToFirestore,
  deleteWorkoutFromFirestore,
  saveWorkoutSetToFirestore,
  deleteWorkoutSetFromFirestore,
  saveGoalTaskToFirestore,
  deleteGoalTaskFromFirestore,
  saveStudySessionToFirestore,
  deleteStudySessionFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveBudgetCategoryToFirestore,
} from "@/lib/firebase/firestore-sync";

export const uuid = () => crypto.randomUUID();
export const nowISO = () => new Date().toISOString();
export const todayISO = () => toISODate(new Date());

export const DEFAULT_PROFILE: Profile = {
  id: PROFILE_KEY, display_name: null, body_weight_kg: 70, target_kcal: 2400, target_protein_g: 140, target_carbs_g: 260,
  target_fat_g: 75, target_sleep_hours: 8, target_study_hours: 4, exam_crunch_mode: false, pomodoro_focus_mins: 50,
  pomodoro_short_break_mins: 10, pomodoro_long_break_mins: 25, pomodoro_cycles_before_long: 4, currency_code: "INR",
  monthly_budget_minor: 15000_00, rest_days: [0], created_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString(),
};

export function emptyDailyLog(date: string): DailyLog {
  return {
    id: uuid(), user_id: LOCAL_USER_ID, log_date: date, sleep_hours: null, sleep_quality: null, study_hours: 0, active_recall_mins: 0,
    mood_score: null, energy_score: null, body_weight_kg: null, wins_list: [], friction_note: null, day_score: 0, score_breakdown: {},
    client_updated_at: nowISO(),
  };
}

/**
 * Demo writes are real but local: they land in IndexedDB so every logging flow
 * works, and the Firestore layer (firestore-sync.ts) refuses to upload demo data.
 * Shows a one-time note per session; never blocks the write.
 */
function notifyDemoReadOnly(): boolean {
  if (typeof window !== "undefined" && isDemoMode()) {
    try {
      if (sessionStorage.getItem("cc:demo_write_note") !== "1") {
        sessionStorage.setItem("cc:demo_write_note", "1");
        setTimeout(
          () => toast("Demo: saved on this device only", { tone: "neutral", body: "Sign in to keep your own log and sync it." }),
          1600
        );
      }
    } catch {
      // storage unavailable: skip the note
    }
  }
  return false;
}

const ALL_TABLES = () => {
  const db = getDB();
  return [db.profile, db.dailyLogs, db.workouts, db.workoutSets, db.foodEntries, db.goalsTasks, db.studySessions, db.expenses, db.budgetCategories, db.weeklyReviews, db.aiLedger, db.syncQueue];
};

/** Put + enqueue into Dexie for offline local query engine */
async function putAndQueue<T extends { id: string }>(table: SyncedTableName, record: T) {
  const db = getDB();
  const local: Local<T> = { ...record, sync_status: "pending" };
  await db.table(TABLE_MAP[table].local as string).put(local);
  await enqueue(table, table === "profiles" ? PROFILE_KEY : record.id, "upsert", local as unknown as Record<string, unknown>);
}

async function removeAndQueue(table: SyncedTableName, id: string) {
  const db = getDB();
  await db.table(TABLE_MAP[table].local as string).delete(id);
  await enqueue(table, id, "delete", null);
}

export async function getProfile(): Promise<Profile> {
  return (await getDB().profile.get(PROFILE_KEY)) ?? DEFAULT_PROFILE;
}

/* ------------------------------- Day Score ------------------------------- */

export async function recomputeDayScore(date: string): Promise<DailyLog> {
  const db = getDB();
  return db.transaction("rw", ALL_TABLES(), async () => {
    const profile = await getProfile();
    const log = (await db.dailyLogs.where("log_date").equals(date).first()) ?? emptyDailyLog(date);
    const food = await db.foodEntries.where("log_date").equals(date).toArray();
    const workouts = await db.workouts.where("log_date").equals(date).toArray();
    const sets = workouts.length ? await db.workoutSets.where("workout_id").anyOf(workouts.map((w) => w.id)).toArray() : [];
    const tasks = await db.goalsTasks.where("scheduled_date").equals(date).toArray();
    const sessions = await db.studySessions.where("log_date").equals(date).toArray();

    const study = sessions.length ? dailyStudyTotals(sessions, date) : { study_hours: log.study_hours, active_recall_mins: log.active_recall_mins };
    const b3 = bigThreeProgress(tasks, date);
    const result = computeDayScore({
      sleep_hours: log.sleep_hours, sleep_quality: log.sleep_quality, target_sleep_hours: profile.target_sleep_hours,
      protein_g: food.reduce((t, f) => t + f.protein_g, 0), target_protein_g: profile.target_protein_g,
      kcal_point: food.reduce((t, f) => t + f.kcal_point, 0), target_kcal: profile.target_kcal,
      study_hours: study.study_hours, target_study_hours: profile.target_study_hours, active_recall_mins: study.active_recall_mins,
      working_sets_today: profile.exam_crunch_mode ? sets.length : sets.filter(isHardSet).length,
      is_rest_day: profile.rest_days.includes(dayOfWeek(date)),
      big_three_completed: b3.completed, big_three_total: b3.total, wins_count: log.wins_list.length,
      mood_score: log.mood_score, energy_score: log.energy_score, exam_crunch_mode: profile.exam_crunch_mode,
    });
    const next: DailyLog = {
      ...log, ...study, day_score: result.score, score_breakdown: result.breakdown, client_updated_at: nowISO(),
    };
    const { sync_status: _s, ...plain } = next as Local<DailyLog>;
    await putAndQueue("daily_logs", plain);

    if (typeof window !== "undefined") {
      void saveDailyLogToFirestore(date, plain);
    }

    return plain;
  }).finally(() => scheduleFlush());
}

/* ------------------------------- Daily log ------------------------------- */

export async function patchDailyLog(date: string, patch: Partial<Omit<DailyLog, "id" | "log_date" | "user_id">>) {
  if (notifyDemoReadOnly()) {
    const existing = (await getDB().dailyLogs.where("log_date").equals(date).first()) ?? emptyDailyLog(date);
    return existing;
  }
  const db = getDB();
  await db.transaction("rw", db.dailyLogs, db.syncQueue, async () => {
    const log = (await db.dailyLogs.where("log_date").equals(date).first()) ?? emptyDailyLog(date);
    const { sync_status: _s, ...plain } = log as Local<DailyLog>;
    await putAndQueue("daily_logs", { ...plain, ...patch, client_updated_at: nowISO() });
  });

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveDailyLogToFirestore(date, patch);
  }

  return recomputeDayScore(date);
}

export async function addWin(date: string, text: string, tag: Win["tag"]) {
  if (notifyDemoReadOnly()) {
    const existing = (await getDB().dailyLogs.where("log_date").equals(date).first()) ?? emptyDailyLog(date);
    return existing;
  }
  const db = getDB();
  const log = (await db.dailyLogs.where("log_date").equals(date).first()) ?? emptyDailyLog(date);
  return patchDailyLog(date, { wins_list: [...log.wins_list, { id: uuid(), text: text.trim(), tag }] });
}

export async function removeWin(date: string, winId: string) {
  if (notifyDemoReadOnly()) return;
  const log = await getDB().dailyLogs.where("log_date").equals(date).first();
  if (!log) return;
  return patchDailyLog(date, { wins_list: log.wins_list.filter((w) => w.id !== winId) });
}

/* -------------------------------- Profile -------------------------------- */

export async function updateProfile(patch: Partial<Omit<Profile, "id">>) {
  if (notifyDemoReadOnly()) {
    return getProfile();
  }
  const db = getDB();
  await db.transaction("rw", db.profile, db.syncQueue, async () => {
    const cur = await getProfile();
    const { sync_status: _s, ...plain } = cur as Local<Profile>;
    await putAndQueue("profiles", { ...plain, ...patch, id: PROFILE_KEY, updated_at: nowISO() });
  });

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveProfileToFirestore(patch);
  }

  return recomputeDayScore(todayISO());
}

/* --------------------------------- Food ---------------------------------- */

export type NewFoodEntry = Omit<FoodEntry, "id" | "user_id" | "logged_at"> & { id?: string };

export async function addFoodEntry(entry: NewFoodEntry) {
  if (notifyDemoReadOnly()) {
    return { ...entry, id: entry.id ?? uuid(), user_id: LOCAL_USER_ID, logged_at: nowISO() };
  }
  const db = getDB();
  const rec: FoodEntry = { ...entry, id: entry.id ?? uuid(), user_id: LOCAL_USER_ID, logged_at: nowISO() };
  await db.transaction("rw", db.foodEntries, db.syncQueue, () => putAndQueue("food_entries", rec));
  await recomputeDayScore(entry.log_date);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveFoodEntryToFirestore(rec);
  }

  return rec;
}

export async function deleteFoodEntry(id: string) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  const e = await db.foodEntries.get(id);
  if (!e) return;
  await db.transaction("rw", db.foodEntries, db.syncQueue, () => removeAndQueue("food_entries", id));
  await recomputeDayScore(e.log_date);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void deleteFoodEntryFromFirestore(id);
  }
}

/* -------------------------------- Training ------------------------------- */

export async function startWorkout(split_name: string, date = todayISO()): Promise<Workout> {
  if (notifyDemoReadOnly()) {
    return {
      id: uuid(),
      user_id: LOCAL_USER_ID,
      log_date: date,
      split_name,
      started_at: nowISO(),
      ended_at: null,
      session_rpe: null,
      notes: null,
      total_volume_kg: 0,
      pr_count: 0,
      client_updated_at: nowISO(),
    };
  }
  const db = getDB();
  const w: Workout = {
    id: uuid(), user_id: LOCAL_USER_ID, log_date: date, split_name, started_at: nowISO(), ended_at: null, session_rpe: null,
    notes: null, total_volume_kg: 0, pr_count: 0, client_updated_at: nowISO(),
  };
  await db.transaction("rw", db.workouts, db.syncQueue, () => putAndQueue("workouts", w));
  scheduleFlush();

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveWorkoutToFirestore(w);
  }

  return w;
}

export interface LogSetInput {
  id?: string;
  workout_id: string;
  exercise_slug: string;
  set_number: number;
  set_type: SetType;
  weight_kg: number;
  reps: number;
  rir: number | null;
}

export interface LogSetResult {
  set: WorkoutSet;
  previousBest1RM: number;
  newPR: boolean;
}

export async function logSet(input: LogSetInput): Promise<LogSetResult> {
  if (notifyDemoReadOnly()) {
    return {
      set: {
        ...input,
        id: input.id ?? uuid(),
        user_id: LOCAL_USER_ID,
        est_1rm: calculateEst1RM(input.weight_kg, input.reps, input.rir),
        is_1rm_pr: false,
        is_volume_pr: false,
        completed_at: nowISO(),
      },
      previousBest1RM: 0,
      newPR: false,
    };
  }
  const db = getDB();
  const id = input.id ?? uuid();
  const result = await db.transaction("rw", db.workoutSets, db.workouts, db.syncQueue, async () => {
    const history = (await db.workoutSets.where("exercise_slug").equals(input.exercise_slug).toArray()).filter((s) => s.id !== id && isHardSet(s));
    const best1RM = history.reduce((m, s) => Math.max(m, s.est_1rm), 0);
    const bestVol = history.reduce((m, s) => Math.max(m, s.weight_kg * s.reps), 0);
    const est_1rm = calculateEst1RM(input.weight_kg, input.reps, input.rir);
    const prs = evaluateSetPRs({ set_type: input.set_type, weight_kg: input.weight_kg, reps: input.reps, est_1rm }, best1RM, bestVol);
    // A first-ever log establishes a baseline, it is not celebrated as a PR.
    const hasHistory = history.length > 0;
    const set: WorkoutSet = {
      ...input, id, user_id: LOCAL_USER_ID, est_1rm, is_1rm_pr: hasHistory && prs.is_1rm_pr, is_volume_pr: hasHistory && prs.is_volume_pr,
      completed_at: nowISO(),
    };
    await putAndQueue("workout_sets", set);
    await refreshWorkoutTotals(input.workout_id);
    return { set, previousBest1RM: best1RM, newPR: set.is_1rm_pr };
  });

  const w = await db.workouts.get(input.workout_id);
  if (w) await recomputeDayScore(w.log_date);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveWorkoutSetToFirestore(result.set);
    if (w) void saveWorkoutToFirestore(w);
  }

  return result;
}

async function refreshWorkoutTotals(workoutId: string) {
  const db = getDB();
  const w = await db.workouts.get(workoutId);
  if (!w) return;
  const sets = await db.workoutSets.where("workout_id").equals(workoutId).toArray();
  const { sync_status: _s, ...plain } = w;
  const updated: Workout = {
    ...plain, total_volume_kg: workoutVolume(sets), pr_count: sets.filter((s) => s.is_1rm_pr || s.is_volume_pr).length, client_updated_at: nowISO(),
  };
  await putAndQueue("workouts", updated);

  if (typeof window !== "undefined") {
    void saveWorkoutToFirestore(updated);
  }
}

export async function deleteSet(id: string) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  const s = await db.workoutSets.get(id);
  if (!s) return;
  await db.transaction("rw", db.workoutSets, db.workouts, db.syncQueue, async () => {
    await removeAndQueue("workout_sets", id);
    await refreshWorkoutTotals(s.workout_id);
  });
  const w = await db.workouts.get(s.workout_id);
  if (w) await recomputeDayScore(w.log_date);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void deleteWorkoutSetFromFirestore(id, s.workout_id);
  }
}

export async function finishWorkout(id: string, session_rpe: number | null, notes: string | null) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  let updatedWorkout: Workout | null = null;
  await db.transaction("rw", db.workouts, db.syncQueue, async () => {
    const w = await db.workouts.get(id);
    if (!w) return;
    const { sync_status: _s, ...plain } = w;
    updatedWorkout = { ...plain, ended_at: nowISO(), session_rpe, notes, client_updated_at: nowISO() };
    await putAndQueue("workouts", updatedWorkout);
  });
  scheduleFlush();

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined" && updatedWorkout) {
    void saveWorkoutToFirestore(updatedWorkout);
  }
}

export async function discardWorkout(id: string) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  const w = await db.workouts.get(id);
  await db.transaction("rw", db.workouts, db.workoutSets, db.syncQueue, async () => {
    const sets = await db.workoutSets.where("workout_id").equals(id).toArray();
    for (const s of sets) await removeAndQueue("workout_sets", s.id);
    await removeAndQueue("workouts", id);
  });
  if (w) await recomputeDayScore(w.log_date);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void deleteWorkoutFromFirestore(id);
  }
}

/* ---------------------------- Goals & tasks ------------------------------ */

export function newTask(fields: { title: string; domain: Domain; is_big_three?: boolean; scheduled_date?: string | null; parent_goal_id?: string | null }): GoalTask {
  return {
    id: uuid(), user_id: LOCAL_USER_ID, kind: "daily_task", parent_goal_id: fields.parent_goal_id ?? null, domain: fields.domain,
    title: fields.title, status: "todo", is_big_three: fields.is_big_three ?? false, scheduled_date: fields.scheduled_date ?? null,
    due_date: null, target_metric_num: null, current_metric_num: null, start_metric_num: null, metric_unit: null, completed_at: null,
    created_at: nowISO(),
  };
}

export type AddTaskResult = { ok: true; task: GoalTask } | { ok: false; reason: "BIG_THREE_FULL"; task: GoalTask };

/** Adds a task. If the Big-3 is full, the task is saved un-pinned and the caller opens the swap drawer. */
export async function addTask(fields: Parameters<typeof newTask>[0]): Promise<AddTaskResult> {
  const task = newTask(fields);
  if (notifyDemoReadOnly()) {
    return { ok: true, task };
  }
  const db = getDB();
  let full = false;
  await db.transaction("rw", db.goalsTasks, db.syncQueue, async () => {
    if (task.is_big_three && task.scheduled_date) {
      const day = await db.goalsTasks.where("scheduled_date").equals(task.scheduled_date).toArray();
      if (!canPinBigThree(day, task.scheduled_date)) {
        full = true;
        task.is_big_three = false;
      }
    }
    await putAndQueue("goals_tasks", task);
  });
  if (task.scheduled_date) await recomputeDayScore(task.scheduled_date);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveGoalTaskToFirestore(task);
  }

  return full ? { ok: false, reason: "BIG_THREE_FULL", task } : { ok: true, task };
}

async function patchTask(id: string, patch: Partial<GoalTask>) {
  if (notifyDemoReadOnly()) return null;
  const db = getDB();
  const t = await db.goalsTasks.get(id);
  if (!t) return null;
  const { sync_status: _s, ...plain } = t;
  const next: GoalTask = { ...plain, ...patch };
  await putAndQueue("goals_tasks", next);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveGoalTaskToFirestore(next);
  }

  return { before: plain, after: next };
}

export async function setTaskStatus(id: string, status: TaskStatus, bumpParentGoal = true) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  const res = await db.transaction("rw", db.goalsTasks, db.syncQueue, async () => {
    const r = await patchTask(id, { status, completed_at: status === "done" ? nowISO() : null });
    if (r && bumpParentGoal && r.after.parent_goal_id && r.before.status !== status && (status === "done" || r.before.status === "done")) {
      const g = await db.goalsTasks.get(r.after.parent_goal_id);
      if (g && g.target_metric_num !== null) {
        await patchTask(g.id, { current_metric_num: (g.current_metric_num ?? 0) + (status === "done" ? 1 : -1) });
      }
    }
    return r;
  });
  if (res?.after.scheduled_date) await recomputeDayScore(res.after.scheduled_date);
}

export async function pinBigThree(id: string, pinned: boolean): Promise<boolean> {
  if (notifyDemoReadOnly()) return false;
  const db = getDB();
  const t = await db.goalsTasks.get(id);
  if (!t) return false;
  const date = t.scheduled_date ?? todayISO();
  if (pinned) {
    const day = await db.goalsTasks.where("scheduled_date").equals(date).toArray();
    if (!canPinBigThree(day.filter((x) => x.id !== id), date)) return false;
  }
  await db.transaction("rw", db.goalsTasks, db.syncQueue, () => patchTask(id, { is_big_three: pinned, scheduled_date: date }));
  await recomputeDayScore(date);
  return true;
}

/** Swap drawer: unpin replaceId and pin newId atomically. */
export async function swapBigThree(newId: string, replaceId: string, date: string) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  await db.transaction("rw", db.goalsTasks, db.syncQueue, async () => {
    await patchTask(replaceId, { is_big_three: false });
    await patchTask(newId, { is_big_three: true, scheduled_date: date });
  });
  await recomputeDayScore(date);
}

export async function rollTaskTo(id: string, date: string) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  const t = await db.goalsTasks.get(id);
  if (!t) return;
  const day = await db.goalsTasks.where("scheduled_date").equals(date).toArray();
  const keepPin = t.is_big_three && canPinBigThree(day, date);
  await db.transaction("rw", db.goalsTasks, db.syncQueue, () => patchTask(id, { scheduled_date: date, is_big_three: keepPin }));
  await recomputeDayScore(date);
}

export async function dropTask(id: string) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  const t = await db.goalsTasks.get(id);
  await db.transaction("rw", db.goalsTasks, db.syncQueue, () => patchTask(id, { status: "dropped", is_big_three: false }));
  if (t?.scheduled_date) await recomputeDayScore(t.scheduled_date);
}

export async function deleteTask(id: string) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  const t = await db.goalsTasks.get(id);
  await db.transaction("rw", db.goalsTasks, db.syncQueue, () => removeAndQueue("goals_tasks", id));
  if (t?.scheduled_date) await recomputeDayScore(t.scheduled_date);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void deleteGoalTaskFromFirestore(id);
  }
}

export async function addGoal(fields: { title: string; domain: Domain; start: number; target: number; unit: string; due_date: string }) {
  const goal: GoalTask = {
    ...newTask({ title: fields.title, domain: fields.domain }), kind: "quarterly_goal", status: "in_progress",
    start_metric_num: fields.start, current_metric_num: fields.start, target_metric_num: fields.target, metric_unit: fields.unit,
    due_date: fields.due_date,
  };
  if (notifyDemoReadOnly()) return goal;
  const db = getDB();
  await db.transaction("rw", db.goalsTasks, db.syncQueue, () => putAndQueue("goals_tasks", goal));
  scheduleFlush();

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveGoalTaskToFirestore(goal);
  }

  return goal;
}

export async function adjustGoalMetric(id: string, delta: number) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  await db.transaction("rw", db.goalsTasks, db.syncQueue, async () => {
    const g = await db.goalsTasks.get(id);
    if (!g) return;
    const next = Math.round(((g.current_metric_num ?? 0) + delta) * 100) / 100;
    const reached = g.target_metric_num !== null && (g.target_metric_num >= (g.start_metric_num ?? 0) ? next >= g.target_metric_num : next <= g.target_metric_num);
    await patchTask(id, { current_metric_num: next, status: reached ? "done" : "in_progress", completed_at: reached ? nowISO() : null });
  });
  scheduleFlush();
}

/* --------------------------------- Study --------------------------------- */

export interface NewStudySession {
  subject: string;
  mode: StudyMode;
  source: StudySession["source"];
  started_at: string;
  ended_at: string;
  focus_mins: number;
  pomodoros?: number;
  interruptions?: number;
  focus_rating?: number | null;
  note?: string | null;
  log_date?: string;
}

export async function addStudySession(s: NewStudySession) {
  const rec: StudySession = {
    id: uuid(), user_id: LOCAL_USER_ID, log_date: s.log_date ?? toISODate(new Date(s.started_at)), subject: s.subject.trim() || "General",
    mode: s.mode, source: s.source, started_at: s.started_at, ended_at: s.ended_at, focus_mins: Math.max(0, Math.round(s.focus_mins * 100) / 100),
    pomodoros: s.pomodoros ?? 0, interruptions: s.interruptions ?? 0, focus_rating: s.focus_rating ?? null, note: s.note ?? null,
    client_updated_at: nowISO(),
  };
  if (notifyDemoReadOnly()) return rec;
  const db = getDB();
  await db.transaction("rw", db.studySessions, db.syncQueue, () => putAndQueue("study_sessions", rec));
  await recomputeDayScore(rec.log_date);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveStudySessionToFirestore(rec);
  }

  return rec;
}

export async function rateStudySession(id: string, focus_rating: number) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  let updatedSession: StudySession | null = null;
  await db.transaction("rw", db.studySessions, db.syncQueue, async () => {
    const s = await db.studySessions.get(id);
    if (!s) return;
    const { sync_status: _s, ...plain } = s;
    updatedSession = { ...plain, focus_rating, client_updated_at: nowISO() };
    await putAndQueue("study_sessions", updatedSession);
  });
  scheduleFlush();

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined" && updatedSession) {
    void saveStudySessionToFirestore(updatedSession);
  }
}

export async function deleteStudySession(id: string) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  const s = await db.studySessions.get(id);
  await db.transaction("rw", db.studySessions, db.syncQueue, () => removeAndQueue("study_sessions", id));
  if (s) await recomputeDayScore(s.log_date);

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void deleteStudySessionFromFirestore(id);
  }
}

/* --------------------------------- Money --------------------------------- */

export interface NewExpense {
  spent_on: string;
  amount_minor: number;
  category: ExpenseCategory;
  merchant?: string | null;
  note?: string | null;
  payment_method?: PaymentMethod;
  is_recurring?: boolean;
}

export async function addExpense(e: NewExpense) {
  const profile = await getProfile();
  const rec: Expense = {
    id: uuid(), user_id: LOCAL_USER_ID, spent_on: e.spent_on, amount_minor: Math.round(e.amount_minor), currency_code: profile.currency_code,
    category: e.category, merchant: e.merchant ?? null, note: e.note ?? null, payment_method: e.payment_method ?? "upi",
    is_recurring: e.is_recurring ?? false, client_updated_at: nowISO(),
  };
  if (notifyDemoReadOnly()) return rec;
  const db = getDB();
  await db.transaction("rw", db.expenses, db.syncQueue, () => putAndQueue("expenses", rec));
  scheduleFlush();

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveExpenseToFirestore(rec);
  }

  return rec;
}

export async function deleteExpense(id: string) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  await db.transaction("rw", db.expenses, db.syncQueue, () => removeAndQueue("expenses", id));
  scheduleFlush();

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void deleteExpenseFromFirestore(id);
  }
}

export async function setCategoryBudget(category: ExpenseCategory, monthly_limit_minor: number | null) {
  if (notifyDemoReadOnly()) return;
  const db = getDB();
  await db.transaction("rw", db.budgetCategories, db.syncQueue, async () => {
    const existing = await db.budgetCategories.where("category").equals(category).first();
    if (monthly_limit_minor === null) {
      if (existing) await removeAndQueue("budget_categories", existing.id);
      return;
    }
    await putAndQueue("budget_categories", {
      id: existing?.id ?? uuid(), user_id: LOCAL_USER_ID, category, monthly_limit_minor, client_updated_at: nowISO(),
    });
  });
  scheduleFlush();

  // Direct Firestore persistence with persistentLocalCache
  if (typeof window !== "undefined") {
    void saveBudgetCategoryToFirestore(category, monthly_limit_minor);
  }
}

export async function exportAllLocalData() {
  const db = getDB();
  return {
    exported_at: nowISO(),
    profile: await db.profile.toArray(),
    dailyLogs: await db.dailyLogs.toArray(),
    workouts: await db.workouts.toArray(),
    workoutSets: await db.workoutSets.toArray(),
    foodEntries: await db.foodEntries.toArray(),
    goalsTasks: await db.goalsTasks.toArray(),
    studySessions: await db.studySessions.toArray(),
    expenses: await db.expenses.toArray(),
    budgetCategories: await db.budgetCategories.toArray(),
    weeklyReviews: await db.weeklyReviews.toArray(),
  };
}
