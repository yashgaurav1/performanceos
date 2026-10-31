"use client";

import React, { useState } from "react";
import NumberFlow from "@number-flow/react";
import { Card } from "@/components/ui/primitives";

export function DeficitCalculatorWidget() {
  const [tdee, setTdee] = useState<number>(2550);
  const [targetLossRate, setTargetLossRate] = useState<number>(0.5); // kg per week

  // 1 kg body fat ≈ 7,700 kcal
  // Weekly deficit needed = targetLossRate * 7700
  // Daily deficit = (targetLossRate * 7700) / 7 = targetLossRate * 1100
  const dailyDeficit = Math.round(targetLossRate * 1100);
  const dailyTarget = Math.max(1200, tdee - dailyDeficit);

  return (
    <Card className="p-6 sm:p-8 not-prose bg-[#151517] border-white/10 my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#A1A1AA] block mb-1">
              Estimated Daily Burn (TDEE): {tdee} kcal
            </label>
            <input
              type="range"
              min={1600}
              max={4000}
              step={50}
              value={tdee}
              onChange={(e) => setTdee(Number(e.target.value))}
              className="w-full accent-[#FF5533]"
            />
          </div>

          <div>
            <label className="text-xs text-[#A1A1AA] block mb-1">
              Target Weight Loss Rate: {targetLossRate} kg / week
            </label>
            <input
              type="range"
              min={0.25}
              max={1.0}
              step={0.05}
              value={targetLossRate}
              onChange={(e) => setTargetLossRate(Number(e.target.value))}
              className="w-full accent-[#FF5533]"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] text-xs text-[#A1A1AA] leading-relaxed">
            {targetLossRate <= 0.5 ? (
              <span className="text-[#3CC8C0] font-semibold">
                Sustainable Pace: Ideal for preserving strength, mood, and lean muscle mass.
              </span>
            ) : (
              <span className="text-[#F5B841] font-semibold">
                Aggressive Pace: Recommended for short diet blocks only; requires strict protein adherence.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 rounded-2xl bg-[#0C0C0D] border border-white/10 text-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#A1A1AA] font-sans">
              Your Daily Calorie Target
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#FF5533] mt-3">
              <NumberFlow value={dailyTarget} />
              <span className="text-base text-[#A1A1AA] font-normal ml-1">kcal / day</span>
            </div>
            <p className="text-xs text-[#A1A1AA] mt-2">
              Daily Deficit: {dailyDeficit} kcal below burn
            </p>
          </div>

          <div className="pt-6 border-t border-white/[0.08] text-xs text-[#A1A1AA]">
            Projected 30-day weight loss: <span className="font-bold text-[#F5F5F4]">{(targetLossRate * 4.3).toFixed(1)} kg</span> of true trend reduction.
          </div>
        </div>
      </div>
    </Card>
  );
}
