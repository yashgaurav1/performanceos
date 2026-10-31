import { describe, expect, it } from "vitest";
import { generateDemoData } from "@/lib/demo/generate";
import { buildTelemetryFromData } from "./build-weekly-telemetry";
import { WeeklyTelemetrySchema } from "./schemas";

describe("buildTelemetryFromData", () => {
  const demo = generateDemoData("2026-10-25");
  const t = buildTelemetryFromData({ ...demo, dailyLogs: demo.dailyLogs, food: demo.food }, "2026-10-25");

  it("produces a schema-valid 7-row payload", () => {
    expect(() => WeeklyTelemetrySchema.parse(t)).not.toThrow();
    expect(t.daily_series).toHaveLength(7);
    expect(t.window).toEqual({ start: "2026-10-19", end: "2026-10-25" });
  });

  it("stays token-efficient (< ~2,500 tokens ≈ 10k chars)", () => {
    expect(JSON.stringify(t).length).toBeLessThan(11_000);
  });

  it("pre-computes correlations consistently with the daily series", () => {
    const short = t.daily_series.filter((d) => d.sleep_hours !== null && d.sleep_hours < 6.5);
    expect(t.computed_correlations.after_short_sleep.days).toBe(short.length);
    expect(t.training_summary.workouts_completed).toBeGreaterThan(0);
  });

  it("flags the deliberately stalled incline DB press", () => {
    const incline = t.training_summary.key_lifts_progression.find((l) => l.exercise === "Incline DB Press");
    expect(incline?.stall_status).toBe("STALLED");
  });
});
