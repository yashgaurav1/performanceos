"use client";
import { getDB, PROFILE_KEY } from "@/lib/db/dexie";
import { toISODate } from "@/lib/math/dates";
import demoDataJson from "./demo-data.json";
import type {
  DailyLog,
  Expense,
  FoodEntry,
  GoalTask,
  Profile,
  StudySession,
  Workout,
  WorkoutSet,
} from "@/types/database.types";

function shiftISODate(isoDateStr: string, daysOffset: number): string {
  if (!isoDateStr || daysOffset === 0) return isoDateStr;
  const d = new Date(isoDateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().split("T")[0]!;
}

function shiftISOTimestamp(timestampStr: string, daysOffset: number): string {
  if (!timestampStr || daysOffset === 0) return timestampStr;
  const d = new Date(timestampStr);
  if (isNaN(d.getTime())) return timestampStr;
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString();
}

/** Loads the 30-day fixed demo dataset into IndexedDB and Cloud Firestore local cache. */
export async function loadDemoData() {
  const db = getDB();
  const raw = demoDataJson as unknown as {
    profile: Profile;
    dailyLogs: DailyLog[];
    food: FoodEntry[];
    workouts: Workout[];
    sets: WorkoutSet[];
    tasks: GoalTask[];
    sessions: StudySession[];
    expenses: Expense[];
  };

  const today = toISODate(new Date());
  const lastLogDate = raw.dailyLogs[raw.dailyLogs.length - 1]?.log_date || today;
  const daysOffset = Math.round(
    (new Date(today).getTime() - new Date(lastLogDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const profile: Profile = {
    ...raw.profile,
    created_at: shiftISOTimestamp(raw.profile.created_at, daysOffset),
    updated_at: shiftISOTimestamp(raw.profile.updated_at, daysOffset),
  };

  const dailyLogs: DailyLog[] = raw.dailyLogs.map((l) => ({
    ...l,
    log_date: shiftISODate(l.log_date, daysOffset),
    client_updated_at: shiftISOTimestamp(l.client_updated_at || new Date().toISOString(), daysOffset),
  }));

  const food: FoodEntry[] = raw.food.map((f) => ({
    ...f,
    log_date: shiftISODate(f.log_date, daysOffset),
    logged_at: shiftISOTimestamp(f.logged_at, daysOffset),
  }));

  const workouts: Workout[] = raw.workouts.map((w) => ({
    ...w,
    log_date: shiftISODate(w.log_date, daysOffset),
    started_at: shiftISOTimestamp(w.started_at, daysOffset),
    ended_at: w.ended_at ? shiftISOTimestamp(w.ended_at, daysOffset) : null,
    client_updated_at: shiftISOTimestamp(w.client_updated_at || new Date().toISOString(), daysOffset),
  }));

  const sets: WorkoutSet[] = raw.sets.map((s) => ({
    ...s,
    completed_at: shiftISOTimestamp(s.completed_at, daysOffset),
  }));

  const tasks: GoalTask[] = raw.tasks.map((t) => ({
    ...t,
    scheduled_date: t.scheduled_date ? shiftISODate(t.scheduled_date, daysOffset) : null,
    due_date: t.due_date ? shiftISODate(t.due_date, daysOffset) : null,
    completed_at: t.completed_at ? shiftISOTimestamp(t.completed_at, daysOffset) : null,
    created_at: shiftISOTimestamp(t.created_at, daysOffset),
  }));

  const sessions: StudySession[] = raw.sessions.map((s) => ({
    ...s,
    log_date: shiftISODate(s.log_date, daysOffset),
    started_at: shiftISOTimestamp(s.started_at, daysOffset),
    ended_at: shiftISOTimestamp(s.ended_at, daysOffset),
    client_updated_at: shiftISOTimestamp(s.client_updated_at || new Date().toISOString(), daysOffset),
  }));

  const expenses: Expense[] = raw.expenses.map((e) => {
    const rawDate = e.spent_on || (e as unknown as { expense_date?: string }).expense_date || today;
    return {
      ...e,
      spent_on: shiftISODate(rawDate, daysOffset),
      client_updated_at: shiftISOTimestamp(e.client_updated_at || new Date().toISOString(), daysOffset),
    };
  });

  const s = <T>(rows: T[]) => rows.map((r) => ({ ...r, sync_status: "synced" as const }));

  await db.transaction("rw", db.tables, async () => {
    await Promise.all([
      db.dailyLogs,
      db.foodEntries,
      db.workouts,
      db.workoutSets,
      db.goalsTasks,
      db.studySessions,
      db.expenses,
      db.budgetCategories,
    ].map((t) => t.clear()));
    await db.profile.put({ ...profile, id: PROFILE_KEY, sync_status: "synced" });
    await db.dailyLogs.bulkPut(s(dailyLogs));
    await db.foodEntries.bulkPut(s(food));
    await db.workouts.bulkPut(s(workouts));
    await db.workoutSets.bulkPut(s(sets));
    await db.goalsTasks.bulkPut(s(tasks));
    await db.studySessions.bulkPut(s(sessions));
    await db.expenses.bulkPut(s(expenses));
    await db.budgetCategories.bulkPut(
      s([
        {
          id: crypto.randomUUID(),
          user_id: profile.id,
          category: "food",
          monthly_limit_minor: 4000_00,
          client_updated_at: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          user_id: profile.id,
          category: "transport",
          monthly_limit_minor: 1500_00,
          client_updated_at: new Date().toISOString(),
        },
      ]),
    );
  });

}

/** Developer Mode: seed specialized diet & training phases. */
export async function seedPhaseProfile(preset: "bulk" | "cut" | "crunch") {
  const db = getDB();
  const profile = await db.profile.get(PROFILE_KEY);
  if (!profile) return;
  if (preset === "bulk") {
    await db.profile.update(PROFILE_KEY, {
      target_kcal: 3100,
      target_protein_g: 180,
      target_carbs_g: 380,
      target_fat_g: 85,
      exam_crunch_mode: false,
    });
  } else if (preset === "cut") {
    await db.profile.update(PROFILE_KEY, {
      target_kcal: 1850,
      target_protein_g: 195,
      target_carbs_g: 145,
      target_fat_g: 50,
      exam_crunch_mode: false,
    });
  } else if (preset === "crunch") {
    await db.profile.update(PROFILE_KEY, {
      exam_crunch_mode: true,
      target_study_hours: 6.5,
      target_sleep_hours: 8.0,
    });
  }
}

/** Developer Mode: inspect live IndexedDB table row counts. */
export async function getTableCounts(): Promise<Record<string, number>> {
  const db = getDB();
  const counts: Record<string, number> = {};
  for (const t of db.tables) {
    counts[t.name] = await t.count();
  }
  return counts;
}

export async function clearLocalData() {
  const db = getDB();
  await db.transaction("rw", db.tables, () => Promise.all(db.tables.map((t) => t.clear())));
  Object.keys(localStorage)
    .filter((k) => k.startsWith("cc:"))
    .forEach((k) => localStorage.removeItem(k));
}

export async function exportLocalData(): Promise<Blob> {
  const db = getDB();
  const dump: Record<string, unknown> = { exported_at: new Date().toISOString() };
  for (const t of db.tables) if (t.name !== "syncQueue") dump[t.name] = await t.toArray();
  return new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
}
