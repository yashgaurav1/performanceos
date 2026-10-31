"use client";

import React, { useMemo } from "react";

interface KineticFocusDialProps {
  progressRatio: number; // 0 to 1
  timeFormatted: string;
  subject: string;
  mode: string;
  isBreak: boolean;
  paused: boolean;
  size?: number;
}

export function KineticFocusDial({
  progressRatio,
  timeFormatted,
  subject,
  mode,
  isBreak,
  paused,
  size = 236,
}: KineticFocusDialProps) {
  const stroke = 8;
  const radius = (size - stroke * 2 - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedRatio = Math.min(1, Math.max(0, progressRatio));
  const progressLength = clampedRatio * circumference;

  // 60 precision ticks for the 60 minutes/seconds
  const ticks = useMemo(() => {
    const list = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const isFiveMin = i % 5 === 0;
      const tickLength = isFiveMin ? 6 : 3;
      const active = i / count <= clampedRatio;
      list.push({ angle, isFiveMin, tickLength, active });
    }
    return list;
  }, [clampedRatio]);

  // Satellite orbital dot coordinate at the tip of progress arc
  const tipAngleDeg = clampedRatio * 360 - 90;
  const tipAngleRad = (tipAngleDeg * Math.PI) / 180;
  const satelliteX = size / 2 + radius * Math.cos(tipAngleRad);
  const satelliteY = size / 2 + radius * Math.sin(tipAngleRad);

  const activeColor = isBreak ? "#00E599" : "#FF5533";
  const glowColor = isBreak ? "rgba(0, 229, 153, 0.5)" : "rgba(255, 85, 51, 0.5)";

  return (
    <div className="relative shrink-0 flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Ambient Breathing Radar Sheen */}
      <div
        className="absolute inset-0 rounded-full blur-2xl pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`,
          opacity: paused ? 0.2 : 0.65,
        }}
      />

      <svg width={size} height={size} className="relative z-10">
        <defs>
          <linearGradient id="pomoSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor={activeColor} />
            <stop offset="100%" stopColor={isBreak ? "#00D2FF" : "#FF7744"} />
          </linearGradient>
          <filter id="satelliteGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 60 Precision Dial Ticks */}
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={0}
              y1={radius + 4}
              x2={0}
              y2={radius + 4 + t.tickLength}
              transform={`rotate(${t.angle})`}
              stroke={t.active ? (isBreak ? "#00E599" : "#FFFFFF") : "rgba(255, 255, 255, 0.08)"}
              strokeWidth={t.isFiveMin ? 1.5 : 1}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={stroke}
        />

        {/* Foreground Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#pomoSweepGrad)"
          strokeWidth={stroke}
          strokeDasharray={`${progressLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-300 ease-out"
        />

        {/* Orbital Satellite Dot at the leading edge */}
        {clampedRatio > 0 && clampedRatio < 1 && (
          <circle
            cx={satelliteX}
            cy={satelliteY}
            r={5}
            fill="#FFFFFF"
            filter="url(#satelliteGlow)"
            className="transition-all duration-300 ease-out"
          />
        )}
      </svg>

      {/* Center Digital Clock & Session Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none">
        <span className="num text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
          {timeFormatted}
        </span>
        <span className="mt-1.5 max-w-44 truncate text-xs font-sans font-medium text-zinc-400">
          {subject} · {mode}
        </span>
        {paused && (
          <span className="mt-1 text-[10px] font-sans uppercase px-2 py-0.5 rounded bg-amber/15 text-amber border border-amber/30">
            Paused
          </span>
        )}
      </div>
    </div>
  );
}
