"use client";

import { useMemo } from "react";

interface SpringRingsProps {
  calories: number;
  targetCalories: number;
  protein: number;
  targetProtein: number;
  carbs: number;
  targetCarbs: number;
  fat: number;
  targetFat: number;
}

export function SpringRings({
  calories,
  targetCalories,
  protein,
  targetProtein,
  carbs,
  targetCarbs,
  fat,
  targetFat,
}: SpringRingsProps) {
  const rings = useMemo(() => {
    return [
      {
        label: "Calories",
        current: calories,
        target: targetCalories,
        unit: "kcal",
        radius: 76,
        strokeWidth: 8,
        strokeColor: "#FFFFFF",
      },
      {
        label: "Protein",
        current: Math.round(protein),
        target: targetProtein,
        unit: "g",
        radius: 60,
        strokeWidth: 7,
        strokeColor: "rgba(255, 255, 255, 0.85)",
      },
      {
        label: "Carbs",
        current: Math.round(carbs),
        target: targetCarbs,
        unit: "g",
        radius: 46,
        strokeWidth: 6,
        strokeColor: "rgba(255, 255, 255, 0.55)",
      },
      {
        label: "Fat",
        current: Math.round(fat),
        target: targetFat,
        unit: "g",
        radius: 34,
        strokeWidth: 5,
        strokeColor: "rgba(255, 255, 255, 0.35)",
      },
    ];
  }, [calories, targetCalories, protein, targetProtein, carbs, targetCarbs, fat, targetFat]);

  const calRemaining = Math.max(0, targetCalories - calories);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
      {/* Concentric Rings SVG */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
          {rings.map((r) => {
            const circumference = 2 * Math.PI * r.radius;
            const progress = Math.min(1.2, Math.max(0, r.current / Math.max(1, r.target)));
            const strokeDashoffset = circumference * (1 - progress);

            return (
              <g key={r.label}>
                {/* Background Track */}
                <circle
                  cx="90"
                  cy="90"
                  r={r.radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={r.strokeWidth}
                />
                {/* Active Progress Arc with Spring-like Transition */}
                <circle
                  cx="90"
                  cy="90"
                  r={r.radius}
                  fill="none"
                  stroke={r.strokeColor}
                  strokeWidth={r.strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </g>
            );
          })}
        </svg>

        {/* Center Calorie Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="num text-xl font-bold tracking-tight text-white leading-none">
            {calRemaining}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">
            kcal left
          </span>
        </div>
      </div>

      {/* Numerical Metrics Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
        {rings.map((r) => {
          const pct = Math.round((r.current / Math.max(1, r.target)) * 100);
          return (
            <div
              key={r.label}
              className="flex flex-col p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {r.label}
                </span>
                <span className="num text-[10px] text-zinc-500 font-bold">{pct}%</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="num text-lg font-bold text-white">{r.current}</span>
                <span className="num text-xs text-zinc-400">/ {r.target} {r.unit}</span>
              </div>
              {/* Micro Progress Bar */}
              <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
