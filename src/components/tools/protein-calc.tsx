"use client";

import React, { useState } from "react";
import NumberFlow from "@number-flow/react";
import { Card } from "@/components/ui/primitives";

export function ProteinCalculatorWidget() {
  const [weightKg, setWeightKg] = useState<number>(75);
  const [goal, setGoal] = useState<"cut" | "maintain" | "bulk">("cut");

  // Multipliers based on evidence:
  // Cutting / fat loss: 2.0 to 2.4 g/kg to preserve muscle in a deficit
  // Maintenance: 1.6 to 2.0 g/kg
  // Muscle gain (bulk): 1.8 to 2.2 g/kg
  const multiplier = goal === "cut" ? 2.2 : goal === "bulk" ? 2.0 : 1.8;
  const targetGrams = Math.round(weightKg * multiplier);

  return (
    <Card className="p-6 sm:p-8 not-prose bg-[#151517] border-white/10 my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#A1A1AA] block mb-2 font-medium">Your Goal</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setGoal("cut")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  goal === "cut"
                    ? "bg-[#FF5533] text-white border-[#FF5533]"
                    : "bg-[#0C0C0D] text-[#A1A1AA] border-white/10"
                }`}
              >
                Fat Loss
              </button>
              <button
                onClick={() => setGoal("maintain")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  goal === "maintain"
                    ? "bg-[#3CC8C0] text-black border-[#3CC8C0]"
                    : "bg-[#0C0C0D] text-[#A1A1AA] border-white/10"
                }`}
              >
                Maintain
              </button>
              <button
                onClick={() => setGoal("bulk")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  goal === "bulk"
                    ? "bg-[#F5B841] text-black border-[#F5B841]"
                    : "bg-[#0C0C0D] text-[#A1A1AA] border-white/10"
                }`}
              >
                Muscle Gain
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#A1A1AA] block mb-1">
              Body Weight: {weightKg} kg
            </label>
            <input
              type="range"
              min={40}
              max={150}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full accent-[#3CC8C0]"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] text-xs text-[#A1A1AA] leading-relaxed">
            Target multiplier: <span className="text-[#F5F5F4] font-bold">{multiplier} g/kg</span>. Higher protein during a calorie deficit prevents lean tissue catabolism.
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 rounded-2xl bg-[#0C0C0D] border border-white/10 text-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#A1A1AA] font-sans">
              Recommended Daily Protein
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#3CC8C0] mt-3">
              <NumberFlow value={targetGrams} />
              <span className="text-base text-[#A1A1AA] font-normal ml-1">g / day</span>
            </div>
            <p className="text-xs text-[#A1A1AA] mt-2">
              Calories from protein: {targetGrams * 4} kcal
            </p>
          </div>

          <div className="pt-6 border-t border-white/[0.08] text-xs text-[#A1A1AA]">
            Split into 3 to 4 meals of <span className="font-bold text-[#F5F5F4]">{Math.round(targetGrams / 4)} g</span> per meal to stimulate muscle protein synthesis.
          </div>
        </div>
      </div>
    </Card>
  );
}
