/**
 * Deterministic 6-week demo dataset (student who lifts, Indian campus context).
 * Pure: no IndexedDB, no Date.now · used by Settings → "Load demo data" and by tests.
 */
import { computeDayScore } from "@/lib/math/day-score";
import { addDays, dateRange, dayOfWeek } from "@/lib/math/dates";
import { calculateEst1RM } from "@/lib/math/gym-math";
import { EXERCISE_MAP } from "@/lib/exercises";
import type { ExpenseCategory } from "@/lib/math/budget-math";
import type { StudyMode } from "@/lib/math/study-math";
import type { DailyLog, Expense, FoodEntry, GoalTask, Profile, StudySession, Workout, WorkoutSet } from "@/types/database.types";

const U = "00000000-0000-0000-0000-000000000000";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DemoData {
  profile: Profile;
  dailyLogs: DailyLog[];
  food: FoodEntry[];
  workouts: Workout[];
  sets: WorkoutSet[];
  tasks: GoalTask[];
  sessions: StudySession[];
  expenses: Expense[];
}

const SPLITS: Record<number, { name: string; lifts: [string, number, number][] } | null> = {
  // dow → split; lift = [slug, start kg, weekly gain kg]
  1: { name: "Push", lifts: [["barbell-bench-press", 72.5, 1.25], ["incline-db-press", 26, 0], ["db-lateral-raise", 10, 0.25], ["cable-triceps-pushdown", 30, 1]] },
  2: { name: "Pull", lifts: [["barbell-row", 70, 1.25], ["lat-pulldown", 60, 1.25], ["reverse-pec-deck", 35, 0.5], ["ez-bar-curl", 30, 0.5]] },
  3: { name: "Legs", lifts: [["barbell-squat", 95, 2.5], ["romanian-deadlift", 90, 2.5], ["leg-extension", 50, 1], ["standing-calf-raise", 80, 2]] },
  4: { name: "Push", lifts: [["overhead-press", 45, 0.5], ["incline-db-press", 26, 0], ["cable-fly", 15, 0.5], ["db-lateral-raise", 10, 0.25]] },
  5: { name: "Pull", lifts: [["weighted-pull-up", 10, 1.25], ["seated-cable-row", 65, 1.25], ["incline-db-curl", 12, 0.25]] },
  6: { name: "Legs", lifts: [["hack-squat", 100, 5], ["seated-leg-curl", 45, 1], ["hip-thrust", 110, 5]] },
  0: null,
};

export function generateDemoData(today: string, seed = 42): DemoData {
  const r = rng(seed);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]!;
  const id = () => {
    const h = () => Math.floor(r() * 0x10000).toString(16).padStart(4, "0");
    return `${h()}${h()}-${h()}-4${h().slice(1)}-a${h().slice(1)}-${h()}${h()}${h()}`;
  };
  const start = addDays(today, -41);
  const days = dateRange(start, today);
  const profile: Profile = {
    id: "me", display_name: "Demo", body_weight_kg: 74.5, target_kcal: 2500, target_protein_g: 140, target_carbs_g: 290, target_fat_g: 75,
    target_sleep_hours: 7.5, target_study_hours: 4, exam_crunch_mode: false, pomodoro_focus_mins: 50, pomodoro_short_break_mins: 10,
    pomodoro_long_break_mins: 25, pomodoro_cycles_before_long: 4, currency_code: "INR", monthly_budget_minor: 15000_00, rest_days: [0],
    created_at: `${start}T08:00:00.000Z`, updated_at: `${start}T08:00:00.000Z`,
  };
  const out: DemoData = { profile, dailyLogs: [], food: [], workouts: [], sets: [], tasks: [], sessions: [], expenses: [] };

  /* Goals */
  const goalMock: GoalTask = { id: id(), user_id: U, kind: "quarterly_goal", parent_goal_id: null, domain: "study", title: "Complete CAT mock series", status: "in_progress", is_big_three: false, scheduled_date: null, due_date: addDays(today, 60), target_metric_num: 20, current_metric_num: 7, start_metric_num: 0, metric_unit: "mocks", completed_at: null, created_at: `${addDays(today, -30)}T08:00:00.000Z` };
  const goalBulk: GoalTask = { ...goalMock, id: id(), domain: "physique", title: "Lean bulk to 77 kg", target_metric_num: 77, current_metric_num: 74.6, start_metric_num: 74, metric_unit: "kg", due_date: addDays(today, 75) };
  const goalCase: GoalTask = { ...goalMock, id: id(), domain: "career", title: "Consulting case decks", target_metric_num: 15, current_metric_num: 4, start_metric_num: 0, metric_unit: "decks", due_date: addDays(today, 45) };
  out.tasks.push(goalMock, goalBulk, goalCase);

  const SUBJECTS = ["Quant", "DILR", "Verbal", "Maths", "Physics"] as const;
  const MERCHANTS: [ExpenseCategory, string, string, number, number][] = [
    ["food", "canteen", "chai + samosa", 40, 90], ["food", "swiggy", "dinner", 220, 450], ["food", "mess", "extra paneer", 60, 120],
    ["groceries", "zepto", "fruits + curd", 180, 420], ["transport", "auto", "auto to campus", 50, 120], ["transport", "uber", "cab to city", 180, 380],
    ["education", "xerox", "notes printout", 30, 120], ["fitness", "amazon", "whey refill", 2400, 2900], ["entertainment", "pvr", "movie", 250, 420],
    ["social", "cafe", "friend's birthday", 300, 700], ["shopping", "myntra", "t-shirt", 450, 900], ["utilities", "airtel", "recharge", 299, 299],
  ];

  let weight = 74.0;
  days.forEach((d, i) => {
    const dow = dayOfWeek(d);
    const isToday = d === today;
    const examWeek = i >= 21 && i <= 25;
    const sleep = isToday ? 6.5 : Math.round((examWeek ? 5.6 + r() * 1.2 : 6.4 + r() * 2) * 2) / 2;
    weight += 0.02 + (r() - 0.5) * 0.35;

    /* Study sessions */
    const blocks = isToday ? 2 : examWeek ? 5 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3);
    for (let b = 0; b < blocks; b++) {
      const mode: StudyMode = pick(["lecture", "active_recall", "problem_solving", "revision", "active_recall", "reading"] as const);
      const mins = pick([25, 50, 50, 50, 90]);
      const startH = 8 + b * 2;
      out.sessions.push({
        id: id(), user_id: U, log_date: d, subject: pick(SUBJECTS), mode, source: "pomodoro",
        started_at: `${d}T${String(startH).padStart(2, "0")}:00:00`, ended_at: `${d}T${String(startH).padStart(2, "0")}:${String(Math.min(59, mins)).padStart(2, "0")}:00`,
        focus_mins: mins, pomodoros: mins >= 50 ? 1 : 0, interruptions: Math.floor(r() * 2), focus_rating: r() > 0.4 ? 3 + Math.floor(r() * 3) : null, note: null,
        client_updated_at: `${d}T20:00:00.000Z`,
      });
    }
    const daySess = out.sessions.filter((s) => s.log_date === d);
    const studyMins = daySess.reduce((t, s) => t + s.focus_mins, 0);
    const recall = daySess.filter((s) => s.mode === "active_recall" || s.mode === "problem_solving").reduce((t, s) => t + s.focus_mins, 0);

    /* Food */
    const meals: [FoodEntry["meal_slot"], string, number, number, number, number, FoodEntry["source_type"]][] = [
      ["breakfast", "Poha + 2 eggs", 520, 22, 62, 18, "ai_photo"],
      ["lunch", "Mess thali · dal, rice, 2 roti, paneer", 820, 28, 110, 30, "ai_photo"],
      ["post_workout", "1 Scoop Whey", 120, 24, 3, 1.5, "saved_template"],
      ["dinner", pick(["Chicken biryani", "Rajma chawal", "Egg curry + 3 roti"]), 760, 34, 95, 26, "ai_photo"],
      ["snack", "200g Greek Yogurt/Skyr", 130, 20, 8, 0.8, "saved_template"],
    ];
    const mealCount = isToday ? 2 : 4 + (r() > 0.5 ? 1 : 0);
    meals.slice(0, mealCount).forEach(([slot, title, k, p, c, f, src]) => {
      const scale = 0.85 + r() * 0.35;
      const kp = Math.round(k * scale);
      const band = src === "ai_photo" ? 0.14 : 0.05;
      out.food.push({
        id: id(), user_id: U, log_date: d, logged_at: `${d}T12:00:00.000Z`, meal_slot: slot, meal_title: title, source_type: src, photo_path: null,
        prep_modifier: slot === "lunch" ? "canteen_oily" : "standard", confidence_tier: src === "ai_photo" ? "medium" : "high",
        kcal_point: kp, kcal_low: Math.round(kp * (1 - band)), kcal_high: Math.round(kp * (1 + band * 1.2)),
        protein_g: Math.round(p * scale * 10) / 10, carbs_g: Math.round(c * scale), fat_g: Math.round(f * scale), fiber_g: 0, items_breakdown: [],
      });
    });

    /* Training */
    const split = SPLITS[dow];
    let workingSets = 0;
    if (split && !isToday && !(examWeek && r() > 0.5)) {
      const week = Math.floor(i / 7);
      const w: Workout = {
        id: id(), user_id: U, log_date: d, split_name: split.name, started_at: `${d}T17:30:00.000Z`, ended_at: `${d}T18:40:00.000Z`,
        session_rpe: sleep < 6.5 ? 9 : 7.5 + Math.round(r() * 2) / 2, notes: null, total_volume_kg: 0, pr_count: 0, client_updated_at: `${d}T18:40:00.000Z`,
      };
      let vol = 0;
      for (const [slug, base, gain] of split.lifts) {
        const stalledLift = slug === "incline-db-press";
        const kg = Math.round((base + gain * Math.floor(week / 2) * 2) * 4) / 4;
        for (let n = 1; n <= 3; n++) {
          const meta = EXERCISE_MAP.get(slug)!;
          // Double progression inside the rep range: reps climb across the 2-week load cycle.
          const reps = stalledLift ? (n === 1 ? 8 : 7) : Math.min(meta.rep_range_max, meta.rep_range_min + (week % 2) * 2 + Math.floor(r() * 2) + (n === 1 ? 1 : 0));
          const rir = stalledLift ? 0 : 1 + Math.floor(r() * 2);
          out.sets.push({
            id: id(), workout_id: w.id, user_id: U, exercise_slug: slug, set_number: n, set_type: "working", weight_kg: kg, reps, rir,
            est_1rm: calculateEst1RM(kg, reps, rir), is_1rm_pr: false, is_volume_pr: false, completed_at: `${d}T17:${String(30 + n * 3).padStart(2, "0")}:00.000Z`,
          });
          vol += kg * reps;
          workingSets++;
        }
      }
      w.total_volume_kg = Math.round(vol);
      out.workouts.push(w);
    }

    /* Tasks: Big-3 */
    const titles = [["Mock test analysis #study", "study"], ["30 quant PYQs", "study"], ["Case deck: market sizing", "career"], ["Meal prep chicken", "physique"], ["Revise DILR sets", "study"]] as const;
    for (let t = 0; t < 3; t++) {
      const [title, domain] = pick(titles);
      const done = isToday ? t === 0 : r() > 0.3;
      out.tasks.push({
        id: id(), user_id: U, kind: "daily_task", parent_goal_id: domain === "study" ? goalMock.id : domain === "career" ? goalCase.id : null, domain,
        title: title.replace(" #study", ""), status: done ? "done" : isToday || (i === days.length - 2 && t === 2) ? "todo" : "dropped",
        is_big_three: true, scheduled_date: d, due_date: null, target_metric_num: null, current_metric_num: null, start_metric_num: null, metric_unit: null,
        completed_at: done ? `${d}T19:00:00.000Z` : null, created_at: `${d}T07:00:00.000Z`,
      });
    }

    /* Expenses */
    if (d.endsWith("-01")) {
      out.expenses.push({ id: id(), user_id: U, spent_on: d, amount_minor: 6500_00, currency_code: "INR", category: "rent", merchant: "pg", note: "PG rent", payment_method: "bank", is_recurring: true, client_updated_at: `${d}T09:00:00.000Z` });
    }
    const n = isToday ? 1 : 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const [category, merchant, note, lo, hi] = r() > 0.9 ? pick(MERCHANTS) : pick(MERCHANTS.slice(0, 7));
      out.expenses.push({
        id: id(), user_id: U, spent_on: d, amount_minor: Math.round(lo + r() * (hi - lo)) * 100, currency_code: "INR", category, merchant, note,
        payment_method: pick(["upi", "upi", "upi", "card", "cash"] as const), is_recurring: false, client_updated_at: `${d}T${String(10 + k * 3).padStart(2, "0")}:00:00.000Z`,
      });
    }

    /* Daily log + score */
    const dayFood = out.food.filter((f) => f.log_date === d);
    const big = out.tasks.filter((t) => t.kind === "daily_task" && t.scheduled_date === d && t.status !== "dropped");
    const wins = r() > 0.3 ? [{ id: id(), text: pick(["Finished mock in time", "Hit protein target", "No phone in study block", "New bench PR", "3 pomodoros before lunch"]), tag: pick(["study", "gym", "life"] as const) }] : [];
    const partial = {
      sleep_hours: sleep, sleep_quality: sleep >= 7 ? 4 : 3, mood_score: 3 + Math.floor(r() * 2), energy_score: sleep < 6.5 ? 2 : 4,
      body_weight_kg: r() > 0.2 ? Math.round(weight * 10) / 10 : null,
    };
    const score = computeDayScore({
      ...partial, target_sleep_hours: profile.target_sleep_hours, protein_g: dayFood.reduce((t, f) => t + f.protein_g, 0), target_protein_g: profile.target_protein_g,
      kcal_point: dayFood.reduce((t, f) => t + f.kcal_point, 0), target_kcal: profile.target_kcal, study_hours: studyMins / 60,
      target_study_hours: profile.target_study_hours, active_recall_mins: recall, working_sets_today: workingSets, is_rest_day: profile.rest_days.includes(dow),
      big_three_completed: big.filter((t) => t.status === "done").length, big_three_total: big.length, wins_count: wins.length, exam_crunch_mode: false,
    });
    out.dailyLogs.push({
      id: id(), user_id: U, log_date: d, ...partial, study_hours: Math.round((studyMins / 60) * 100) / 100, active_recall_mins: recall,
      wins_list: wins, friction_note: examWeek ? "Late-night revision wrecked sleep" : r() > 0.7 ? "Phone during study block" : null,
      day_score: score.score, score_breakdown: score.breakdown, client_updated_at: `${d}T22:00:00.000Z`,
    });
  });
  return out;
}
