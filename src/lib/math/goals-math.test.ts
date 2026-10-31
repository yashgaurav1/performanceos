import { describe, expect, it } from "vitest";
import { bigThreeProgress, canPinBigThree, goalPace, parseTaskInput, staleTasks, type TaskLike } from "./goals-math";

describe("parseTaskInput", () => {
  it("parses domain and big-3 flags", () => {
    expect(parseTaskInput("Solve 30 quant questions #study !big3")).toEqual({ title: "Solve 30 quant questions", domain: "study", is_big_three: true });
    expect(parseTaskInput("Leg day #gym")).toEqual({ title: "Leg day", domain: "physique", is_big_three: false });
    expect(parseTaskInput("call mom")).toEqual({ title: "call mom", domain: "life", is_big_three: false });
  });
  it("keeps unknown hashtags in the title", () => {
    expect(parseTaskInput("ship #v2 #work").title).toBe("ship #v2");
  });
});

const t = (id: string, o: Partial<TaskLike> = {}): TaskLike => ({ id, kind: "daily_task", status: "todo", is_big_three: true, scheduled_date: "2026-10-25", ...o });

describe("big three", () => {
  it("enforces the ceiling of 3, ignoring dropped tasks", () => {
    expect(canPinBigThree([t("a"), t("b")], "2026-10-25")).toBe(true);
    expect(canPinBigThree([t("a"), t("b"), t("c")], "2026-10-25")).toBe(false);
    expect(canPinBigThree([t("a"), t("b"), t("c", { status: "dropped" })], "2026-10-25")).toBe(true);
  });
  it("computes progress", () => {
    expect(bigThreeProgress([t("a", { status: "done" }), t("b"), t("x", { scheduled_date: "2026-10-24" })], "2026-10-25")).toEqual({ completed: 1, total: 2 });
  });
  it("finds stale tasks", () => {
    const s = staleTasks([t("a", { scheduled_date: "2026-10-24" }), t("b", { scheduled_date: "2026-10-24", status: "done" }), t("c")], "2026-10-25");
    expect(s.map((x) => x.id)).toEqual(["a"]);
  });
});

describe("goalPace", () => {
  const base = { start_metric_num: 0, target_metric_num: 20, created_at: "2026-10-01", due_date: "2026-12-24" }; // 84 days
  it("is on track when ahead of the linear line", () => {
    expect(goalPace({ ...base, current_metric_num: 12 }, "2026-10-29").on_track).toBe(true);
  });
  it("reports how far behind per week", () => {
    // planned 20/12wk = 1.667/wk; at day 42 with 2 done, 18 left over 6 wks = 3/wk -> behind by 1.3
    const p = goalPace({ ...base, current_metric_num: 2 }, "2026-11-12");
    expect(p.on_track).toBe(false);
    expect(p.behind_by_per_week).toBeCloseTo(1.3, 1);
    expect(p.label).toBe("Behind by 1.3 units/wk");
  });
  it("supports decreasing targets", () => {
    const p = goalPace({ start_metric_num: 80, target_metric_num: 76, current_metric_num: 78, created_at: "2026-10-01", due_date: "2026-11-01" }, "2026-10-16");
    expect(p.progress_pct).toBe(50);
    expect(p.on_track).toBe(true);
  });
});
