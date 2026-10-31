/**
 * Budget ledger engine. All money is integer minor units (paise / cents) · never floats.
 */
import { addDays, daysInMonth, monthKey, parseISODate, toISODate } from "./dates";
import { round } from "./stats";

export type ExpenseCategory =
  | "food" | "groceries" | "transport" | "rent" | "utilities" | "education" | "health" | "fitness"
  | "shopping" | "entertainment" | "subscriptions" | "social" | "travel" | "other";

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  "food", "groceries", "transport", "rent", "utilities", "education", "health", "fitness",
  "shopping", "entertainment", "subscriptions", "social", "travel", "other",
];

export type PaymentMethod = "upi" | "card" | "cash" | "bank" | "wallet";
export const PAYMENT_METHODS: readonly PaymentMethod[] = ["upi", "card", "cash", "bank", "wallet"];

const CATEGORY_ALIASES: Record<string, ExpenseCategory> = {
  food: "food", eat: "food", canteen: "food", mess: "food", chai: "food", coffee: "food", swiggy: "food", zomato: "food", snack: "food",
  groceries: "groceries", grocery: "groceries", blinkit: "groceries", zepto: "groceries",
  transport: "transport", auto: "transport", uber: "transport", ola: "transport", fuel: "transport", petrol: "transport", bus: "transport", cab: "transport",
  rent: "rent", pg: "rent", hostel: "rent",
  utilities: "utilities", bill: "utilities", electricity: "utilities", wifi: "utilities", recharge: "utilities", phone: "utilities",
  education: "education", books: "education", course: "education", fees: "education", print: "education", stationery: "education",
  health: "health", meds: "health", doctor: "health", pharmacy: "health",
  fitness: "fitness", gym: "fitness", whey: "fitness", supplements: "fitness", protein: "fitness",
  shopping: "shopping", clothes: "shopping", amazon: "shopping", myntra: "shopping",
  entertainment: "entertainment", movie: "entertainment", movies: "entertainment", games: "entertainment",
  subscriptions: "subscriptions", sub: "subscriptions", netflix: "subscriptions", spotify: "subscriptions",
  social: "social", party: "social", gift: "social", treat: "social",
  travel: "travel", trip: "travel", train: "travel", flight: "travel",
  other: "other", misc: "other",
};

export function guessCategory(word: string): ExpenseCategory | null {
  return CATEGORY_ALIASES[word.toLowerCase()] ?? null;
}

/** "120.5" → 12050. Returns null for invalid / non-positive amounts. */
export function parseAmountToMinor(input: string): number | null {
  const cleaned = input.replace(/[,₹$\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const minor = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return minor > 0 ? minor : null;
}

export interface ParsedExpense {
  amount_minor: number;
  category: ExpenseCategory;
  merchant: string | null;
  note: string;
}

/**
 * Inline syntax: `"120 chai #food @canteen"` → amount 120.00, category food, merchant canteen, note "chai".
 * Without a #tag the category is guessed from words (e.g. "uber" → transport).
 */
export function parseExpenseInput(raw: string): ParsedExpense | null {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  let amount: number | null = null;
  let category: ExpenseCategory | null = null;
  let merchant: string | null = null;
  const words: string[] = [];
  for (const tok of tokens) {
    if (amount === null) {
      const a = parseAmountToMinor(tok);
      if (a !== null) { amount = a; continue; }
    }
    if (tok.startsWith("#") && guessCategory(tok.slice(1))) { category = guessCategory(tok.slice(1)); continue; }
    if (tok.startsWith("@") && tok.length > 1) { merchant = tok.slice(1); continue; }
    words.push(tok);
  }
  if (amount === null) return null;
  if (!category) category = words.map(guessCategory).find((c) => c !== null) ?? (merchant ? guessCategory(merchant) : null) ?? "other";
  return { amount_minor: amount, category, merchant, note: words.join(" ") };
}

export interface ExpenseLike {
  spent_on: string;
  amount_minor: number;
  category: ExpenseCategory;
  merchant: string | null;
}

export type BudgetStatus = "under" | "pace_warning" | "over";

/** Over = limit exceeded; pace_warning = spending faster than the month is elapsing (+10% grace). */
export function budgetStatus(spentMinor: number, limitMinor: number, monthFractionElapsed: number): BudgetStatus {
  if (limitMinor <= 0) return spentMinor > 0 ? "over" : "under";
  if (spentMinor > limitMinor) return "over";
  if (spentMinor / limitMinor > Math.min(1, monthFractionElapsed + 0.1)) return "pace_warning";
  return "under";
}

export interface CategoryRow {
  category: ExpenseCategory;
  spent_minor: number;
  limit_minor: number | null;
  share: number;
  status: BudgetStatus | null;
  count: number;
}

export interface MonthSummary {
  month: string;
  total_minor: number;
  budget_minor: number;
  remaining_minor: number;
  days_in_month: number;
  days_elapsed: number;
  avg_per_day_minor: number;
  projected_total_minor: number;
  safe_to_spend_per_day_minor: number;
  status: BudgetStatus;
  vs_last_month_same_point_pct: number | null;
  categories: CategoryRow[];
  daily: { date: string; spent_minor: number; cumulative_minor: number; ideal_cumulative_minor: number }[];
  top_merchants: { merchant: string; spent_minor: number; count: number }[];
}

export function summarizeMonth(
  expenses: readonly ExpenseLike[],
  month: string,
  today: string,
  monthlyBudgetMinor: number,
  categoryLimits: ReadonlyMap<ExpenseCategory, number> = new Map(),
): MonthSummary {
  const dim = daysInMonth(month);
  const currentMonth = monthKey(today);
  const daysElapsed = month < currentMonth ? dim : month > currentMonth ? 0 : Number(today.slice(8, 10));
  const inMonth = expenses.filter((e) => monthKey(e.spent_on) === month);
  const total = inMonth.reduce((t, e) => t + e.amount_minor, 0);

  const catMap = new Map<ExpenseCategory, { spent: number; count: number }>();
  const merchMap = new Map<string, { spent: number; count: number }>();
  const dayMap = new Map<string, number>();
  for (const e of inMonth) {
    const c = catMap.get(e.category) ?? { spent: 0, count: 0 };
    c.spent += e.amount_minor; c.count++;
    catMap.set(e.category, c);
    if (e.merchant) {
      const key = e.merchant.toLowerCase();
      const m = merchMap.get(key) ?? { spent: 0, count: 0 };
      m.spent += e.amount_minor; m.count++;
      merchMap.set(key, m);
    }
    dayMap.set(e.spent_on, (dayMap.get(e.spent_on) ?? 0) + e.amount_minor);
  }

  const frac = dim ? daysElapsed / dim : 0;
  const categories: CategoryRow[] = [...new Set<ExpenseCategory>([...catMap.keys(), ...categoryLimits.keys()])]
    .map((category) => {
      const spent = catMap.get(category)?.spent ?? 0;
      const limit = categoryLimits.get(category) ?? null;
      return {
        category, spent_minor: spent, limit_minor: limit, share: total ? round(spent / total, 3) : 0,
        status: limit === null ? null : budgetStatus(spent, limit, frac), count: catMap.get(category)?.count ?? 0,
      };
    })
    .sort((a, b) => b.spent_minor - a.spent_minor);

  const daily: MonthSummary["daily"] = [];
  let cum = 0;
  for (let d = 1; d <= dim; d++) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    const spent = dayMap.get(date) ?? 0;
    cum += spent;
    daily.push({ date, spent_minor: spent, cumulative_minor: cum, ideal_cumulative_minor: Math.round((monthlyBudgetMinor * d) / dim) });
  }

  // Same-point comparison against the previous month (first N days vs first N days).
  const prevMonth = monthKey(addDays(`${month}-01`, -1));
  const prevDays = Math.min(daysElapsed, daysInMonth(prevMonth));
  const prevTotal = expenses
    .filter((e) => monthKey(e.spent_on) === prevMonth && Number(e.spent_on.slice(8, 10)) <= prevDays)
    .reduce((t, e) => t + e.amount_minor, 0);
  const hasPrev = expenses.some((e) => monthKey(e.spent_on) === prevMonth);

  const avg = daysElapsed ? Math.round(total / daysElapsed) : 0;
  const projected = daysElapsed ? Math.round((total / daysElapsed) * dim) : 0;
  const remaining = monthlyBudgetMinor - total;
  const daysLeft = Math.max(1, dim - daysElapsed + (daysElapsed > 0 ? 1 : 0));

  return {
    month, total_minor: total, budget_minor: monthlyBudgetMinor, remaining_minor: remaining,
    days_in_month: dim, days_elapsed: daysElapsed, avg_per_day_minor: avg, projected_total_minor: projected,
    safe_to_spend_per_day_minor: Math.max(0, Math.floor(remaining / daysLeft)),
    status: budgetStatus(total, monthlyBudgetMinor, frac),
    vs_last_month_same_point_pct: hasPrev && prevTotal > 0 ? round(((total - prevTotal) / prevTotal) * 100, 1) : null,
    categories, daily,
    top_merchants: [...merchMap.entries()].map(([merchant, v]) => ({ merchant, spent_minor: v.spent, count: v.count }))
      .sort((a, b) => b.spent_minor - a.spent_minor).slice(0, 5),
  };
}

/** Totals for the last `n` Monday-based weeks ending with the week containing `today`. */
export function weeklyTotals(expenses: readonly ExpenseLike[], today: string, n = 8): { week_start: string; total_minor: number }[] {
  const d = parseISODate(today);
  const dow = (d.getDay() + 6) % 7;
  const thisWeek = toISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow));
  const starts = Array.from({ length: n }, (_, i) => addDays(thisWeek, -7 * (n - 1 - i)));
  return starts.map((ws) => {
    const we = addDays(ws, 6);
    return { week_start: ws, total_minor: expenses.filter((e) => e.spent_on >= ws && e.spent_on <= we).reduce((t, e) => t + e.amount_minor, 0) };
  });
}

export function monthlyTotals(expenses: readonly ExpenseLike[], today: string, n = 6): { month: string; total_minor: number }[] {
  const months: string[] = [];
  let cursor = `${monthKey(today)}-01`;
  for (let i = 0; i < n; i++) {
    months.unshift(monthKey(cursor));
    cursor = `${monthKey(addDays(cursor, -1))}-01`;
  }
  return months.map((m) => ({ month: m, total_minor: expenses.filter((e) => monthKey(e.spent_on) === m).reduce((t, e) => t + e.amount_minor, 0) }));
}
