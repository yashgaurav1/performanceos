"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import type { ComputedDayTelemetry } from "@/lib/macrofactor-engine";

interface KineticChartProps {
  series: ComputedDayTelemetry[];
  mode: "expenditure" | "weight" | "macros";
  targetCalories?: number;
}

export function KineticChart({ series, mode, targetCalories = 2170 }: KineticChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 55 };

  const chartData = useMemo(() => {
    if (!series || series.length === 0) return [];
    return series;
  }, [series]);

  // Extract min/max values based on current active view
  const bounds = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 100 };

    if (mode === "expenditure") {
      const allVals = chartData.flatMap((d) => [d.calculatedExpenditureKcal, d.caloriesIn]);
      const min = Math.floor(Math.min(...allVals) / 100) * 100 - 100;
      const max = Math.ceil(Math.max(...allVals) / 100) * 100 + 100;
      return { min: Math.max(1200, min), max: Math.min(4500, max) };
    }

    if (mode === "weight") {
      const allWeights = chartData
        .flatMap((d) => [d.trendWeightKg, d.scaleWeightKg])
        .filter((w): w is number => w !== null && w > 0);
      const min = Math.floor(Math.min(...allWeights) * 2) / 2 - 0.5;
      const max = Math.ceil(Math.max(...allWeights) * 2) / 2 + 0.5;
      return { min, max };
    }

    // mode === "macros" (Calories In vs Target)
    const allCals = chartData.map((d) => d.caloriesIn).concat(targetCalories);
    const min = Math.floor(Math.min(...allCals) / 100) * 100 - 100;
    const max = Math.ceil(Math.max(...allCals) / 100) * 100 + 100;
    return { min: Math.max(1000, min), max };
  }, [chartData, mode, targetCalories]);

  const getY = useCallback(
    (val: number) => {
      const range = bounds.max - bounds.min || 1;
      const norm = (val - bounds.min) / range;
      return height - padding.bottom - norm * (height - padding.top - padding.bottom);
    },
    [bounds.max, bounds.min, height, padding.bottom, padding.top]
  );

  const getX = useCallback(
    (idx: number) => {
      const usableWidth = width - padding.left - padding.right;
      const step = chartData.length > 1 ? usableWidth / (chartData.length - 1) : usableWidth;
      return padding.left + idx * step;
    },
    [chartData.length, padding.left, padding.right, width]
  );

  // Generate SVG spline paths
  const paths = useMemo(() => {
    if (chartData.length === 0) return { mainLine: "", area: "", secondaryLine: "" };

    const getPrimaryVal = (d: ComputedDayTelemetry) => {
      if (mode === "expenditure") return d.calculatedExpenditureKcal;
      if (mode === "weight") return d.trendWeightKg;
      return d.caloriesIn;
    };

    const points = chartData.map((d, i) => ({ x: getX(i), y: getY(getPrimaryVal(d)) }));
    if (points.length === 0 || !points[0]) {
      return { mainLine: "", area: "", secondaryLine: "" };
    }

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1] ?? firstPoint;

    // Simple smooth bezier spline generator
    let mainLine = `M ${firstPoint.x} ${firstPoint.y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      if (!p0 || !p1) continue;
      const cpX = (p0.x + p1.x) / 2;
      mainLine += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const baselineY = height - padding.bottom;
    const area = `${mainLine} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;

    // Secondary line (Raw scale weight or Intake in expenditure mode)
    let secondaryLine = "";
    if (mode === "expenditure") {
      const intakePoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.caloriesIn) }));
      const firstIntake = intakePoints[0];
      if (firstIntake) {
        secondaryLine = `M ${firstIntake.x} ${firstIntake.y}`;
        for (let i = 0; i < intakePoints.length - 1; i++) {
          const ip0 = intakePoints[i];
          const ip1 = intakePoints[i + 1];
          if (!ip0 || !ip1) continue;
          const cpX = (ip0.x + ip1.x) / 2;
          secondaryLine += ` C ${cpX} ${ip0.y}, ${cpX} ${ip1.y}, ${ip1.x} ${ip1.y}`;
        }
      }
    } else if (mode === "weight") {
      const rawPoints = chartData
        .map((d, i) => (d.scaleWeightKg ? { x: getX(i), y: getY(d.scaleWeightKg) } : null))
        .filter((p): p is { x: number; y: number } => p !== null);

      const firstRaw = rawPoints[0];
      if (firstRaw) {
        secondaryLine = `M ${firstRaw.x} ${firstRaw.y}`;
        for (let i = 1; i < rawPoints.length; i++) {
          const rp = rawPoints[i];
          if (!rp) continue;
          secondaryLine += ` L ${rp.x} ${rp.y}`;
        }
      }
    }

    return { mainLine, area, secondaryLine };
  }, [chartData, mode, getX, getY, height, padding.bottom]);

  // Handle crosshair hover scrubbing
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || chartData.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (mouseX - padding.left) / (rect.width - padding.left - padding.right)));
    const index = Math.round(ratio * (chartData.length - 1));
    setHoverIndex(index);
  };

  const activePoint = hoverIndex !== null && chartData[hoverIndex] ? chartData[hoverIndex] : chartData[chartData.length - 1];
  const activeX = hoverIndex !== null ? getX(hoverIndex) : chartData.length > 0 ? getX(chartData.length - 1) : 0;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden select-none">
      {/* SVG Kinetic Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          {/* Strict Monochrome White-to-Transparent Gradient */}
          <linearGradient id="mono-glow-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.00" />
          </linearGradient>

          <filter id="white-node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle Horizontal Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const val = bounds.min + pct * (bounds.max - bounds.min);
          const y = getY(val);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                fill="rgba(255, 255, 255, 0.35)"
                fontSize="10"
                fontFamily="var(--font-sans)"
                textAnchor="end"
                className="tabular-nums"
              >
                {mode === "weight" ? `${val.toFixed(1)}k` : Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Target Reference Line for Macros Mode */}
        {mode === "macros" && (
          <g>
            <line
              x1={padding.left}
              y1={getY(targetCalories)}
              x2={width - padding.right}
              y2={getY(targetCalories)}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <text
              x={width - padding.right}
              y={getY(targetCalories) - 6}
              fill="rgba(255, 255, 255, 0.6)"
              fontSize="9"
              fontFamily="var(--font-sans)"
              textAnchor="end"
              className="tabular-nums font-semibold uppercase tracking-wider"
            >
              Target: {targetCalories} kcal
            </text>
          </g>
        )}

        {/* Smooth Area Fill */}
        {paths.area && <path d={paths.area} fill="url(#mono-glow-gradient)" />}

        {/* Secondary Curve (Intake or Raw Scale Weight Dots/Lines) */}
        {paths.secondaryLine && (
          <path
            d={paths.secondaryLine}
            fill="none"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth={mode === "weight" ? "1" : "1.5"}
            strokeDasharray={mode === "weight" ? "2 2" : undefined}
          />
        )}

        {/* Raw Scale Weight Dots */}
        {mode === "weight" &&
          chartData.map((d, i) => {
            if (d.scaleWeightKg === null) return null;
            const x = getX(i);
            const y = getY(d.scaleWeightKg);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2"
                fill="rgba(255, 255, 255, 0.45)"
                className="transition-all duration-150 hover:r-3 hover:fill-white"
              />
            );
          })}

        {/* Primary Curve (Pure White Active Spline) */}
        {paths.mainLine && (
          <path
            d={paths.mainLine}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#white-node-glow)"
          />
        )}

        {/* Live Hover Crosshair */}
        {activePoint && (
          <g>
            <line
              x1={activeX}
              y1={padding.top}
              x2={activeX}
              y2={height - padding.bottom}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            {/* Glowing Active Node on Main Curve */}
            <circle
              cx={activeX}
              cy={getY(
                mode === "expenditure"
                  ? activePoint.calculatedExpenditureKcal
                  : mode === "weight"
                  ? activePoint.trendWeightKg
                  : activePoint.caloriesIn
              )}
              r="4.5"
              fill="#FFFFFF"
              stroke="#08090C"
              strokeWidth="2"
              filter="url(#white-node-glow)"
            />
          </g>
        )}

        {/* X-Axis Date Ticks */}
        {chartData.map((d, i) => {
          // Show tick approximately every 5 days or first/last
          const showTick = i === 0 || i === chartData.length - 1 || i % Math.max(1, Math.floor(chartData.length / 5)) === 0;
          if (!showTick) return null;
          const x = getX(i);
          const parts = d.date.split("-");
          const label = `${parts[1]}/${parts[2]}`;
          return (
            <text
              key={i}
              x={x}
              y={height - padding.bottom + 18}
              fill="rgba(255, 255, 255, 0.4)"
              fontSize="10"
              fontFamily="var(--font-sans)"
              textAnchor="middle"
              className="tabular-nums"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Floating Scrubbing HUD */}
      {activePoint && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            <span className="num text-xs font-bold text-white tracking-tight">{activePoint.date}</span>
            <span className="text-[11px] text-zinc-400">· Log Scrub</span>
          </div>

          <div className="flex items-center gap-5 num text-xs">
            {mode === "expenditure" && (
              <>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Daily Burn</span>
                  <span className="font-bold text-white">{activePoint.calculatedExpenditureKcal}</span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Intake</span>
                  <span className="font-bold text-zinc-300">{activePoint.caloriesIn}</span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Deficit</span>
                  <span className={`font-bold ${activePoint.deficitKcal >= 0 ? "text-white" : "text-zinc-400"}`}>
                    {activePoint.deficitKcal >= 0 ? `+${activePoint.deficitKcal}` : activePoint.deficitKcal}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">kcal</span>
                </div>
              </>
            )}

            {mode === "weight" && (
              <>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Trend Weight</span>
                  <span className="font-bold text-white">{activePoint.trendWeightKg.toFixed(2)}</span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Raw Scale</span>
                  <span className="font-bold text-zinc-300">
                    {activePoint.scaleWeightKg ? activePoint.scaleWeightKg.toFixed(1) : "--"}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Day Delta</span>
                  <span className="font-bold text-white">
                    {activePoint.weightDeltaKg > 0 ? `+${activePoint.weightDeltaKg}` : activePoint.weightDeltaKg}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">kg</span>
                </div>
              </>
            )}

            {mode === "macros" && (
              <>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Calories</span>
                  <span className="font-bold text-white">{activePoint.caloriesIn}</span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Protein</span>
                  <span className="font-bold text-zinc-300">{activePoint.proteinG ?? 0}</span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">g</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Carbs</span>
                  <span className="font-bold text-zinc-300">{activePoint.carbsG ?? 0}</span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">g</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase mr-1.5 font-sans font-semibold">Fat</span>
                  <span className="font-bold text-zinc-300">{activePoint.fatG ?? 0}</span>
                  <span className="text-[10px] text-zinc-400 ml-0.5">g</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
