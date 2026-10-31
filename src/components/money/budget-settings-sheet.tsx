"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { setCategoryBudget, updateProfile } from "@/lib/db/repo";
import { EXPENSE_CATEGORIES, parseAmountToMinor, type ExpenseCategory } from "@/lib/math/budget-math";
import type { BudgetCategory, Profile } from "@/types/database.types";
import { CATEGORY_META } from "./categories";

export function BudgetSettingsSheet({ open, onOpenChange, profile, limits }: { open: boolean; onOpenChange: (o: boolean) => void; profile: Profile; limits: BudgetCategory[] }) {
  const initial = () => ({
    total: String(profile.monthly_budget_minor / 100),
    currency: profile.currency_code,
    cats: Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, String((limits.find((l) => l.category === c)?.monthly_limit_minor ?? 0) / 100 || "")])) as Record<ExpenseCategory, string>,
  });
  const [f, setF] = useState(initial);
  return (
    <Sheet open={open} onOpenChange={(o) => { if (o) setF(initial()); onOpenChange(o); }} title="Budget settings" description="Leave a category blank for no limit.">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        const total = parseAmountToMinor(f.total);
        await updateProfile({ monthly_budget_minor: total ?? 0, currency_code: f.currency.toUpperCase().slice(0, 3) || "INR" });
        for (const c of EXPENSE_CATEGORIES) {
          const v = f.cats[c].trim();
          const minor = v ? parseAmountToMinor(v) : null;
          const existing = limits.find((l) => l.category === c)?.monthly_limit_minor ?? null;
          if (minor !== existing) await setCategoryBudget(c, minor);
        }
        toast("Budget saved", { tone: "emerald" });
        onOpenChange(false);
      }}>
        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <div><Label htmlFor="bt">Monthly budget</Label><Input id="bt" className="num" inputMode="decimal" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} /></div>
          <div><Label htmlFor="bc">Currency</Label><Input id="bc" className="num uppercase" maxLength={3} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {EXPENSE_CATEGORIES.map((c) => {
            const M = CATEGORY_META[c];
            return (
              <div key={c}>
                <Label htmlFor={`cat-${c}`} className="flex items-center gap-1"><M.icon size={11} style={{ color: M.color }} /> {M.label}</Label>
                <Input id={`cat-${c}`} className="num" inputMode="decimal" placeholder="no limit" value={f.cats[c]} onChange={(e) => setF({ ...f, cats: { ...f.cats, [c]: e.target.value } })} />
              </div>
            );
          })}
        </div>
        <Button type="submit" variant="primary" className="w-full">Save</Button>
      </form>
    </Sheet>
  );
}
