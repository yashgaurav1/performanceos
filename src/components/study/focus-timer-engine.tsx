"use client";
import { useEffect } from "react";
import { advance, isPhaseComplete, phaseDurationMs, type PomodoroState } from "@/lib/math/pomodoro";
import { useFocusTimer } from "@/lib/hooks/use-focus-timer";
import { useNow } from "@/lib/hooks/use-today";
import { beep, notify } from "@/lib/audio";
import { toast } from "@/components/ui/toast";

/**
 * Headless engine mounted once in the shell: completes phases (even after the app was closed),
 * logs finished focus blocks as study sessions, beeps, and parks finished breaks in "ready" (idle).
 */
export function FocusTimerEngine() {
  const { timer, cfg, setTimer, logFocus } = useFocusTimer();
  const active = timer.kind === "pomodoro" && timer.pomo.phase !== "idle" && timer.pomo.paused_at === null;
  const now = useNow(active, 1000);

  useEffect(() => {
    if (!active) return;
    const t = Date.now();
    const s = timer.pomo;
    if (!isPhaseComplete(s, cfg, t)) return;
    const phaseEnd = (s.phase_started_at ?? t) + s.paused_ms + phaseDurationMs(s.phase, cfg);

    if (s.phase === "focus") {
      const r = advance(s, cfg, phaseEnd);
      setTimer({ ...timer, pomo: r.state });
      void logFocus(r.completedFocus, timer, "pomodoro");
      beep([0, 200, 400]);
      const longBreak = r.state.phase === "long_break";
      toast(`Focus block done · ${cfg.focus_mins}m logged`, { tone: "emerald", body: longBreak ? `Long break: ${cfg.long_break_mins}m` : `Break: ${cfg.short_break_mins}m` });
      notify("Focus block complete", `${cfg.focus_mins} min of ${timer.subject} logged. Take a break.`);
    } else {
      const ready: PomodoroState = { ...s, phase: "idle", phase_started_at: null, paused_at: null, paused_ms: 0, completed_focus: s.phase === "long_break" ? 0 : s.completed_focus };
      setTimer({ ...timer, pomo: ready });
      beep([0, 250], 660);
      toast("Break over · ready for the next block", { tone: "neutral" });
      notify("Break over", "Ready for the next focus block.");
    }
  }, [now, active, timer, cfg, setTimer, logFocus]);

  return null;
}
