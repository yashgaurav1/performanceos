"use client";
import { Droplets } from "lucide-react";
import type { FoodItem, ItemBreakdown } from "@/lib/math/nutrition-math";
import { cn } from "@/lib/utils";

const MULTIPLIERS = [0.5, 1, 1.25, 1.5] as const;

/** One detected component: gram slider + 0.5x/1x/1.25x/1.5x chips. Macros recompute locally (no LLM call). */
export function IngredientSlider({ item, baselineGrams, computed, onGrams }: {
  item: FoodItem; baselineGrams: number; computed: ItemBreakdown | undefined; onGrams: (g: number) => void;
}) {
  const max = Math.max(50, Math.round(baselineGrams * 2.5));
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            {item.is_hidden_oil_or_gravy && <Droplets size={13} className="shrink-0 text-amber" />}
            <span className="truncate">{item.name}</span>
            {item.portion_description && (
              <span className="shrink-0 rounded bg-emerald/10 px-1.5 py-0.5 font-sans text-[10px] text-emerald border border-emerald/20">
                {item.portion_description}
              </span>
            )}
          </div>
          {item.preparation_note && <div className="truncate text-[11px] text-faint">{item.preparation_note}</div>}
        </div>
        <div className="num shrink-0 text-right">
          <div className="text-sm font-semibold text-fg">{computed?.kcal_point ?? 0} kcal</div>
          <div className="text-[10px] text-muted flex items-center justify-end gap-1">
            <span className="text-flame font-semibold">{computed?.protein_g ?? 0}P</span>
            <span>·</span>
            <span className="text-cyan font-semibold">{computed?.carbs_g ?? 0}C</span>
            <span>·</span>
            <span className="text-purple font-semibold">{computed?.fat_g ?? 0}F</span>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input type="range" min={0} max={max} step={1} value={Math.round(item.estimated_grams)} aria-label={`${item.name} grams`}
          onChange={(e) => onGrams(Number(e.target.value))}
          className="h-11 flex-1 accent-flame" />
        <span className="num w-14 text-right text-sm font-bold text-fg">{Math.round(item.estimated_grams)}g</span>
      </div>
      <div className="flex gap-1">
        {MULTIPLIERS.map((m) => {
          const active = Math.abs(item.estimated_grams - baselineGrams * m) < 0.5;
          return (
            <button key={m} type="button" onClick={() => onGrams(baselineGrams * m)}
              className={cn("num h-9 flex-1 rounded-lg border text-[11px] font-semibold transition-all active:scale-95", active ? "border-flame/50 bg-flame/15 text-flame shadow-xs" : "border-line text-muted hover:border-line-strong hover:text-fg")}>
              {m}x
            </button>
          );
        })}
      </div>
      <div className="num mt-1.5 text-[10px] text-faint">p10-p90: {Math.round(item.grams_low)}-{Math.round(item.grams_high)}g · {computed?.kcal_low ?? 0}-{computed?.kcal_high ?? 0} kcal</div>
    </div>
  );
}
