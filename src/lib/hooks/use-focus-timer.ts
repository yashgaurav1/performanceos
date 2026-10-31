"use client";
/**
 * Shared focus timer (Pomodoro + stopwatch) persisted in localStorage so closing the PWA never loses time.
 * The same state drives the Today card and the Study page; <FocusTimerEngine/> handles phase completion.
 */
import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";
import { useProfile } from "@/lib/db/hooks";
import { addStudySession } from "@/lib/db/repo";
import {
  advance, DEFAULT_POMODORO, elapsedMs, IDLE, pause as pausePomo, resume as resumePomo, startFocus, stop as stopPomo,
  type PomodoroConfig, type PomodoroState,
} from "@/lib/math/pomodoro";
import type { StudyMode } from "@/lib/math/study-math";

export interface StopwatchState {
  started_at: number | null;
  paused_at: number | null;
  paused_ms: number;
}

export interface FocusTimerState {
  kind: "pomodoro" | "stopwatch";
  pomo: PomodoroState;
  /** Focus length override for this run (25/50/90 presets); null = profile default. */
  focus_override: number | null;
  sw: StopwatchState;
  subject: string;
  mode: StudyMode;
}

export const FOCUS_TIMER_KEY = "cc:focus-timer";

export const INITIAL_TIMER: FocusTimerState = {
  kind: "pomodoro", pomo: IDLE, focus_override: null, sw: { started_at: null, paused_at: null, paused_ms: 0 }, subject: "General", mode: "lecture",
};

export function stopwatchElapsed(sw: StopwatchState, now: number) {
  if (sw.started_at === null) return 0;
  return Math.max(0, (sw.paused_at ?? now) - sw.started_at - sw.paused_ms);
}

export function useFocusTimer() {
  const profile = useProfile();
  const [timer, setTimer] = useLocalStorage<FocusTimerState>(FOCUS_TIMER_KEY, INITIAL_TIMER);

  const cfg: PomodoroConfig = {
    focus_mins: timer.focus_override ?? profile.pomodoro_focus_mins ?? DEFAULT_POMODORO.focus_mins,
    short_break_mins: profile.pomodoro_short_break_mins ?? DEFAULT_POMODORO.short_break_mins,
    long_break_mins: profile.pomodoro_long_break_mins ?? DEFAULT_POMODORO.long_break_mins,
    cycles_before_long: profile.pomodoro_cycles_before_long ?? DEFAULT_POMODORO.cycles_before_long,
  };

  const running = timer.kind === "pomodoro" ? timer.pomo.phase !== "idle" : timer.sw.started_at !== null;
  const paused = timer.kind === "pomodoro" ? timer.pomo.paused_at !== null : timer.sw.paused_at !== null;

  const logFocus = useCallback(
    async (f: { started_at: number; ended_at: number; focus_mins: number; interruptions: number } | null, t: FocusTimerState, source: "pomodoro" | "stopwatch") => {
      if (!f || f.focus_mins < 1) return null;
      const lockKey = `cc:focus-logged:${f.started_at}`;
      if (localStorage.getItem(lockKey)) return null;
      localStorage.setItem(lockKey, "1");
      return addStudySession({
        subject: t.subject, mode: t.mode, source, started_at: new Date(f.started_at).toISOString(), ended_at: new Date(f.ended_at).toISOString(),
        focus_mins: f.focus_mins, pomodoros: source === "pomodoro" && f.focus_mins >= cfg.focus_mins - 0.05 ? 1 : 0, interruptions: f.interruptions,
      });
    },
    [cfg.focus_mins],
  );

  const startPomodoro = (focusMins: number | null = null) => {
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
    setTimer((t) => ({ ...t, kind: "pomodoro", focus_override: focusMins, pomo: startFocus(t.pomo.phase === "idle" ? t.pomo : IDLE, Date.now()) }));
  };

  const startStopwatch = () => setTimer((t) => ({ ...t, kind: "stopwatch", pomo: IDLE, sw: { started_at: Date.now(), paused_at: null, paused_ms: 0 } }));

  const pause = () =>
    setTimer((t) => t.kind === "pomodoro"
      ? { ...t, pomo: pausePomo(t.pomo, Date.now()) }
      : t.sw.paused_at === null ? { ...t, sw: { ...t.sw, paused_at: Date.now() } } : t);

  const resume = () =>
    setTimer((t) => t.kind === "pomodoro"
      ? { ...t, pomo: resumePomo(t.pomo, Date.now()) }
      : t.sw.paused_at !== null ? { ...t, sw: { ...t.sw, paused_ms: t.sw.paused_ms + (Date.now() - t.sw.paused_at), paused_at: null } } : t);

  /** Skip to the next phase (credits partial focus). */
  const skip = async () => {
    const now = Date.now();
    const r = advance(timer.pomo, cfg, now);
    setTimer({ ...timer, pomo: r.state });
    return logFocus(r.completedFocus, timer, "pomodoro");
  };

  /** Stop and log whatever focus time accrued. */
  const stop = async () => {
    const now = Date.now();
    if (timer.kind === "stopwatch") {
      const ms = stopwatchElapsed(timer.sw, now);
      setTimer({ ...timer, sw: INITIAL_TIMER.sw });
      return logFocus({ started_at: timer.sw.started_at ?? now, ended_at: now, focus_mins: Math.round(ms / 6000) / 10, interruptions: 0 }, timer, "stopwatch");
    }
    const r = stopPomo(timer.pomo, cfg, now);
    setTimer({ ...timer, pomo: { ...r.state, completed_focus: 0 } });
    return logFocus(r.completedFocus, timer, "pomodoro");
  };

  const setSubject = (subject: string) => setTimer((t) => ({ ...t, subject }));
  const setMode = (mode: StudyMode) => setTimer((t) => ({ ...t, mode }));

  return {
    timer, cfg, running, paused, setTimer, logFocus,
    startPomodoro, startStopwatch, pause, resume, skip, stop, setSubject, setMode,
    focusElapsedMs: (now: number) => (timer.kind === "pomodoro" ? (timer.pomo.phase === "focus" ? elapsedMs(timer.pomo, now) : 0) : stopwatchElapsed(timer.sw, now)),
  };
}
