import { describe, expect, it } from "vitest";
import {
  calculateEst1RM, computeWeeklyMuscleVolume, detectStalledLift, evaluateSetPRs, recommendNextTarget,
  volumeStatus, type ExerciseMeta, type SetLike,
} from "./gym-math";

const bench: ExerciseMeta = {
  slug: "barbell-bench-press", name: "Bench", primary_muscle: "chest", secondary_muscles: ["triceps", "shoulders"],
  equipment: "barbell", overload_increment_kg: 2.5, rep_range_min: 6, rep_range_max: 10, is_compound: true,
};
const w = (set_number: number, weight_kg: number, reps: number, rir: number | null = 2): SetLike =>
  ({ set_number, set_type: "working", weight_kg, reps, rir });

describe("calculateEst1RM", () => {
  it("returns 0 for empty sets", () => {
    expect(calculateEst1RM(0, 5)).toBe(0);
    expect(calculateEst1RM(100, 0)).toBe(0);
  });
  it("returns the weight for a true single", () => expect(calculateEst1RM(140, 1, 0)).toBe(140));
  it("uses Epley with RIR for <= 10 effective reps", () => {
    expect(calculateEst1RM(100, 5, 0)).toBeCloseTo(116.67, 2);
    expect(calculateEst1RM(100, 5, 2)).toBeCloseTo(123.33, 2);
  });
  it("uses Brzycki capped at 15 for > 10 effective reps", () => {
    expect(calculateEst1RM(60, 12, 0)).toBeCloseTo(60 * (36 / 25), 2);
    expect(calculateEst1RM(60, 20, 0)).toBeCloseTo(60 * (36 / 22), 2);
  });
});

describe("evaluateSetPRs", () => {
  it("ignores warmups", () => {
    expect(evaluateSetPRs({ set_type: "warmup", weight_kg: 200, reps: 5, est_1rm: 233 }, 100, 100)).toEqual({ is_1rm_pr: false, is_volume_pr: false });
  });
  it("flags 1RM and volume PRs independently", () => {
    expect(evaluateSetPRs({ set_type: "working", weight_kg: 100, reps: 5, est_1rm: 116.67 }, 110, 600)).toEqual({ is_1rm_pr: true, is_volume_pr: false });
  });
});

describe("recommendNextTarget", () => {
  it("Rule A: adds load when all sets hit the top of the range with RIR >= 1", () => {
    const r = recommendNextTarget([w(1, 80, 10, 1), w(2, 80, 10, 1), w(3, 80, 10, 2)], bench);
    expect(r.rule).toBe("A_LOAD");
    expect(r.target_weight_kg).toBe(82.5);
    expect(r.target_reps_min).toBe(6);
    expect(r.message).toContain("+2.5kg");
  });
  it("Rule B: keeps weight and adds a rep to the first two sets", () => {
    const r = recommendNextTarget([w(1, 80, 8), w(2, 80, 7), w(3, 80, 7)], bench);
    expect(r.rule).toBe("B_REPS");
    expect(r.per_set.map((s) => s.reps)).toEqual([9, 8, 7]);
    expect(r.message).toBe("Match 80kg, push Set 1 from 8 -> 9 reps");
  });
  it("Rule C: reduces 5% when Set 1 falls below the range", () => {
    const r = recommendNextTarget([w(1, 100, 4, 0), w(2, 100, 3, 0)], bench);
    expect(r.rule).toBe("C_CONSOLIDATE");
    expect(r.target_weight_kg).toBe(95);
  });
  it("Rule C: holds weight on a >3 rep drop-off after a 0-RIR Set 1", () => {
    const r = recommendNextTarget([w(1, 80, 10, 0), w(2, 80, 6, 0)], bench);
    expect(r.rule).toBe("C_CONSOLIDATE");
    expect(r.target_weight_kg).toBe(80);
  });
  it("ignores warmups and handles no history", () => {
    expect(recommendNextTarget([{ ...w(1, 40, 10), set_type: "warmup" }], bench).rule).toBe("NO_HISTORY");
  });
});

describe("detectStalledLift", () => {
  const goodLogs = Array.from({ length: 14 }, (_, i) => ({ log_date: `2026-10-${String(i + 1).padStart(2, "0")}`, sleep_hours: 8, protein_g: 150 }));
  const flat = [
    { date: "2026-10-01", sets: [w(1, 100, 6, 1), w(2, 100, 6, 1)] },
    { date: "2026-10-05", sets: [w(1, 100, 6, 1), w(2, 100, 6, 1)] },
    { date: "2026-10-09", sets: [w(1, 100, 6, 1), w(2, 100, 5, 1)] },
    { date: "2026-10-13", sets: [w(1, 100, 6, 1), w(2, 100, 5, 1)] },
  ];

  it("needs 3 sessions across >= 10 days", () => {
    expect(detectStalledLift(flat.slice(0, 2), goodLogs, { body_weight_kg: 75 }).status).toBe("INSUFFICIENT_DATA");
    expect(detectStalledLift(flat.slice(1, 4).map((s, i) => ({ ...s, date: `2026-10-0${i + 1}` })), goodLogs, { body_weight_kg: 75 }).status).toBe("INSUFFICIENT_DATA");
  });
  it("attributes a stall to recovery debt on poor sleep", () => {
    const logs = goodLogs.map((l) => ({ ...l, sleep_hours: 6 }));
    const r = detectStalledLift(flat, logs, { body_weight_kg: 75 });
    expect(r.status).toBe("STALLED");
    expect(r.cause).toBe("RECOVERY_DEBT_STALL");
  });
  it("attributes a stall to recovery debt on low protein per kg", () => {
    const logs = goodLogs.map((l) => ({ ...l, protein_g: 100 }));
    expect(detectStalledLift(flat, logs, { body_weight_kg: 75 }).cause).toBe("RECOVERY_DEBT_STALL");
  });
  it("attributes to local fatigue when training at ~0 RIR", () => {
    const grind = flat.map((s) => ({ ...s, sets: s.sets.map((x) => ({ ...x, rir: 0 })) }));
    expect(detectStalledLift(grind, goodLogs, { body_weight_kg: 75 }).cause).toBe("LOCAL_FATIGUE_STALL");
  });
  it("falls back to micro-load stall", () => {
    expect(detectStalledLift(flat, goodLogs, { body_weight_kg: 75 }).cause).toBe("MICRO_LOAD_STALL");
  });
  it("reports progressing lifts", () => {
    const up = flat.map((s, i) => ({ ...s, sets: s.sets.map((x) => ({ ...x, weight_kg: 100 + i * 2.5 })) }));
    expect(detectStalledLift(up, goodLogs, { body_weight_kg: 75 }).status).toBe("PROGRESSING");
  });
});

describe("computeWeeklyMuscleVolume", () => {
  it("counts primary as 1 and secondary as 0.5, skipping warmups", () => {
    const map = new Map([["barbell-bench-press", bench]]);
    const sets = [
      { exercise_slug: "barbell-bench-press", set_type: "working" as const },
      { exercise_slug: "barbell-bench-press", set_type: "dropset" as const },
      { exercise_slug: "barbell-bench-press", set_type: "warmup" as const },
    ];
    const r = computeWeeklyMuscleVolume(sets, map);
    expect(r).toEqual([
      { muscle: "chest", sets: 2, status: "under_target" },
      { muscle: "triceps", sets: 1, status: "under_target" },
      { muscle: "shoulders", sets: 1, status: "under_target" },
    ]);
  });
  it("classifies zones", () => {
    expect(volumeStatus(7.5)).toBe("under_target");
    expect(volumeStatus(12)).toBe("optimal");
    expect(volumeStatus(19)).toBe("upper_zone");
    expect(volumeStatus(21)).toBe("high_fatigue_risk");
  });
});
