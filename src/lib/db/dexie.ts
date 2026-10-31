/**
 * CommandCenterLocalDB · IndexedDB is the client source of truth.
 * Every write lands here first (instant UI via useLiveQuery), then enters `syncQueue`,
 * then is flushed to Supabase with idempotent upserts keyed on client-generated UUIDs.
 */
import Dexie, { type EntityTable } from "dexie";
import type {
  AIRunLedger, AIWeeklyReview, BudgetCategory, DailyLog, Expense, FoodEntry, GoalTask, Profile, StudySession,
  SyncedTableName, Workout, WorkoutSet,
} from "@/types/database.types";

export type SyncStatus = "pending" | "synced";
export type Local<T> = T & { sync_status: SyncStatus };

export interface SyncQueueItem {
  queue_id?: number;
  table_name: SyncedTableName;
  record_id: string;
  operation: "upsert" | "delete";
  payload: Record<string, unknown> | null;
  created_at: string;
  attempts: number;
  last_error?: string | null;
}

/** Placeholder owner id for Local-Only mode; rewritten to auth.uid() at flush time. */
export const LOCAL_USER_ID = "00000000-0000-0000-0000-000000000000";
export const PROFILE_KEY = "me";

export class CommandCenterLocalDB extends Dexie {
  profile!: EntityTable<Local<Profile>, "id">;
  dailyLogs!: EntityTable<Local<DailyLog>, "id">;
  workouts!: EntityTable<Local<Workout>, "id">;
  workoutSets!: EntityTable<Local<WorkoutSet>, "id">;
  foodEntries!: EntityTable<Local<FoodEntry>, "id">;
  goalsTasks!: EntityTable<Local<GoalTask>, "id">;
  studySessions!: EntityTable<Local<StudySession>, "id">;
  expenses!: EntityTable<Local<Expense>, "id">;
  budgetCategories!: EntityTable<Local<BudgetCategory>, "id">;
  weeklyReviews!: EntityTable<Local<AIWeeklyReview>, "id">;
  aiLedger!: EntityTable<Local<AIRunLedger>, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "queue_id">;

  constructor() {
    super("CommandCenterLocalDB");
    this.version(1).stores({
      profile: "id",
      dailyLogs: "id, &log_date, sync_status",
      workouts: "id, log_date, sync_status",
      workoutSets: "id, workout_id, exercise_slug, completed_at, sync_status, [exercise_slug+completed_at]",
      foodEntries: "id, log_date, sync_status",
      goalsTasks: "id, kind, scheduled_date, status, parent_goal_id, sync_status",
      studySessions: "id, log_date, subject, sync_status",
      expenses: "id, spent_on, category, sync_status",
      budgetCategories: "id, &category, sync_status",
      weeklyReviews: "id, &week_start_date",
      aiLedger: "id, created_at, feature",
      syncQueue: "++queue_id, table_name, record_id, operation, created_at, attempts",
    });
  }
}

let _db: CommandCenterLocalDB | null = null;
/** Lazily constructed so server components / SSR never touch IndexedDB. */
export function getDB(): CommandCenterLocalDB {
  if (!_db) _db = new CommandCenterLocalDB();
  return _db;
}

/** Map Supabase table → Dexie table (and the conflict target used for idempotent upserts). */
export const TABLE_MAP: Record<SyncedTableName, { local: keyof CommandCenterLocalDB; onConflict: string }> = {
  profiles: { local: "profile", onConflict: "id" },
  daily_logs: { local: "dailyLogs", onConflict: "user_id,log_date" },
  food_entries: { local: "foodEntries", onConflict: "id" },
  workouts: { local: "workouts", onConflict: "id" },
  workout_sets: { local: "workoutSets", onConflict: "id" },
  goals_tasks: { local: "goalsTasks", onConflict: "id" },
  study_sessions: { local: "studySessions", onConflict: "id" },
  expenses: { local: "expenses", onConflict: "id" },
  budget_categories: { local: "budgetCategories", onConflict: "user_id,category" },
  ai_weekly_reviews: { local: "weeklyReviews", onConflict: "user_id,week_start_date" },
  ai_runs_ledger: { local: "aiLedger", onConflict: "id" },
};
