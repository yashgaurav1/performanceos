/**
 * Food search and natural-language food parsing. Pure, zero-dependency.
 *
 *   "2 roti, 1 katori dal and 200g chicken"
 *     → [{roti, 70 g}, {dal tadka, 150 g}, {chicken, 200 g}]
 */

export interface Per100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Serving {
  label: string;
  grams: number;
}

export interface CatalogFood {
  id: string;
  name: string;
  aliases: string[];
  per100g: Per100g;
  /** First entry is the default serving. */
  servings: Serving[];
  /** Grams per countable unit (roti, egg, slice). */
  piece?: number;
  /** "high" = verified recipe or ingredient; "medium" = standard average. */
  confidence: "high" | "medium";
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ParsedFoodItem {
  food: CatalogFood;
  grams: number;
  /** Human description of the amount, e.g. "2 roti" or "150 g". */
  amount: string;
  macros: Macros;
}

export interface ParseResult {
  items: ParsedFoodItem[];
  /** Segments we couldn't match to a food. */
  unmatched: string[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function macrosFor(food: CatalogFood, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: Math.round(food.per100g.kcal * f),
    protein: round1(food.per100g.protein * f),
    carbs: round1(food.per100g.carbs * f),
    fat: round1(food.per100g.fat * f),
  };
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s./]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Strip a simple English plural so "rotis" / "eggs" / "slices" match. */
const singular = (w: string) => (w.length > 3 && w.endsWith("es") && !w.endsWith("ses") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

function scoreFood(food: CatalogFood, tokens: string[], phrase: string): number {
  const names = [food.name, ...food.aliases].map(normalize);
  let best = 0;
  for (const n of names) {
    const words = n.split(" ").map(singular);
    let score = 0;
    let all = true;
    for (const t of tokens) {
      const st = singular(t);
      if (words.includes(st)) score += 3;
      else if (words.some((w) => w.startsWith(st))) score += 2;
      else if (st.length >= 3 && n.includes(st)) score += 1;
      else {
        all = false;
        break;
      }
    }
    if (!all) continue;
    if (n === phrase || singular(n) === singular(phrase)) score += 6;
    else if (n.startsWith(phrase)) score += 2;
    // Prefer the tighter match: fewer extra words in the name.
    score -= Math.max(0, words.length - tokens.length) * 0.25;
    best = Math.max(best, score);
  }
  return best;
}

/** Ranked catalog search. Every query word must match the name or an alias. */
export function searchFoods(query: string, catalog: CatalogFood[], limit = 8): CatalogFood[] {
  const phrase = normalize(query);
  if (!phrase) return [];
  const tokens = phrase.split(" ").filter(Boolean);
  return catalog
    .map((food) => ({ food, score: scoreFood(food, tokens, phrase) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
    .slice(0, limit)
    .map((r) => r.food);
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 0.5, quarter: 0.25, ek: 1, do: 2, teen: 3,
};

/** Units we understand, mapped to a canonical name. */
const UNIT_ALIASES: Record<string, string> = {
  g: "g", gm: "g", gms: "g", gram: "g", grams: "g", gr: "g",
  ml: "ml", kg: "kg",
  katori: "katori", katoris: "katori", bowl: "bowl", bowls: "bowl",
  cup: "cup", cups: "cup", glass: "glass", glasses: "glass",
  plate: "plate", plates: "plate",
  slice: "slice", slices: "slice", piece: "piece", pieces: "piece", pc: "piece", pcs: "piece",
  scoop: "scoop", scoops: "scoop", tbsp: "tbsp", tablespoon: "tbsp", tsp: "tsp", teaspoon: "tsp",
  serving: "serving", servings: "serving", handful: "handful",
};

/** Typical grams when a food has no serving with that unit's name. */
const UNIT_FALLBACK_GRAMS: Record<string, number> = {
  katori: 150, bowl: 200, cup: 200, glass: 250, plate: 250, tbsp: 15, tsp: 5, scoop: 30, handful: 30,
};

function parseQuantity(token: string | undefined): number | null {
  if (!token) return null;
  if (token in NUMBER_WORDS) return NUMBER_WORDS[token] ?? null;
  const frac = token.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const n = Number(token);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function gramsFor(food: CatalogFood, qty: number, unit: string | null): { grams: number; amount: string } {
  const def = food.servings[0] ?? { label: "100 g", grams: 100 };
  if (unit === "g" || unit === "ml") return { grams: qty, amount: `${qty} ${unit}` };
  if (unit === "kg") return { grams: qty * 1000, amount: `${qty} kg` };
  if (unit && unit !== "piece" && unit !== "slice" && unit !== "serving") {
    const named = food.servings.find((s) => normalize(s.label).split(" ").some((w) => singular(w) === unit));
    const each = named ? named.grams / (Number(named.label.match(/^\d+(?:\.\d+)?/)?.[0]) || 1) : UNIT_FALLBACK_GRAMS[unit];
    if (each) return { grams: qty * each, amount: `${qty} ${unit}` };
  }
  if (food.piece && unit !== "serving") {
    return { grams: qty * food.piece, amount: `${qty} × ${food.name.toLowerCase()}` };
  }
  return { grams: qty * def.grams, amount: qty === 1 ? def.label : `${qty} × ${def.label}` };
}

function parseSegment(segment: string, catalog: CatalogFood[]): ParsedFoodItem | null {
  let words = normalize(segment).split(" ").filter(Boolean);
  if (!words.length) return null;

  let qty: number | null = null;
  let unit: string | null = null;

  // "200g chicken" / "1.5kg" written without a space
  const glued = words[0]?.match(/^(\d+(?:\.\d+)?)(g|gm|gms|ml|kg)$/);
  if (glued) {
    qty = Number(glued[1]);
    unit = UNIT_ALIASES[glued[2] ?? ""] ?? null;
    words = words.slice(1);
  } else {
    qty = parseQuantity(words[0]);
    if (qty !== null) words = words.slice(1);
    const u = words[0] ? UNIT_ALIASES[words[0]] : undefined;
    if (u) {
      unit = u;
      words = words.slice(1);
    }
  }
  if (words[0] === "of") words = words.slice(1);

  // Trailing amount: "chicken 200g" / "dal 1 katori"
  const last = words[words.length - 1];
  const trailingGlued = last?.match(/^(\d+(?:\.\d+)?)(g|gm|gms|ml|kg)$/);
  if (qty === null && trailingGlued) {
    qty = Number(trailingGlued[1]);
    unit = UNIT_ALIASES[trailingGlued[2] ?? ""] ?? null;
    words = words.slice(0, -1);
  } else if (qty === null && words.length >= 3) {
    const tq = parseQuantity(words[words.length - 2]);
    const tu = UNIT_ALIASES[words[words.length - 1] ?? ""];
    if (tq !== null && tu) {
      qty = tq;
      unit = tu;
      words = words.slice(0, -2);
    }
  }

  const query = words.join(" ");
  const food = searchFoods(query, catalog, 1)[0];
  if (!food) return null;

  const { grams, amount } = gramsFor(food, qty ?? 1, unit);
  if (!(grams > 0) || grams > 5000) return null;
  return { food, grams: Math.round(grams), amount, macros: macrosFor(food, grams) };
}

/** Parse free text like "2 roti, 1 katori dal and 200g chicken". */
export function parseFoodText(text: string, catalog: CatalogFood[]): ParseResult {
  const segments = text
    .split(/,|\+|;|\n|\band\b|\bwith\b|&/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const items: ParsedFoodItem[] = [];
  const unmatched: string[] = [];
  for (const seg of segments) {
    const item = parseSegment(seg, catalog);
    if (item) items.push(item);
    else unmatched.push(seg);
  }
  return { items, unmatched };
}

export interface FoodEntryTotals {
  kcal_point: number;
  kcal_low: number;
  kcal_high: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  confidence_tier: "high" | "medium";
}

/** Uncertainty band: ±10% for verified foods, ±20% for standard averages. */
export function totalsForItems(items: Pick<ParsedFoodItem, "macros" | "food">[]): FoodEntryTotals {
  let kcal = 0, protein = 0, carbs = 0, fat = 0, spread = 0;
  for (const it of items) {
    kcal += it.macros.kcal;
    protein += it.macros.protein;
    carbs += it.macros.carbs;
    fat += it.macros.fat;
    spread += it.macros.kcal * (it.food.confidence === "high" ? 0.1 : 0.2);
  }
  return {
    kcal_point: Math.round(kcal),
    kcal_low: Math.max(0, Math.round(kcal - spread)),
    kcal_high: Math.round(kcal + spread),
    protein_g: round1(protein),
    carbs_g: round1(carbs),
    fat_g: round1(fat),
    fiber_g: 0,
    confidence_tier: items.every((i) => i.food.confidence === "high") ? "high" : "medium",
  };
}
