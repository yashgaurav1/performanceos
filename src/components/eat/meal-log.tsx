"use client";
import { Camera, PenLine, Trash2, Zap, Utensils } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/primitives";
import { Pill } from "@/components/ui/pill";
import { deleteFoodEntry } from "@/lib/db/repo";
import { plusMinus } from "@/lib/math/nutrition-math";
import { titleCase } from "@/lib/format";
import type { FoodEntry, MealSlot } from "@/types/database.types";

const ORDER: MealSlot[] = ["breakfast", "lunch", "snack", "post_workout", "dinner"];
const SRC_ICON: Record<string, typeof Camera> = {
  ai_photo: Camera,
  quick_manual: PenLine,
  quick_add: PenLine,
  saved_template: Zap,
  barcode: Zap,
};

export function MealLog({ entries }: { entries: FoodEntry[] }) {
  const groups = ORDER.map((slot) => ({
    slot,
    items: entries.filter((e) => e.meal_slot === slot),
  })).filter((g) => g.items.length);

  return (
    <Card>
      <CardHeader eyebrow="Timeline" title="Food Log" icon={<Utensils size={16} />} />
      {groups.length === 0 ? (
        <EmptyState
          illustrationSrc="/images/illus/empty-meals.png"
          title="No meals logged today"
          description="Snap a photo of your plate or log with the quick staples above."
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const kcal = g.items.reduce((t, e) => t + e.kcal_point, 0);
            const p = g.items.reduce((t, e) => t + e.protein_g, 0);
            const c = g.items.reduce((t, e) => t + e.carbs_g, 0);
            const f = g.items.reduce((t, e) => t + e.fat_g, 0);

            return (
              <div key={g.slot} className="rounded-xl border border-line bg-surface-2/40 p-2.5">
                <div className="mb-2 flex items-baseline justify-between border-b border-line/60 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
                  <span className="text-fg">{titleCase(g.slot)}</span>
                  <div className="num flex items-center gap-2 text-[10px]">
                    <span className="text-flame font-bold">{Math.round(p)}g P</span>
                    <span className="text-cyan font-bold">{Math.round(c)}g C</span>
                    <span className="text-purple font-bold">{Math.round(f)}g F</span>
                    <span className="font-bold text-fg bg-white/[0.06] px-1.5 py-0.5 rounded-md">
                      {kcal} kcal
                    </span>
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {g.items.map((e) => {
                    const Icon = SRC_ICON[e.source_type] || Utensils;
                    const pm = plusMinus(e.kcal_low, e.kcal_high);

                    return (
                      <li
                        key={e.id}
                        className="group flex items-center gap-2.5 rounded-lg bg-surface-2/90 py-2 pl-3 pr-1.5 border border-line/50 transition-colors hover:border-white/10"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-muted">
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-fg">
                            {e.meal_title}
                          </div>
                          <div className="num mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="font-bold text-fg">
                              {e.kcal_point} kcal
                              {pm > 0 && <span className="text-amber"> ± {pm}</span>}
                            </span>
                            <span className="text-line-strong">·</span>
                            <span className="text-flame font-semibold">{Math.round(e.protein_g)}P</span>
                            <span className="text-cyan font-semibold">{Math.round(e.carbs_g)}C</span>
                            <span className="text-purple font-semibold">{Math.round(e.fat_g)}F</span>
                          </div>
                        </div>

                        {e.source_type === "ai_photo" && e.prep_modifier === "canteen_oily" && (
                          <Pill tone="amber" className="text-[9px]">
                            oily prep
                          </Pill>
                        )}

                        <button
                          type="button"
                          aria-label={`Delete ${e.meal_title}`}
                          onClick={() => void deleteFoodEntry(e.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-coral/10 hover:text-coral"
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
