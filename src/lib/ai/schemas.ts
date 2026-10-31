import { z } from "zod";

/* ----------------------------- Food vision ------------------------------ */

export const FoodVisionEstimationSchema = z.object({
  meal_title: z.string(),
  confidence_tier: z.enum(["high", "medium", "low"]),
  visual_reference_used: z.string().describe("e.g. Standard 26cm plate, steel thali compartment, spoon size"),
  ambiguous_item_question: z
    .object({
      question: z.string(),
      option_a: z.object({ label: z.string(), kcal_delta: z.number(), protein_delta: z.number() }),
      option_b: z.object({ label: z.string(), kcal_delta: z.number(), protein_delta: z.number() }),
    })
    .nullable(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      portion_description: z.string().optional(),
      preparation_note: z.string().optional(),
      estimated_grams: z.number(),
      grams_low: z.number(),
      grams_high: z.number(),
      kcal_per_100g: z.number(),
      protein_per_100g: z.number(),
      carbs_per_100g: z.number(),
      fat_per_100g: z.number(),
      is_hidden_oil_or_gravy: z.boolean(),
    }),
  ),
});
export type FoodVisionEstimation = z.infer<typeof FoodVisionEstimationSchema>;

export const FoodVisionRequestSchema = z.object({
  image_base64: z.string().min(100).max(1_500_000),
  mime_type: z.enum(["image/webp", "image/jpeg", "image/png"]),
  hint: z.string().max(280).optional(),
  month_spend_usd: z.number().min(0).optional(),
});

/* ---------------------------- Weekly review ----------------------------- */

export const WeeklyReviewSchema = z.object({
  overall_grade: z.enum(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D"]),
  headline_verdict: z.string().describe("Max 18 words, brutally honest, citing 2 real numbers"),
  scorecard_summary: z.object({
    biggest_win: z.string(),
    primary_bottleneck: z.string(),
    body_comp_and_tdee_note: z.string(),
  }),
  cross_domain_correlations: z
    .array(
      z.object({
        title: z.string(),
        domains_linked: z.array(z.enum(["sleep", "nutrition", "training", "study", "tasks"])),
        evidence_from_logs: z.string().describe("Must cite exact dates and metrics from telemetry"),
        mechanism_explanation: z.string(),
      }),
    )
    .length(3),
  training_and_stalled_lifts_audit: z.array(
    z.object({
      exercise_or_muscle: z.string(),
      status: z.enum(["progressing", "stalled_recovery", "stalled_fatigue", "under_volume"]),
      prescription_next_week: z.string(),
    }),
  ),
  next_week_protocol: z
    .array(
      z.object({
        domain: z.enum(["sleep_recovery", "nutrition", "training", "study_execution"]),
        rule_statement: z.string().describe("Binary, measurable rule under 22 words"),
        target_metric: z.string(),
      }),
    )
    .length(3),
});
export type WeeklyReview = z.infer<typeof WeeklyReviewSchema>;

/* -------------------------- Telemetry payload --------------------------- */

const nullableNum = z.number().nullable();

export const WeeklyTelemetrySchema = z.object({
  window: z.object({ start: z.string(), end: z.string() }),
  profile_targets: z.object({
    body_weight_kg: z.number(), target_kcal: z.number(), target_protein_g: z.number(), target_carbs_g: z.number(),
    target_fat_g: z.number(), target_sleep_hours: z.number(), target_study_hours: z.number(), exam_crunch_mode: z.boolean(),
  }),
  daily_series: z.array(z.object({
    date: z.string(), day_score: z.number(), sleep_hours: nullableNum, sleep_quality: nullableNum, study_hours: z.number(),
    active_recall_mins: z.number(), mood_score: nullableNum, energy_score: nullableNum, body_weight_kg: nullableNum,
    kcal_point: z.number(), kcal_low: z.number(), kcal_high: z.number(), protein_g: z.number(), big_three_completed_ratio: nullableNum,
    wins_list: z.array(z.string()), friction_note: z.string().nullable(), workout_rpe: nullableNum, spend: z.number(),
  })).max(7),
  training_summary: z.object({
    workouts_completed: z.number(), working_sets: z.number(), tonnage_kg: z.number(),
    muscle_volume_fractional: z.record(z.string(), z.number()),
    key_lifts_progression: z.array(z.object({
      exercise: z.string(), best_set: z.string(), est_1rm: z.number(), delta_vs_prev_2wk_kg: nullableNum,
      stall_status: z.string(), stall_cause: z.string().nullable(), prescription: z.string().nullable(),
    })),
  }),
  study_summary: z.object({
    total_hours: z.number(), active_recall_ratio: z.number(), pomodoros: z.number(), streak_days: z.number(),
    by_subject: z.array(z.object({ subject: z.string(), hours: z.number() })),
  }),
  money_summary: z.object({
    currency: z.string(), week_spend: z.number(), month_to_date: z.number(), month_budget: z.number(),
    top_categories: z.array(z.object({ category: z.string(), amount: z.number() })),
  }),
  goals_velocity: z.array(z.object({ title: z.string(), domain: z.string(), current: z.number(), target: z.number(), unit: z.string(), delta_7d: nullableNum, pace: z.string() })),
  computed_correlations: z.object({
    after_short_sleep: z.object({ days: z.number(), avg_study_hours: nullableNum, avg_workout_rpe: nullableNum }),
    after_long_sleep: z.object({ days: z.number(), avg_study_hours: nullableNum, avg_workout_rpe: nullableNum }),
    weight_7d_avg_kg: nullableNum, weight_prev_7d_avg_kg: nullableNum, weight_trend_delta_kg: nullableNum,
    avg_kcal_point: nullableNum, avg_protein_g: nullableNum, protein_per_kg: nullableNum, avg_sleep_hours: nullableNum,
  }),
});
export type WeeklyTelemetry = z.infer<typeof WeeklyTelemetrySchema>;

export const WeeklyReviewRequestSchema = z.object({
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  telemetry: WeeklyTelemetrySchema.optional(),
  force: z.boolean().optional(),
  month_spend_usd: z.number().min(0).optional(),
});

export const TodayLiveSchema = z.object({
  date: z.string(),
  sleep_hours: nullableNum, study_hours: z.number(), kcal_point: z.number(), protein_g: z.number(),
  remaining_kcal: z.number(), remaining_protein_g: z.number(), big_three: z.array(z.object({ title: z.string(), done: z.boolean() })),
  planned_split: z.string().nullable(),
});

export const CoachChatBodySchema = z.object({
  telemetry: WeeklyTelemetrySchema.optional(),
  today_live: TodayLiveSchema,
  month_spend_usd: z.number().min(0).optional(),
});

/** Metadata attached to the coach's streamed message so the client can mirror cost locally. */
export interface CoachMessageMetadata {
  ledger?: import("@/types/database.types").AIRunLedger;
}
