"use client";
import { FOOD_CATALOG } from "@/data/food-catalog";
import { parseFoodText, totalsForItems } from "@/lib/math/food-parse";
import { parseExpenseInput } from "@/lib/math/budget-math";
import { formatDueTime } from "@/lib/math/assistant-intents";
import type { RunnableAction } from "@/lib/ai/assistant-actions";
import {
  addExpense,
  addFoodEntry,
  addTask,
  addWin,
  deleteExpense,
  deleteFoodEntry,
  deleteTask,
  getProfile,
  patchDailyLog,
  updateProfile,
} from "@/lib/db/repo";
import { getDB } from "@/lib/db/dexie";
import { fmtMoney } from "@/lib/format";
import { logFoodItems } from "@/components/eat/log-food";
import { defaultMealSlot } from "@/components/eat/staples";
import type { WinTag } from "@/types/database.types";

export interface ActionContext {
  today: string;
  startTimer: (minutes: number, subject?: string) => void;
  stopTimer: () => Promise<unknown>;
}

export interface ActionResult {
  ok: boolean;
  /** One line shown in the assistant transcript. */
  message: string;
  /** Where to see the result. */
  href?: string;
  undo?: () => Promise<unknown> | unknown;
}

const WIN_TAG: Record<string, WinTag> = { study: "study", physique: "gym", career: "career", life: "life" };

/** Runs one assistant action against local data (Dexie → Firestore sync). */
export async function runAssistantAction(a: RunnableAction, ctx: ActionContext): Promise<ActionResult> {
  switch (a.type) {
    case "start_timer": {
      ctx.startTimer(a.minutes, a.subject);
      return { ok: true, message: `Focus timer started · ${a.minutes} min${a.subject ? ` · ${a.subject}` : ""}`, href: "/study", undo: ctx.stopTimer };
    }
    case "stop_timer": {
      await ctx.stopTimer();
      return { ok: true, message: "Timer stopped. Focus time saved.", href: "/study" };
    }
    case "add_task": {
      const title = a.due_time ? `${a.title} · by ${formatDueTime(a.due_time)}` : a.title;
      const r = await addTask({ title, domain: a.domain, is_big_three: a.big_three, scheduled_date: a.date });
      const when = a.date === ctx.today ? "today" : new Date(`${a.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
      return {
        ok: true,
        message: r.ok
          ? `Added to your to-do list for ${when}: “${title}”${a.big_three ? " · Big 3" : ""}`
          : `Added for ${when}: “${title}”. Your Big 3 is full, so it’s in the list (not pinned).`,
        href: "/goals",
        undo: () => deleteTask(r.task.id),
      };
    }
    case "log_expense": {
      const parsed = parseExpenseInput([String(a.amount), a.note ?? "", a.merchant ? `@${a.merchant.replace(/\s+/g, "")}` : ""].join(" ").trim());
      if (!parsed) return { ok: false, message: "I couldn’t read that amount." };
      const rec = await addExpense({
        spent_on: ctx.today,
        amount_minor: parsed.amount_minor,
        category: parsed.category,
        merchant: a.merchant ?? parsed.merchant,
        note: a.note ?? (parsed.note || null),
      });
      const profile = await getProfile();
      return {
        ok: true,
        message: `Logged ${fmtMoney(parsed.amount_minor, profile.currency_code)}${a.note ? ` · ${a.note}` : ""}${a.merchant ? ` @ ${a.merchant}` : ""}`,
        href: "/money",
        undo: () => deleteExpense(rec.id),
      };
    }
    case "log_weight": {
      const prev = (await getDB().dailyLogs.where("log_date").equals(ctx.today).first())?.body_weight_kg ?? null;
      await patchDailyLog(ctx.today, { body_weight_kg: Math.round(a.kg * 100) / 100 });
      return { ok: true, message: `Weight logged · ${a.kg.toFixed(1)} kg`, href: "/today", undo: () => patchDailyLog(ctx.today, { body_weight_kg: prev }) };
    }
    case "log_food": {
      const parse = parseFoodText(a.text, FOOD_CATALOG);
      if (!parse.items.length) {
        return { ok: false, message: `I couldn’t recognise “${a.text}”. Try “2 roti, 1 katori dal” or use Eat → Search.`, href: "/eat" };
      }
      const entry = await logFoodItems(parse.items, ctx.today, a.meal_slot ?? defaultMealSlot(), { toast: false });
      const t = totalsForItems(parse.items);
      const skipped = parse.unmatched.length ? ` (skipped: ${parse.unmatched.join(", ")})` : "";
      return {
        ok: true,
        message: `Logged ${t.kcal_point} kcal ± ${t.kcal_high - t.kcal_point} · ${t.protein_g} g protein${skipped}`,
        href: "/eat",
        undo: entry ? () => deleteFoodEntry(entry.id) : undefined,
      };
    }
    case "log_meal": {
      const k = Math.round(a.kcal);
      const entry = await addFoodEntry({
        log_date: ctx.today,
        meal_slot: a.meal_slot ?? defaultMealSlot(),
        meal_title: a.meal_title,
        source_type: "quick_manual",
        photo_path: null,
        prep_modifier: "standard",
        confidence_tier: "medium",
        kcal_point: k,
        kcal_low: Math.round(k * 0.85),
        kcal_high: Math.round(k * 1.15),
        protein_g: a.protein_g ?? 0,
        carbs_g: a.carbs_g ?? 0,
        fat_g: a.fat_g ?? 0,
        fiber_g: 0,
        items_breakdown: [],
      });
      return { ok: true, message: `Logged ${a.meal_title} · ${k} kcal ± ${Math.round(k * 0.15)}`, href: "/eat", undo: () => deleteFoodEntry(entry.id) };
    }
    case "add_win": {
      const domain = /study|exam|pomodoro|chapter/i.test(a.text) ? "study" : /gym|workout|run|lift/i.test(a.text) ? "physique" : "life";
      await addWin(ctx.today, a.text, WIN_TAG[domain] ?? "life");
      return { ok: true, message: `Win saved: “${a.text}”`, href: "/today" };
    }
    case "update_targets": {
      const { type: _t, ...patch } = a;
      const before = await getProfile();
      await updateProfile(patch);
      const parts = Object.entries(patch).map(([k, v]) => `${k.replace(/^target_|_g$|_hours$/g, "").replace(/_/g, " ")} ${v}`);
      return {
        ok: true,
        message: `Targets updated · ${parts.join(", ")}`,
        href: "/settings",
        undo: () => updateProfile(Object.fromEntries(Object.keys(patch).map((k) => [k, before[k as keyof typeof before]]))),
      };
    }
  }
}
