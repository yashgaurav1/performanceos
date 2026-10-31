import { describe, expect, it } from "vitest";
import { caloriePoints, computeDayScore, proteinPoints, sleepPoints, studyPoints, type DayScoreInput } from "./day-score";

const perfect: DayScoreInput = {
  sleep_hours: 8, sleep_quality: 5, target_sleep_hours: 8,
  protein_g: 140, target_protein_g: 140, kcal_point: 2400, target_kcal: 2400,
  study_hours: 4, target_study_hours: 4, active_recall_mins: 60,
  working_sets_today: 12, is_rest_day: false,
  big_three_completed: 3, big_three_total: 3, wins_count: 2, mood_score: 4, energy_score: 4,
  exam_crunch_mode: false,
};

describe("computeDayScore", () => {
  it("scores a perfect standard day at 100", () => {
    const r = computeDayScore(perfect);
    expect(r.score).toBe(100);
    expect(r.breakdown).toEqual({ sleep: 25, nutrition: 25, study: 20, training: 15, tasks: 15 });
  });

  it("scores a perfect crunch day at 100 with shifted weights", () => {
    const r = computeDayScore({ ...perfect, exam_crunch_mode: true });
    expect(r.score).toBe(100);
    expect(r.max).toEqual({ sleep: 25, nutrition: 20, study: 35, training: 5, tasks: 15 });
    expect(r.breakdown.study).toBe(35);
    expect(r.breakdown.training).toBe(5);
  });

  it("scores an empty day at 0", () => {
    const r = computeDayScore({
      ...perfect, sleep_hours: null, sleep_quality: null, protein_g: 0, kcal_point: 0, study_hours: 0,
      active_recall_mins: 0, working_sets_today: 0, big_three_completed: 0, big_three_total: 0, wins_count: 0,
      mood_score: null, energy_score: null,
    });
    expect(r.score).toBe(0);
  });

  it("gives training credit on a rest day only with >= 7h sleep", () => {
    expect(computeDayScore({ ...perfect, working_sets_today: 0, is_rest_day: true, sleep_hours: 7 }).breakdown.training).toBe(15);
    expect(computeDayScore({ ...perfect, working_sets_today: 0, is_rest_day: true, sleep_hours: 6.5 }).breakdown.training).toBe(0);
    expect(computeDayScore({ ...perfect, working_sets_today: 0, is_rest_day: false }).breakdown.training).toBe(0);
  });
});

describe("components", () => {
  it("applies the < 5h recovery penalty", () => {
    // 4.5/8 * 18 = 10.125 - 5 = 5.125 ; quality 1 -> 0
    expect(sleepPoints(4.5, 1, 8)).toBeCloseTo(5.125);
    expect(sleepPoints(1, 1, 8)).toBe(0);
  });

  it("scales protein linearly below 90%", () => {
    expect(proteinPoints(126, 140)).toBe(15);
    expect(proteinPoints(63, 140)).toBeCloseTo(7.5);
  });

  it("deducts 1 pt per 2.5% calorie deviation beyond ±10%", () => {
    expect(caloriePoints(2640, 2400)).toBe(10); // +10%
    expect(caloriePoints(2700, 2400)).toBeCloseTo(9); // +12.5% -> 2.5% outside band -> -1
    expect(caloriePoints(1800, 2400)).toBeCloseTo(4); // -25% -> 15% outside band -> -6
    expect(caloriePoints(4800, 2400)).toBe(0);
  });

  it("awards active recall by absolute minutes or 35% ratio", () => {
    expect(studyPoints(4, 4, 45)).toBe(20);
    expect(studyPoints(1, 4, 21)).toBeCloseTo(3.5 + 6); // 21 >= 35% of 60
    expect(studyPoints(2, 4, 0)).toBe(7);
  });
});
