"use client";
import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Trash2 } from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { deleteExpense } from "@/lib/db/repo";
import type { ExpenseCategory, MonthSummary } from "@/lib/math/budget-math";
import { fmtDateLong, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types/database.types";
import { CATEGORY_META } from "./categories";

export function CategoryBreakdown({ s, currency, filter, onFilter }: { s: MonthSummary; currency: string; filter: ExpenseCategory | null; onFilter: (c: ExpenseCategory | null) => void }) {
  const rows = s.categories.filter((c) => c.spent_minor > 0 || c.limit_minor !== null);
  return (
    <Card>
      <CardHeader eyebrow="Where it went" title="Categories" action={filter && <button type="button" className="h-9 text-xs text-indigo" onClick={() => onFilter(null)}>clear filter</button>} />
      {rows.length === 0 ? <EmptyState title="No spending this month" /> : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
            {rows.filter((c) => c.spent_minor > 0).map((c) => <div key={c.category} style={{ width: `${c.share * 100}%`, background: CATEGORY_META[c.category].color }} />)}
          </div>
          <ul className="mt-3 space-y-1">
            {rows.map((c) => {
              const M = CATEGORY_META[c.category];
              const pct = c.limit_minor ? Math.min(100, (c.spent_minor / c.limit_minor) * 100) : 0;
              const barColor = c.status === "over" ? "#F43F5E" : c.status === "pace_warning" ? "#F59E0B" : "#10B981";
              return (
                <li key={c.category}>
                  <button type="button" onClick={() => onFilter(filter === c.category ? null : c.category)}
                    className={cn("w-full rounded-xl px-2 py-2 text-left transition-colors", filter === c.category ? "bg-white/[0.06]" : "hover:bg-white/[0.03]")}>
                    <div className="flex items-center gap-2">
                      <M.icon size={15} style={{ color: M.color }} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-sm">{M.label}<span className="num ml-1.5 text-[10px] text-faint">{c.count}×</span></span>
                      <span className="num text-sm font-semibold">{fmtMoney(c.spent_minor, currency)}</span>
                      <span className="num w-10 text-right text-[11px] text-faint">{Math.round(c.share * 100)}%</span>
                    </div>
                    {c.limit_minor !== null && (
                      <div className="mt-1.5 flex items-center gap-2 pl-6">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} /></div>
                        <span className="num text-[10px] text-faint">of {fmtMoney(c.limit_minor, currency)}</span>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}

export function SpendTrends({ weekly, monthly, currency }: { weekly: { week_start: string; total_minor: number }[]; monthly: { month: string; total_minor: number }[]; currency: string }) {
  const [view, setView] = useState<"weeks" | "months">("weeks");
  const data = view === "weeks"
    ? weekly.map((w) => ({ label: new Date(w.week_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), v: w.total_minor / 100 }))
    : monthly.map((m) => ({ label: new Date(`${m.month}-01`).toLocaleDateString("en-GB", { month: "short" }), v: m.total_minor / 100 }));
  const avg = data.length ? data.slice(0, -1).reduce((t, d) => t + d.v, 0) / Math.max(1, data.length - 1) : 0;
  return (
    <Card>
      <CardHeader eyebrow="Trends" title="Total expenses" action={<Segmented size="sm" className="w-40" value={view} onChange={setView} options={[{ value: "weeks", label: "8 wk" }, { value: "months", label: "6 mo" }]} />} />
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#5a5f72", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#181b25", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, fontSize: 12 }}
              formatter={(v) => (typeof v === "number" ? fmtMoney(v * 100, currency) : String(v))} />
            <Bar dataKey="v" radius={[4, 4, 0, 0]} name="Spent">
              {data.map((d, i) => <Cell key={d.label + i} fill={i === data.length - 1 ? "#6366F1" : d.v > avg * 1.25 ? "rgba(244,63,94,0.6)" : "rgba(99,102,241,0.35)"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="num mt-1 text-[11px] text-muted">Avg prior {view === "weeks" ? "week" : "month"}: {fmtMoney(Math.round(avg * 100), currency)}</div>
    </Card>
  );
}

export function TopMerchants({ s, currency }: { s: MonthSummary; currency: string }) {
  if (!s.top_merchants.length) return null;
  const max = s.top_merchants[0]?.spent_minor ?? 1;
  return (
    <Card>
      <CardHeader eyebrow="This month" title="Top places" />
      <ul className="space-y-2">
        {s.top_merchants.map((m) => (
          <li key={m.merchant}>
            <div className="flex items-baseline justify-between text-sm"><span className="capitalize">{m.merchant}<span className="num ml-1.5 text-[10px] text-faint">{m.count}×</span></span><span className="num font-medium">{fmtMoney(m.spent_minor, currency)}</span></div>
            <div className="mt-1 h-1 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-indigo/60" style={{ width: `${(m.spent_minor / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function TransactionList({ expenses, currency, filter }: { expenses: Expense[]; currency: string; filter: ExpenseCategory | null }) {
  const [showAll, setShowAll] = useState(false);
  const full = expenses.filter((e) => !filter || e.category === filter).sort((a, b) => b.spent_on.localeCompare(a.spent_on) || b.client_updated_at.localeCompare(a.client_updated_at));
  const list = showAll ? full : full.slice(0, 20);
  const byDay = new Map<string, Expense[]>();
  for (const e of list) byDay.set(e.spent_on, [...(byDay.get(e.spent_on) ?? []), e]);
  return (
    <Card>
      <CardHeader eyebrow="Ledger" title={filter ? `${CATEGORY_META[filter].label} transactions` : "Transactions"} action={<span className="num text-xs text-muted">{full.length}</span>} />
      {list.length === 0 ? (
        <div className="py-6 px-4 text-center space-y-3">
          <div className="text-xs text-zinc-400 font-sans">
            Log an entry above · takes 2 seconds
          </div>
          {/* Animated ghost-row skeleton pulsing gently on hover */}
          <div className="space-y-2 opacity-35 hover:opacity-60 transition-opacity duration-300">
            <div className="h-10 rounded-xl bg-white/[0.04] border border-white/5 animate-pulse flex items-center px-3 justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-white/10" />
                <div className="h-3 w-24 rounded bg-white/10" />
              </div>
              <div className="h-3 w-12 rounded bg-white/10" />
            </div>
            <div className="h-10 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse flex items-center px-3 justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-white/10" />
                <div className="h-3 w-28 rounded bg-white/10" />
              </div>
              <div className="h-3 w-16 rounded bg-white/10" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {[...byDay.entries()].map(([day, items]) => (
            <div key={day}>
              <div className="mb-1 flex justify-between text-[11px] text-faint"><span>{fmtDateLong(day)}</span><span className="num">{fmtMoney(items.reduce((t, e) => t + e.amount_minor, 0), currency)}</span></div>
              <ul className="space-y-1">
                {items.map((e) => {
                  const M = CATEGORY_META[e.category];
                  return (
                    <li key={e.id} className="flex items-center gap-2.5 rounded-xl bg-surface-2 py-1.5 pl-2.5 pr-1">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${M.color}1f` }}><M.icon size={15} style={{ color: M.color }} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{e.note || e.merchant || M.label}</div>
                        <div className="truncate text-[10px] uppercase text-faint">{M.label}{e.merchant && ` · @${e.merchant}`} · {e.payment_method}</div>
                      </div>
                      <span className="num text-sm font-semibold">{fmtMoney(e.amount_minor, currency, { decimals: e.amount_minor % 100 !== 0 })}</span>
                      <button type="button" aria-label="Delete expense" onClick={() => void deleteExpense(e.id)} className="flex h-10 w-9 items-center justify-center text-faint hover:text-coral"><Trash2 size={13} /></button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {full.length > list.length && (
            <button type="button" onClick={() => setShowAll(true)} className="num h-11 w-full rounded-xl border border-line text-xs text-muted hover:text-fg">
              Show all {full.length} transactions
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
