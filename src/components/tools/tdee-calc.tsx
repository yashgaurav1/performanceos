"use client";

import React, { useState } from "react";
import NumberFlow from "@number-flow/react";
import { Card } from "@/components/ui/primitives";

export function TDEECalculatorWidget() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState<number>(26);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [activity, setActivity] = useState<number>(1.375); // Sedentary, Light, Moderate, Heavy

  // Mifflin-St Jeor Formula
  // BMR: 10 * weight + 6.25 * height - 5 * age + (male ? 5 : -161)
  const bmr = Math.round(
    10 * weightKg + 6.25 * heightCm - 5 * age + (gender === "male" ? 5 : -161)
  );
  const tdee = Math.round(bmr * activity);

  return (
    <Card className="p-6 sm:p-8 not-prose bg-[#151517] border-white/10 my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setGender("male")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                gender === "male"
                  ? "bg-[#F5F5F4] text-[#0C0C0D] border-white"
                  : "bg-[#0C0C0D] text-[#A1A1AA] border-white/10 hover:border-white/20"
              }`}
            >
              Male
            </button>
            <button
              onClick={() => setGender("female")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                gender === "female"
                  ? "bg-[#F5F5F4] text-[#0C0C0D] border-white"
                  : "bg-[#0C0C0D] text-[#A1A1AA] border-white/10 hover:border-white/20"
              }`}
            >
              Female
            </button>
          </div>

          <div>
            <label className="text-xs text-[#A1A1AA] block mb-1">
              Age: {age} years
            </label>
            <input
              type="range"
              min={16}
              max={80}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-[#FF5533]"
            />
          </div>

          <div>
            <label className="text-xs text-[#A1A1AA] block mb-1">
              Weight: {weightKg} kg
            </label>
            <input
              type="range"
              min={40}
              max={150}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full accent-[#FF5533]"
            />
          </div>

          <div>
            <label className="text-xs text-[#A1A1AA] block mb-1">
              Height: {heightCm} cm
            </label>
            <input
              type="range"
              min={140}
              max={210}
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full accent-[#FF5533]"
            />
          </div>

          <div>
            <label className="text-xs text-[#A1A1AA] block mb-1">Activity Level</label>
            <select
              value={activity}
              onChange={(e) => setActivity(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[#0C0C0D] border border-white/10 text-xs text-[#F5F5F4]"
            >
              <option value={1.2}>Sedentary (Desk job, little exercise)</option>
              <option value={1.375}>Lightly active (1 to 3 workouts/week)</option>
              <option value={1.55}>Moderately active (3 to 5 workouts/week)</option>
              <option value={1.725}>Very active (6 to 7 heavy workouts/week)</option>
            </select>
          </div>
        </div>

        {/* Output Metrics */}
        <div className="flex flex-col justify-between p-6 rounded-2xl bg-[#0C0C0D] border border-white/10 text-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#A1A1AA] font-sans">
              Estimated Daily Burn (TDEE)
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#3CC8C0] mt-3">
              <NumberFlow value={tdee} />
              <span className="text-base text-[#A1A1AA] font-normal ml-1">kcal/day</span>
            </div>
            <p className="text-xs text-[#A1A1AA] mt-2">
              Basal Metabolic Rate (BMR): {bmr} kcal/day
            </p>
          </div>

          <div className="pt-6 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <span className="text-[#A1A1AA] block">0.5 kg/week Cut</span>
              <span className="font-bold text-[#FF5533]">{tdee - 550} kcal</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <span className="text-[#A1A1AA] block">Lean Bulk</span>
              <span className="font-bold text-[#F5B841]">{tdee + 250} kcal</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
