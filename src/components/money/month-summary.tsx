"use client";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { MonthSummary } from "@/lib/math/budget-math";
import { fmtMoney } from "@/lib/format";

const STATUS = { under: { tone: "emerald", label: "On budget" }, pace_warning: { tone: "amber", label: "Spending fast" }, over: { tone: "coral", label: "Over budget" } } as const;

export function MonthSummaryHeader({ s, currency, onPrev, onNext, canNext, onSettings }: {
  s: MonthSummary; currency: string; onPrev: () => void; onNext: () => void; canNext: boolean; onSettings: () => void;
}) {
  const [y, m] = s.month.split("-").map(Number);
  const label = new Date(y ?? 1970, (m ?? 1) - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const st = STATUS[s.status];
  const money = (v: number) => fmtMoney(v, currency);
  const chart = s.daily.map((d, i) => ({ day: i + 1, actual: i < s.days_elapsed ? d.cumulative_minor / 100 : null, ideal: d.ideal_cumulative_minor / 100 }));
  const pctUsed = s.budget_minor ? Math.round((s.total_minor / s.budget_minor) * 100) : 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button type="button" aria-label="Previous month" onClick={onPrev} className="flex h-11 w-9 items-center justify-center text-muted hover:text-fg"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium">{label}</span>
          <button type="button" aria-label="Next month" onClick={onNext} disabled={!canNext} className="flex h-11 w-9 items-center justify-center text-muted hover:text-fg disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
        <div className="flex items-center gap-1">
          <Pill tone={st.tone}>{st.label}</Pill>
          <button type="button" aria-label="Budget settings" onClick={onSettings} className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-white/5 hover:text-fg"><Settings2 size={18} /></button>
        </div>
      </div>

      <div className="mt-1 flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-faint">Spent</div>
          <div className="num text-[34px] font-semibold leading-none tracking-tight">{money(s.total_minor)}</div>
          <div className="num mt-1 text-xs text-muted">{pctUsed}% of {money(s.budget_minor)}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.08em] text-faint">Remaining</div>
          <div className={`num text-xl font-semibold ${s.remaining_minor < 0 ? "text-coral" : "text-emerald"}`}>{money(s.remaining_minor)}</div>
        </div>
      </div>

      <div className="mt-3 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chart} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.status === "over" ? "#F43F5E" : "#6366F1"} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.status === "over" ? "#F43F5E" : "#6366F1"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <YAxis hide domain={[0, (max: number) => Math.max(max, s.budget_minor / 100) * 1.05]} />
            <Tooltip contentStyle={{ background: "#181b25", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, fontSize: 12 }}
              formatter={(v) => (typeof v === "number" ? fmtMoney(v * 100, currency) : String(v))} labelFormatter={(d) => `Day ${d}`} />
            <Line dataKey="ideal" stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" dot={false} strokeWidth={1} name="Even pace" isAnimationActive={false} />
            <Area dataKey="actual" stroke={s.status === "over" ? "#F43F5E" : "#6366F1"} fill="url(#spendFill)" strokeWidth={2} dot={false} connectNulls={false} name="Spent" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-3">
        <div><div className="text-[10px] uppercase tracking-wider text-faint">Safe / day</div><div className="num text-sm font-semibold text-emerald">{money(s.safe_to_spend_per_day_minor)}</div></div>
        <div><div className="text-[10px] uppercase tracking-wider text-faint">Avg / day</div><div className="num text-sm font-semibold">{money(s.avg_per_day_minor)}</div></div>
        <div><div className="text-[10px] uppercase tracking-wider text-faint">Projected</div><div className={`num text-sm font-semibold ${s.projected_total_minor > s.budget_minor ? "text-coral" : ""}`}>{money(s.projected_total_minor)}</div></div>
      </div>
      {s.vs_last_month_same_point_pct !== null && (
        <div className="num mt-2 text-[11px] text-muted">
          <span className={s.vs_last_month_same_point_pct > 0 ? "text-coral" : "text-emerald"}>{s.vs_last_month_same_point_pct > 0 ? "▲" : "▼"} {Math.abs(s.vs_last_month_same_point_pct)}%</span> vs same point last month
        </div>
      )}
    </Card>
  );
}
