"use client";
/** Reactive IndexedDB reads · every write re-renders subscribers instantly (optimistic by construction). */
import { useLiveQuery } from "dexie-react-hooks";
import { addDays } from "@/lib/math/dates";
import { getDB, PROFILE_KEY } from "./dexie";
import { DEFAULT_PROFILE } from "./repo";

export function useProfile() {
  return useLiveQuery(async () => (await getDB().profile.get(PROFILE_KEY)) ?? DEFAULT_PROFILE, [], DEFAULT_PROFILE);
}

export function useDailyLog(date: string) {
  return useLiveQuery(() => getDB().dailyLogs.where("log_date").equals(date).first(), [date]);
}

export function useDailyLogsRange(start: string, end: string) {
  return useLiveQuery(() => getDB().dailyLogs.where("log_date").between(start, end, true, true).sortBy("log_date"), [start, end], []);
}

export function useFoodEntries(date: string) {
  return useLiveQuery(() => getDB().foodEntries.where("log_date").equals(date).sortBy("logged_at"), [date], []);
}

export function useFoodRange(start: string, end: string) {
  return useLiveQuery(() => getDB().foodEntries.where("log_date").between(start, end, true, true).toArray(), [start, end], []);
}

export function useWorkoutsRange(start: string, end: string) {
  return useLiveQuery(() => getDB().workouts.where("log_date").between(start, end, true, true).sortBy("started_at"), [start, end], []);
}

export function useActiveWorkout() {
  return useLiveQuery(async () => (await getDB().workouts.toArray()).filter((w) => w.ended_at === null).sort((a, b) => b.started_at.localeCompare(a.started_at))[0] ?? null, [], null);
}

export function useWorkoutSets(workoutId: string | null | undefined) {
  return useLiveQuery(() => (workoutId ? getDB().workoutSets.where("workout_id").equals(workoutId).sortBy("completed_at") : []), [workoutId], []);
}

export function useAllSets() {
  return useLiveQuery(() => getDB().workoutSets.toArray(), [], []);
}

export function useAllWorkouts() {
  return useLiveQuery(() => getDB().workouts.toArray(), [], []);
}

export function useTasks() {
  return useLiveQuery(() => getDB().goalsTasks.toArray(), [], []);
}

export function useStudySessions(start: string, end: string) {
  return useLiveQuery(() => getDB().studySessions.where("log_date").between(start, end, true, true).sortBy("started_at"), [start, end], []);
}

export function useExpenses(start: string, end: string) {
  return useLiveQuery(() => getDB().expenses.where("spent_on").between(start, end, true, true).toArray(), [start, end], []);
}

export function useBudgetCategories() {
  return useLiveQuery(() => getDB().budgetCategories.toArray(), [], []);
}

export function useSyncQueueCount() {
  return useLiveQuery(() => getDB().syncQueue.count(), [], 0);
}

export function useSyncQueueErrors() {
  return useLiveQuery(() => getDB().syncQueue.filter((q) => Boolean(q.last_error)).toArray(), [], []);
}

export function useWeeklyReview(weekStart: string) {
  return useLiveQuery(() => getDB().weeklyReviews.where("week_start_date").equals(weekStart).first(), [weekStart]);
}

export function useAiLedgerSince(sinceISO: string) {
  return useLiveQuery(() => getDB().aiLedger.where("created_at").aboveOrEqual(sinceISO).toArray(), [sinceISO], []);
}

export function useLast(days: number, today: string) {
  return { start: addDays(today, -(days - 1)), end: today };
}
