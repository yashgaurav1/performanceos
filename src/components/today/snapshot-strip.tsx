"use client";
import Link from "next/link";
import { useExpenses, useFoodEntries, useProfile, useStudySessions } from "@/lib/db/hooks";
import { addDays } from "@/lib/math/dates";
import { aggregateDayNutrition, plusMinus } from "@/lib/math/nutrition-math";
import { studyStreak } from "@/lib/math/study-math";
import { fmtInt, fmtMoney } from "@/lib/format";

/** performanceos Glance Row: Energy left, Protein left, Spend today, Focus streak. */
export function TodaySnapshotStrip({ date }: { date: string }) {
  const profile = useProfile();
  const food = useFoodEntries(date);
  const spend = useExpenses(date, date);
  const sessions = useStudySessions(addDays(date, -60), date);
  const t = aggregateDayNutrition(food);
  const kcalLeft = profile.target_kcal - t.kcal_point;
  const pLeft = profile.target_protein_g - t.protein_g;
  const spent = spend.reduce((s, e) => s + e.amount_minor, 0);
  const streak = studyStreak(sessions, date);

  const tiles = [
    {
      href: "/eat",
      label: "Energy Left",
      value: kcalLeft < 0 ? `+${fmtInt(Math.abs(kcalLeft))}` : fmtInt(kcalLeft),
      unit: "kcal",
      sub: food.length ? `±${plusMinus(t.kcal_low, t.kcal_high)} range` : "no meals yet",
      tone: kcalLeft < 0 ? "text-amber" : "text-fg",
      badgeColor: "bg-flame/15 text-flame",
    },
    {
      href: "/eat",
      label: "Protein Left",
      value: `${Math.max(0, Math.round(pLeft))}`,
      unit: "g",
      sub: `${Math.round(t.protein_g)} / ${profile.target_protein_g}g`,
      tone: pLeft <= 0 ? "text-emerald" : "text-flame",
      badgeColor: "bg-flame/15 text-flame",
    },
    {
      href: "/money",
      label: "Spent Today",
      value: fmtMoney(spent, profile.currency_code, { compact: spent >= 100_000_00 }),
      unit: "",
      sub: `${spend.length} txns`,
      tone: "text-fg",
      badgeColor: "bg-cyan/15 text-cyan",
    },
    {
      href: "/study",
      label: "Focus Streak",
      value: `${streak}`,
      unit: "d",
      sub: "≥30m/day",
      tone: streak >= 3 ? "text-cyan" : "text-fg",
      badgeColor: "bg-purple/15 text-purple",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
      {tiles.map((x) => (
        <Link
          key={x.label}
          href={x.href}
          className="group relative min-w-0 rounded-2xl border border-line bg-surface/90 p-3 transition-all duration-150 hover:border-white/20 hover:bg-surface-2 active:scale-[0.98] shadow-xs"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint group-hover:text-muted transition-colors">
            {x.label}
          </div>
          <div className="num mt-0.5 flex items-baseline gap-0.5 truncate text-[17px] font-extrabold tracking-tight">
            <span className={x.tone}>{x.value}</span>
            {x.unit && <span className="text-[11px] font-normal text-muted">{x.unit}</span>}
          </div>
          <div className="num mt-0.5 truncate text-[10px] font-medium text-muted">{x.sub}</div>
        </Link>
      ))}
    </div>
  );
}
