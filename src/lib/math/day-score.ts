/**
 * Day Score engine · deterministic - integer score.
 *
 * Standard weights: Sleep 25 · Nutrition 25 · Study 20 · Training 15 · Tasks/Reflection 15.
 * Exam Crunch weights: Sleep 25 · Study 35 · Nutrition 20 · Tasks/Wins 15 · Movement 5.
 */
import { clamp, round } from "./stats";

export interface DayScoreInput {
  sleep_hours: number | null;
  sleep_quality: number | null;
  target_sleep_hours: number;

  protein_g: number;
  target_protein_g: number;
  kcal_point: number;
  target_kcal: number;

  study_hours: number;
  target_study_hours: number;
  active_recall_mins: number;

  working_sets_today: number;
  is_rest_day: boolean;

  big_three_completed: number;
  big_three_total: number;
  wins_count: number;
  mood_score: number | null;
  energy_score: number | null;

  exam_crunch_mode: boolean;
}

export interface ScoreBreakdown {
  sleep: number;
  nutrition: number;
  training: number;
  study: number;
  tasks: number;
}

export interface DayScoreResult {
  score: number;
  breakdown: ScoreBreakdown;
  max: ScoreBreakdown;
  mode: "standard" | "exam_crunch";
}

export const STANDARD_MAX: ScoreBreakdown = { sleep: 25, nutrition: 25, study: 20, training: 15, tasks: 15 };
export const CRUNCH_MAX: ScoreBreakdown = { sleep: 25, nutrition: 20, study: 35, training: 5, tasks: 15 };

/** Sleep (-): duration 18 (−5 if < 5h, floored at 0) + quality 7. */
export function sleepPoints(hours: number | null, quality: number | null, target: number): number {
  let duration = 0;
  if (hours !== null && target > 0) {
    duration = Math.min(1, hours / target) * 18;
    if (hours < 5) duration = Math.max(0, duration - 5);
  }
  const q = quality === null ? 0 : ((clamp(quality, 1, 5) - 1) / 4) * 7;
  return duration + q;
}

/** Protein (-): full at ≥ 90% of target, linear below. */
export function proteinPoints(protein: number, target: number): number {
  if (target <= 0) return 15;
  const threshold = target * 0.9;
  if (protein >= threshold) return 15;
  return clamp(protein / threshold, 0, 1) * 15;
}

/** Calories (-): full within ±10%; −1 pt per 2.5% deviation beyond the band. */
export function caloriePoints(kcal: number, target: number): number {
  if (target <= 0) return 10;
  if (kcal <= 0) return 0;
  const devPct = (Math.abs(kcal - target) / target) * 100;
  if (devPct <= 10) return 10;
  return Math.max(0, 10 - (devPct - 10) / 2.5);
}

/** Study (-): hours 14 + active recall 6 (full at ≥ 45 min or ≥ 35% of study time). */
export function studyPoints(hours: number, target: number, recallMins: number): number {
  const hoursPts = target > 0 ? Math.min(1, Math.max(0, hours) / target) * 14 : 14;
  const studyMins = Math.max(0, hours) * 60;
  const byAbsolute = recallMins / 45;
  const byRatio = studyMins > 0 ? recallMins / (studyMins * 0.35) : 0;
  const recallPts = clamp(Math.max(byAbsolute, byRatio), 0, 1) * 6;
  return hoursPts + recallPts;
}

/** Training (0 or 1 fraction): a logged working set, or a scheduled rest day with ≥ 7h sleep. */
export function trainingAdherent(workingSets: number, isRestDay: boolean, sleepHours: number | null): boolean {
  return workingSets >= 1 || (isRestDay && (sleepHours ?? 0) >= 7);
}

/** Execution & Reflection (-): Big-3 ratio × 10 + 3 for ≥ 1 win + 2 for mood & energy. */
export function taskPoints(
  completed: number,
  total: number,
  wins: number,
  mood: number | null,
  energy: number | null,
): number {
  const big3 = (clamp(completed, 0, total) / Math.max(1, total)) * 10;
  const winPts = wins >= 1 ? 3 : 0;
  const moodPts = mood !== null && energy !== null ? 2 : 0;
  return big3 + winPts + moodPts;
}

export function computeDayScore(input: DayScoreInput): DayScoreResult {
  const crunch = input.exam_crunch_mode;
  const max = crunch ? CRUNCH_MAX : STANDARD_MAX;

  const sleep = sleepPoints(input.sleep_hours, input.sleep_quality, input.target_sleep_hours);
  const nutritionRaw = proteinPoints(input.protein_g, input.target_protein_g) + caloriePoints(input.kcal_point, input.target_kcal);
  const studyRaw = studyPoints(input.study_hours, input.target_study_hours, input.active_recall_mins);
  const trained = trainingAdherent(input.working_sets_today, input.is_rest_day, input.sleep_hours);
  const tasks = taskPoints(input.big_three_completed, input.big_three_total, input.wins_count, input.mood_score, input.energy_score);

  const breakdown: ScoreBreakdown = {
    sleep: round(sleep, 1),
    nutrition: round(nutritionRaw * (max.nutrition / STANDARD_MAX.nutrition), 1),
    study: round(studyRaw * (max.study / STANDARD_MAX.study), 1),
    training: trained ? max.training : 0,
    tasks: round(tasks, 1),
  };

  const total = breakdown.sleep + breakdown.nutrition + breakdown.study + breakdown.training + breakdown.tasks;
  return { score: clamp(Math.round(total), 0, 100), breakdown, max, mode: crunch ? "exam_crunch" : "standard" };
}
