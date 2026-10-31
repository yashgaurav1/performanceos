import { describe, expect, it } from "vitest";
import { aggregateDayNutrition, plusMinus, recalculateMealTotals, scaleItemGrams, type FoodItem } from "./nutrition-math";

const rice: FoodItem = {
  id: "rice", name: "Steamed rice", estimated_grams: 200, grams_low: 160, grams_high: 260,
  kcal_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3, is_hidden_oil_or_gravy: false,
};
const oil: FoodItem = {
  id: "oil", name: "Ghee / oil", estimated_grams: 10, grams_low: 5, grams_high: 20,
  kcal_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, is_hidden_oil_or_gravy: true,
};

describe("recalculateMealTotals", () => {
  it("computes point/low/high from per-100g anchors", () => {
    const r = recalculateMealTotals([rice], "standard", null);
    expect(r.kcal_point).toBe(260);
    expect(r.kcal_low).toBe(208);
    expect(r.kcal_high).toBe(338);
    expect(r.protein_g).toBe(5.4);
  });
  it("halves hidden oil for home_dry", () => {
    const r = recalculateMealTotals([rice, oil], "home_dry", null);
    expect(r.kcal_point).toBe(260 + 44);
    expect(r.fat_g).toBeCloseTo(0.6 + 5, 1);
  });
  it("adds 75% oil and widens high by 10% for canteen_oily", () => {
    const r = recalculateMealTotals([rice, oil], "canteen_oily", null);
    expect(r.kcal_point).toBe(Math.round(260 + 88.4 * 1.75));
    expect(r.kcal_high).toBe(Math.round((338 + 176.8 * 1.75) * 1.1));
  });
  it("adds a synthetic +110 kcal / +12g fat when no oil item exists", () => {
    const r = recalculateMealTotals([rice], "canteen_oily", null);
    expect(r.kcal_point).toBe(370);
    expect(r.fat_g).toBeCloseTo(12.6, 1);
    expect(r.items).toHaveLength(2);
  });
  it("applies disambiguation deltas", () => {
    const r = recalculateMealTotals([rice], "standard", { label: "Paneer", kcal_delta: 120, protein_delta: 6 });
    expect(r.kcal_point).toBe(380);
    expect(r.protein_g).toBeCloseTo(11.4, 1);
  });
  it("keeps low <= point <= high", () => {
    const r = recalculateMealTotals([{ ...rice, grams_low: 300, grams_high: 100 }], "standard", null);
    expect(r.kcal_low).toBeLessThanOrEqual(r.kcal_point);
    expect(r.kcal_high).toBeGreaterThanOrEqual(r.kcal_point);
  });
});

describe("helpers", () => {
  it("scales grams while preserving the relative band", () => {
    const s = scaleItemGrams(rice, 300);
    expect(s.grams_low).toBe(240);
    expect(s.grams_high).toBe(390);
  });
  it("aggregates and formats ±", () => {
    const t = aggregateDayNutrition([
      { kcal_point: 500, kcal_low: 450, kcal_high: 600, protein_g: 30, carbs_g: 50, fat_g: 10, fiber_g: 2 },
      { kcal_point: 140, kcal_low: 130, kcal_high: 150, protein_g: 24, carbs_g: 3, fat_g: 2, fiber_g: 0 },
    ]);
    expect(t.kcal_point).toBe(640);
    expect(plusMinus(t.kcal_low, t.kcal_high)).toBe(85);
  });
});
