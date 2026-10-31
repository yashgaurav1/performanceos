import { stapleEntry, type EntryTotals } from "@/lib/math/nutrition-math";

export interface Staple { id: string; label: string; short: string; totals: EntryTotals }

export const STAPLES: Staple[] = [
  { id: "whey", label: "1 Scoop Whey", short: "24g P", totals: stapleEntry(120, 24, 3, 1.5) },
  { id: "eggs", label: "3 Whole Eggs", short: "18g P", totals: stapleEntry(215, 18, 1.5, 15) },
  { id: "skyr", label: "200g Greek Yogurt/Skyr", short: "20g P", totals: stapleEntry(130, 20, 8, 0.8) },
  { id: "chicken", label: "150g Chicken Breast", short: "46g P", totals: stapleEntry(248, 46, 0, 5.4) },
  { id: "roti", label: "1 Roti", short: "120 kcal", totals: stapleEntry(120, 3.5, 18, 3.7) },
  { id: "dal", label: "1 Katori Dal", short: "9g P", totals: stapleEntry(180, 9, 24, 5) },
  { id: "milk", label: "250ml Milk", short: "8g P", totals: stapleEntry(155, 8, 12, 8) },
  { id: "banana", label: "1 Banana", short: "105 kcal", totals: stapleEntry(105, 1.3, 27, 0.4) },
];

export function defaultMealSlot(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < 10.5) return "breakfast" as const;
  if (h < 15) return "lunch" as const;
  if (h < 18.5) return "snack" as const;
  return "dinner" as const;
}
