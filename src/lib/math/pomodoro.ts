/**
 * Pomodoro state machine. Timestamp-based (never tick-counting) so closing the PWA,
 * backgrounding the tab or locking the phone never loses elapsed time.
 */
export type PomodoroPhase = "idle" | "focus" | "short_break" | "long_break";

export interface PomodoroConfig {
  focus_mins: number;
  short_break_mins: number;
  long_break_mins: number;
  cycles_before_long: number;
}

export interface PomodoroState {
  phase: PomodoroPhase;
  phase_started_at: number | null; // epoch ms
  paused_at: number | null;
  paused_ms: number;
  completed_focus: number; // focus blocks completed in the current set
  interruptions: number;
}

export const DEFAULT_POMODORO: PomodoroConfig = { focus_mins: 50, short_break_mins: 10, long_break_mins: 25, cycles_before_long: 4 };

export const IDLE: PomodoroState = { phase: "idle", phase_started_at: null, paused_at: null, paused_ms: 0, completed_focus: 0, interruptions: 0 };

export function phaseDurationMs(phase: PomodoroPhase, cfg: PomodoroConfig): number {
  switch (phase) {
    case "focus": return cfg.focus_mins * 60_000;
    case "short_break": return cfg.short_break_mins * 60_000;
    case "long_break": return cfg.long_break_mins * 60_000;
    default: return 0;
  }
}

export function elapsedMs(s: PomodoroState, now: number): number {
  if (s.phase_started_at === null) return 0;
  const end = s.paused_at ?? now;
  return Math.max(0, end - s.phase_started_at - s.paused_ms);
}

export function remainingMs(s: PomodoroState, cfg: PomodoroConfig, now: number): number {
  return Math.max(0, phaseDurationMs(s.phase, cfg) - elapsedMs(s, now));
}

export function isPhaseComplete(s: PomodoroState, cfg: PomodoroConfig, now: number): boolean {
  return s.phase !== "idle" && s.paused_at === null && remainingMs(s, cfg, now) === 0;
}

export function startFocus(s: PomodoroState, now: number): PomodoroState {
  return { ...s, phase: "focus", phase_started_at: now, paused_at: null, paused_ms: 0 };
}

export function pause(s: PomodoroState, now: number): PomodoroState {
  if (s.phase === "idle" || s.paused_at !== null) return s;
  return { ...s, paused_at: now, interruptions: s.phase === "focus" ? s.interruptions + 1 : s.interruptions };
}

export function resume(s: PomodoroState, now: number): PomodoroState {
  if (s.paused_at === null) return s;
  return { ...s, paused_ms: s.paused_ms + (now - s.paused_at), paused_at: null };
}

export function nextBreakPhase(completedFocus: number, cfg: PomodoroConfig): "short_break" | "long_break" {
  return completedFocus > 0 && completedFocus % cfg.cycles_before_long === 0 ? "long_break" : "short_break";
}

export interface AdvanceResult {
  state: PomodoroState;
  /** Set when a focus block just finished · the caller persists it as a study session. */
  completedFocus: { started_at: number; ended_at: number; focus_mins: number; interruptions: number } | null;
}

/**
 * Move to the next phase. If called on a running focus block (complete or skipped early),
 * the focused minutes are returned so partial focus is still credited.
 */
export function advance(s: PomodoroState, cfg: PomodoroConfig, now: number): AdvanceResult {
  if (s.phase === "focus") {
    const focusMs = Math.min(elapsedMs(s, now), phaseDurationMs("focus", cfg));
    const full = focusMs >= phaseDurationMs("focus", cfg);
    const completed = full ? s.completed_focus + 1 : s.completed_focus;
    const brk = full ? nextBreakPhase(completed, cfg) : "short_break";
    return {
      state: { ...s, phase: brk, phase_started_at: now, paused_at: null, paused_ms: 0, completed_focus: completed, interruptions: 0 },
      completedFocus: focusMs >= 60_000
        ? { started_at: s.phase_started_at ?? now, ended_at: now, focus_mins: Math.round(focusMs / 6_000) / 10, interruptions: s.interruptions }
        : null,
    };
  }
  if (s.phase === "short_break" || s.phase === "long_break") {
    const resetSet = s.phase === "long_break";
    return { state: { ...startFocus(s, now), completed_focus: resetSet ? 0 : s.completed_focus, interruptions: 0 }, completedFocus: null };
  }
  return { state: startFocus(s, now), completedFocus: null };
}

export function stop(s: PomodoroState, cfg: PomodoroConfig, now: number): AdvanceResult {
  if (s.phase === "focus") {
    const r = advance(s, cfg, now);
    return { state: IDLE, completedFocus: r.completedFocus };
  }
  return { state: IDLE, completedFocus: null };
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
