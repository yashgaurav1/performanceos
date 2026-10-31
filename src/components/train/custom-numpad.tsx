"use client";
import { Check, Delete, ArrowRight } from "lucide-react";
import type { SetType } from "@/lib/math/gym-math";
import { cn } from "@/lib/utils";

export type NumpadField = "weight" | "reps" | "rir";

const KEY_LAYOUT = ["1", "2", "3", "back", "4", "5", "6", "next", "7", "8", "9", "hide", ".", "0", "done"] as const;

const TYPES: { t: SetType; label: string; cls: string }[] = [
  { t: "warmup", label: "W", cls: "text-amber" },
  { t: "working", label: "1", cls: "text-fg" },
  { t: "dropset", label: "D", cls: "text-indigo" },
  { t: "failure", label: "F", cls: "text-coral" },
];

/**
 * Docked gym keypad · replaces the OS keyboard so it never covers the set rows.
 * Weight jumps (+1.25/+2.5/+5), RIR quick-picks and set-type toggle are one tap.
 */
export function CustomNumpad({
  field, value, onChange, setType, onSetType, onNext, onDone, onClose, title,
}: {
  field: NumpadField;
  value: string;
  onChange: (v: string) => void;
  setType: SetType;
  onSetType: (t: SetType) => void;
  onNext: () => void;
  onDone: () => void;
  onClose: () => void;
  title: string;
}) {
  const press = (k: string) => {
    if (k === "back") return onChange(value.slice(0, -1));
    if (k === "." && (field === "reps" || value.includes("."))) return;
    if (value.length >= 6) return;
    onChange(value === "0" && k !== "." ? k : value + k);
  };
  const bump = (d: number) => {
    const n = Math.max(0, (Number(value) || 0) + d);
    onChange(String(Math.round(n * 100) / 100));
  };

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-line-strong bg-surface/95 backdrop-blur-xl lg:left-60" role="dialog" aria-label="Gym keypad">
      <div className="mx-auto max-w-lg px-3 pb-3 pt-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[11px] text-faint">{title}</div>
            <div className="num text-lg font-semibold">
              {value || <span className="text-faint">0</span>}
              <span className="ml-1 text-xs font-normal text-muted">{field === "weight" ? "kg" : field === "reps" ? "reps" : "RIR"}</span>
            </div>
          </div>
          <div className="flex gap-1" role="radiogroup" aria-label="Set type">
            {TYPES.map((x) => (
              <button key={x.t} type="button" role="radio" aria-checked={setType === x.t} aria-label={x.t} onClick={() => onSetType(x.t)}
                className={cn("num h-11 w-11 rounded-xl border text-sm font-bold", setType === x.t ? "border-indigo/60 bg-indigo/15" : "border-line", x.cls)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>

        <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
          {field === "weight" && [-2.5, 1.25, 2.5, 5].map((d) => (
            <button key={d} type="button" onClick={() => bump(d)} className="num h-10 flex-1 rounded-xl bg-surface-3 px-3 text-xs font-semibold text-emerald">
              {d > 0 ? "+" : ""}{d}kg
            </button>
          ))}
          {field === "reps" && [-1, 1, 2].map((d) => (
            <button key={d} type="button" onClick={() => bump(d)} className="num h-10 flex-1 rounded-xl bg-surface-3 px-3 text-xs font-semibold text-emerald">
              {d > 0 ? "+" : ""}{d}
            </button>
          ))}
          {field === "rir" && [0, 1, 2, 3].map((r) => (
            <button key={r} type="button" onClick={() => onChange(String(r))}
              className={cn("num h-10 flex-1 rounded-xl px-3 text-xs font-semibold", value === String(r) ? "bg-indigo text-white" : "bg-surface-3 text-indigo")}>
              RIR {r}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {KEY_LAYOUT.map((k) => {
            if (k === "back") return <button key={k} type="button" aria-label="Backspace" onClick={() => press("back")} className="flex h-12 items-center justify-center rounded-xl bg-surface-3 text-muted"><Delete size={18} /></button>;
            if (k === "next") return <button key={k} type="button" aria-label="Next field" onClick={onNext} className="flex h-12 items-center justify-center rounded-xl bg-surface-3 text-muted"><ArrowRight size={18} /></button>;
            if (k === "hide") return <button key={k} type="button" onClick={onClose} className="h-12 rounded-xl bg-surface-3 text-xs text-muted">Hide</button>;
            if (k === "done") {
              return (
                <button key={k} type="button" onClick={onDone} className="col-span-2 flex h-12 items-center justify-center gap-1.5 rounded-xl bg-emerald text-sm font-semibold text-bg">
                  <Check size={18} strokeWidth={3} /> Log set
                </button>
              );
            }
            return (
              <button key={k} type="button" onClick={() => press(k)} disabled={k === "." && field === "reps"}
                className="num h-12 rounded-xl bg-surface-2 text-lg font-medium active:bg-surface-3 disabled:opacity-30">
                {k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
