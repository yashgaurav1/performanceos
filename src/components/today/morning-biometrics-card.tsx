"use client";
import { useState } from "react";
import {
  Annoyed,
  Battery,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Frown,
  Laugh,
  Meh,
  Moon,
  Scale,
  Smile,
  Zap,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { Stepper } from "@/components/ui/stepper";
import { useDailyLog, useDailyLogsRange } from "@/lib/db/hooks";
import { patchDailyLog } from "@/lib/db/repo";
import { addDays } from "@/lib/math/dates";
import { weightTrendDiff } from "@/lib/math/stats";
import { cn } from "@/lib/utils";

const MOOD = [Frown, Annoyed, Meh, Smile, Laugh];
const ENERGY = [BatteryLow, Battery, BatteryMedium, BatteryFull, Zap];
const QUALITY_LABEL = ["Awful", "Poor", "OK", "Good", "Great"];

function IconScale({
  icons,
  value,
  onChange,
  label,
}: {
  icons: typeof MOOD;
  value: number | null;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5">
      {icons.map((Icon, i) => {
        const v = i + 1;
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} ${v}`}
            onClick={() => onChange(v)}
            className={cn(
              "flex h-11 flex-1 items-center justify-center rounded-xl border transition-all duration-150 active:scale-90 hover:scale-105",
              active
                ? "border-flame/50 bg-flame/15 text-flame shadow-xs"
                : "border-line bg-surface-2/60 text-faint hover:text-muted hover:border-line-strong",
            )}
          >
            <Icon size={19} />
          </button>
        );
      })}
    </div>
  );
}

export function MorningBiometricsCard({ date }: { date: string }) {
  const log = useDailyLog(date);
  const history = useDailyLogsRange(addDays(date, -30), date);
  const [weightDraft, setWeightDraft] = useState<string | null>(null);

  const weights = history.flatMap((l) =>
    l.body_weight_kg === null ? [] : [{ date: l.log_date, kg: l.body_weight_kg }],
  );
  const trend = weightTrendDiff(weights, date);
  const sleep = log?.sleep_hours ?? null;

  const commitWeight = () => {
    if (weightDraft === null) return;
    const kg = Number(weightDraft);
    void patchDailyLog(date, {
      body_weight_kg:
        weightDraft.trim() === ""
          ? null
          : kg > 20 && kg < 300
          ? Math.round(kg * 100) / 100
          : log?.body_weight_kg ?? null,
    });
    setWeightDraft(null);
  };

  return (
    <Card>
      <CardHeader
        eyebrow="Recovery & Metabolism"
        title="Biometrics & Trend Weight"
        icon={<Moon size={16} className="text-flame" />}
        action={
          sleep !== null && sleep < 6.5 ? (
            <Pill tone="amber">Prioritize Recovery</Pill>
          ) : (
            <Pill tone="mint">Ready</Pill>
          )
        }
      />
      <div className="space-y-4">
        {/* PerformanceOS Weight Trend Module */}
        <div className="rounded-xl border border-line bg-surface-2/60 p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="weight" className="flex items-center gap-1.5 text-fg font-semibold">
              <Scale size={13} className="text-flame" /> Scale Weigh-in
            </Label>
            {trend && (
              <span className="num text-[11px] font-semibold text-flame">
                Trend Weight: <span className="font-bold text-fg">{trend.trendKg} kg</span>
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                id="weight"
                inputMode="decimal"
                className="num pr-10 font-bold text-base"
                placeholder="Enter kg..."
                value={weightDraft ?? (log?.body_weight_kg?.toString() ?? "")}
                onChange={(e) => setWeightDraft(e.target.value)}
                onBlur={commitWeight}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-faint">
                kg
              </span>
            </div>
            {trend ? (
              <Pill
                tone={
                  Math.abs(trend.diffKg) < 0.2
                    ? "neutral"
                    : trend.diffKg < 0
                    ? "mint"
                    : "amber"
                }
                className="num h-11 px-3 text-xs font-bold"
              >
                {trend.diffKg > 0 ? "+" : ""}
                {trend.diffKg.toFixed(1)} kg vs trend
              </Pill>
            ) : (
              <span className="text-[11px] text-faint px-2">Trend starts with 2 weigh-ins</span>
            )}
          </div>
        </div>

        {/* Sleep Duration */}
        <div>
          <Label>Sleep duration</Label>
          <div className="flex gap-2">
            <Stepper
              className="flex-1"
              value={sleep}
              step={0.5}
              min={4}
              max={10}
              format={(v) => v.toFixed(1)}
              unit="h"
              placeholder="7.5h?"
              onChange={(v) => void patchDailyLog(date, { sleep_hours: v })}
            />
            <Input
              aria-label="Exact sleep hours"
              className="num w-20 text-center font-bold"
              inputMode="decimal"
              placeholder="exact"
              key={`sleep-${sleep}`}
              defaultValue={sleep ?? ""}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (e.target.value !== "" && v >= 0 && v <= 24 && v !== sleep)
                  void patchDailyLog(date, { sleep_hours: Math.round(v * 10) / 10 });
              }}
            />
          </div>
        </div>

        {/* Sleep Quality */}
        <div>
          <Label>Sleep quality</Label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                type="button"
                aria-label={`Quality ${q} ${QUALITY_LABEL[q - 1]}`}
                aria-pressed={log?.sleep_quality === q}
                onClick={() => void patchDailyLog(date, { sleep_quality: q })}
                className={cn(
                  "num flex h-11 flex-1 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-all active:scale-95",
                  log?.sleep_quality === q
                    ? "border-flame/50 bg-flame/15 text-flame shadow-xs"
                    : "border-line bg-surface-2/60 text-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {q}
                <span className="text-[9px] font-normal opacity-70">{QUALITY_LABEL[q - 1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood & Energy */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Subjective Mood</Label>
            <IconScale
              icons={MOOD}
              value={log?.mood_score ?? null}
              label="Mood"
              onChange={(v) => void patchDailyLog(date, { mood_score: v })}
            />
          </div>
          <div>
            <Label>Energy Level</Label>
            <IconScale
              icons={ENERGY}
              value={log?.energy_score ?? null}
              label="Energy"
              onChange={(v) => void patchDailyLog(date, { energy_score: v })}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
