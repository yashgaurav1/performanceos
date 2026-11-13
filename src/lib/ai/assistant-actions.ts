import { z } from "zod";
import type { AssistantAction } from "@/lib/math/assistant-intents";

/**
 * Actions the AI coach may ask the app to perform. The server never writes user
 * data: it streams `{ type: "action", name, args }` and the browser validates the
 * args here, then runs them through the same executor as typed commands.
 */

const MealSlot = z.enum(["breakfast", "lunch", "dinner", "snack"]);
const Domain = z.enum(["study", "physique", "career", "life"]);
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const ACTION_SCHEMAS = {
  start_timer: z.object({ minutes: z.number().min(1).max(240), subject: z.string().max(60).optional() }),
  stop_timer: z.object({}).passthrough(),
  add_task: z.object({
    title: z.string().min(1).max(160),
    date: IsoDate.optional(),
    due_time: HHMM.optional(),
    domain: Domain.optional(),
    big_three: z.boolean().optional(),
  }),
  log_food: z.object({ text: z.string().min(1).max(300), meal_slot: MealSlot.optional() }),
  log_meal: z.object({
    meal_title: z.string().min(1).max(120),
    kcal: z.number().min(0).max(5000),
    protein_g: z.number().min(0).max(400).optional(),
    carbs_g: z.number().min(0).max(800).optional(),
    fat_g: z.number().min(0).max(400).optional(),
    meal_slot: MealSlot.optional(),
  }),
  log_expense: z.object({ amount: z.number().positive().max(10_000_000), note: z.string().max(80).optional(), merchant: z.string().max(60).optional() }),
  log_weight: z.object({ kg: z.number().min(25).max(300) }),
  add_win: z.object({ text: z.string().min(1).max(200) }),
  update_targets: z.object({
    target_kcal: z.number().min(800).max(6000).optional(),
    target_protein_g: z.number().min(0).max(400).optional(),
    target_carbs_g: z.number().min(0).max(800).optional(),
    target_fat_g: z.number().min(0).max(300).optional(),
    target_sleep_hours: z.number().min(3).max(12).optional(),
    target_study_hours: z.number().min(0).max(16).optional(),
    body_weight_kg: z.number().min(25).max(300).optional(),
  }),
} as const;

export type AiActionName = keyof typeof ACTION_SCHEMAS;

/** Everything the executor can run: typed commands plus AI-only actions. */
export type RunnableAction =
  | AssistantAction
  | ({ type: "log_meal" } & z.infer<(typeof ACTION_SCHEMAS)["log_meal"]>)
  | ({ type: "update_targets" } & z.infer<(typeof ACTION_SCHEMAS)["update_targets"]>);

/** Validates an AI tool call. Returns null for unknown tools or bad arguments. */
export function toRunnableAction(name: string, args: unknown, today: string): RunnableAction | null {
  if (!(name in ACTION_SCHEMAS)) return null;
  const parsed = ACTION_SCHEMAS[name as AiActionName].safeParse(args ?? {});
  if (!parsed.success) return null;
  const a = parsed.data as Record<string, unknown>;
  switch (name as AiActionName) {
    case "add_task":
      return {
        type: "add_task",
        title: String(a.title),
        date: (a.date as string | undefined) ?? today,
        ...(a.due_time ? { due_time: a.due_time as string } : {}),
        domain: (a.domain as "study" | "physique" | "career" | "life" | undefined) ?? "life",
        big_three: Boolean(a.big_three),
      };
    case "stop_timer":
      return { type: "stop_timer" };
    default:
      return { type: name, ...a } as RunnableAction;
  }
}
