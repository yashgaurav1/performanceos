/**
 * 7-day telemetry aggregator. The pure builder turns raw rows into a compact (<2.5k token) JSON payload,
 * with every correlation pre-computed in TypeScript so the LLM never does arithmetic.
 * `buildWeeklyTelemetryPayload` (server, Supabase) and `buildLocalTelemetry` (client, IndexedDB) both feed it.
 */
import { EXERCISE_MAP } from "@/lib/exercises";
import { addDays, dateRange, monthKey } from "@/lib/math/dates";
import { computeWeeklyMuscleVolume, detectStalledLift, isHardSet, isWorkingSet, type RecoveryDayLog } from "@/lib/math/gym-math";
import { goalPace } from "@/lib/math/goals-math";
import { mean, round } from "@/lib/math/stats";
import { RECALL_MODES, studyStreak, subjectSplit } from "@/lib/math/study-math";
import type {
  DailyLog, Expense, FoodEntry, GoalTask, Profile, StudySession, Workout, WorkoutSet,
} from "@/types/database.types";
import type { WeeklyTelemetry } from "./schemas";

export interface TelemetrySource {
  profile: Profile;
  dailyLogs: DailyLog[];   // ≥ 14 days
  food: FoodEntry[];       // ≥ 14 days
  workouts: Workout[];     // ≥ 6 weeks
  sets: WorkoutSet[];      // for those workouts
  tasks: GoalTask[];
  sessions: StudySession[]; // ≥ 30 days
  expenses: Expense[];     // current month + window
}

const r1 = (x: number | null) => (x === null ? null : round(x, 1));
const r2 = (x: number | null) => (x === null ? null : round(x, 2));

export function buildTelemetryFromData(src: TelemetrySource, endDate: string): WeeklyTelemetry {
  const start = addDays(endDate, -6);
  const days = dateRange(start, endDate);
  const prevStart = addDays(start, -7);
  const inWin = (d: string) => d >= start && d <= endDate;
  const { profile } = src;

  const logBy = new Map(src.dailyLogs.map((l) => [l.log_date, l]));
  const foodBy = new Map<string, { k: number; lo: number; hi: number; p: number }>();
  for (const f of src.food) {
    const c = foodBy.get(f.log_date) ?? { k: 0, lo: 0, hi: 0, p: 0 };
    c.k += f.kcal_point; c.lo += f.kcal_low; c.hi += f.kcal_high; c.p += f.protein_g;
    foodBy.set(f.log_date, c);
  }
  const rpeBy = new Map<string, number>();
  for (const w of src.workouts) if (w.session_rpe !== null) rpeBy.set(w.log_date, w.session_rpe);
  const spendBy = new Map<string, number>();
  for (const e of src.expenses) spendBy.set(e.spent_on, (spendBy.get(e.spent_on) ?? 0) + e.amount_minor);

  const daily_series = days.map((d) => {
    const l = logBy.get(d);
    const f = foodBy.get(d);
    const big = src.tasks.filter((t) => t.kind === "daily_task" && t.is_big_three && t.scheduled_date === d && t.status !== "dropped");
    return {
      date: d, day_score: l?.day_score ?? 0, sleep_hours: l?.sleep_hours ?? null, sleep_quality: l?.sleep_quality ?? null,
      study_hours: l?.study_hours ?? 0, active_recall_mins: l?.active_recall_mins ?? 0, mood_score: l?.mood_score ?? null,
      energy_score: l?.energy_score ?? null, body_weight_kg: l?.body_weight_kg ?? null,
      kcal_point: f?.k ?? 0, kcal_low: f?.lo ?? 0, kcal_high: f?.hi ?? 0, protein_g: round(f?.p ?? 0, 1),
      big_three_completed_ratio: big.length ? r2(big.filter((t) => t.status === "done").length / big.length) : null,
      wins_list: (l?.wins_list ?? []).map((w) => `#${w.tag} ${w.text}`).slice(0, 4),
      friction_note: l?.friction_note ?? null, workout_rpe: rpeBy.get(d) ?? null,
      spend: round((spendBy.get(d) ?? 0) / 100, 0),
    };
  });

  /* Training */
  const wIn = src.workouts.filter((w) => inWin(w.log_date));
  const wInIds = new Set(wIn.map((w) => w.id));
  const setsIn = src.sets.filter((s) => wInIds.has(s.workout_id));
  const wDate = new Map(src.workouts.map((w) => [w.id, w.log_date]));
  const recovery: RecoveryDayLog[] = dateRange(addDays(endDate, -13), endDate).map((d) => ({
    log_date: d, sleep_hours: logBy.get(d)?.sleep_hours ?? null, protein_g: foodBy.has(d) ? foodBy.get(d)!.p : null,
  }));
  const liftSlugs = [...new Set(setsIn.filter(isWorkingSet).map((s) => s.exercise_slug))];
  const key_lifts_progression = liftSlugs.slice(0, 8).map((slug) => {
    const ex = EXERCISE_MAP.get(slug);
    const working = setsIn.filter((s) => s.exercise_slug === slug && isWorkingSet(s));
    const best = working.reduce((b, s) => (s.est_1rm > b.est_1rm ? s : b), working[0]!);
    const prior = src.sets.filter((s) => s.exercise_slug === slug && isWorkingSet(s) && (wDate.get(s.workout_id) ?? "") >= addDays(start, -14) && (wDate.get(s.workout_id) ?? "") < start);
    const priorBest = prior.length ? Math.max(...prior.map((s) => s.est_1rm)) : null;
    const bySession = new Map<string, WorkoutSet[]>();
    for (const s of src.sets.filter((x) => x.exercise_slug === slug)) bySession.set(s.workout_id, [...(bySession.get(s.workout_id) ?? []), s]);
    const sessions = [...bySession.entries()].map(([id, sets]) => ({ date: wDate.get(id) ?? "", sets })).filter((x) => x.date && x.date <= endDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-4);
    const stall = detectStalledLift(sessions, recovery, profile);
    return {
      exercise: ex?.name ?? slug, best_set: `${best.weight_kg}x${best.reps}${best.rir !== null ? ` @${best.rir}RIR` : ""}`, est_1rm: best.est_1rm,
      delta_vs_prev_2wk_kg: priorBest === null ? null : round(best.est_1rm - priorBest, 1),
      stall_status: stall.status, stall_cause: stall.cause, prescription: stall.prescription,
    };
  });
  const muscle = computeWeeklyMuscleVolume(setsIn, EXERCISE_MAP);

  /* Study */
  const sessIn = src.sessions.filter((s) => inWin(s.log_date));
  const studyMins = sessIn.reduce((t, s) => t + s.focus_mins, 0);
  const recallMins = sessIn.reduce((t, s) => t + (RECALL_MODES.has(s.mode) ? s.focus_mins : 0), 0);

  /* Money */
  const month = monthKey(endDate);
  const weekSpend = src.expenses.filter((e) => inWin(e.spent_on)).reduce((t, e) => t + e.amount_minor, 0);
  const mtd = src.expenses.filter((e) => monthKey(e.spent_on) === month && e.spent_on <= endDate);
  const catTotals = new Map<string, number>();
  for (const e of src.expenses.filter((x) => inWin(x.spent_on))) catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount_minor);

  /* Goals */
  const goals_velocity = src.tasks.filter((t) => t.kind === "quarterly_goal" && t.status !== "dropped").slice(0, 4).map((g) => {
    const linkedDone = src.tasks.filter((t) => t.parent_goal_id === g.id && t.status === "done" && t.completed_at && inWin(t.completed_at.slice(0, 10))).length;
    const linkedAny = src.tasks.some((t) => t.parent_goal_id === g.id);
    return {
      title: g.title, domain: g.domain, current: g.current_metric_num ?? 0, target: g.target_metric_num ?? 0, unit: g.metric_unit ?? "",
      delta_7d: linkedAny ? linkedDone : null, pace: goalPace(g, endDate, g.metric_unit ?? "units").label,
    };
  });

  /* Pre-computed correlations · "sleep_hours" on a log date is last night's sleep, so the same date is "the day after". */
  const short = daily_series.filter((d) => d.sleep_hours !== null && d.sleep_hours < 6.5);
  const long = daily_series.filter((d) => d.sleep_hours !== null && d.sleep_hours >= 7.5);
  const avgOf = (xs: (number | null)[]) => mean(xs.filter((x): x is number => x !== null));
  const weights = (from: string, to: string) => src.dailyLogs.filter((l) => l.log_date >= from && l.log_date <= to && l.body_weight_kg !== null).map((l) => l.body_weight_kg as number);
  const w7 = mean(weights(start, endDate));
  const wPrev = mean(weights(prevStart, addDays(start, -1)));
  const fedDays = daily_series.filter((d) => d.kcal_point > 0);
  const avgProtein = mean(fedDays.map((d) => d.protein_g));

  return {
    window: { start, end: endDate },
    profile_targets: {
      body_weight_kg: profile.body_weight_kg, target_kcal: profile.target_kcal, target_protein_g: profile.target_protein_g,
      target_carbs_g: profile.target_carbs_g, target_fat_g: profile.target_fat_g, target_sleep_hours: profile.target_sleep_hours,
      target_study_hours: profile.target_study_hours, exam_crunch_mode: profile.exam_crunch_mode,
    },
    daily_series,
    training_summary: {
      workouts_completed: wIn.length, working_sets: setsIn.filter(isHardSet).length,
      tonnage_kg: round(setsIn.filter(isHardSet).reduce((t, s) => t + s.weight_kg * s.reps, 0), 0),
      muscle_volume_fractional: Object.fromEntries(muscle.map((m) => [m.muscle, m.sets])),
      key_lifts_progression,
    },
    study_summary: {
      total_hours: round(studyMins / 60, 1), active_recall_ratio: studyMins ? round(recallMins / studyMins, 2) : 0,
      pomodoros: sessIn.reduce((t, s) => t + s.pomodoros, 0), streak_days: studyStreak(src.sessions, endDate),
      by_subject: subjectSplit(sessIn).slice(0, 6).map((s) => ({ subject: s.subject, hours: round(s.mins / 60, 1) })),
    },
    money_summary: {
      currency: profile.currency_code, week_spend: round(weekSpend / 100, 0), month_to_date: round(mtd.reduce((t, e) => t + e.amount_minor, 0) / 100, 0),
      month_budget: round(profile.monthly_budget_minor / 100, 0),
      top_categories: [...catTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([category, v]) => ({ category, amount: round(v / 100, 0) })),
    },
    goals_velocity,
    computed_correlations: {
      after_short_sleep: { days: short.length, avg_study_hours: r1(avgOf(short.map((d) => d.study_hours))), avg_workout_rpe: r1(avgOf(short.map((d) => d.workout_rpe))) },
      after_long_sleep: { days: long.length, avg_study_hours: r1(avgOf(long.map((d) => d.study_hours))), avg_workout_rpe: r1(avgOf(long.map((d) => d.workout_rpe))) },
      weight_7d_avg_kg: r2(w7), weight_prev_7d_avg_kg: r2(wPrev), weight_trend_delta_kg: w7 !== null && wPrev !== null ? round(w7 - wPrev, 2) : null,
      avg_kcal_point: fedDays.length ? round(mean(fedDays.map((d) => d.kcal_point))!, 0) : null,
      avg_protein_g: r1(avgProtein),
      protein_per_kg: avgProtein !== null ? round(avgProtein / (w7 ?? profile.body_weight_kg), 2) : null,
      avg_sleep_hours: r2(avgOf(daily_series.map((d) => d.sleep_hours))),
    },
  };
}
