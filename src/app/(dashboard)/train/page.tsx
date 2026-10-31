"use client";
import { useMemo } from "react";
import { OfflineSyncStatusBadge } from "@/components/shell/sync-badge";
import { WeeklyMuscleVolumeBar } from "@/components/train/muscle-volume-bar";
import { LiveWorkoutTerminal } from "@/components/train/live-workout-terminal";
import { LiftTelemetry, RecentWorkouts, StartWorkoutCard } from "@/components/train/start-workout";
import { FloatingRestTimer } from "@/components/train/rest-timer";
import { useTrainingData } from "@/components/train/training-data";
import { useActiveWorkout } from "@/lib/db/hooks";
import { EXERCISE_MAP } from "@/lib/exercises";
import { addDays } from "@/lib/math/dates";
import { computeWeeklyMuscleVolume } from "@/lib/math/gym-math";
import { useToday } from "@/lib/hooks/use-today";

export default function TrainPage() {
  const today = useToday();
  const active = useActiveWorkout();
  const data = useTrainingData(today || "1970-01-01");

  const volume = useMemo(() => {
    const since = addDays(today || "1970-01-01", -6);
    const wIds = new Set(data.workouts.filter((w) => w.log_date >= since).map((w) => w.id));
    return computeWeeklyMuscleVolume(data.sets.filter((s) => wIds.has(s.workout_id)), EXERCISE_MAP);
  }, [data.sets, data.workouts, today]);

  if (!today) return null;
  return (
    <div className="space-y-3">
      <div className="flex justify-start"><OfflineSyncStatusBadge noun="Sets" /></div>
      <WeeklyMuscleVolumeBar volume={volume} />
      {active ? (
        <LiveWorkoutTerminal key={active.id} workout={active} data={data} />
      ) : (
        <>
          <StartWorkoutCard today={today} />
          <LiftTelemetry data={data} />
          <RecentWorkouts data={data} />
          <FloatingRestTimer />
        </>
      )}
    </div>
  );
}
