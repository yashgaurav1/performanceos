"use client";
import { AlertTriangle, Dumbbell, Trophy } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/primitives";
import { Pill } from "@/components/ui/pill";
import { Sparkline } from "@/components/ui/sparkline";
import { startWorkout } from "@/lib/db/repo";
import { EXERCISE_MAP, SPLIT_TEMPLATES } from "@/lib/exercises";
import { detectStalledLift, recommendNextTarget } from "@/lib/math/gym-math";
import { fmtDateShort, fmtInt } from "@/lib/format";
import { useProfile } from "@/lib/db/hooks";
import type { useTrainingData } from "./training-data";

export function StartWorkoutCard({ today, onStarted }: { today: string; onStarted?: () => void }) {
  return (
    <Card>
      <CardHeader eyebrow="Start session" title="Pick a split" icon={<Dumbbell size={16} />} />
      <div className="grid grid-cols-3 gap-2">
        {[...Object.keys(SPLIT_TEMPLATES), "Custom"].map((split) => (
          <button key={split} type="button" onClick={async () => { await startWorkout(split, today); onStarted?.(); }}
            className="flex h-16 flex-col items-center justify-center rounded-2xl border border-line bg-surface-2 text-sm font-semibold transition-all hover:border-flame/40 hover:bg-flame/10 active:scale-95 shadow-xs">
            {split}
            <span className="num text-[10px] font-normal text-faint">{SPLIT_TEMPLATES[split]?.length ?? 0} lifts</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

export function LiftTelemetry({ data }: { data: ReturnType<typeof useTrainingData> }) {
  const profile = useProfile();
  const rows = data.exerciseSlugs
    .map((slug) => {
      const ex = EXERCISE_MAP.get(slug);
      if (!ex) return null;
      const hist = data.history(slug);
      const series = hist.map((h) => ({ x: h.date, y: Math.max(0, ...h.sets.filter((s) => s.set_type !== "warmup").map((s) => s.est_1rm)) }));
      const stall = detectStalledLift(hist.slice(-4), data.recovery, { body_weight_kg: profile.body_weight_kg });
      const target = recommendNextTarget(hist.at(-1)?.sets ?? [], ex);
      return { ex, series, stall, target, last: hist.at(-1)?.date ?? "" };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => Number(b.stall.status === "STALLED") - Number(a.stall.status === "STALLED") || b.last.localeCompare(a.last));

  return (
    <Card>
      <CardHeader eyebrow="Progressive overload" title="Strength log" icon={<Trophy size={16} />} />
      {rows.length === 0 ? (
        <EmptyState title="No lifts logged yet" description="Your first session sets the baseline. Targets, PRs and stall diagnosis appear from session 2." />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map(({ ex, series, stall, target, last }) => {
            const best = Math.max(...series.map((s) => s.y ?? 0));
            return (
              <li key={ex.slug} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{ex.name}</span>
                    {stall.status === "STALLED" && <Pill tone="coral"><AlertTriangle size={10} /> Stalled</Pill>}
                  </div>
                  <div className="num truncate text-[11px] text-muted">
                    {stall.status === "STALLED" ? stall.prescription : target.message}
                  </div>
                  <div className="num text-[10px] text-faint">best e1RM {best.toFixed(1)}kg · last {last && fmtDateShort(last)}</div>
                </div>
                <div className="w-20 shrink-0">
                  <Sparkline data={series} color={stall.status === "STALLED" ? "#F43F5E" : "#10B981"} height={32} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function RecentWorkouts({ data }: { data: ReturnType<typeof useTrainingData> }) {
  const recent = data.workouts.filter((w) => w.ended_at).sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 6);
  if (recent.length === 0) {
    return (
      <Card>
        <CardHeader eyebrow="History" title="Recent sessions" />
        <EmptyState
          illustrationSrc="/images/illus/empty-workouts.png"
          title="No workouts logged yet"
          description="Pick a split above to start tracking your sets, reps and personal records."
        />
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader eyebrow="History" title="Recent sessions" />
      <ul className="space-y-1.5">
        {recent.map((w) => (
          <li key={w.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
            <div>
              <div className="text-sm font-medium">{w.split_name}</div>
              <div className="num text-[11px] text-faint">{fmtDateShort(w.log_date)}{w.session_rpe !== null && ` · RPE ${w.session_rpe}`}</div>
            </div>
            <div className="text-right">
              <div className="num text-sm font-semibold">{fmtInt(w.total_volume_kg)} kg</div>
              {w.pr_count > 0 && <div className="num text-[11px] text-[#F5D06A]">{w.pr_count} PR{w.pr_count > 1 ? "s" : ""}</div>}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
