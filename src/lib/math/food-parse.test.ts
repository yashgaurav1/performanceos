import { describe, expect, it } from "vitest";
import { FOOD_CATALOG } from "@/data/food-catalog";
import { macrosFor, parseFoodText, searchFoods, totalsForItems } from "./food-parse";

const parse = (t: string) => parseFoodText(t, FOOD_CATALOG);
const one = (t: string) => {
  const r = parse(t);
  expect(r.unmatched).toEqual([]);
  expect(r.items).toHaveLength(1);
  return r.items[0]!;
};

describe("searchFoods", () => {
  it("finds foods by name and Indian aliases", () => {
    expect(searchFoods("chapati", FOOD_CATALOG)[0]?.id).toBe("roti");
    expect(searchFoods("dahi", FOOD_CATALOG)[0]?.id).toBe("curd");
    expect(searchFoods("chawal", FOOD_CATALOG)[0]?.id).toBe("rice");
    expect(searchFoods("anda", FOOD_CATALOG)[0]?.id).toBe("boiled-egg");
  });

  it("matches prefixes while typing", () => {
    expect(searchFoods("bir", FOOD_CATALOG)[0]?.id).toBe("chicken-biryani");
    expect(searchFoods("pan", FOOD_CATALOG).map((f) => f.id)).toContain("paneer");
  });

  it("prefers the exact food over longer names", () => {
    expect(searchFoods("paneer", FOOD_CATALOG)[0]?.id).toBe("paneer");
    expect(searchFoods("rice", FOOD_CATALOG)[0]?.id).toBe("rice");
    expect(searchFoods("curd rice", FOOD_CATALOG)[0]?.id).toBe("curd-rice");
  });

  it("returns nothing for empty or unknown queries", () => {
    expect(searchFoods("", FOOD_CATALOG)).toEqual([]);
    expect(searchFoods("zzqx", FOOD_CATALOG)).toEqual([]);
  });
});

describe("parseFoodText", () => {
  it("counts pieces for countable foods", () => {
    const r = one("2 roti");
    expect(r.food.id).toBe("roti");
    expect(r.grams).toBe(70);
    const eggs = one("3 eggs");
    expect(eggs.food.id).toBe("boiled-egg");
    expect(eggs.grams).toBe(150);
  });

  it("understands katori, glass and scoop", () => {
    expect(one("1 katori dal").grams).toBe(150);
    expect(one("1 glass milk").grams).toBe(250);
    expect(one("2 scoops whey").grams).toBe(60);
  });

  it("reads grams written before or after the food", () => {
    expect(one("200g chicken").grams).toBe(200);
    expect(one("chicken 150 g").grams).toBe(150);
    expect(one("paneer 100g").grams).toBe(100);
  });

  it("supports number words and fractions", () => {
    expect(one("half katori rice").grams).toBe(75);
    expect(one("two idli").grams).toBe(90);
    expect(one("1/2 plate biryani").grams).toBe(160);
  });

  it("uses the default serving when no amount is given", () => {
    expect(one("dal").grams).toBe(150);
    expect(one("banana").grams).toBe(118);
  });

  it("splits a full meal on commas, plus and 'and'", () => {
    const r = parse("2 roti, 1 katori dal and 200g chicken + 1 glass milk");
    expect(r.items.map((i) => i.food.id)).toEqual(["roti", "dal-tadka", "chicken", "milk"]);
    expect(r.unmatched).toEqual([]);
  });

  it("reports what it couldn't match instead of guessing", () => {
    const r = parse("2 roti, unicorn steak");
    expect(r.items).toHaveLength(1);
    expect(r.unmatched).toEqual(["unicorn steak"]);
  });
});

describe("macros and totals", () => {
  it("scales per-100 g values", () => {
    const rice = FOOD_CATALOG.find((f) => f.id === "rice")!;
    expect(macrosFor(rice, 150)).toEqual({ kcal: 195, protein: 4.1, carbs: 42, fat: 0.5 });
  });

  it("widens the kcal band for medium-confidence foods", () => {
    const r = parse("2 roti, 1 katori rice");
    const t = totalsForItems(r.items);
    const roti = r.items[0]!.macros.kcal;
    const rice = r.items[1]!.macros.kcal;
    expect(t.kcal_point).toBe(roti + rice);
    expect(t.kcal_high - t.kcal_point).toBe(Math.round(roti * 0.1 + rice * 0.2));
    expect(t.confidence_tier).toBe("medium");
  });

  it("is high confidence when every item is verified", () => {
    expect(totalsForItems(parse("2 roti, 1 katori dal").items).confidence_tier).toBe("high");
  });
});
