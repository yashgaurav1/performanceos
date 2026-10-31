import { describe, expect, it } from "vitest";
import { dailyMinutesSeries, dailyStudyTotals, focusQuality, recallRatio, studyStreak, subjectSplit, type StudySessionLike } from "./study-math";

const s = (log_date: string, focus_mins: number, o: Partial<StudySessionLike> = {}): StudySessionLike =>
  ({ log_date, subject: "Maths", mode: "lecture", focus_mins, pomodoros: 1, interruptions: 0, focus_rating: null, ...o });

describe("study math", () => {
  it("derives daily totals with recall modes", () => {
    const r = dailyStudyTotals([s("2026-10-25", 50), s("2026-10-25", 40, { mode: "active_recall" }), s("2026-10-25", 30, { mode: "problem_solving" }), s("2026-10-24", 99)], "2026-10-25");
    expect(r).toEqual({ study_hours: 2, active_recall_mins: 70 });
  });
  it("computes ratios and subject splits", () => {
    expect(recallRatio(120, 42)).toBe(0.35);
    const split = subjectSplit([s("d", 60), s("d", 30, { subject: "Physics", mode: "active_recall" })]);
    expect(split[0]).toEqual({ subject: "Maths", mins: 60, share: 0.667, recall_mins: 0 });
  });
  it("computes streaks tolerant of an unfinished today", () => {
    const xs = [s("2026-10-22", 40), s("2026-10-23", 40), s("2026-10-24", 30)];
    expect(studyStreak(xs, "2026-10-25")).toBe(3);
    expect(studyStreak([...xs, s("2026-10-25", 45)], "2026-10-25")).toBe(4);
    expect(studyStreak([s("2026-10-20", 60)], "2026-10-25")).toBe(0);
  });
  it("builds a zero-filled series", () => {
    expect(dailyMinutesSeries([s("2026-10-24", 20)], "2026-10-23", "2026-10-25").map((d) => d.mins)).toEqual([0, 20, 0]);
  });
  it("scores focus quality", () => {
    expect(focusQuality([])).toBeNull();
    expect(focusQuality([s("d", 50, { focus_rating: 5 })])).toBe(100);
  });
});
