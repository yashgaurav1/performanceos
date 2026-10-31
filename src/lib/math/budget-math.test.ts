import { describe, expect, it } from "vitest";
import { budgetStatus, monthlyTotals, parseAmountToMinor, parseExpenseInput, summarizeMonth, weeklyTotals, type ExpenseLike } from "./budget-math";

describe("parsing", () => {
  it("parses amounts to integer minor units", () => {
    expect(parseAmountToMinor("120")).toBe(12000);
    expect(parseAmountToMinor("120.5")).toBe(12050);
    expect(parseAmountToMinor("₹1,250.75")).toBe(125075);
    expect(parseAmountToMinor("0")).toBeNull();
    expect(parseAmountToMinor("abc")).toBeNull();
    expect(parseAmountToMinor("1.234")).toBeNull();
  });
  it("parses inline expense syntax", () => {
    expect(parseExpenseInput("120 chai #food @canteen")).toEqual({ amount_minor: 12000, category: "food", merchant: "canteen", note: "chai" });
    expect(parseExpenseInput("uber to campus 180")).toEqual({ amount_minor: 18000, category: "transport", merchant: null, note: "uber to campus" });
    expect(parseExpenseInput("@zepto 640")?.category).toBe("groceries");
    expect(parseExpenseInput("random thing 99")?.category).toBe("other");
    expect(parseExpenseInput("no amount here")).toBeNull();
  });
});

describe("budgetStatus", () => {
  it("classifies pace", () => {
    expect(budgetStatus(5000, 10000, 0.5)).toBe("under");
    expect(budgetStatus(7000, 10000, 0.5)).toBe("pace_warning");
    expect(budgetStatus(10001, 10000, 0.9)).toBe("over");
  });
});

const e = (spent_on: string, rupees: number, category: ExpenseLike["category"] = "food", merchant: string | null = null): ExpenseLike =>
  ({ spent_on, amount_minor: rupees * 100, category, merchant });

describe("summarizeMonth", () => {
  const xs = [
    e("2026-10-01", 300), e("2026-10-05", 700, "transport", "Uber"), e("2026-10-10", 1000, "food", "canteen"),
    e("2026-09-02", 1000), e("2026-09-20", 5000),
  ];
  const sum = summarizeMonth(xs, "2026-10", "2026-10-10", 15000_00, new Map([["food", 1000_00]]));
  it("totals, averages and projects", () => {
    expect(sum.total_minor).toBe(2000_00);
    expect(sum.days_elapsed).toBe(10);
    expect(sum.avg_per_day_minor).toBe(200_00);
    expect(sum.projected_total_minor).toBe(6200_00);
    expect(sum.remaining_minor).toBe(13000_00);
    expect(sum.safe_to_spend_per_day_minor).toBe(Math.floor(13000_00 / 22));
  });
  it("breaks down categories with limits", () => {
    expect(sum.categories[0]).toMatchObject({ category: "food", spent_minor: 1300_00, limit_minor: 1000_00, status: "over" });
  });
  it("compares with the same point last month", () => {
    expect(sum.vs_last_month_same_point_pct).toBe(100); // 2000 vs 1000 by day 10
  });
  it("builds cumulative daily series and merchants", () => {
    expect(sum.daily).toHaveLength(31);
    expect(sum.daily[9]?.cumulative_minor).toBe(2000_00);
    expect(sum.top_merchants[0]).toEqual({ merchant: "canteen", spent_minor: 1000_00, count: 1 });
  });
  it("rolls up weeks and months", () => {
    expect(weeklyTotals(xs, "2026-10-10", 2)).toEqual([{ week_start: "2026-09-28", total_minor: 300_00 }, { week_start: "2026-10-05", total_minor: 1700_00 }]);
    expect(monthlyTotals(xs, "2026-10-10", 2)).toEqual([{ month: "2026-09", total_minor: 6000_00 }, { month: "2026-10", total_minor: 2000_00 }]);
  });
});
