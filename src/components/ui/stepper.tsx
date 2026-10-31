"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({
  value, onChange, step = 1, min = -Infinity, max = Infinity, format = (v) => String(v), unit, className, placeholder = " · ",
}: {
  value: number | null; onChange: (v: number) => void; step?: number; min?: number; max?: number;
  format?: (v: number) => string; unit?: string; className?: string; placeholder?: string;
}) {
  const base = value ?? Math.max(min, 0);
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 1000) / 1000)));
  return (
    <div className={cn("flex items-center gap-1 rounded-xl border border-line bg-bg/60 p-1", className)}>
      <button type="button" aria-label="Decrease" className="flex h-10 w-11 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-fg active:scale-95"
        onClick={() => set(value === null ? base : base - step)}>
        <Minus size={16} />
      </button>
      <div className="num flex-1 text-center text-lg font-semibold">
        {value === null ? <span className="text-faint">{placeholder}</span> : format(value)}
        {unit && value !== null && <span className="ml-0.5 text-xs font-normal text-muted">{unit}</span>}
      </div>
      <button type="button" aria-label="Increase" className="flex h-10 w-11 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-fg active:scale-95"
        onClick={() => set(value === null ? base : base + step)}>
        <Plus size={16} />
      </button>
    </div>
  );
}
