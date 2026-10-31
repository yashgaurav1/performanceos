"use client";

import React, { useMemo } from "react";
import { Odometer } from "@/components/motion/odometer";

interface KineticScoreDialProps {
  score: number;
  highlightCategory?: string | null;
  size?: number;
}

export function KineticScoreDial({
  score,
  highlightCategory,
  size = 124,
}: KineticScoreDialProps) {
  const stroke = 8;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  // Generate 48 precision dial ticks around perimeter
  const ticks = useMemo(() => {
    const list = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const isMajor = i % 6 === 0;
      const tickLength = isMajor ? 5 : 3;
      const active = (i / count) * 100 <= score;
      list.push({ angle, isMajor, tickLength, active });
    }
    return list;
  }, [score]);

  return (
    <div className="relative shrink-0 flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Ambient Breathing Glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl pointer-events-none transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle, rgba(255, 85, 51, 0.22) 0%, transparent 70%)",
          opacity: score > 50 ? 0.9 : 0.4,
        }}
      />

      <svg width={size} height={size} className="relative z-10 -rotate-90">
        <defs>
          <linearGradient id="scoreDialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FF5533" />
            <stop offset="100%" stopColor="#FF8855" />
          </linearGradient>
          <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Tick Ring */}
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={0}
              y1={radius + 3}
              x2={0}
              y2={radius + 3 + t.tickLength}
              transform={`rotate(${t.angle})`}
              stroke={t.active ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 255, 255, 0.08)"}
              strokeWidth={t.isMajor ? 1.5 : 1}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={stroke}
        />

        {/* Foreground Animated Gradient Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreDialGrad)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          filter={score >= 70 ? "url(#dialGlow)" : undefined}
        />
      </svg>

      {/* Central Numeric Score Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none">
        <div className="flex items-baseline">
          <Odometer value={score} className="text-3xl font-extrabold tracking-tight text-white" />
        </div>
        <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-widest mt-0.5">
          {highlightCategory ? highlightCategory : "Score / 100"}
        </span>
      </div>
    </div>
  );
}
