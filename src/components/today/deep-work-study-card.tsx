"use client";
import Link from "next/link";
import { BookOpen, ChevronRight, Pause, Play, SkipForward, Square, Timer } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { toast } from "@/components/ui/toast";
import { useDailyLog, useProfile } from "@/lib/db/hooks";
import { addStudySession } from "@/lib/db/repo";
import { formatClock, remainingMs } from "@/lib/math/pomodoro";
import { recallRatio } from "@/lib/math/study-math";
import { stopwatchElapsed, useFocusTimer } from "@/lib/hooks/use-focus-timer";
import { useNow } from "@/lib/hooks/use-today";
import { fmtMins, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRESETS = [25, 50, 90] as const;
const PHASE_LABEL = { idle: "Ready", focus: "Focus", short_break: "Short break", long_break: "Long break" } as const;

export function FocusClock({ big = false }: { big?: boolean }) {
  const ft = useFocusTimer();
  const { timer, cfg } = ft;
  const now = useNow(ft.running && !ft.paused, 1000) || Date.now();
  const display = timer.kind === "stopwatch" ? formatClock(stopwatchElapsed(timer.sw, now)) : timer.pomo.phase === "idle" ? formatClock(cfg.focus_mins * 60_000) : formatClock(remainingMs(timer.pomo, cfg, now));
  const isBreak = timer.kind === "pomodoro" && timer.pomo.phase.includes("break");
  return (
    <div className={cn("num font-semibold leading-none tracking-tight", big ? "text-6xl" : "text-4xl", isBreak ? "text-emerald" : ft.running ? "text-fg" : "text-muted")}>
      {display}
    </div>
  );
}

export function DeepWorkStudyCard({ date }: { date: string }) {
  const profile = useProfile();
  const log = useDailyLog(date);
  const ft = useFocusTimer();
  const { timer, cfg } = ft;

  const studyMins = (log?.study_hours ?? 0) * 60;
  const recallMins = log?.active_recall_mins ?? 0;
  const ratio = recallRatio(studyMins, recallMins);
  const targetMins = profile.target_study_hours * 60;

  const quickAdd = async (mode: "lecture" | "active_recall") => {
    const end = new Date();
    await addStudySession({ subject: timer.subject, mode, source: "manual", started_at: new Date(end.getTime() - 30 * 60_000).toISOString(), ended_at: end.toISOString(), focus_mins: 30, log_date: date });
    toast(`+30m ${mode === "lecture" ? "Lecture" : "Active Recall"}`, { tone: "emerald", body: timer.subject });
  };

  const phase = timer.kind === "stopwatch" ? (timer.sw.started_at ? "Stopwatch" : "Ready") : PHASE_LABEL[timer.pomo.phase];

  return (
    <Card>
      <CardHeader eyebrow="Deep work" title="Study" icon={<BookOpen size={16} />}
        action={<Link href="/study" className="flex h-9 items-center gap-0.5 rounded-lg px-2 text-xs text-muted hover:text-fg">Study OS <ChevronRight size={14} /></Link>} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-faint">
            <Timer size={12} /> {phase}{timer.kind === "pomodoro" && timer.pomo.phase !== "idle" && <span className="num normal-case">· #{timer.pomo.completed_focus + (timer.pomo.phase === "focus" ? 1 : 0)}</span>}
          </div>
          <FocusClock />
          <div className="mt-1 truncate text-xs text-muted">{timer.subject} · {titleCase(timer.mode)}</div>
        </div>
        <div className="flex gap-1.5">
          {!ft.running ? (
            <Button variant="primary" size="icon" aria-label="Start focus" onClick={() => ft.startPomodoro(timer.focus_override)}><Play size={18} /></Button>
          ) : ft.paused ? (
            <Button variant="primary" size="icon" aria-label="Resume" onClick={ft.resume}><Play size={18} /></Button>
          ) : (
            <Button size="icon" aria-label="Pause" onClick={ft.pause}><Pause size={18} /></Button>
          )}
          {ft.running && timer.kind === "pomodoro" && <Button size="icon" aria-label="Skip phase" onClick={() => void ft.skip()}><SkipForward size={18} /></Button>}
          {ft.running && <Button size="icon" variant="danger" aria-label="Stop and log" onClick={() => void ft.stop()}><Square size={16} /></Button>}
        </div>
      </div>

      {!ft.running && (
        <div className="mt-3 flex gap-1.5">
          {PRESETS.map((m) => (
            <button key={m} type="button" onClick={() => ft.startPomodoro(m)}
              className={cn("num h-10 flex-1 rounded-xl border text-xs font-semibold transition-all active:scale-95", cfg.focus_mins === m ? "border-flame/50 bg-flame/15 text-flame shadow-xs" : "border-line text-muted hover:border-line-strong hover:text-fg")}>
              {m}m
            </button>
          ))}
          <button type="button" onClick={ft.startStopwatch} className="h-10 flex-1 rounded-xl border border-line text-xs font-medium text-muted hover:text-fg">Stopwatch</button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <Button size="sm" className="h-10" onClick={() => void quickAdd("lecture")}>+30m Lecture</Button>
        <Button size="sm" className="h-10" onClick={() => void quickAdd("active_recall")}>+30m Active Recall / Mock</Button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted">Today</span>
          <span className="num"><span className="font-semibold text-fg">{fmtMins(studyMins)}</span><span className="text-faint"> / {fmtMins(targetMins)}</span></span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="absolute inset-y-0 left-0 rounded-full bg-indigo/40 transition-all" style={{ width: `${Math.min(100, (studyMins / Math.max(1, targetMins)) * 100)}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-indigo transition-all" style={{ width: `${Math.min(100, (recallMins / Math.max(1, targetMins)) * 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full bg-indigo" />Active Recall</span>
          <Pill tone={ratio >= 0.35 || recallMins >= 45 ? "emerald" : ratio > 0 ? "amber" : "neutral"} className="num">
            {Math.round(ratio * 100)}% · {recallMins}m {ratio >= 0.35 || recallMins >= 45 ? "✓" : "· goal 35%"}
          </Pill>
        </div>
      </div>
    </Card>
  );
}
