"use client";
import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Settings, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill, TogglePill, type Tone } from "@/components/ui/pill";
import type { BarTone } from "@/components/ui/progress";
import { Sparkline } from "@/components/ui/sparkline";
import { KineticScoreDial } from "./kinetic-score-dial";
import { useDailyLog, useDailyLogsRange, useProfile } from "@/lib/db/hooks";
import { updateProfile } from "@/lib/db/repo";
import { addDays, dateRange } from "@/lib/math/dates";
import { CRUNCH_MAX, STANDARD_MAX, type ScoreBreakdown } from "@/lib/math/day-score";
import { fmtDateLong, weekdayLetter } from "@/lib/format";

export function scoreTone(score: number): BarTone {
  if (score >= 75) return "emerald";
  if (score >= 50) return "flame";
  if (score >= 30) return "amber";
  return "coral";
}

function ratioTone(v: number, max: number): Tone {
  const r = max ? v / max : 0;
  if (r >= 0.85) return "emerald";
  if (r >= 0.5) return "flame";
  if (r > 0) return "amber";
  return "neutral";
}

const LABELS: { key: keyof ScoreBreakdown; label: string; crunchLabel?: string }[] = [
  { key: "sleep", label: "Sleep" },
  { key: "nutrition", label: "Nutrition" },
  { key: "study", label: "Study" },
  { key: "training", label: "Training", crunchLabel: "Move" },
  { key: "tasks", label: "Tasks" },
];

export function DayScoreTelemetryHeader({ date }: { date: string }) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const profile = useProfile();
  const log = useDailyLog(date);
  const week = useDailyLogsRange(addDays(date, -6), date);
  const crunch = profile.exam_crunch_mode;
  const max = crunch ? CRUNCH_MAX : STANDARD_MAX;
  const score = log?.day_score ?? 0;
  const bd = log?.score_breakdown ?? {};
  const byDate = new Map(week.map((l) => [l.log_date, l.day_score]));
  const series = dateRange(addDays(date, -6), date).map((d) => ({
    x: d,
    y: byDate.get(d) ?? null,
  }));
  const avg7 = week.length
    ? Math.round(week.reduce((t, l) => t + l.day_score, 0) / week.length)
    : null;

  const scoreLabel =
    score >= 80
      ? "Peak Performance"
      : score >= 60
      ? "Steady Progress"
      : score >= 40
      ? "Active Focus"
      : "Recovery Day";

  return (
    <Card className="relative overflow-hidden p-4.5" highlight="flame">
      {/* PerformanceOS ambient glow */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-flame/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-flame">
            <Sparkles size={12} className="text-flame" /> Daily Score
          </div>
          <div className="text-sm font-semibold text-fg mt-0.5">{fmtDateLong(date)}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <TogglePill
            active={crunch}
            tone="amber"
            onClick={() => void updateProfile({ exam_crunch_mode: !crunch })}
            aria-label="Toggle Exam Crunch Mode"
          >
            <GraduationCap size={14} /> {crunch ? "Crunch Active" : "Exam Crunch"}
          </TogglePill>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-white/5 hover:text-fg lg:hidden border border-line"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>

      <div className="relative mt-3.5 flex items-center gap-5">
        <KineticScoreDial score={score} highlightCategory={hoveredCategory} size={118} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
              {scoreLabel}
            </span>
            {avg7 !== null && (
              <span className="num text-[11px] font-semibold text-muted">
                7d avg <span className="text-fg font-bold">{avg7}</span>
              </span>
            )}
          </div>
          <Sparkline data={series} color="#FF5533" height={44} domain={[0, 100]} />
          <div className="num flex justify-between px-0.5 text-[9px] font-semibold text-faint mt-1">
            {series.map((p) => (
              <span key={p.x}>{weekdayLetter(p.x)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-3.5 flex flex-wrap gap-1.5 pt-2 border-t border-line/60">
        {LABELS.map(({ key, label, crunchLabel }) => {
          const v = Math.round(bd[key] ?? 0);
          const displayLabel = crunch && crunchLabel ? crunchLabel : label;
          return (
            <div
              key={key}
              onMouseEnter={() => setHoveredCategory(`${displayLabel}: ${v}/${max[key]}`)}
              onMouseLeave={() => setHoveredCategory(null)}
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <Pill tone={ratioTone(v, max[key])} className="num text-[10px]">
                {displayLabel} {v}/{max[key]}
              </Pill>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
