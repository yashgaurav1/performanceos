import { describe, expect, it } from "vitest";
import { advance, formatClock, IDLE, isPhaseComplete, nextBreakPhase, pause, remainingMs, resume, startFocus, stop, type PomodoroConfig } from "./pomodoro";

const cfg: PomodoroConfig = { focus_mins: 25, short_break_mins: 5, long_break_mins: 15, cycles_before_long: 4 };
const MIN = 60_000;

describe("pomodoro", () => {
  it("counts down from timestamps and survives pauses", () => {
    let s = startFocus(IDLE, 0);
    expect(remainingMs(s, cfg, 10 * MIN)).toBe(15 * MIN);
    s = pause(s, 10 * MIN);
    expect(remainingMs(s, cfg, 99 * MIN)).toBe(15 * MIN); // frozen while paused
    expect(s.interruptions).toBe(1);
    s = resume(s, 20 * MIN);
    expect(remainingMs(s, cfg, 25 * MIN)).toBe(10 * MIN);
    expect(isPhaseComplete(s, cfg, 35 * MIN)).toBe(true);
  });

  it("goes to a long break every N focus blocks", () => {
    expect(nextBreakPhase(1, cfg)).toBe("short_break");
    expect(nextBreakPhase(4, cfg)).toBe("long_break");
    let s = { ...startFocus(IDLE, 0), completed_focus: 3 };
    const r = advance(s, cfg, 25 * MIN);
    expect(r.state.phase).toBe("long_break");
    expect(r.completedFocus?.focus_mins).toBe(25);
    s = advance(r.state, cfg, 40 * MIN).state;
    expect(s.phase).toBe("focus");
    expect(s.completed_focus).toBe(0);
  });

  it("credits partial focus on early stop, but not < 1 minute", () => {
    const s = startFocus(IDLE, 0);
    expect(stop(s, cfg, 12 * MIN).completedFocus?.focus_mins).toBe(12);
    expect(stop(s, cfg, 30_000).completedFocus).toBeNull();
    expect(stop(s, cfg, 12 * MIN).state.phase).toBe("idle");
  });

  it("formats the clock", () => {
    expect(formatClock(25 * MIN)).toBe("25:00");
    expect(formatClock(61_500)).toBe("01:02");
  });
});
