"use client";
import { toast } from "@/components/ui/toast";
import { addFoodEntry, deleteFoodEntry } from "@/lib/db/repo";
import { totalsForItems, type ParsedFoodItem } from "@/lib/math/food-parse";
import type { FoodItemBreakdown, MealSlot } from "@/types/database.types";

export const MEAL_SLOTS: { value: Exclude<MealSlot, "post_workout">; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "snack", label: "Snack" },
  { value: "dinner", label: "Dinner" },
];

function titleFor(items: ParsedFoodItem[]): string {
  if (items.length === 1) return items[0]!.food.name;
  const names = items.map((i) => i.food.name);
  const joined = names.join(" + ");
  return joined.length <= 60 ? joined : `${names.slice(0, 2).join(" + ")} + ${names.length - 2} more`;
}

/** Saves parsed foods as one meal entry (with per-item breakdown) and offers Undo. */
export async function logFoodItems(items: ParsedFoodItem[], date: string, slot: MealSlot) {
  if (!items.length) return null;
  const totals = totalsForItems(items);
  const breakdown: FoodItemBreakdown[] = items.map((i) => {
    const band = i.food.confidence === "high" ? 0.1 : 0.2;
    return {
      id: crypto.randomUUID(),
      name: `${i.food.name} (${i.amount})`,
      grams: i.grams,
      kcal_point: i.macros.kcal,
      kcal_low: Math.round(i.macros.kcal * (1 - band)),
      kcal_high: Math.round(i.macros.kcal * (1 + band)),
      protein_g: i.macros.protein,
      carbs_g: i.macros.carbs,
      fat_g: i.macros.fat,
      is_hidden_fat: false,
    };
  });
  const entry = await addFoodEntry({
    log_date: date,
    meal_slot: slot,
    meal_title: titleFor(items),
    source_type: "quick_manual",
    photo_path: null,
    prep_modifier: "standard",
    items_breakdown: breakdown,
    ...totals,
  });
  toast(`${totals.kcal_point} kcal logged`, {
    tone: "emerald",
    body: `${titleFor(items)} · ${totals.protein_g} g protein`,
    action: { label: "Undo", onClick: () => deleteFoodEntry(entry.id) },
  });
  return entry;
}
