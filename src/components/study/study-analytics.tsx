"use client";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame, Trash2 } from "lucide-react";
import { Card, CardHeader, Stat } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/primitives";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress";
import { deleteStudySession, rateStudySession } from "@/lib/db/repo";
import { addDays, dateRange, startOfWeek } from "@/lib/math/dates";
import { dailyMinutesSeries, focusQuality, modeSplit, recallRatio, studyStreak, subjectSplit, STUDY_MODES } from "@/lib/math/study-math";
import { fmtMins, titleCase, weekdayLetter } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudySession } from "@/types/database.types";

const SUBJECT_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6", "#06B6D4", "#84CC16"];

export function StudyKpis({ sessions, today, targetHours }: { sessions: StudySession[]; today: string; targetHours: number }) {
  const weekStart = startOfWeek(today);
  const week = sessions.filter((s) => s.log_date >= weekStart);
  const todayS = sessions.filter((s) => s.log_date === today);
  const todayMins = todayS.reduce((t, s) => t + s.focus_mins, 0);
  const weekMins = week.reduce((t, s) => t + s.focus_mins, 0);
  const weekRecall = week.reduce((t, s) => t + (s.mode === "active_recall" || s.mode === "problem_solving" ? s.focus_mins : 0), 0);
  const streak = studyStreak(sessions, today);
  const poms = week.reduce((t, s) => t + s.pomodoros, 0);
  const fq = focusQuality(week);
  return (
    <Card>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Today" value={fmtMins(todayMins)} sub={`of ${targetHours}h target`} tone={todayMins >= targetHours * 60 ? "emerald" : undefined} />
        <Stat label="This week" value={fmtMins(weekMins)} sub={`${poms} pomodoros`} />
        <Stat label="Streak" value={<span className="flex items-center gap-1">{streak}<Flame size={16} className={streak ? "text-amber" : "text-faint"} /></span>} sub="days ≥30m" />
      </div>
      <ProgressBar className="mt-3" value={todayMins} max={targetHours * 60} tone="indigo" height="h-2" />
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill tone={recallRatio(weekMins, weekRecall) >= 0.35 ? "emerald" : "amber"} className="num">Recall {Math.round(recallRatio(weekMins, weekRecall) * 100)}% wk</Pill>
        {fq !== null && <Pill tone={fq >= 75 ? "emerald" : fq >= 50 ? "indigo" : "amber"} className="num">Focus quality {fq}</Pill>}
      </div>
    </Card>
  );
}

export function StudyWeekChart({ sessions, today }: { sessions: StudySession[]; today: string }) {
  const data = dailyMinutesSeries(sessions, addDays(today, -13), today).map((d) => ({ ...d, other: Math.round(d.mins - d.recall), recall: Math.round(d.recall), label: weekdayLetter(d.date) }));
  return (
    <Card className="spotlight-card">
      <CardHeader eyebrow="14 days" title="Focus minutes" action={<span className="flex items-center gap-2 text-[10px] text-faint"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-flame" />recall</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-flame/35" />other</span></span>} />
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#8E8E93", fontSize: 10, fontFamily: "var(--font-sans)" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} interval={0} />
            <YAxis tick={{ fill: "#8E8E93", fontSize: 10, fontFamily: "var(--font-sans)" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as { date: string; recall: number; other: number; mins: number };
                return (
                  <div className="rounded-xl border border-white/15 bg-black/90 backdrop-blur-xl p-2.5 shadow-2xl text-xs font-sans space-y-1">
                    <div className="text-[10px] text-zinc-400">{d.date}</div>
                    <div className="text-white font-bold">{d.mins} min total</div>
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-flame">Recall: {d.recall}m</span>
                      <span className="text-zinc-400">Other: {d.other}m</span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="recall" stackId="a" fill="#FF5533" name="Recall" animationDuration={900} />
            <Bar dataKey="other" stackId="a" fill="rgba(255,85,51,0.35)" radius={[4, 4, 0, 0]} name="Other" animationDuration={900} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/** 12-week contribution-style heatmap with 3x3 proximity wave effect on hover. */
export function StudyHeatmap({ sessions, today }: { sessions: StudySession[]; today: string }) {
  const [hoveredCell, setHoveredCell] = useState<{ w: number; d: number; date: string; mins: number } | null>(null);
  const start = startOfWeek(addDays(today, -7 * 11));
  const series = new Map(dailyMinutesSeries(sessions, start, today).map((d) => [d.date, d.mins]));
  const days = dateRange(start, addDays(startOfWeek(today), 6));
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const level = (m: number) =>
    m <= 0
      ? "bg-white/[0.04]"
      : m < 60
      ? "bg-flame/25"
      : m < 120
      ? "bg-flame/45"
      : m < 240
      ? "bg-flame/70"
      : "bg-flame";

  return (
    <Card className="spotlight-card">
      <CardHeader
        eyebrow="12 weeks"
        title="Consistency Matrix"
        action={
          hoveredCell ? (
            <span className="num text-xs text-white font-bold animate-fade-in">
              {hoveredCell.date}: {hoveredCell.mins}m
            </span>
          ) : (
            <span className="text-[10px] font-sans text-zinc-500">Proximity Wave</span>
          )
        }
      />
      <div
        className="flex justify-between gap-[3px] select-none p-1"
        onMouseLeave={() => setHoveredCell(null)}
      >
        {weeks.map((w, wIdx) => (
          <div key={w[0]} className="flex flex-1 flex-col gap-[3px]">
            {w.map((d, dIdx) => {
              const mins = Math.round(series.get(d) ?? 0);
              // Calculate distance to hovered cell for 3x3 proximity wave
              const dist =
                hoveredCell !== null
                  ? Math.max(Math.abs(hoveredCell.w - wIdx), Math.abs(hoveredCell.d - dIdx))
                  : null;

              const isDirect = dist === 0;
              const isAdjacent = dist === 1;

              return (
                <div
                  key={d}
                  onMouseEnter={() => setHoveredCell({ w: wIdx, d: dIdx, date: d, mins })}
                  className={cn(
                    "aspect-square w-full rounded-[3px] transition-all duration-150 cursor-pointer",
                    d > today ? "opacity-0 pointer-events-none" : level(mins),
                    isDirect && "scale-125 z-10 ring-2 ring-white shadow-lg",
                    isAdjacent && "scale-105 z-5 ring-1 ring-white/50",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="num mt-2.5 flex items-center justify-between text-[10px] text-faint border-t border-line/40 pt-2">
        <span>3x3 Proximity Field</span>
        <div className="flex items-center gap-1">
          <span>0m</span>
          <i className="h-2.5 w-2.5 rounded-sm bg-flame/25" />
          <i className="h-2.5 w-2.5 rounded-sm bg-flame/45" />
          <i className="h-2.5 w-2.5 rounded-sm bg-flame/70" />
          <i className="h-2.5 w-2.5 rounded-sm bg-flame" />
          <span>4h+</span>
        </div>
      </div>
    </Card>
  );
}

export function SubjectBreakdown({ sessions }: { sessions: StudySession[] }) {
  const split = subjectSplit(sessions);
  const modes = modeSplit(sessions);
  const total = Object.values(modes).reduce((a, b) => a + b, 0);
  return (
    <Card>
      <CardHeader eyebrow="30 days" title="Subjects & modes" />
      {split.length === 0 ? <EmptyState title="No sessions yet" description="Finish a focus block to see your subject split." /> : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {split.map((s, i) => <div key={s.subject} style={{ width: `${s.share * 100}%`, background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />)}
          </div>
          <ul className="mt-3 space-y-1.5">
            {split.map((s, i) => (
              <li key={s.subject} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />
                <span className="min-w-0 flex-1 truncate">{s.subject}</span>
                <span className="num text-xs text-muted">{fmtMins(s.mins)}</span>
                <span className="num w-20 text-right text-[11px] text-faint">{Math.round((s.recall_mins / Math.max(1, s.mins)) * 100)}% recall</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-5 gap-1">
            {STUDY_MODES.map((m) => (
              <div key={m} className="rounded-lg bg-surface-2 p-1.5 text-center">
                <div className="num text-xs font-semibold">{total ? Math.round((modes[m] / total) * 100) : 0}%</div>
                <div className="truncate text-[9px] text-faint">{titleCase(m)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function SessionLog({ sessions }: { sessions: StudySession[] }) {
  const recent = [...sessions].sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 12);
  if (!recent.length) {
    return (
      <Card>
        <CardHeader eyebrow="Log" title="Recent sessions" />
        <EmptyState
          illustrationSrc="/images/illus/empty-focus.png"
          title="No focus sessions logged"
          description="Start the timer on the left to begin your first deep-work block."
        />
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader eyebrow="Log" title="Recent sessions" />
      <ul className="space-y-1">
        {recent.map((s) => (
          <li key={s.id} className="flex items-center gap-2 rounded-xl bg-surface-2 py-1.5 pl-3 pr-1">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{s.subject} <span className="text-[11px] text-faint">· {titleCase(s.mode)}</span></div>
              <div className="num text-[11px] text-muted">
                {new Date(s.started_at).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" })} · {fmtMins(s.focus_mins)}
                {s.pomodoros > 0 && ` · 🍅${s.pomodoros}`}{s.interruptions > 0 && ` · ${s.interruptions} pauses`}
              </div>
            </div>
            <div className="flex" role="radiogroup" aria-label="Focus rating">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" aria-label={`Rate focus ${r}`} onClick={() => void rateStudySession(s.id, r)}
                  className={cn("h-9 w-5 text-xs", (s.focus_rating ?? 0) >= r ? "text-amber" : "text-white/15")}>★</button>
              ))}
            </div>
            <button type="button" aria-label="Delete session" onClick={() => void deleteStudySession(s.id)} className="flex h-10 w-9 items-center justify-center text-faint hover:text-coral"><Trash2 size={13} /></button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
