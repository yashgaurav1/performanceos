"use client";

import { useState } from "react";
import { Check, Loader2, ArrowRight, X, ShieldCheck, Zap } from "lucide-react";

interface CheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckInComplete: () => void;
  currentTDEE: number;
  currentTrendWeight: number;
  goalType: string;
}

export function CheckInModal({
  open,
  onOpenChange,
  onCheckInComplete,
  currentTDEE,
  currentTrendWeight,
  goalType = "Cut",
}: CheckInModalProps) {
  const [selectedGoal, setSelectedGoal] = useState(goalType);
  const [targetRate, setTargetRate] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    previousTDEE: number;
    newTDEE: number;
    recommendedCalories: number;
    recommendedProtein: number;
    recommendedCarbs: number;
    recommendedFat: number;
    dailyDeficitKcal: number;
  } | null>(null);

  if (!open) return null;

  async function handleRunCheckIn() {
    setLoading(true);
    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalType: selectedGoal,
          targetRatePerWeek: targetRate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.targets);
        onCheckInComplete();
      }
    } catch (err) {
      console.error("Check-in error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#0D0D0E] shadow-[0_24px_70px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black font-black text-xs">
              POS
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                PerformanceOS Weekly Check-In
              </h3>
              <p className="text-[11px] text-zinc-400">Adaptive Targets · Your Coach</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!result ? (
            <>
              {/* Stats Snapshot */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02] num text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold block">
                    Current Daily Burn
                  </span>
                  <span className="text-base font-bold text-white">{currentTDEE}</span>
                  <span className="text-[10px] text-zinc-400 ml-1">kcal/day</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold block">
                    Smoothed Trend Weight
                  </span>
                  <span className="text-base font-bold text-white">{currentTrendWeight.toFixed(2)}</span>
                  <span className="text-[10px] text-zinc-400 ml-1">kg</span>
                </div>
              </div>

              {/* Goal Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  Select Training & Macro Focus:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Cut", "Maintain", "Bulk"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGoal(g)}
                      className={`h-11 rounded-xl border font-semibold text-xs transition-all ${
                        selectedGoal.toLowerCase() === g.toLowerCase()
                          ? "border-white bg-white text-black shadow-xs"
                          : "border-white/10 bg-black/40 text-zinc-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate of Loss / Gain (if not maintain) */}
              {selectedGoal.toLowerCase() !== "maintain" && (
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-semibold text-zinc-400">Target Pace Per Week</span>
                    <span className="num font-bold text-white">{targetRate} kg / week</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={targetRate}
                    onChange={(e) => setTargetRate(parseFloat(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 num mt-1">
                    <span>Conservative (0.2kg)</span>
                    <span>Aggressive (1.0kg)</span>
                  </div>
                </div>
              )}

              {/* Explanatory note */}
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] text-[11px] text-zinc-400 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-zinc-300 shrink-0 mt-0.5" />
                <span>
                  PerformanceOS has no guilt and no penalties. Your targets adjust based purely on your observed weight trend, never punitive cuts.
                </span>
              </div>

              <button
                type="button"
                onClick={handleRunCheckIn}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-98 transition-all shadow-xs"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                Run Algorithmic Recalibration
              </button>
            </>
          ) : (
            /* Result Reveal */
            <div className="space-y-4 animate-scale-up">
              <div className="p-4 rounded-xl border border-white/20 bg-white/5 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                  New Recommended Target
                </span>
                <div className="num text-3xl font-extrabold text-white mt-1">
                  {result.recommendedCalories}{" "}
                  <span className="text-xs font-normal text-zinc-400">kcal/day</span>
                </div>
                <span className="num text-xs text-zinc-400 block mt-1">
                  {result.dailyDeficitKcal > 0
                    ? `-${result.dailyDeficitKcal} kcal deficit`
                    : result.dailyDeficitKcal < 0
                    ? `+${Math.abs(result.dailyDeficitKcal)} kcal surplus`
                    : "Zero-deficit maintenance"}
                </span>
              </div>

              {/* New Macro Targets */}
              <div className="grid grid-cols-3 gap-2.5 num text-center">
                <div className="p-3 rounded-xl border border-white/10 bg-black/50">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold block">
                    Protein
                  </span>
                  <span className="text-lg font-bold text-white">{result.recommendedProtein}g</span>
                  <span className="text-[9px] text-zinc-500 block">2.2g/kg</span>
                </div>
                <div className="p-3 rounded-xl border border-white/10 bg-black/50">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold block">
                    Carbs
                  </span>
                  <span className="text-lg font-bold text-white">{result.recommendedCarbs}g</span>
                  <span className="text-[9px] text-zinc-500 block">Remainder</span>
                </div>
                <div className="p-3 rounded-xl border border-white/10 bg-black/50">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold block">
                    Fat
                  </span>
                  <span className="text-lg font-bold text-white">{result.recommendedFat}g</span>
                  <span className="text-[9px] text-zinc-500 block">0.8g/kg</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-zinc-400 flex items-center justify-between">
                <span>Sync Status:</span>
                <span className="text-white font-sans flex items-center gap-1 font-semibold">
                  <Check size={13} className="text-white" /> Saved to your logs
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  onOpenChange(false);
                }}
                className="w-full h-11 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-98 transition-all shadow-xs"
              >
                Accept New Coaching Targets
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
