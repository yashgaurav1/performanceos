"use client";
import { Zap } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { addFoodEntry, deleteFoodEntry } from "@/lib/db/repo";
import { STAPLES, defaultMealSlot } from "./staples";

/** Zero-cost, 1-second logging for recurring staples with performanceos telemetry badges. */
export function QuickProteinAndStaplesBar({ date }: { date: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
        <Zap size={12} className="text-flame" /> Quick add
      </div>
      <div className="fade-mask-x no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 py-2 scroll-smooth">
        {STAPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={async () => {
              const entry = await addFoodEntry({
                log_date: date,
                meal_slot: defaultMealSlot(),
                meal_title: s.label,
                source_type: "saved_template",
                photo_path: null,
                prep_modifier: "standard",
                confidence_tier: "high",
                ...s.totals,
                items_breakdown: [],
              });
              toast(`+${s.label}`, {
                tone: "emerald",
                body: `${s.totals.kcal_point} kcal · ${s.totals.protein_g} g protein`,
                action: { label: "Undo", onClick: () => deleteFoodEntry(entry.id) },
              });
            }}
            className="group flex h-14 shrink-0 flex-col items-start justify-center rounded-xl border border-line bg-surface/90 px-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-flame/50 hover:bg-surface-2 hover:shadow-[0_8px_20px_-4px_rgba(255,85,51,0.25)] active:scale-[0.95] shadow-xs cursor-pointer select-none"
          >
            <span className="whitespace-nowrap text-xs font-semibold text-fg group-hover:text-flame transition-colors">
              +{s.label}
            </span>
            <span className="num text-[10px] font-bold text-flame">{s.short}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
