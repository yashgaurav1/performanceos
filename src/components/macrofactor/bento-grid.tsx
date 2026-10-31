"use client";

import React, { useState, useCallback } from "react";
import {
  Flame,
  Activity,
  ScanBarcode,
  ShieldCheck,
  Zap,
  Sliders,
  Database,
  Lock,
  CheckCircle2,
} from "lucide-react";

export function BentoGrid() {
  // Card 1: Interactive Expenditure Engine State
  const [calorieIntake, setCalorieIntake] = useState<number>(2450);
  const [weeklyWeightDelta, setWeeklyWeightDelta] = useState<number>(-0.35); // kg per week

  // TDEE = Calorie Intake - (DeltaKg * 7700 / 7) = Intake - (DeltaKg * 1100)
  const computedTdee = Math.round(calorieIntake - weeklyWeightDelta * 1100);

  // Card 2: EWMA Noise Filter State
  const [showRawScale, setShowRawScale] = useState<boolean>(true);
  const [filterAlpha, setFilterAlpha] = useState<number>(0.1);

  // Card 3: Food Intelligence Simulator State
  interface SampleFood {
    name: string;
    brand: string;
    cal: number;
    p: number;
    c: number;
    f: number;
    barcode: string;
  }
  const sampleFoods: readonly SampleFood[] = [
    { name: "Rolled Oats", brand: "Quaker", cal: 375, p: 13.5, c: 68.0, f: 6.5, barcode: "030000010204" },
    { name: "Nonfat Greek Yogurt", brand: "Chobani", cal: 97, p: 17.3, c: 6.1, f: 0.4, barcode: "894700010045" },
    { name: "Wild Alaskan Salmon", brand: "Catch", cal: 182, p: 25.4, c: 0.0, f: 8.5, barcode: "041303022149" },
    { name: "Whey Isolate Protein", brand: "Optimum", cal: 120, p: 24.0, c: 1.0, f: 1.0, barcode: "748927028669" },
  ];
  const [selectedFood, setSelectedFood] = useState<SampleFood>(sampleFoods[0] as SampleFood);

  // Cursor spotlight handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const cards = document.querySelectorAll<HTMLElement>(".spotlight-card");
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  }, []);

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
    >
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full apple-glass-chip text-xs font-sans uppercase tracking-wider text-zinc-200">
          <Zap className="w-3.5 h-3.5 text-white" />
          Algorithmic Architecture
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-3xl">
          Engineered for Mathematical Truth. Zero Guilt. Zero Noise.
        </h2>
        <p className="text-zinc-400 max-w-2xl text-base sm:text-lg">
          PerformanceOS adjusts your targets based on real results. Every recommendation is grounded in your weight trend and daily burn.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* CARD 1: Adherence-Neutral Expenditure Equation (7 cols) */}
        <div className="lg:col-span-7 spotlight-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Adherence-Neutral Dynamic Expenditure
                  </h3>
                  <p className="text-xs text-zinc-400">Continuous Energy Balance Equation</p>
                </div>
              </div>
              <span className="text-[10px] font-sans uppercase px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-zinc-300">
                Live Formula
              </span>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              Log an untracked feast or miss a day · the algorithm does not penalize you. It calculates
              your exact metabolic rate from delta trend mass and actual consumed calories.
            </p>

            {/* Interactive Formula Playground */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 space-y-5">
              {/* Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-sans mb-1.5">
                    <span className="text-zinc-400">Average Daily Intake</span>
                    <span className="text-white font-bold">{calorieIntake.toLocaleString()} kcal/day</span>
                  </div>
                  <input
                    type="range"
                    min="1500"
                    max="3800"
                    step="25"
                    value={calorieIntake}
                    onChange={(e) => setCalorieIntake(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-sans mb-1.5">
                    <span className="text-zinc-400">Weekly Trend Weight Change (Δ kg)</span>
                    <span className={`font-bold ${weeklyWeightDelta < 0 ? "text-emerald-400" : weeklyWeightDelta > 0 ? "text-amber-400" : "text-white"}`}>
                      {weeklyWeightDelta > 0 ? `+${weeklyWeightDelta.toFixed(2)}` : weeklyWeightDelta.toFixed(2)} kg/wk
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.05"
                    value={weeklyWeightDelta}
                    onChange={(e) => setWeeklyWeightDelta(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Readout */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="font-sans text-xs text-zinc-400">
                  <span className="text-zinc-500">Equation:</span> Intake − (ΔW × 7,700 / 7)
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-zinc-500 font-sans uppercase">Estimated burn:</span>
                  <span className="text-2xl font-sans font-bold text-white tabular-nums tracking-tight">
                    {computedTdee.toLocaleString()}
                  </span>
                  <span className="text-xs font-sans text-zinc-400">kcal/day</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-white/[0.05] text-xs text-zinc-500 font-sans">
            <span className="inline-flex items-center gap-1.5 text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 0% Compliance Burden
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Calorie targets
            </span>
          </div>
        </div>

        {/* CARD 2: Smart Trend Noise Filtration (5 cols) */}
        <div className="lg:col-span-5 spotlight-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Trend Weight Smoothing
                  </h3>
                  <p className="text-xs text-zinc-400">Weight Trend Engine (α = {filterAlpha})</p>
                </div>
              </div>
              <button
                onClick={() => setShowRawScale(!showRawScale)}
                className={`text-[10px] font-sans uppercase px-2.5 py-1 rounded-md border transition-colors ${
                  showRawScale
                    ? "bg-white text-black border-white font-semibold"
                    : "bg-white/[0.05] text-zinc-400 border-white/10"
                }`}
              >
                {showRawScale ? "Scale Jitter On" : "Trend Only"}
              </button>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              Daily weight fluctuates up to ±2.5kg from water retention, sodium, and bowel transit.
              Our exponentially weighted moving average captures pure tissue changes.
            </p>

            {/* Interactive SVG Trend Visualizer */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 relative overflow-hidden">
              <svg viewBox="0 0 300 120" className="w-full h-28 overflow-visible">
                <defs>
                  <linearGradient id="trend-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1="0" y1="30" x2="300" y2="30" stroke="#222" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#222" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="#222" strokeDasharray="3 3" />

                {/* Raw Scale Noisy Points */}
                {showRawScale && (
                  <g className="transition-opacity duration-300">
                    {/* Simulated points: [x, y] */}
                    {[
                      [20, 45], [45, 30], [70, 58], [95, 35], [120, 68],
                      [145, 50], [170, 75], [195, 60], [220, 85], [245, 70],
                      [270, 95], [290, 82],
                    ].map(([px, py], i) => (
                      <circle
                        key={i}
                        cx={px}
                        cy={py}
                        r="3"
                        fill="#71717a"
                        className="opacity-70 hover:opacity-100 hover:scale-125 transition-all"
                      />
                    ))}
                    {/* Connecting jitter line */}
                    <polyline
                      fill="none"
                      stroke="#52525b"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      points="20,45 45,30 70,58 95,35 120,68 145,50 170,75 195,60 220,85 245,70 270,95 290,82"
                    />
                  </g>
                )}

                {/* Smooth Trend Curve */}
                <path
                  d="M 20,45 C 70,48 120,56 170,66 C 220,76 260,85 290,88"
                  fill="none"
                  stroke="url(#trend-glow)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Current node */}
                <circle cx="290" cy="88" r="4.5" fill="#ffffff" />
                <circle cx="290" cy="88" r="8" fill="#ffffff" opacity="0.2" className="animate-ping" />
              </svg>

              <div className="flex justify-between items-center text-[11px] font-sans mt-2 pt-2 border-t border-white/[0.05] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-white rounded"></span> Trend Weight
                </span>
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span> Raw Scale Noise
                </span>
                <span className="text-zinc-300 font-bold">Variance Filter: -78.4%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs font-sans text-zinc-400">
            <span>Dampening Parameter:</span>
            <div className="flex items-center gap-1">
              {[0.05, 0.1, 0.2].map((alpha) => (
                <button
                  key={alpha}
                  onClick={() => setFilterAlpha(alpha)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    filterAlpha === alpha
                      ? "bg-white text-black font-bold"
                      : "bg-white/[0.05] text-zinc-400 hover:text-white"
                  }`}
                >
                  α={alpha}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: Curated Food Database (6 cols) */}
        <div className="lg:col-span-6 spotlight-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                  <ScanBarcode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Global Nutrition Database
                  </h3>
                  <p className="text-xs text-zinc-400">3,000,000+ Verified Products</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-sans text-zinc-400">Verified</span>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              Search any food item or scan barcodes instantly with comprehensive macro breakdown.
            </p>

            {/* Food Selector Chips */}
            <div className="flex flex-wrap gap-1.5">
              {sampleFoods.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFood(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all ${
                    selectedFood.name === f.name
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-white/[0.04] text-zinc-400 border border-white/10 hover:border-white/20 hover:text-zinc-200"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Food Macro HUD */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div>
                  <div className="text-sm font-bold text-white">{selectedFood.name}</div>
                  <div className="text-xs text-zinc-500 font-sans">
                    {selectedFood.brand} • Barcode: {selectedFood.barcode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-sans font-bold text-white tabular-nums">
                    {selectedFood.cal} <span className="text-xs text-zinc-400 font-normal">kcal</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-sans">per 100g</div>
                </div>
              </div>

              {/* Macro breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center font-sans text-xs">
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">PROTEIN</span>
                  <span className="text-white font-bold">{selectedFood.p}g</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">CARBS</span>
                  <span className="text-white font-bold">{selectedFood.c}g</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">FAT</span>
                  <span className="text-white font-bold">{selectedFood.f}g</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-sans text-zinc-400">
            <span className="text-zinc-500">Speed Logging Shortcut:</span>
            <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white text-[11px]">
              Ctrl + K
            </kbd>
          </div>
        </div>

        {/* CARD 4: Enterprise-Grade Offline-First Engine (6 cols) */}
        <div className="lg:col-span-6 spotlight-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Reliable Data Architecture
                  </h3>
                  <p className="text-xs text-zinc-400">Local Cache & Cloud Sync</p>
                </div>
              </div>
              <span className="text-[10px] font-sans uppercase px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Operational
              </span>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              Zero guesswork. Built for offline-first multi-tab operation with instant local caching and secure cloud sync.
            </p>

            {/* Data Architecture Status Matrix */}
            <div className="grid grid-cols-2 gap-2 font-sans text-xs">
              <div className="p-3 rounded-xl bg-[#0a0a0a] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Database className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Cloud Sync</span>
                </div>
                <div className="text-white font-bold">30-Day Logs</div>
                <div className="text-[10px] text-zinc-500">Persistent local cache</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0a0a0a] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Lock className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Session Security</span>
                </div>
                <div className="text-white font-bold">Secure Account</div>
                <div className="text-[10px] text-zinc-500">Persistent Multi-Tab Cache</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0a0a0a] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Sliders className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Validation Engine</span>
                </div>
                <div className="text-white font-bold">Runtime Guard</div>
                <div className="text-[10px] text-zinc-500">Fully typed inputs</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0a0a0a] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Zap className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Edge Rate Limiter</span>
                </div>
                <div className="text-white font-bold">120 req / min Token Bucket</div>
                <div className="text-[10px] text-zinc-500">DDoS & brute-force immune</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-sans text-zinc-400">
            <span className="text-zinc-500">Response Latency:</span>
            <span className="text-white font-bold tabular-nums">&lt; 0.8ms (Local DB)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
