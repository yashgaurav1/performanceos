import { FOODS_DATABASE, RAW_INGREDIENTS } from "./foods";
import type { CatalogFood, Per100g } from "@/lib/math/food-parse";

/**
 * Searchable foods for manual and text logging.
 *
 * - Dishes reuse the verified recipes in foods.ts (confidence "high").
 * - Raw ingredients reuse RAW_INGREDIENTS (confidence "high").
 * - A few common foods use standard published averages (confidence "medium"),
 *   which widens their kcal range so we never imply false precision.
 *
 * The first serving is the default. `piece` is grams per countable unit
 * ("2 roti" = 2 × 35 g).
 */

function dish(slug: string): Per100g {
  const f = FOODS_DATABASE[slug];
  if (!f) throw new Error(`Unknown dish ${slug}`);
  return { kcal: f.per100g.calories, protein: f.per100g.protein, carbs: f.per100g.carbs, fat: f.per100g.fat };
}

function raw(key: string): Per100g {
  const r = RAW_INGREDIENTS[key];
  if (!r) throw new Error(`Unknown ingredient ${key}`);
  return { kcal: r.caloriesPer100g, protein: r.proteinPer100g, carbs: r.carbsPer100g, fat: r.fatPer100g };
}

const per = (kcal: number, protein: number, carbs: number, fat: number): Per100g => ({ kcal, protein, carbs, fat });

export const FOOD_CATALOG: CatalogFood[] = [
  // Verified dishes
  { id: "roti", name: "Phulka roti", aliases: ["roti", "chapati", "chapathi", "phulka", "fulka"], per100g: dish("roti"), piece: 35, servings: [{ label: "1 roti", grams: 35 }, { label: "2 roti", grams: 70 }, { label: "3 roti", grams: 105 }], confidence: "high" },
  { id: "dal-tadka", name: "Dal tadka", aliases: ["dal", "daal", "dhal", "toor dal", "yellow dal"], per100g: dish("dal-tadka"), servings: [{ label: "1 katori", grams: 150 }, { label: "Small katori", grams: 100 }, { label: "Large bowl", grams: 250 }], confidence: "high" },
  { id: "paneer-bhurji", name: "Paneer bhurji", aliases: ["bhurji", "paneer scramble"], per100g: dish("paneer-bhurji"), servings: [{ label: "1 katori", grams: 150 }, { label: "Small portion", grams: 100 }, { label: "Full plate", grams: 180 }], confidence: "high" },
  { id: "chicken-biryani", name: "Chicken biryani", aliases: ["biryani", "biriyani", "dum biryani"], per100g: dish("chicken-biryani"), servings: [{ label: "1 plate", grams: 320 }, { label: "Half plate", grams: 200 }, { label: "Restaurant portion", grams: 400 }], confidence: "high" },
  { id: "masala-dosa", name: "Masala dosa", aliases: ["dosa", "dosai"], per100g: dish("masala-dosa"), piece: 180, servings: [{ label: "1 dosa", grams: 180 }, { label: "Small home dosa", grams: 120 }, { label: "Paper roast", grams: 240 }], confidence: "high" },
  { id: "poha", name: "Kanda poha", aliases: ["poha", "pohe", "aval"], per100g: dish("poha"), servings: [{ label: "1 bowl", grams: 150 }, { label: "Small bowl", grams: 100 }, { label: "Large plate", grams: 220 }], confidence: "high" },
  { id: "idli", name: "Idli", aliases: ["idly", "idlis"], per100g: dish("idli"), piece: 45, servings: [{ label: "2 idli", grams: 90 }, { label: "1 idli", grams: 45 }, { label: "4 idli", grams: 180 }], confidence: "high" },
  { id: "boiled-egg", name: "Boiled egg", aliases: ["egg", "eggs", "anda", "ande", "whole egg"], per100g: dish("boiled-eggs"), piece: 50, servings: [{ label: "1 egg", grams: 50 }, { label: "2 eggs", grams: 100 }, { label: "3 eggs", grams: 150 }], confidence: "high" },
  { id: "oats-banana", name: "Oats with banana & milk", aliases: ["oatmeal", "oats bowl", "porridge"], per100g: dish("oats-banana"), servings: [{ label: "1 bowl", grams: 250 }, { label: "Large bowl", grams: 350 }], confidence: "high" },
  { id: "curd-rice", name: "Curd rice", aliases: ["dahi chawal", "thayir sadam"], per100g: dish("curd-rice"), servings: [{ label: "1 katori", grams: 150 }, { label: "1 bowl", grams: 250 }], confidence: "high" },

  // Raw ingredients
  { id: "paneer", name: "Paneer", aliases: ["cottage cheese", "fresh paneer"], per100g: raw("paneer"), servings: [{ label: "100 g", grams: 100 }, { label: "50 g", grams: 50 }, { label: "200 g", grams: 200 }], confidence: "high" },
  { id: "whey", name: "Whey protein", aliases: ["whey", "protein shake", "protein powder", "isolate"], per100g: raw("wheyIsolate"), servings: [{ label: "1 scoop", grams: 30 }, { label: "2 scoops", grams: 60 }], confidence: "high" },
  { id: "oats", name: "Rolled oats (dry)", aliases: ["oats", "rolled oats"], per100g: raw("rolledOats"), servings: [{ label: "1 serving", grams: 40 }, { label: "Large serving", grams: 60 }], confidence: "high" },
  { id: "banana", name: "Banana", aliases: ["kela", "bananas"], per100g: raw("banana"), piece: 118, servings: [{ label: "1 medium", grams: 118 }, { label: "1 small", grams: 90 }, { label: "1 large", grams: 140 }], confidence: "high" },
  { id: "curd", name: "Curd (dahi)", aliases: ["dahi", "yogurt", "yoghurt", "curd"], per100g: raw("curd"), servings: [{ label: "1 katori", grams: 150 }, { label: "1 bowl", grams: 250 }], confidence: "high" },
  { id: "milk", name: "Milk (toned)", aliases: ["milk", "doodh", "dudh"], per100g: raw("cowMilk"), servings: [{ label: "1 glass", grams: 250 }, { label: "1 cup", grams: 200 }], confidence: "high" },
  { id: "almonds", name: "Almonds", aliases: ["badam", "almond"], per100g: raw("almonds"), piece: 1.2, servings: [{ label: "10 almonds", grams: 12 }, { label: "1 handful", grams: 25 }], confidence: "high" },
  { id: "peanuts", name: "Peanuts", aliases: ["moongphali", "groundnuts", "peanut"], per100g: raw("peanuts"), servings: [{ label: "1 handful", grams: 30 }, { label: "Small bowl", grams: 50 }], confidence: "high" },
  { id: "ghee", name: "Ghee", aliases: ["desi ghee"], per100g: raw("ghee"), servings: [{ label: "1 tsp", grams: 5 }, { label: "1 tbsp", grams: 14 }], confidence: "high" },
  { id: "oil", name: "Cooking oil", aliases: ["oil", "vegetable oil", "refined oil"], per100g: raw("vegetableOil"), servings: [{ label: "1 tsp", grams: 5 }, { label: "1 tbsp", grams: 14 }], confidence: "high" },
  { id: "sprouts", name: "Moong sprouts", aliases: ["sprouts", "sprouted moong", "moong"], per100g: raw("sproutedMoong"), servings: [{ label: "1 katori", grams: 100 }, { label: "1 bowl", grams: 200 }], confidence: "high" },
  { id: "potato", name: "Boiled potato", aliases: ["aloo boiled", "potato"], per100g: raw("potato"), piece: 150, servings: [{ label: "1 medium", grams: 150 }], confidence: "high" },

  // Common foods: standard published averages, wider uncertainty
  { id: "rice", name: "Cooked rice", aliases: ["rice", "chawal", "white rice", "steamed rice", "plain rice"], per100g: per(130, 2.7, 28, 0.3), servings: [{ label: "1 katori", grams: 150 }, { label: "1 plate", grams: 250 }], confidence: "medium" },
  { id: "chicken", name: "Chicken breast (cooked)", aliases: ["chicken", "grilled chicken", "chicken breast", "boiled chicken"], per100g: per(165, 31, 0, 3.6), servings: [{ label: "100 g", grams: 100 }, { label: "150 g", grams: 150 }, { label: "200 g", grams: 200 }], confidence: "medium" },
  { id: "greek-yogurt", name: "Greek yogurt / skyr", aliases: ["greek yogurt", "skyr", "hung curd"], per100g: per(65, 10, 4, 0.4), servings: [{ label: "200 g", grams: 200 }, { label: "100 g", grams: 100 }], confidence: "medium" },
  { id: "chole", name: "Chole (chana masala)", aliases: ["chole", "chana masala", "chana", "chickpea curry"], per100g: per(150, 7, 19, 5.5), servings: [{ label: "1 katori", grams: 150 }], confidence: "medium" },
  { id: "rajma", name: "Rajma masala", aliases: ["rajma", "kidney bean curry"], per100g: per(135, 7, 17, 4.5), servings: [{ label: "1 katori", grams: 150 }], confidence: "medium" },
  { id: "aloo-sabzi", name: "Aloo sabzi", aliases: ["aloo", "potato sabzi", "aloo curry", "sabzi"], per100g: per(120, 2, 15, 6), servings: [{ label: "1 katori", grams: 150 }], confidence: "medium" },
  { id: "upma", name: "Upma", aliases: ["rava upma", "uppittu"], per100g: per(145, 3.5, 21, 5.5), servings: [{ label: "1 bowl", grams: 150 }], confidence: "medium" },
  { id: "paratha", name: "Plain paratha", aliases: ["paratha", "parantha", "parotta"], per100g: per(300, 7, 42, 12), piece: 60, servings: [{ label: "1 paratha", grams: 60 }, { label: "2 paratha", grams: 120 }], confidence: "medium" },
  { id: "samosa", name: "Samosa", aliases: ["samosas"], per100g: per(310, 5, 32, 18), piece: 80, servings: [{ label: "1 samosa", grams: 80 }], confidence: "medium" },
  { id: "chai", name: "Chai (milk + sugar)", aliases: ["chai", "tea", "milk tea", "masala chai"], per100g: per(55, 1.8, 8, 1.8), servings: [{ label: "1 cup", grams: 150 }], confidence: "medium" },
  { id: "coffee-black", name: "Black coffee", aliases: ["black coffee", "americano", "coffee"], per100g: per(1, 0.1, 0, 0), servings: [{ label: "1 cup", grams: 240 }], confidence: "medium" },
  { id: "bread", name: "White bread", aliases: ["bread", "white bread", "toast"], per100g: per(265, 9, 49, 3.2), piece: 25, servings: [{ label: "1 slice", grams: 25 }, { label: "2 slices", grams: 50 }], confidence: "medium" },
  { id: "brown-bread", name: "Brown bread", aliases: ["brown bread", "whole wheat bread"], per100g: per(250, 10, 43, 3.5), piece: 28, servings: [{ label: "1 slice", grams: 28 }, { label: "2 slices", grams: 56 }], confidence: "medium" },
  { id: "peanut-butter", name: "Peanut butter", aliases: ["pb", "peanut butter"], per100g: per(590, 25, 20, 50), servings: [{ label: "1 tbsp", grams: 16 }, { label: "2 tbsp", grams: 32 }], confidence: "medium" },
  { id: "apple", name: "Apple", aliases: ["apples", "seb"], per100g: per(52, 0.3, 14, 0.2), piece: 182, servings: [{ label: "1 medium", grams: 182 }], confidence: "medium" },
];
