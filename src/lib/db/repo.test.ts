import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDB } from "./dexie";
import { addStudySession, addTask, logSet, patchDailyLog, setTaskStatus, startWorkout, updateProfile, addFoodEntry } from "./repo";

const D = "2026-10-21"; // a Wednesday (not a default rest day)

beforeEach(async () => {
  const db = getDB();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("local-first repo", () => {
  it("coalesces queued ops per record and recomputes the day score", async () => {
    await patchDailyLog(D, { sleep_hours: 8, sleep_quality: 5 });
    await patchDailyLog(D, { mood_score: 4, energy_score: 4 });
    const db = getDB();
    const log = await db.dailyLogs.where("log_date").equals(D).first();
    expect(log?.day_score).toBe(25 + 2);
    expect(await db.syncQueue.where("table_name").equals("daily_logs").count()).toBe(1);
  });

  it("derives study totals from sessions", async () => {
    await addStudySession({ subject: "Maths", mode: "active_recall", source: "pomodoro", started_at: `${D}T09:00:00`, ended_at: `${D}T09:50:00`, focus_mins: 50, log_date: D });
    const log = await getDB().dailyLogs.where("log_date").equals(D).first();
    expect(log?.study_hours).toBeCloseTo(0.83, 2);
    expect(log?.active_recall_mins).toBe(50);
  });

  it("enforces Big-3 and credits completion", async () => {
    for (const t of ["a", "b", "c"]) await addTask({ title: t, domain: "study", is_big_three: true, scheduled_date: D });
    const fourth = await addTask({ title: "d", domain: "study", is_big_three: true, scheduled_date: D });
    expect(fourth.ok).toBe(false);
    const tasks = (await getDB().goalsTasks.toArray()).filter((t) => t.is_big_three);
    expect(tasks).toHaveLength(3);
    await setTaskStatus(tasks[0]!.id, "done");
    const log = await getDB().dailyLogs.where("log_date").equals(D).first();
    expect(log?.score_breakdown.tasks).toBeCloseTo(3.3, 1);
  });

  it("logs sets with e1RM, PRs after a baseline, and training credit", async () => {
    const w = await startWorkout("Push", D);
    const first = await logSet({ workout_id: w.id, exercise_slug: "barbell-bench-press", set_number: 1, set_type: "working", weight_kg: 80, reps: 8, rir: 2 });
    expect(first.newPR).toBe(false);
    const second = await logSet({ workout_id: w.id, exercise_slug: "barbell-bench-press", set_number: 2, set_type: "working", weight_kg: 85, reps: 8, rir: 2 });
    expect(second.newPR).toBe(true);
    expect(second.set.est_1rm).toBeCloseTo(113.33, 2);
    const wk = await getDB().workouts.get(w.id);
    expect(wk?.total_volume_kg).toBe(80 * 8 + 85 * 8);
    const log = await getDB().dailyLogs.where("log_date").equals(D).first();
    expect(log?.score_breakdown.training).toBe(15);
  });

  it("feeds nutrition and crunch mode into the score", async () => {
    await addFoodEntry({
      log_date: D, meal_slot: "lunch", meal_title: "x", source_type: "quick_manual", photo_path: null, prep_modifier: "standard",
      confidence_tier: "high", kcal_point: 2400, kcal_low: 2300, kcal_high: 2500, protein_g: 140, carbs_g: 0, fat_g: 0, fiber_g: 0, items_breakdown: [],
    });
    const log = await getDB().dailyLogs.where("log_date").equals(D).first();
    expect(log?.score_breakdown.nutrition).toBe(25);
    await updateProfile({ exam_crunch_mode: true });
    const { recomputeDayScore } = await import("./repo");
    const crunch = await recomputeDayScore(D);
    expect(crunch.score_breakdown.nutrition).toBe(20);
  });
});
