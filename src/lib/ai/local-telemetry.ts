"use client";
import { getDB } from "@/lib/db/dexie";
import { getProfile } from "@/lib/db/repo";
import { addDays, monthKey } from "@/lib/math/dates";
import { buildTelemetryFromData } from "./build-weekly-telemetry";
import type { WeeklyTelemetry } from "./schemas";

/** Local-Only mode: build the same payload from IndexedDB. */
export async function buildLocalTelemetry(endDate: string): Promise<WeeklyTelemetry> {
  const db = getDB();
  const since14 = addDays(endDate, -13);
  const workouts = await db.workouts.where("log_date").between(addDays(endDate, -42), endDate, true, true).toArray();
  const monthStart = `${monthKey(endDate)}-01`;
  return buildTelemetryFromData({
    profile: await getProfile(),
    dailyLogs: await db.dailyLogs.where("log_date").between(since14, endDate, true, true).toArray(),
    food: await db.foodEntries.where("log_date").between(since14, endDate, true, true).toArray(),
    workouts,
    sets: await db.workoutSets.where("workout_id").anyOf(workouts.map((w) => w.id)).toArray(),
    tasks: await db.goalsTasks.toArray(),
    sessions: await db.studySessions.where("log_date").between(addDays(endDate, -40), endDate, true, true).toArray(),
    expenses: await db.expenses.where("spent_on").between(monthStart < addDays(endDate, -6) ? monthStart : addDays(endDate, -6), endDate, true, true).toArray(),
  }, endDate);
}
