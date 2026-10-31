"use client";
import { useMemo } from "react";
import { useAllSets, useAllWorkouts, useDailyLogsRange, useFoodRange } from "@/lib/db/hooks";
import { addDays } from "@/lib/math/dates";
import type { ExerciseSession, RecoveryDayLog } from "@/lib/math/gym-math";
import type { WorkoutSet } from "@/types/database.types";

export interface ExerciseHistorySession extends ExerciseSession {
  workout_id: string;
  sets: WorkoutSet[];
}

/** Indexes every logged set by exercise → sessions (oldest first). */
export function useTrainingData(today: string) {
  const sets = useAllSets();
  const workouts = useAllWorkouts();
  const logs = useDailyLogsRange(addDays(today, -13), today);
  const food = useFoodRange(addDays(today, -13), today);

  return useMemo(() => {
    const wById = new Map(workouts.map((w) => [w.id, w]));
    const byExercise = new Map<string, Map<string, ExerciseHistorySession>>();
    for (const s of sets) {
      const w = wById.get(s.workout_id);
      if (!w) continue;
      const m = byExercise.get(s.exercise_slug) ?? new Map<string, ExerciseHistorySession>();
      const sess = m.get(w.id) ?? { workout_id: w.id, date: w.log_date, sets: [] };
      sess.sets.push(s);
      m.set(w.id, sess);
      byExercise.set(s.exercise_slug, m);
    }
    const history = (slug: string, excludeWorkoutId?: string): ExerciseHistorySession[] =>
      [...(byExercise.get(slug)?.values() ?? [])]
        .filter((x) => x.workout_id !== excludeWorkoutId)
        .map((x) => ({ ...x, sets: [...x.sets].sort((a, b) => a.set_number - b.set_number) }))
        .sort((a, b) => a.date.localeCompare(b.date) || a.sets[0]!.completed_at.localeCompare(b.sets[0]!.completed_at));

    const proteinByDate = new Map<string, number>();
    for (const f of food) proteinByDate.set(f.log_date, (proteinByDate.get(f.log_date) ?? 0) + f.protein_g);
    const dates = new Set([...logs.map((l) => l.log_date), ...proteinByDate.keys()]);
    const recovery: RecoveryDayLog[] = [...dates].map((d) => ({
      log_date: d,
      sleep_hours: logs.find((l) => l.log_date === d)?.sleep_hours ?? null,
      protein_g: proteinByDate.has(d) ? proteinByDate.get(d)! : null,
    }));

    const best1RM = (slug: string) => Math.max(0, ...(byExercise.get(slug) ? [...byExercise.get(slug)!.values()].flatMap((x) => x.sets.filter((s) => s.set_type !== "warmup").map((s) => s.est_1rm)) : []));
    return { sets, workouts, history, recovery, best1RM, exerciseSlugs: [...byExercise.keys()] };
  }, [sets, workouts, logs, food]);
}
