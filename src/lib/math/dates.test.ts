import { describe, expect, it } from "vitest";
import { addDays, dateRange, daysBetween, daysInMonth, startOfWeek } from "./dates";
import { ema, linearSlope, weightTrendDiff } from "./stats";

describe("dates", () => {
  it("does calendar math", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(daysBetween("2026-10-01", "2026-10-11")).toBe(10);
    expect(startOfWeek("2026-10-25")).toBe("2026-10-19");
    expect(daysInMonth("2028-02")).toBe(29);
    expect(dateRange("2026-10-30", "2026-11-01")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01"]);
  });
});

describe("stats", () => {
  it("computes slope and ema", () => {
    expect(linearSlope([1, 2, 3])).toBe(1);
    expect(linearSlope([3, 3, 3])).toBe(0);
    expect(ema([10, 20], 3)).toEqual([10, 15]);
  });
  it("computes weight trend diff vs prior EMA", () => {
    const r = weightTrendDiff([{ date: "2026-10-23", kg: 75 }, { date: "2026-10-24", kg: 75 }, { date: "2026-10-25", kg: 74.7 }], "2026-10-25");
    expect(r).toEqual({ trendKg: 75, diffKg: -0.3 });
  });
});
