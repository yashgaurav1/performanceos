import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

export interface FourteenDayTelemetry {
  uid: string;
  targets: Record<string, unknown>;
  days: Record<string, unknown>[];
  recentMeals: Record<string, unknown>[];
  recentWorkouts: Record<string, unknown>[];
  recentFocus: Record<string, unknown>[];
  summaryText: string;
}

/**
 * Builds a server-side 14-day telemetry brief from Firestore
 * Queries users/{uid}/{days,meals,workouts,focus}
 */
export async function buildFourteenDaySummary(
  uid: string,
  anchorDate?: string
): Promise<FourteenDayTelemetry> {
  const db = getAdminFirestore();
  const today = anchorDate || new Date().toISOString().slice(0, 10);

  const dates: string[] = [];
  const anchorTime = new Date(`${today}T00:00:00Z`).getTime();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(anchorTime - i * 86400000).toISOString().slice(0, 10);
    dates.push(d);
  }
  const startDate = dates[0] || today;

  let targets: Record<string, unknown> = {
    target_kcal: 2400,
    target_protein_g: 140,
    target_carbs_g: 260,
    target_fat_g: 75,
    target_sleep_hours: 8,
    target_study_hours: 4,
    body_weight_kg: 70,
  };

  const days: Record<string, unknown>[] = [];
  let meals: Record<string, unknown>[] = [];
  let workouts: Record<string, unknown>[] = [];
  let focus: Record<string, unknown>[] = [];

  if (db) {
    try {
      // 1. User targets
      const userDoc = await db.collection("users").doc(uid).get();
      if (userDoc.exists) {
        targets = { ...targets, ...(userDoc.data() || {}) };
      }

      // 2. 14 Days logs
      for (const d of dates) {
        const daySnap = await db
          .collection("users")
          .doc(uid)
          .collection("days")
          .doc(d)
          .get();
        if (daySnap.exists) {
          days.push({ date: d, ...daySnap.data() });
        } else {
          const compatSnap = await db
            .collection("users")
            .doc(uid)
            .collection("dailyLogs")
            .doc(d)
            .get();
          if (compatSnap.exists) {
            days.push({ date: d, ...compatSnap.data() });
          }
        }
      }

      // 3. Meals
      const mealsSnap = await db
        .collection("users")
        .doc(uid)
        .collection("meals")
        .where("log_date", ">=", startDate)
        .get()
        .catch(() => null);

      if (mealsSnap && !mealsSnap.empty) {
        meals = mealsSnap.docs.map((doc) => doc.data());
      } else {
        const allMeals = await db
          .collection("users")
          .doc(uid)
          .collection("meals")
          .limit(50)
          .get()
          .catch(() => null);
        if (allMeals && !allMeals.empty) {
          meals = allMeals.docs
            .map((doc) => doc.data())
            .filter((m) => !m.log_date || m.log_date >= startDate);
        }
      }

      // 4. Workouts
      const workoutsSnap = await db
        .collection("users")
        .doc(uid)
        .collection("workouts")
        .where("workout_date", ">=", startDate)
        .get()
        .catch(() => null);

      if (workoutsSnap && !workoutsSnap.empty) {
        workouts = workoutsSnap.docs.map((doc) => doc.data());
      } else {
        const allWk = await db
          .collection("users")
          .doc(uid)
          .collection("workouts")
          .limit(30)
          .get()
          .catch(() => null);
        if (allWk && !allWk.empty) {
          workouts = allWk.docs.map((doc) => doc.data());
        }
      }

      // 5. Focus
      const focusSnap = await db
        .collection("users")
        .doc(uid)
        .collection("focus")
        .where("session_date", ">=", startDate)
        .get()
        .catch(() => null);

      if (focusSnap && !focusSnap.empty) {
        focus = focusSnap.docs.map((doc) => doc.data());
      } else {
        const allFoc = await db
          .collection("users")
          .doc(uid)
          .collection("focus")
          .limit(30)
          .get()
          .catch(() => null);
        if (allFoc && !allFoc.empty) {
          focus = allFoc.docs.map((doc) => doc.data());
        }
      }
    } catch (err) {
      console.warn("Notice reading Firestore 14-day telemetry:", err);
    }
  }

  const lines: string[] = [
    `=== 14-DAY TELEMETRY BRIEF (${startDate} to ${today}) ===`,
    `Athlete Targets:`,
    `- Daily Energy: ${targets.target_kcal ?? 2400} kcal (P: ${targets.target_protein_g ?? 140}g, C: ${targets.target_carbs_g ?? 260}g, F: ${targets.target_fat_g ?? 75}g)`,
    `- Sleep: ${targets.target_sleep_hours ?? 8}h · Focus: ${targets.target_study_hours ?? 4}h · Body Weight: ${targets.body_weight_kg ?? "70"} kg`,
    ``,
    `Days Logged (${days.length} entries recorded):`,
  ];

  if (days.length === 0) {
    lines.push(`(No daily score logs found in the last 14 days)`);
  } else {
    for (const d of days.slice(-7)) {
      lines.push(
        `- ${d.date}: Score ${d.day_score ?? "N/A"} · Sleep ${d.sleep_hours ?? "N/A"}h · Weight ${d.body_weight_kg ?? "N/A"}kg`
      );
    }
  }

  lines.push(``);
  lines.push(`Meals Logged (${meals.length} entries):`);
  if (meals.length === 0) {
    lines.push(`(No meals recorded)`);
  } else {
    for (const m of meals.slice(-10)) {
      lines.push(
        `- [${m.log_date || today}] ${m.meal_title || "Meal"}: ${m.kcal_point ?? 0} kcal, ${m.protein_g ?? 0}g P, ${m.carbs_g ?? 0}g C, ${m.fat_g ?? 0}g F (${m.meal_slot || "snack"})`
      );
    }
  }

  lines.push(``);
  lines.push(`Workouts Completed (${workouts.length} sessions):`);
  if (workouts.length === 0) {
    lines.push(`(No workouts recorded)`);
  } else {
    for (const w of workouts.slice(-6)) {
      lines.push(
        `- [${w.workout_date || today}] ${w.name || "Workout"}: Volume ${w.volume_kg ?? 0} kg`
      );
    }
  }

  lines.push(``);
  lines.push(`Focus Sessions (${focus.length} sessions):`);
  if (focus.length === 0) {
    lines.push(`(No focus sessions recorded)`);
  } else {
    for (const f of focus.slice(-6)) {
      lines.push(
        `- [${f.session_date || today}] ${f.subject || "Study"}: ${f.duration_minutes ?? 0} mins`
      );
    }
  }

  return {
    uid,
    targets,
    days,
    recentMeals: meals,
    recentWorkouts: workouts,
    recentFocus: focus,
    summaryText: lines.join("\n"),
  };
}

/**
 * Executes supported function calls for the coach on Firestore
 */
export async function executeCoachTool(
  toolName: string,
  args: Record<string, unknown>,
  uid: string,
  currentDate?: string
): Promise<{ success: boolean; result: string; data?: unknown }> {
  const db = getAdminFirestore();
  const today = currentDate || new Date().toISOString().slice(0, 10);

  if (toolName === "log_meal") {
    const mealId = crypto.randomUUID();
    const logDate = String(args.log_date || today);
    const mealTitle = String(args.meal_title || "Logged Meal");
    const kcal = Math.round(Number(args.kcal) || 0);
    const protein = Math.round(Number(args.protein_g) || 0);
    const carbs = Math.round(Number(args.carbs_g) || 0);
    const fat = Math.round(Number(args.fat_g) || 0);
    const slot = String(args.meal_slot || "snack");

    const mealDoc = {
      id: mealId,
      log_date: logDate,
      meal_title: mealTitle,
      meal_slot: slot,
      source_type: "ai_coach",
      kcal_point: kcal,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      fiber_g: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (db) {
      try {
        await db
          .collection("users")
          .doc(uid)
          .collection("meals")
          .doc(mealId)
          .set(mealDoc);
        // Compat mirror
        await db
          .collection("users")
          .doc(uid)
          .collection("foodEntries")
          .doc(mealId)
          .set(mealDoc);
      } catch (err) {
        console.warn("Notice saving meal to Firestore:", err);
      }
    }

    return {
      success: true,
      result: `Successfully logged "${mealTitle}" (${kcal} kcal, ${protein}g P, ${carbs}g C, ${fat}g F) to ${slot} for ${logDate}.`,
      data: mealDoc,
    };
  }

  if (toolName === "update_targets") {
    const patch: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (args.target_kcal !== undefined) patch.target_kcal = Math.round(Number(args.target_kcal));
    if (args.target_protein_g !== undefined) patch.target_protein_g = Math.round(Number(args.target_protein_g));
    if (args.target_carbs_g !== undefined) patch.target_carbs_g = Math.round(Number(args.target_carbs_g));
    if (args.target_fat_g !== undefined) patch.target_fat_g = Math.round(Number(args.target_fat_g));
    if (args.target_sleep_hours !== undefined) patch.target_sleep_hours = Number(args.target_sleep_hours);
    if (args.target_study_hours !== undefined) patch.target_study_hours = Number(args.target_study_hours);
    if (args.body_weight_kg !== undefined) patch.body_weight_kg = Number(args.body_weight_kg);

    if (db) {
      try {
        await db.collection("users").doc(uid).set(patch, { merge: true });
      } catch (err) {
        console.warn("Notice updating targets in Firestore:", err);
      }
    }

    const changed = Object.entries(patch)
      .filter(([k]) => k !== "updatedAt")
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    return {
      success: true,
      result: `Target values successfully updated in database: ${changed}.`,
      data: patch,
    };
  }

  if (toolName === "get_week_summary") {
    const summary = await buildFourteenDaySummary(uid, today);
    const last7Days = summary.days.slice(-7);
    const last7Meals = summary.recentMeals.slice(-15);
    const totalKcal = last7Meals.reduce((acc, m) => acc + (Number(m.kcal_point) || 0), 0);
    const totalP = last7Meals.reduce((acc, m) => acc + (Number(m.protein_g) || 0), 0);
    const avgKcal = Math.round(totalKcal / 7);
    const avgProtein = Math.round(totalP / 7);

    const weekResult = {
      period: `Last 7 Days (up to ${today})`,
      avg_daily_kcal: avgKcal,
      avg_daily_protein_g: avgProtein,
      total_workouts: summary.recentWorkouts.length,
      total_focus_sessions: summary.recentFocus.length,
      days_logged: last7Days.length,
      target_kcal: summary.targets.target_kcal,
      target_protein_g: summary.targets.target_protein_g,
    };

    return {
      success: true,
      result: `7-Day Summary: Avg ${avgKcal} kcal/day, ${avgProtein}g Protein/day, ${summary.recentWorkouts.length} workouts completed, ${summary.recentFocus.length} focus sessions logged across ${last7Days.length} scored days.`,
      data: weekResult,
    };
  }

  return {
    success: false,
    result: `Unknown tool "${toolName}".`,
  };
}
