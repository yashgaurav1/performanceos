"use client";
import { useState } from "react";
import { Pause, Play, SkipForward, Square, Coffee, Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KineticFocusDial } from "./kinetic-focus-dial";
import { Magnetic } from "@/components/motion/magnetic";
import { useFocusTimer, stopwatchElapsed } from "@/lib/hooks/use-focus-timer";
import { useNow } from "@/lib/hooks/use-today";
import { formatClock, phaseDurationMs, remainingMs } from "@/lib/math/pomodoro";
import { STUDY_MODES, type StudyMode } from "@/lib/math/study-math";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

const PRESETS = [25, 50, 90] as const;
const MODE_HINT: Record<StudyMode, string> = {
  lecture: "Passive intake", active_recall: "Flashcards / blurting", problem_solving: "PYQs / mock drill", revision: "Re-reading notes", reading: "Textbook",
};

export function PomodoroPanel({ subjects }: { subjects: string[] }) {
  const ft = useFocusTimer();
  const { timer, cfg } = ft;
  const now = useNow(ft.running && !ft.paused, 1000) || Date.now();
  const [newSubject, setNewSubject] = useState("");

  const isPomo = timer.kind === "pomodoro";
  const phase = timer.pomo.phase;
  const total = isPomo ? (phase === "idle" ? cfg.focus_mins * 60_000 : phaseDurationMs(phase, cfg)) : 0;
  const remaining = isPomo ? (phase === "idle" ? total : remainingMs(timer.pomo, cfg, now)) : 0;
  const swMs = !isPomo ? stopwatchElapsed(timer.sw, now) : 0;
  const onBreak = phase === "short_break" || phase === "long_break";
  const cycleDots = Array.from({ length: cfg.cycles_before_long }, (_, i) => i < timer.pomo.completed_focus);

  const stopAndLog = async () => {
    const s = await ft.stop();
    if (s) {
      void fetch("/api/study/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: s.subject,
          durationMinutes: Math.max(1, Math.round(s.focus_mins)),
          mode: s.mode,
        }),
      }).catch(() => undefined);
      toast(`${Math.round(s.focus_mins)}m logged`, { tone: "emerald", body: `${s.subject} · ${titleCase(s.mode)}` });
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={cn("pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full blur-3xl", onBreak ? "bg-emerald/10" : "bg-indigo/10")} />
      <div className="relative flex flex-col items-center">
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
          {onBreak ? <Coffee size={13} className="text-emerald" /> : <Brain size={13} className="text-indigo" />}
          {isPomo ? (phase === "idle" ? "Ready" : titleCase(phase)) : "Stopwatch"}
          {ft.paused && <span className="text-amber">· paused</span>}
        </div>
        <KineticFocusDial
          progressRatio={isPomo ? (total > 0 ? (total - remaining) / total : 0) : ((swMs % 3_600_000) / 3_600_000)}
          timeFormatted={formatClock(isPomo ? remaining : swMs)}
          subject={timer.subject}
          mode={titleCase(timer.mode)}
          isBreak={onBreak}
          paused={ft.paused}
          size={236}
        />

        {isPomo && (
          <div className="mt-2 flex items-center gap-1.5" aria-label={`${timer.pomo.completed_focus} of ${cfg.cycles_before_long} blocks`}>
            {cycleDots.map((d, i) => (
              <span key={i} className={cn("h-1.5 w-4 rounded-full transition-all", d ? "bg-flame shadow-[0_0_6px_#FF5533]" : "bg-white/10")} />
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          {!ft.running ? (
            <Magnetic>
              <Button variant="primary" size="lg" className="w-40 font-bold action-surface-white" onClick={() => ft.startPomodoro(timer.focus_override)}>
                <Play size={18} fill="#050505" /> Start focus
              </Button>
            </Magnetic>
          ) : (
            <>
              {ft.paused ? (
                <Magnetic>
                  <Button variant="primary" size="lg" className="action-surface-white" onClick={ft.resume}>
                    <Play size={18} fill="#050505" /> Resume
                  </Button>
                </Magnetic>
              ) : (
                <Magnetic>
                  <Button size="lg" onClick={ft.pause}><Pause size={18} /> Pause</Button>
                </Magnetic>
              )}
              {isPomo && <Button size="lg" aria-label={onBreak ? "Skip break" : "Finish block early"} onClick={() => void ft.skip()}><SkipForward size={18} /></Button>}
              <Button size="lg" variant="danger" aria-label="Stop and log" onClick={() => void stopAndLog()}><Square size={16} /></Button>
            </>
          )}
        </div>

        {!ft.running && (
          <div className="mt-3 flex w-full gap-1.5">
            {PRESETS.map((m) => (
              <button key={m} type="button" onClick={() => ft.setTimer((t) => ({ ...t, kind: "pomodoro", focus_override: m }))}
                className={cn("num h-10 flex-1 rounded-xl border text-xs font-medium", isPomo && cfg.focus_mins === m ? "border-indigo/40 bg-indigo/10 text-indigo" : "border-line text-muted")}>
                {m}m
              </button>
            ))}
            <button type="button" onClick={ft.startStopwatch} className="h-10 flex-1 rounded-xl border border-line text-xs font-medium text-muted">Stopwatch</button>
          </div>
        )}
        <div className="num mt-2 text-[11px] text-faint">
          {cfg.focus_mins}m focus · {cfg.short_break_mins}m break · {cfg.long_break_mins}m long break every {cfg.cycles_before_long}
        </div>
      </div>

      <div className="relative mt-5 space-y-3">
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-faint">Subject</div>
          <div className="fade-mask-x no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-1">
            {subjects.map((s) => (
              <button key={s} type="button" onClick={() => ft.setSubject(s)}
                className={cn("h-9 shrink-0 rounded-full border px-3 text-xs font-medium transition-all hover:border-white/20 active:scale-95", timer.subject === s ? "border-indigo/40 bg-indigo/15 text-indigo shadow-xs" : "border-line text-muted bg-surface-2/40")}>{s}</button>
            ))}
            <form className="flex shrink-0 gap-1" onSubmit={(e) => { e.preventDefault(); if (newSubject.trim()) { ft.setSubject(newSubject.trim()); setNewSubject(""); } }}>
              <Input className="h-9 w-32 rounded-full text-xs" placeholder="+ subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} aria-label="New subject" />
            </form>
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-faint">Mode</div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {STUDY_MODES.map((m) => (
              <button key={m} type="button" onClick={() => ft.setMode(m)}
                className={cn("flex min-h-12 flex-col items-start justify-center rounded-xl border px-2.5 text-left", timer.mode === m ? "border-indigo/40 bg-indigo/10" : "border-line")}>
                <span className={cn("text-xs font-medium", timer.mode === m ? "text-indigo" : "text-fg")}>{titleCase(m)}</span>
                <span className="text-[10px] text-faint">{MODE_HINT[m]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
