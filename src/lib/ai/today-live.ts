"use client";
import { getDB } from "@/lib/db/dexie";
import { getProfile } from "@/lib/db/repo";
import { bigThreeFor } from "@/lib/math/goals-math";
import type { z } from "zod";
import type { TodayLiveSchema } from "./schemas";

export async function buildTodayLive(date: string): Promise<z.infer<typeof TodayLiveSchema>> {
  const db = getDB();
  const profile = await getProfile();
  const log = await db.dailyLogs.where("log_date").equals(date).first();
  const food = await db.foodEntries.where("log_date").equals(date).toArray();
  const tasks = await db.goalsTasks.where("scheduled_date").equals(date).toArray();
  const active = (await db.workouts.where("log_date").equals(date).toArray()).at(-1);
  const kcal = food.reduce((t, f) => t + f.kcal_point, 0);
  const protein = food.reduce((t, f) => t + f.protein_g, 0);
  return {
    date, sleep_hours: log?.sleep_hours ?? null, study_hours: log?.study_hours ?? 0, kcal_point: kcal, protein_g: Math.round(protein),
    remaining_kcal: profile.target_kcal - kcal, remaining_protein_g: Math.round(profile.target_protein_g - protein),
    big_three: bigThreeFor(tasks, date).map((t) => ({ title: t.title, done: t.status === "done" })), planned_split: active?.split_name ?? null,
  };
}
