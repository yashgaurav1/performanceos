"use client";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { fmtInt } from "@/lib/format";
import type { EntryTotals } from "@/lib/math/nutrition-math";
import type { Profile } from "@/types/database.types";
import { Flame, Sparkles } from "lucide-react";

/**
 * performanceos Macro & Expenditure Hub:
 * - Calories Remaining / Consumed with adherence-neutral framing
 * - Calorie Whisker Progress Bar: Solid bar to Σ kcal_point + hatched amber uncertainty
 *   over [Σ kcal_low, Σ kcal_high] with target notch
 * - Official performanceos Macro Trio: Protein (Flame), Carbs (Cyan), Fat (Purple)
 */
export function MacroWhiskerProgressBar({
  totals,
  profile,
}: {
  totals: EntryTotals;
  profile: Profile;
}) {
  const target = profile.target_kcal;
  const scale = Math.max(target * 1.25, totals.kcal_high * 1.08, 1);
  const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
  const remaining = target - totals.kcal_point;
  const pRemain = profile.target_protein_g - totals.protein_g;
  const cRemain = profile.target_carbs_g - totals.carbs_g;
  const fRemain = profile.target_fat_g - totals.fat_g;

  // Adherence-neutral status label
  const isOverKcal = remaining < 0;
  const kcalDeltaAbs = Math.abs(remaining);
  const statusLabel =
    Math.abs(remaining) <= 75
      ? "Target Hit · Equilibrium"
      : remaining > 0
      ? `${fmtInt(remaining)} kcal remaining`
      : `+${fmtInt(kcalDeltaAbs)} kcal over target`;

  return (
    <Card className="relative overflow-hidden" highlight="flame">
      {/* PerformanceOS ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-flame/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-20 h-44 w-44 rounded-full bg-cyan/10 blur-3xl" />

      {/* Header bar: Calorie targets status */}
      <div className="relative mb-3 flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-flame">
          <Flame size={13} className="text-flame" /> PerformanceOS Daily Stats
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-muted">
          <Sparkles size={12} className="text-emerald" />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Main Calories & Protein Readouts */}
      <div className="relative grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
            Energy Balance
          </div>
          <div className="num mt-0.5 flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                isOverKcal ? "text-amber" : "text-fg"
              }`}
            >
              {isOverKcal ? `+${fmtInt(kcalDeltaAbs)}` : fmtInt(remaining)}
            </span>
            <span className="text-xs font-medium text-muted">kcal</span>
          </div>
          <div className="num text-[11px] text-muted">
            {fmtInt(totals.kcal_point)} of {fmtInt(target)} kcal
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-flame">
            Protein Target
          </div>
          <div className="num mt-0.5 flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                pRemain <= 0 ? "text-emerald" : "text-flame"
              }`}
            >
              {pRemain <= 0 ? "HIT" : Math.round(pRemain)}
              {pRemain > 0 && <span className="text-base font-normal text-muted">g</span>}
            </span>
          </div>
          <div className="num text-[11px] text-muted">
            {Math.round(totals.protein_g)} / {profile.target_protein_g} g
          </div>
        </div>
      </div>

      {/* Whisker Bar with Uncertainty Interval */}
      <div className="relative mt-4">
        <div
          className="relative h-4 w-full overflow-hidden rounded-full bg-white/[0.06] p-0.5"
          role="img"
          aria-label={`${totals.kcal_point} kcal eaten, range ${totals.kcal_low} to ${totals.kcal_high}, target ${target}`}
        >
          {/* Base point estimate bar with liquid-metal shimmer */}
          <div
            className={`relative h-full rounded-full transition-[width] duration-500 ease-out overflow-hidden ${
              isOverKcal ? "bg-amber" : "bg-gradient-to-r from-flame to-flame-glow"
            }`}
            style={{ width: pct(totals.kcal_point) }}
          >
            <div className="absolute inset-y-0 right-0 w-3.5 bg-white/60 blur-[1px] animate-pulse" />
          </div>
          {/* Hatched uncertainty confidence whisker */}
          {totals.kcal_high > totals.kcal_low && (
            <div
              className="hatch absolute inset-y-0 border-x border-amber/70 opacity-90 rounded-xs"
              style={{
                left: pct(totals.kcal_low),
                width: `calc(${pct(totals.kcal_high)} - ${pct(totals.kcal_low)})`,
              }}
            />
          )}
          {/* Precision Target Notch */}
          <div
            className="absolute inset-y-[-2px] w-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"
            style={{ left: pct(target) }}
          />
        </div>

        <div className="num mt-2 flex flex-wrap items-baseline justify-between gap-x-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="font-bold text-fg">{fmtInt(totals.kcal_point)} kcal</span>
            <span className="text-muted">
              · Range: {fmtInt(totals.kcal_low)}-{fmtInt(totals.kcal_high)} kcal
            </span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-faint">
            <span className="hatch inline-block h-2 w-3 rounded-xs" />
            <span>± uncertainty</span>
          </span>
        </div>
      </div>

      {/* The PerformanceOS Macro Trio Cards: Protein (Flame), Carbs (Cyan), Fat (Purple) */}
      <div className="relative mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {/* Protein Card */}
        <div className="rounded-xl border border-line bg-surface-2/80 p-2.5 transition-all hover:border-flame/30">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-flame">
              {/* Radial Micro-Ring */}
              <svg width={14} height={14} className="-rotate-90 shrink-0">
                <circle cx={7} cy={7} r={5} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                <circle
                  cx={7}
                  cy={7}
                  r={5}
                  fill="none"
                  stroke="#FF5533"
                  strokeWidth={2}
                  strokeDasharray={31.4}
                  strokeDashoffset={31.4 - (Math.min(1, totals.protein_g / profile.target_protein_g) * 31.4)}
                  strokeLinecap="round"
                />
              </svg>
              Protein
            </span>
            <span className="num text-[10px] font-semibold text-muted">
              {Math.max(0, Math.round(pRemain))}g left
            </span>
          </div>
          <div className="num mt-1 flex items-baseline justify-between text-xs">
            <span className="font-bold text-fg">{Math.round(totals.protein_g)}g</span>
            <span className="text-[10px] text-faint">/ {profile.target_protein_g}g</span>
          </div>
          <ProgressBar
            className="mt-2"
            value={totals.protein_g}
            max={profile.target_protein_g}
            tone="flame"
            height="h-1.5"
          />
        </div>

        {/* Carbs Card */}
        <div className="rounded-xl border border-line bg-surface-2/80 p-2.5 transition-all hover:border-cyan/30">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-cyan">
              {/* Radial Micro-Ring */}
              <svg width={14} height={14} className="-rotate-90 shrink-0">
                <circle cx={7} cy={7} r={5} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                <circle
                  cx={7}
                  cy={7}
                  r={5}
                  fill="none"
                  stroke="#00D2FF"
                  strokeWidth={2}
                  strokeDasharray={31.4}
                  strokeDashoffset={31.4 - (Math.min(1, totals.carbs_g / profile.target_carbs_g) * 31.4)}
                  strokeLinecap="round"
                />
              </svg>
              Carbs
            </span>
            <span className="num text-[10px] font-semibold text-muted">
              {Math.max(0, Math.round(cRemain))}g left
            </span>
          </div>
          <div className="num mt-1 flex items-baseline justify-between text-xs">
            <span className="font-bold text-fg">{Math.round(totals.carbs_g)}g</span>
            <span className="text-[10px] text-faint">/ {profile.target_carbs_g}g</span>
          </div>
          <ProgressBar
            className="mt-2"
            value={totals.carbs_g}
            max={profile.target_carbs_g}
            tone="cyan"
            height="h-1.5"
          />
        </div>

        {/* Fat Card */}
        <div className="rounded-xl border border-line bg-surface-2/80 p-2.5 transition-all hover:border-purple/30">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-purple">
              {/* Radial Micro-Ring */}
              <svg width={14} height={14} className="-rotate-90 shrink-0">
                <circle cx={7} cy={7} r={5} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                <circle
                  cx={7}
                  cy={7}
                  r={5}
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth={2}
                  strokeDasharray={31.4}
                  strokeDashoffset={31.4 - (Math.min(1, totals.fat_g / profile.target_fat_g) * 31.4)}
                  strokeLinecap="round"
                />
              </svg>
              Fat
            </span>
            <span className="num text-[10px] font-semibold text-muted">
              {Math.max(0, Math.round(fRemain))}g left
            </span>
          </div>
          <div className="num mt-1 flex items-baseline justify-between text-xs">
            <span className="font-bold text-fg">{Math.round(totals.fat_g)}g</span>
            <span className="text-[10px] text-faint">/ {profile.target_fat_g}g</span>
          </div>
          <ProgressBar
            className="mt-2"
            value={totals.fat_g}
            max={profile.target_fat_g}
            tone="purple"
            height="h-1.5"
          />
        </div>
      </div>
    </Card>
  );
}
