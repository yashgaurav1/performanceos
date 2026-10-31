/**
 * Nutrition engine: per-100g recalculation with honest uncertainty bands, prep/oil modifiers,
 * and day aggregation. Designed to run at 60fps while a gram slider is dragged.
 */
import { round } from "./stats";

export type PrepModifier = "home_dry" | "standard" | "canteen_oily";

export interface FoodItem {
  id: string;
  name: string;
  portion_description?: string;
  preparation_note?: string;
  estimated_grams: number;
  grams_low: number;
  grams_high: number;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  is_hidden_oil_or_gravy: boolean;
}

export interface DisambiguationChoice {
  label: string;
  kcal_delta: number;
  protein_delta: number;
}

export interface ItemBreakdown {
  id: string;
  name: string;
  grams: number;
  kcal_point: number;
  kcal_low: number;
  kcal_high: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_hidden_fat: boolean;
}

export interface MealTotals {
  kcal_point: number;
  kcal_low: number;
  kcal_high: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: ItemBreakdown[];
}

export const PREP_OIL_MULTIPLIER: Record<PrepModifier, number> = { home_dry: 0.5, standard: 1, canteen_oily: 1.75 };
export const CANTEEN_SYNTHETIC_OIL = { kcal: 110, fat_g: 12 } as const;

/** Rescale an item to new grams while keeping its relative uncertainty band. */
export function scaleItemGrams(item: FoodItem, newGrams: number): FoodItem {
  const g = Math.max(0, newGrams);
  const base = item.estimated_grams > 0 ? item.estimated_grams : 1;
  const ratio = g / base;
  return {
    ...item,
    estimated_grams: g,
    grams_low: item.estimated_grams > 0 ? item.grams_low * ratio : g * 0.85,
    grams_high: item.estimated_grams > 0 ? item.grams_high * ratio : g * 1.15,
  };
}

export function recalculateMealTotals(
  items: readonly FoodItem[],
  prepModifier: PrepModifier,
  disambiguationChoice: DisambiguationChoice | null,
): MealTotals {
  const oilMul = PREP_OIL_MULTIPLIER[prepModifier];
  let kp = 0, kl = 0, kh = 0, p = 0, c = 0, f = 0;
  const out: ItemBreakdown[] = [];

  for (const item of items) {
    const mul = item.is_hidden_oil_or_gravy ? oilMul : 1;
    const g = item.estimated_grams * mul;
    const lo = Math.min(item.grams_low, item.estimated_grams) * mul;
    const hi = Math.max(item.grams_high, item.estimated_grams) * mul;
    const row: ItemBreakdown = {
      id: item.id,
      name: item.name,
      grams: round(g, 0),
      kcal_point: (g / 100) * item.kcal_per_100g,
      kcal_low: (lo / 100) * item.kcal_per_100g,
      kcal_high: (hi / 100) * item.kcal_per_100g,
      protein_g: (g / 100) * item.protein_per_100g,
      carbs_g: (g / 100) * item.carbs_per_100g,
      fat_g: (g / 100) * item.fat_per_100g,
      is_hidden_fat: item.is_hidden_oil_or_gravy,
    };
    kp += row.kcal_point; kl += row.kcal_low; kh += row.kcal_high;
    p += row.protein_g; c += row.carbs_g; f += row.fat_g;
    out.push(row);
  }

  if (prepModifier === "canteen_oily" && !items.some((i) => i.is_hidden_oil_or_gravy) && items.length > 0) {
    const { kcal, fat_g } = CANTEEN_SYNTHETIC_OIL;
    kp += kcal; kl += kcal; kh += kcal; f += fat_g;
    out.push({
      id: "synthetic-canteen-oil", name: "Hidden cooking oil (canteen estimate)", grams: fat_g,
      kcal_point: kcal, kcal_low: kcal, kcal_high: kcal, protein_g: 0, carbs_g: 0, fat_g, is_hidden_fat: true,
    });
  }

  if (prepModifier === "canteen_oily") kh *= 1.1;

  if (disambiguationChoice) {
    kp += disambiguationChoice.kcal_delta;
    kl += disambiguationChoice.kcal_delta;
    kh += disambiguationChoice.kcal_delta;
    p += disambiguationChoice.protein_delta;
  }

  const point = Math.max(0, Math.round(kp));
  return {
    kcal_point: point,
    kcal_low: Math.min(point, Math.max(0, Math.round(kl))),
    kcal_high: Math.max(point, Math.round(kh)),
    protein_g: round(Math.max(0, p), 1),
    carbs_g: round(Math.max(0, c), 1),
    fat_g: round(Math.max(0, f), 1),
    items: out.map((r) => ({
      ...r,
      kcal_point: Math.round(r.kcal_point), kcal_low: Math.round(r.kcal_low), kcal_high: Math.round(r.kcal_high),
      protein_g: round(r.protein_g, 1), carbs_g: round(r.carbs_g, 1), fat_g: round(r.fat_g, 1),
    })),
  };
}

export interface EntryTotals {
  kcal_point: number;
  kcal_low: number;
  kcal_high: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export function aggregateDayNutrition(entries: readonly EntryTotals[]): EntryTotals {
  const t: EntryTotals = { kcal_point: 0, kcal_low: 0, kcal_high: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  for (const e of entries) {
    t.kcal_point += e.kcal_point; t.kcal_low += e.kcal_low; t.kcal_high += e.kcal_high;
    t.protein_g += e.protein_g; t.carbs_g += e.carbs_g; t.fat_g += e.fat_g; t.fiber_g += e.fiber_g;
  }
  return { ...t, protein_g: round(t.protein_g, 1), carbs_g: round(t.carbs_g, 1), fat_g: round(t.fat_g, 1), fiber_g: round(t.fiber_g, 1) };
}

/** Symmetric ± display value: half the low→high width, e.g. "640 kcal ± 85". */
export function plusMinus(low: number, high: number): number {
  return Math.round((high - low) / 2);
}

/** Quick-add staple from per-serving macros with a tight ±5% band (label/known food). */
export function stapleEntry(kcal: number, protein: number, carbs: number, fat: number): EntryTotals {
  return {
    kcal_point: Math.round(kcal), kcal_low: Math.round(kcal * 0.95), kcal_high: Math.round(kcal * 1.05),
    protein_g: protein, carbs_g: carbs, fat_g: fat, fiber_g: 0,
  };
}
