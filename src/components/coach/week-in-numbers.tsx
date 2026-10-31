"use client";
import { Card, CardHeader, Stat } from "@/components/ui/card";
import type { WeeklyTelemetry } from "@/lib/ai/schemas";
import { fmtInt } from "@/lib/format";

function sleepLine(x: { days: number; avg_study_hours: number | null; avg_workout_rpe: number | null }) {
  if (x.days === 0) return <span className="text-faint">no days logged</span>;
  return (
    <>
      <span className="text-fg">{x.avg_study_hours ?? 0}h study</span>
      {x.avg_workout_rpe !== null && `, RPE ${x.avg_workout_rpe}`} ({x.days}d)
    </>
  );
}

/** Deterministic, zero-cost telemetry digest · always available, even with AI off. */
export function WeekInNumbers({ t }: { t: WeeklyTelemetry }) {
  const c = t.computed_correlations;
  const avgScore = Math.round(t.daily_series.reduce((s, d) => s + d.day_score, 0) / Math.max(1, t.daily_series.length));
  const cur = t.money_summary.currency === "INR" ? "₹" : `${t.money_summary.currency} `;
  return (
    <Card>
      <CardHeader eyebrow={`${t.window.start} → ${t.window.end}`} title="This week in numbers" />
      <div className="grid grid-cols-3 gap-x-3 gap-y-4">
        <Stat label="Day score" value={avgScore} sub="7d avg" tone={avgScore >= 70 ? "emerald" : avgScore >= 50 ? "flame" : "amber"} />
        <Stat label="Sleep" value={c.avg_sleep_hours?.toFixed(1) ?? "-"} unit="h" sub={`${c.after_short_sleep.days} days <6.5h`} tone={(c.avg_sleep_hours ?? 8) < 6.5 ? "coral" : undefined} />
        <Stat label="Study" value={t.study_summary.total_hours.toFixed(1)} unit="h" sub={`${Math.round(t.study_summary.active_recall_ratio * 100)}% recall`} />
        <Stat label="Tonnage" value={fmtInt(t.training_summary.tonnage_kg)} unit="kg" sub={`${t.training_summary.workouts_completed} sessions`} />
        <Stat label="Protein" value={c.protein_per_kg?.toFixed(2) ?? "-"} unit="g/kg" sub={`${c.avg_kcal_point ? fmtInt(c.avg_kcal_point) : "-"} kcal/d`} tone={(c.protein_per_kg ?? 2) < 1.6 ? "amber" : "flame"} />
        <Stat label="Weight Δ" value={c.weight_trend_delta_kg === null ? "-" : `${c.weight_trend_delta_kg > 0 ? "+" : ""}${c.weight_trend_delta_kg.toFixed(2)}`} unit="kg" sub="vs prior 7d" />
      </div>
      <div className="num mt-4 rounded-xl bg-surface-2 p-3 text-[11px] leading-relaxed text-muted">
        After &lt;6.5h sleep: {sleepLine(c.after_short_sleep)}
        <br />After ≥7.5h sleep: {sleepLine(c.after_long_sleep)}
        <br />Spend: <span className="text-fg">{cur}{fmtInt(t.money_summary.week_spend)}</span> this week · {cur}{fmtInt(t.money_summary.month_to_date)} / {cur}{fmtInt(t.money_summary.month_budget)} MTD
      </div>
    </Card>
  );
}
