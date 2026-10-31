"use client";
import { Card } from "@/components/ui/card";
import { MUSCLE_LABELS } from "@/lib/exercises";
import type { MuscleVolume } from "@/lib/math/gym-math";
import { cn } from "@/lib/utils";

const STATUS: Record<MuscleVolume["status"], { cls: string; label: string }> = {
  under_target: { cls: "border-amber/25 text-amber", label: "Under" },
  optimal: { cls: "border-emerald/25 text-emerald", label: "Optimal" },
  upper_zone: { cls: "border-flame/30 text-flame", label: "Upper" },
  high_fatigue_risk: { cls: "border-coral/30 text-coral", label: "Fatigue" },
};

export function WeeklyMuscleVolumeBar({ volume }: { volume: MuscleVolume[] }) {
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Weekly fractional sets · 7d</span>
        <span className="num text-[10px] text-faint">- optimal</span>
      </div>
      {volume.length === 0 ? (
        <div className="px-1 py-2 text-xs text-muted">No hard sets in the last 7 days.</div>
      ) : (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-1 pb-1">
          {volume.map((v) => (
            <div key={v.muscle} className={cn("shrink-0 rounded-xl border bg-surface-2 px-3 py-2", STATUS[v.status].cls)}>
              <div className="text-[11px] text-muted">{MUSCLE_LABELS[v.muscle] ?? v.muscle}</div>
              <div className="num text-base font-semibold">{v.sets.toFixed(1)}<span className="ml-0.5 text-[10px] font-normal text-faint">sets</span></div>
              <div className="relative mt-1 h-1 w-16 overflow-hidden rounded-full bg-white/5">
                <div className="absolute inset-y-0 left-[36%] right-[18%] bg-emerald/20" />
                <div className="absolute inset-y-0 left-0 rounded-full bg-current" style={{ width: `${Math.min(100, (v.sets / 22) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
