/**
 * Gym engine: e1RM, PR detection, double-progression overload, stalled-lift attribution,
 * fractional weekly muscle volume. Pure functions only.
 */
import { mean, round, linearSlope } from "./stats";
import { daysBetween } from "./dates";

export type SetType = "warmup" | "working" | "dropset" | "failure";

export interface SetLike {
  set_number: number;
  set_type: SetType;
  weight_kg: number;
  reps: number;
  rir: number | null;
  est_1rm?: number;
}

export interface ExerciseMeta {
  slug: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: readonly string[];
  equipment: string;
  overload_increment_kg: number;
  rep_range_min: number;
  rep_range_max: number;
  is_compound: boolean;
}

/* ------------------------------------------------------------------ */
/* 1. Estimated 1RM                                                    */
/* ------------------------------------------------------------------ */

export function calculateEst1RM(weightKg: number, reps: number, rir: number | null = 0): number {
  if (reps === 0 || weightKg <= 0) return 0;
  const effectiveReps = reps + (rir ?? 0);
  if (effectiveReps === 1) return weightKg;
  if (effectiveReps <= 10) return round(weightKg * (1 + effectiveReps / 30), 2);
  return round(weightKg * (36 / (37 - Math.min(15, effectiveReps))), 2);
}

/* ------------------------------------------------------------------ */
/* 2. PR detection                                                     */
/* ------------------------------------------------------------------ */

export interface PRResult {
  is_1rm_pr: boolean;
  is_volume_pr: boolean;
}

export function evaluateSetPRs(
  currentSet: Pick<SetLike, "set_type" | "weight_kg" | "reps"> & { est_1rm: number },
  historicalBest1RM: number,
  historicalBestWeightAtReps: number,
): PRResult {
  if (currentSet.set_type === "warmup" || currentSet.reps === 0) return { is_1rm_pr: false, is_volume_pr: false };
  return {
    is_1rm_pr: currentSet.est_1rm > historicalBest1RM,
    is_volume_pr: currentSet.weight_kg * currentSet.reps > historicalBestWeightAtReps,
  };
}

/** Sets that count as "working" for progression & volume. */
export function isWorkingSet(s: Pick<SetLike, "set_type">): boolean {
  return s.set_type === "working" || s.set_type === "failure";
}

export function isHardSet(s: Pick<SetLike, "set_type">): boolean {
  return s.set_type !== "warmup";
}

/* ------------------------------------------------------------------ */
/* 3. Double-progression overload recommender                          */
/* ------------------------------------------------------------------ */

export type OverloadRule = "A_LOAD" | "B_REPS" | "C_CONSOLIDATE" | "NO_HISTORY";

export interface OverloadTarget {
  rule: OverloadRule;
  target_weight_kg: number;
  target_reps_min: number;
  target_reps_max: number;
  delta_kg: number;
  per_set: { set_number: number; weight_kg: number; reps: number }[];
  message: string;
}

export function roundToIncrement(kg: number, increment: number): number {
  const step = Math.max(0.5, increment / 2);
  return round(Math.round(kg / step) * step, 2);
}

const fmtKg = (kg: number) => `${Number(kg.toFixed(2))}kg`;

export function recommendNextTarget(lastSessionWorkingSets: readonly SetLike[], exerciseMeta: ExerciseMeta): OverloadTarget {
  const sets = lastSessionWorkingSets.filter(isWorkingSet).sort((a, b) => a.set_number - b.set_number);
  const { rep_range_min: min, rep_range_max: max, overload_increment_kg: inc } = exerciseMeta;

  if (sets.length === 0) {
    return {
      rule: "NO_HISTORY", target_weight_kg: 0, target_reps_min: min, target_reps_max: max, delta_kg: 0, per_set: [],
      message: `No history · find a load you can do for ${min}-${max} reps at 2 RIR.`,
    };
  }

  const topWeight = Math.max(...sets.map((s) => s.weight_kg));
  const s1 = sets[0]!;
  const s2 = sets[1];

  // Rule C · under-target or a sharp drop-off after a grinder Set 1.
  const belowRange = sets.some((s) => s.reps < min);
  const dropOff = s1.rir === 0 && s2 !== undefined && s1.reps - s2.reps > 3;
  if (belowRange || dropOff) {
    const reduce = s1.reps < min;
    const w = reduce ? roundToIncrement(topWeight * 0.95, inc) : topWeight;
    return {
      rule: "C_CONSOLIDATE", target_weight_kg: w, target_reps_min: min, target_reps_max: max,
      delta_kg: round(w - topWeight, 2),
      per_set: sets.map((s) => ({ set_number: s.set_number, weight_kg: w, reps: min })),
      message: reduce
        ? `Reduce to ${fmtKg(w)} (−5%) and own ${min}+ clean reps every set.`
        : `Hold ${fmtKg(w)} · stop Set 1 at 1 RIR so Set 2 doesn't fall off.`,
    };
  }

  // Rule A · every working set at the top of the range with ≥ 1 RIR (unlogged RIR treated as 1).
  const allAtTop = sets.every((s) => s.reps >= max && (s.rir ?? 1) >= 1);
  if (allAtTop) {
    const w = round(topWeight + inc, 2);
    return {
      rule: "A_LOAD", target_weight_kg: w, target_reps_min: min, target_reps_max: max, delta_kg: inc,
      per_set: sets.map((s) => ({ set_number: s.set_number, weight_kg: w, reps: min })),
      message: `Target Today: ${fmtKg(w)} × ${min}-${max} reps (+${fmtKg(inc)})`,
    };
  }

  // Rule B · inside the range: same weight, +1 rep on the first two working sets.
  const per_set = sets.map((s, i) => ({
    set_number: s.set_number,
    weight_kg: s.weight_kg,
    reps: i < 2 ? Math.min(max, s.reps + 1) : s.reps,
  }));
  const pushable = s1.reps < max;
  return {
    rule: "B_REPS", target_weight_kg: topWeight, target_reps_min: Math.min(max, s1.reps + 1), target_reps_max: max, delta_kg: 0,
    per_set,
    message: pushable
      ? `Match ${fmtKg(topWeight)}, push Set 1 from ${s1.reps} -> ${s1.reps + 1} reps`
      : `Match ${fmtKg(topWeight)} · hit ${max} reps at ≥1 RIR on all sets to earn +${fmtKg(inc)}`,
  };
}

/* ------------------------------------------------------------------ */
/* 4. Stalled-lift detection & root-cause attribution                  */
/* ------------------------------------------------------------------ */

export interface ExerciseSession {
  date: string; // YYYY-MM-DD
  sets: readonly SetLike[];
}

export interface RecoveryDayLog {
  log_date: string;
  sleep_hours: number | null;
  protein_g: number | null;
}

export type StallCause = "RECOVERY_DEBT_STALL" | "LOCAL_FATIGUE_STALL" | "MICRO_LOAD_STALL";

export interface StallReport {
  status: "INSUFFICIENT_DATA" | "PROGRESSING" | "STALLED";
  cause: StallCause | null;
  prescription: string | null;
  slope_kg_per_session: number;
  top_e1rm_series: number[];
  volume_series: number[];
  avgSleep7d: number | null;
  avgProteinPerKg7d: number | null;
  avgRir: number | null;
  sessions_considered: number;
}

export const STALL_PRESCRIPTIONS: Record<StallCause, string> = {
  RECOVERY_DEBT_STALL: "Hold load steady; fix sleep (<6.5h avg) and protein (<1.6g/kg) before deloading.",
  LOCAL_FATIGUE_STALL:
    "Take a 1-week exercise deload (-10% load, -1 working set, stop at 3 RIR) or swap variation (e.g., Barbell Bench -> Incline DB Press).",
  MICRO_LOAD_STALL: "Add 1 backoff set or micro-load by +1.25kg.",
};

function topE1RM(sets: readonly SetLike[]): number {
  const working = sets.filter(isWorkingSet);
  if (working.length === 0) return 0;
  return Math.max(...working.map((s) => s.est_1rm ?? calculateEst1RM(s.weight_kg, s.reps, s.rir)));
}

function sessionVolume(sets: readonly SetLike[]): number {
  return sets.filter(isWorkingSet).reduce((t, s) => t + s.weight_kg * s.reps, 0);
}

export function detectStalledLift(
  last4Sessions: readonly ExerciseSession[],
  last14DaysLogs: readonly RecoveryDayLog[],
  profile: { body_weight_kg: number },
): StallReport {
  const sessions = [...last4Sessions]
    .filter((s) => s.sets.some(isWorkingSet))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-4);

  const recentLogs = [...last14DaysLogs].sort((a, b) => b.log_date.localeCompare(a.log_date)).slice(0, 7);
  const avgSleep = mean(recentLogs.flatMap((l) => (l.sleep_hours === null ? [] : [l.sleep_hours])));
  const avgProtein = mean(recentLogs.flatMap((l) => (l.protein_g === null ? [] : [l.protein_g])));
  const avgSleep7d = avgSleep === null ? null : round(avgSleep, 2);
  const avgProteinPerKg7d = avgProtein === null || profile.body_weight_kg <= 0 ? null : round(avgProtein / profile.body_weight_kg, 2);

  const top_e1rm_series = sessions.map((s) => round(topE1RM(s.sets), 2));
  const volume_series = sessions.map((s) => round(sessionVolume(s.sets), 1));
  const base: Omit<StallReport, "status" | "cause" | "prescription" | "slope_kg_per_session" | "avgRir"> = {
    top_e1rm_series, volume_series, avgSleep7d, avgProteinPerKg7d, sessions_considered: sessions.length,
  };

  const first = sessions[0];
  const last = sessions.at(-1);
  if (sessions.length < 3 || !first || !last || daysBetween(first.date, last.date) < 10) {
    return { ...base, status: "INSUFFICIENT_DATA", cause: null, prescription: null, slope_kg_per_session: 0, avgRir: null };
  }

  const last3 = sessions.slice(-3);
  const slope = round(linearSlope(last3.map((s) => topE1RM(s.sets))), 3);
  const volFirst = sessionVolume(last3[0]!.sets);
  const volLast = sessionVolume(last3[2]!.sets);
  const rirs = last3.flatMap((s) => s.sets.filter(isWorkingSet).flatMap((x) => (x.rir === null ? [] : [x.rir])));
  const avgRirRaw = mean(rirs);
  const avgRir = avgRirRaw === null ? null : round(avgRirRaw, 2);

  if (!(slope <= 0 && volLast <= volFirst)) {
    return { ...base, status: "PROGRESSING", cause: null, prescription: null, slope_kg_per_session: slope, avgRir };
  }

  let cause: StallCause;
  if ((avgSleep7d !== null && avgSleep7d < 6.5) || (avgProteinPerKg7d !== null && avgProteinPerKg7d < 1.6)) {
    cause = "RECOVERY_DEBT_STALL";
  } else if (avgRir !== null && avgRir <= 0.5) {
    cause = "LOCAL_FATIGUE_STALL";
  } else {
    cause = "MICRO_LOAD_STALL";
  }
  return { ...base, status: "STALLED", cause, prescription: STALL_PRESCRIPTIONS[cause], slope_kg_per_session: slope, avgRir };
}

/* ------------------------------------------------------------------ */
/* 5. Fractional weekly muscle volume                                  */
/* ------------------------------------------------------------------ */

export type VolumeStatus = "under_target" | "optimal" | "upper_zone" | "high_fatigue_risk";

export interface MuscleVolume {
  muscle: string;
  sets: number;
  status: VolumeStatus;
}

export function volumeStatus(sets: number): VolumeStatus {
  if (sets < 8) return "under_target";
  if (sets <= 18) return "optimal";
  if (sets <= 20) return "upper_zone";
  return "high_fatigue_risk";
}

export function computeWeeklyMuscleVolume(
  setsLast7Days: readonly (Pick<SetLike, "set_type"> & { exercise_slug: string })[],
  exercisesMap: ReadonlyMap<string, Pick<ExerciseMeta, "primary_muscle" | "secondary_muscles">>,
): MuscleVolume[] {
  const totals = new Map<string, number>();
  const add = (m: string, n: number) => totals.set(m, (totals.get(m) ?? 0) + n);
  for (const s of setsLast7Days) {
    if (!isHardSet(s)) continue;
    const ex = exercisesMap.get(s.exercise_slug);
    if (!ex) continue;
    add(ex.primary_muscle, 1);
    for (const m of ex.secondary_muscles) add(m, 0.5);
  }
  return [...totals.entries()]
    .map(([muscle, sets]) => ({ muscle, sets: round(sets, 1), status: volumeStatus(sets) }))
    .sort((a, b) => b.sets - a.sets);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function restSecondsFor(meta: Pick<ExerciseMeta, "is_compound">): number {
  return meta.is_compound ? 150 : 90;
}

export function workoutVolume(sets: readonly SetLike[]): number {
  return round(sets.filter(isHardSet).reduce((t, s) => t + s.weight_kg * s.reps, 0), 2);
}
