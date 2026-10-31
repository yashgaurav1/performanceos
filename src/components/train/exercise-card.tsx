"use client";
import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, Plus, Trash2, TrendingUp, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Exercise, WorkoutSet } from "@/types/database.types";
import type { OverloadTarget, SetType, StallReport } from "@/lib/math/gym-math";
import { MUSCLE_LABELS } from "@/lib/exercises";
import { fmtKg, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NumpadField } from "./custom-numpad";

export interface SetDraft { weight: string; reps: string; rir: string; type: SetType }
export interface Ghost { weight_kg: number; reps: number; rir: number | null; set_type: SetType }

const TYPE_BADGE: Record<SetType, { label: string; cls: string }> = {
  warmup: { label: "W", cls: "text-amber" },
  working: { label: "", cls: "text-fg" },
  dropset: { label: "D", cls: "text-indigo" },
  failure: { label: "F", cls: "text-coral" },
};

const CAUSE_LABEL: Record<string, string> = {
  RECOVERY_DEBT_STALL: "Recovery-debt stall",
  LOCAL_FATIGUE_STALL: "Local-fatigue stall",
  MICRO_LOAD_STALL: "Micro-load stall",
};

export function ExerciseCard({
  exercise, logged, ghosts, target, stall, best1RM, drafts, active, onFocusField, onLog, onDelete,
}: {
  exercise: Exercise;
  logged: WorkoutSet[];
  ghosts: (Ghost | undefined)[];
  target: OverloadTarget;
  stall: StallReport;
  best1RM: number;
  drafts: Record<number, SetDraft | undefined>;
  active: { setNumber: number; field: NumpadField } | null;
  onFocusField: (setNumber: number, field: NumpadField) => void;
  onLog: (setNumber: number) => void;
  onDelete: (setId: string) => void;
}) {
  const [extra, setExtra] = useState(0);
  const [openDiag, setOpenDiag] = useState(false);
  const maxLogged = logged.reduce((m, s) => Math.max(m, s.set_number), 0);
  const rows = Math.max(ghosts.length, 3, maxLogged) + extra;
  const stalled = stall.status === "STALLED";

  return (
    <Card className="p-0">
      <div className="border-b border-line px-4 pb-3 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold">{exercise.name}</h3>
            <div className="num text-[11px] text-faint">
              {MUSCLE_LABELS[exercise.primary_muscle]} · {exercise.rep_range_min}-{exercise.rep_range_max} reps{best1RM > 0 && ` · e1RM ${best1RM.toFixed(1)}kg`}
            </div>
          </div>
          {stalled && (
            <button type="button" onClick={() => setOpenDiag((o) => !o)} aria-expanded={openDiag}
              className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-coral/40 bg-coral/12 px-2.5 text-[11px] font-bold tracking-wide text-coral">
              <AlertTriangle size={12} /> STALLED LIFT <ChevronDown size={12} className={cn("transition-transform", openDiag && "rotate-180")} />
            </button>
          )}
        </div>
        {stalled && openDiag ? (
          <div className="animate-fade-up mt-2 rounded-xl border border-coral/20 bg-coral/[0.06] p-2.5 text-xs">
            <div className="font-semibold text-coral">{CAUSE_LABEL[stall.cause ?? ""]}</div>
            <div className="mt-0.5 text-muted">{stall.prescription}</div>
            <div className="num mt-1.5 text-[10px] text-faint">
              e1RM {stall.top_e1rm_series.map((x) => x.toFixed(1)).join(" → ")}
              {stall.avgSleep7d !== null && ` · sleep ${stall.avgSleep7d.toFixed(1)}h`}
              {stall.avgProteinPerKg7d !== null && ` · ${stall.avgProteinPerKg7d.toFixed(2)}g/kg`}
              {stall.avgRir !== null && ` · RIR ${stall.avgRir.toFixed(1)}`}
            </div>
          </div>
        ) : !stalled && (
          <div className={cn("num mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium",
            target.rule === "A_LOAD" ? "bg-emerald/10 text-emerald" : target.rule === "C_CONSOLIDATE" ? "bg-amber/10 text-amber" : "bg-indigo/10 text-indigo")}>
            <TrendingUp size={12} className="shrink-0" />
            <span className="truncate">{target.message}</span>
          </div>
        )}
      </div>

      <div className="px-2 py-2">
        <div className="num grid grid-cols-[2rem_1fr_1fr_0.8fr_2.75rem] gap-1.5 px-1 pb-1 text-[10px] uppercase tracking-wider text-faint">
          <span className="text-center">Set</span><span>kg</span><span>Reps</span><span>RIR</span><span />
        </div>
        {Array.from({ length: rows }, (_, i) => {
          const n = i + 1;
          const done = logged.find((s) => s.set_number === n);
          const g = ghosts[i];
          const d = drafts[n];
          const type = done?.set_type ?? d?.type ?? g?.set_type ?? "working";
          const isActive = (f: NumpadField) => active?.setNumber === n && active.field === f;

          if (done) {
            const pr = done.is_1rm_pr || done.is_volume_pr;
            return (
              <div key={n} className={cn("num grid grid-cols-[2rem_1fr_1fr_0.8fr_2.75rem] items-center gap-1.5 rounded-xl px-1 py-1", pr ? "bg-[#E8B931]/[0.08]" : "bg-emerald/[0.05]")}>
                <span className={cn("text-center text-sm font-semibold", TYPE_BADGE[done.set_type].cls)}>{TYPE_BADGE[done.set_type].label || n}</span>
                <span className="text-[15px] font-semibold">{fmtKg(done.weight_kg)}</span>
                <span className="text-[15px] font-semibold">{done.reps}</span>
                <span className="flex items-center gap-1 text-sm text-muted">
                  {done.rir ?? "-"}
                  {pr && <Trophy size={13} className="text-[#F5D06A]" aria-label="PR" />}
                </span>
                <button type="button" aria-label={`Undo set ${n}`} title="Tap to undo" onClick={() => onDelete(done.id)}
                  className="group flex h-11 w-11 items-center justify-center rounded-xl bg-emerald/15 text-emerald hover:bg-coral/15 hover:text-coral">
                  <Check size={16} strokeWidth={3} className="group-hover:hidden" /><Trash2 size={15} className="hidden group-hover:block" />
                </button>
              </div>
            );
          }

          const cell = (field: NumpadField, draftVal: string | undefined, ghostVal: string | undefined) => (
            <button type="button" onClick={() => onFocusField(n, field)} aria-label={`Set ${n} ${field}`}
              className={cn("num h-11 rounded-xl border bg-bg/60 px-2 text-left text-[15px] transition-colors",
                isActive(field) ? "border-indigo ring-2 ring-indigo/25" : "border-line")}>
              {draftVal ? <span className="font-semibold">{draftVal}</span> : <span className="text-faint">{ghostVal ?? "-"}</span>}
            </button>
          );

          return (
            <div key={n} className="grid grid-cols-[2rem_1fr_1fr_0.8fr_2.75rem] items-center gap-1.5 px-1 py-0.5">
              <span className={cn("num text-center text-sm font-semibold", TYPE_BADGE[type].cls)}>{TYPE_BADGE[type].label || n}</span>
              {cell("weight", d?.weight, g ? fmtKg(g.weight_kg) : undefined)}
              {cell("reps", d?.reps, g ? String(g.reps) : undefined)}
              {cell("rir", d?.rir, g?.rir !== null && g?.rir !== undefined ? String(g.rir) : undefined)}
              <button type="button" aria-label={`Log set ${n}${!d ? " (copy last)" : ""}`} onClick={() => onLog(n)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong text-muted hover:border-emerald/50 hover:text-emerald">
                <Check size={18} />
              </button>
            </div>
          );
        })}
        <button type="button" onClick={() => setExtra((x) => x + 1)} className="mt-1 flex h-10 w-full items-center justify-center gap-1 rounded-xl text-xs text-muted hover:bg-white/[0.03] hover:text-fg">
          <Plus size={14} /> Add set
        </button>
        {logged.length > 0 && (
          <div className="num px-1 pb-1 text-right text-[10px] text-faint">
            {logged.filter((s) => s.set_type !== "warmup").length} hard sets · {titleCase(exercise.equipment)}
          </div>
        )}
      </div>
    </Card>
  );
}
