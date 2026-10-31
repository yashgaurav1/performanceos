/**
 * Row types mirroring supabase/migrations/0001_command_center_schema.sql.
 * Numeric columns are typed as `number` (PostgREST returns numeric as number for these precisions).
 */
import type { Domain } from "@/lib/math/goals-math";
import type { SetType } from "@/lib/math/gym-math";
import type { PrepModifier } from "@/lib/math/nutrition-math";
import type { StudyMode } from "@/lib/math/study-math";
import type { ExpenseCategory, PaymentMethod } from "@/lib/math/budget-math";
import type { ScoreBreakdown } from "@/lib/math/day-score";

export type WinTag = "study" | "gym" | "career" | "life";
export interface Win { id: string; text: string; tag: WinTag }

export interface Profile {
  id: string;
  display_name: string | null;
  body_weight_kg: number;
  target_kcal: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  target_sleep_hours: number;
  target_study_hours: number;
  exam_crunch_mode: boolean;
  pomodoro_focus_mins: number;
  pomodoro_short_break_mins: number;
  pomodoro_long_break_mins: number;
  pomodoro_cycles_before_long: number;
  currency_code: string;
  monthly_budget_minor: number;
  rest_days: number[];
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  study_hours: number;
  active_recall_mins: number;
  mood_score: number | null;
  energy_score: number | null;
  body_weight_kg: number | null;
  wins_list: Win[];
  friction_note: string | null;
  day_score: number;
  score_breakdown: Partial<ScoreBreakdown>;
  client_updated_at: string;
}

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack" | "post_workout";
export type SourceType = "ai_photo" | "barcode" | "quick_manual" | "saved_template";
export type ConfidenceTier = "high" | "medium" | "low";

export interface FoodItemBreakdown {
  id: string;
  name: string;
  grams: number;
  kcal_point: number;
  kcal_low: number;
  kcal_high: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_hidden_fat: boolean;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  log_date: string;
  logged_at: string;
  meal_slot: MealSlot;
  meal_title: string;
  source_type: SourceType;
  photo_path: string | null;
  prep_modifier: PrepModifier;
  confidence_tier: ConfidenceTier;
  kcal_point: number;
  kcal_low: number;
  kcal_high: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  items_breakdown: FoodItemBreakdown[];
}

export interface Exercise {
  slug: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight";
  overload_increment_kg: number;
  rep_range_min: number;
  rep_range_max: number;
  is_compound: boolean;
}

export interface Workout {
  id: string;
  user_id: string;
  log_date: string;
  split_name: string;
  started_at: string;
  ended_at: string | null;
  session_rpe: number | null;
  notes: string | null;
  total_volume_kg: number;
  pr_count: number;
  client_updated_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  user_id: string;
  exercise_slug: string;
  set_number: number;
  set_type: SetType;
  weight_kg: number;
  reps: number;
  rir: number | null;
  est_1rm: number;
  is_1rm_pr: boolean;
  is_volume_pr: boolean;
  completed_at: string;
}

export type TaskStatus = "todo" | "in_progress" | "done" | "dropped";

export interface GoalTask {
  id: string;
  user_id: string;
  kind: "quarterly_goal" | "daily_task";
  parent_goal_id: string | null;
  domain: Domain;
  title: string;
  status: TaskStatus;
  is_big_three: boolean;
  scheduled_date: string | null;
  due_date: string | null;
  target_metric_num: number | null;
  current_metric_num: number | null;
  start_metric_num: number | null;
  metric_unit: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AIWeeklyReview {
  id: string;
  user_id: string;
  week_start_date: string;
  overall_grade: string;
  telemetry_snapshot: unknown;
  review_payload: unknown;
  created_at: string;
}

export type AIFeature = "food_vision" | "weekly_review" | "coach_chat";

export interface AIRunLedger {
  id: string;
  user_id: string;
  feature: AIFeature;
  model_id: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  log_date: string;
  subject: string;
  mode: StudyMode;
  source: "pomodoro" | "stopwatch" | "manual";
  started_at: string;
  ended_at: string;
  focus_mins: number;
  pomodoros: number;
  interruptions: number;
  focus_rating: number | null;
  note: string | null;
  client_updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  spent_on: string;
  amount_minor: number;
  currency_code: string;
  category: ExpenseCategory;
  merchant: string | null;
  note: string | null;
  payment_method: PaymentMethod;
  is_recurring: boolean;
  client_updated_at: string;
}

export interface BudgetCategory {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  monthly_limit_minor: number;
  client_updated_at: string;
}

/** Tables the client syncs to Supabase via the offline queue. */
export interface SyncedTables {
  profiles: Profile;
  daily_logs: DailyLog;
  food_entries: FoodEntry;
  workouts: Workout;
  workout_sets: WorkoutSet;
  goals_tasks: GoalTask;
  study_sessions: StudySession;
  expenses: Expense;
  budget_categories: BudgetCategory;
  ai_weekly_reviews: AIWeeklyReview;
  ai_runs_ledger: AIRunLedger;
}
export type SyncedTableName = keyof SyncedTables;
