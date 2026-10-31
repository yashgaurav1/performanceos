"use client";
import { useMemo, useState } from "react";
import { ExpenseQuickAdd } from "@/components/money/expense-quick-add";
import { MonthSummaryHeader } from "@/components/money/month-summary";
import { CategoryBreakdown, SpendTrends, TopMerchants, TransactionList } from "@/components/money/breakdowns";
import { BudgetSettingsSheet } from "@/components/money/budget-settings-sheet";
import { useBudgetCategories, useExpenses, useProfile } from "@/lib/db/hooks";
import { addDays, monthKey } from "@/lib/math/dates";
import { monthlyTotals, summarizeMonth, weeklyTotals, type ExpenseCategory } from "@/lib/math/budget-math";
import { useToday } from "@/lib/hooks/use-today";

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y ?? 1970, (m ?? 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MoneyPage() {
  const today = useToday();
  const profile = useProfile();
  const limits = useBudgetCategories();
  const all = useExpenses(addDays(today || "1970-01-01", -400), today || "1970-01-01");
  const [month, setMonth] = useState<string | null>(null);
  const [filter, setFilter] = useState<ExpenseCategory | null>(null);
  const [settings, setSettings] = useState(false);
  const current = month ?? monthKey(today || "1970-01-01");

  const summary = useMemo(
    () => summarizeMonth(all, current, today || "1970-01-01", profile.monthly_budget_minor, new Map(limits.map((l) => [l.category, l.monthly_limit_minor]))),
    [all, current, today, profile.monthly_budget_minor, limits],
  );
  if (!today) return null;
  const cur = profile.currency_code;
  const monthExpenses = all.filter((e) => monthKey(e.spent_on) === current);

  return (
    <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
      <div className="space-y-3 lg:space-y-4">
        <ExpenseQuickAdd today={today} currency={cur} />
        <MonthSummaryHeader s={summary} currency={cur} onPrev={() => setMonth(shiftMonth(current, -1))} onNext={() => setMonth(shiftMonth(current, 1))}
          canNext={current < monthKey(today)} onSettings={() => setSettings(true)} />
        <CategoryBreakdown s={summary} currency={cur} filter={filter} onFilter={setFilter} />
        <SpendTrends weekly={weeklyTotals(all, today, 8)} monthly={monthlyTotals(all, today, 6)} currency={cur} />
      </div>
      <div className="space-y-3 lg:space-y-4">
        <TopMerchants s={summary} currency={cur} />
        <TransactionList expenses={monthExpenses} currency={cur} filter={filter} />
      </div>
      <BudgetSettingsSheet open={settings} onOpenChange={setSettings} profile={profile} limits={limits} />
    </div>
  );
}
