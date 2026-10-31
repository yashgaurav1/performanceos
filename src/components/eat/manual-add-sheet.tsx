"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { addFoodEntry } from "@/lib/db/repo";
import { defaultMealSlot } from "./staples";

/** Manual entry for label-known foods. A ±10% band reflects portion error even for "known" numbers. */
export function ManualAddSheet({ open, onOpenChange, date }: { open: boolean; onOpenChange: (o: boolean) => void; date: string }) {
  const [f, setF] = useState({ title: "", kcal: "", p: "", c: "", fat: "" });
  const n = (s: string) => Math.max(0, Number(s) || 0);
  const valid = f.title.trim() && n(f.kcal) > 0;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Quick manual entry">
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const k = n(f.kcal);
        await addFoodEntry({
          log_date: date, meal_slot: defaultMealSlot(), meal_title: f.title.trim(), source_type: "quick_manual", photo_path: null,
          prep_modifier: "standard", confidence_tier: "medium", kcal_point: Math.round(k), kcal_low: Math.round(k * 0.9), kcal_high: Math.round(k * 1.1),
          protein_g: n(f.p), carbs_g: n(f.c), fat_g: n(f.fat), fiber_g: 0, items_breakdown: [],
        });
        setF({ title: "", kcal: "", p: "", c: "", fat: "" });
        onOpenChange(false);
      }}>
        <div><Label htmlFor="mt">Food</Label><Input id="mt" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Masala dosa" /></div>
        <div className="grid grid-cols-4 gap-2">
          {([["kcal", "Energy", "text-fg"], ["p", "Protein", "text-flame font-semibold"], ["c", "Carbs", "text-cyan font-semibold"], ["fat", "Fat", "text-purple font-semibold"]] as const).map(([k, l, cls]) => (
            <div key={k}><Label htmlFor={k} className={cls}>{l}</Label><Input id={k} className="num font-bold" inputMode="decimal" placeholder="0" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
          ))}
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={!valid}>Add</Button>
      </form>
    </Sheet>
  );
}
