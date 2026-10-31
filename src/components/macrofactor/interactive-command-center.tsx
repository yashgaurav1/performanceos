"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Flame,
  Scale,
  Target,
  Sparkles,
  Plus,
  RefreshCw,
  Check,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { KineticChart } from "./kinetic-chart";
import { SpringRings } from "./spring-rings";
import { SpeedLogModal } from "./speed-log-modal";
import { CheckInModal } from "./check-in-modal";
import { PerformanceOSMark } from "@/components/shell/brand-logo";
import type { ComputedDayTelemetry } from "@/lib/macrofactor-engine";

interface TelemetryData {
  user: {
    id: string;
    name: string;
    email: string;
    goalType: string;
    targetRatePerWeek: number;
  };
  timeframe: "7d" | "14d" | "30d" | "90d";
  series: ComputedDayTelemetry[];
  currentWeight: number | null;
  currentTrend: number | null;
  currentTDEE: number;
  macroTargets: {
    recommendedCalories: number;
    recommendedProtein: number;
    recommendedCarbs: number;
    recommendedFat: number;
    deficitOrSurplusKcal: number;
  };
  todayLog: {
    id: string;
    date: string;
    scaleWeightKg: number | null;
    caloriesIn: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    foodItems?: Array<{
      id: string;
      foodName: string;
      brand?: string | null;
      servingGrams: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      timestamp: string;
    }>;
  } | null;
}

export function InteractiveCommandCenter() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"7d" | "14d" | "30d" | "90d">("30d");
  const [chartMode, setChartMode] = useState<"expenditure" | "weight" | "macros">("expenditure");

  // Modal states
  const [speedLogOpen, setSpeedLogOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  // Quick weight log state
  const [quickWeight, setQuickWeight] = useState("");
  const [weightSaving, setWeightSaving] = useState(false);
  const [weightSavedSuccess, setWeightSavedSuccess] = useState(false);

  // 3D perspective tilt animation on scroll
  const { scrollY } = useScroll();
  const rotateX = useTransform(scrollY, [0, 450], [12, 0]);
  const scale = useTransform(scrollY, [0, 450], [0.98, 1]);
  const translateY = useTransform(scrollY, [0, 450], [0, -20]);

  // Fetch telemetry
  const fetchTelemetry = useCallback(async (tf = timeframe) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/telemetry?timeframe=${tf}`);
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
        if (data.todayLog?.scaleWeightKg) {
          setQuickWeight(data.todayLog.scaleWeightKg.toFixed(1));
        } else if (data.currentWeight) {
          setQuickWeight(data.currentWeight.toFixed(1));
        }
      }
    } catch (err) {
      console.error("Failed to fetch telemetry:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchTelemetry(timeframe);
  }, [timeframe, fetchTelemetry]);

  // Global Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSpeedLogOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Submit quick scale weight
  const handleQuickWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickWeight);
    if (isNaN(val) || val < 30 || val > 300) return;

    setWeightSaving(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/log/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          scaleWeightKg: val,
        }),
      });

      if (res.ok) {
        setWeightSavedSuccess(true);
        setTimeout(() => setWeightSavedSuccess(false), 2000);
        await fetchTelemetry(timeframe);
      }
    } catch (err) {
      console.error("Failed to log weight:", err);
    } finally {
      setWeightSaving(false);
    }
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="w-full relative [perspective:1400px]">
      {/* 3D Tilted Hero Interactive Dashboard Frame */}
      <motion.div
        style={{
          rotateX,
          scale,
          translateY,
          transformOrigin: "center top",
        }}
        className="w-full max-w-7xl mx-auto rounded-3xl apple-liquid-glass border-white/20 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95),0_0_50px_rgba(255,255,255,0.05),inset_0_1.5px_0_0_rgba(255,255,255,0.45)] overflow-hidden transition-all duration-300"
      >
        {/* Top HUD Strip */}
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
          {/* User & Live Algorithm Status */}
          <div className="flex items-center gap-3">
            <PerformanceOSMark size={26} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">
                  {telemetry?.user.name || "Ayush"}
                </span>
                <span className="text-[10px] font-sans uppercase px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-zinc-300">
                  {telemetry?.user.goalType || "Cut"} ({telemetry?.user.targetRatePerWeek || 0.5} kg/wk)
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-sans">
                PerformanceOS · Stats Active · {todayStr}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSpeedLogOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs transition-all hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Speed Log Food</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-sans bg-black/10 rounded">
                Ctrl+K
              </kbd>
            </button>

            <button
              onClick={() => setCheckInOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-200 hover:text-white hover:bg-white/[0.1] text-xs font-sans transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Weekly Check-In</span>
            </button>

            <button
              onClick={() => fetchTelemetry(timeframe)}
              title="Refresh Stats"
              className="p-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 3 Core Hero KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* KPI 1: Dynamic Expenditure */}
          <div
            onClick={() => setChartMode("expenditure")}
            className={`p-6 cursor-pointer transition-colors relative ${
              chartMode === "expenditure" ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
            }`}
          >
            {chartMode === "expenditure" && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>
            )}
            <div className="flex items-center justify-between text-xs text-zinc-400 font-sans mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-white" /> Dynamic Expenditure
              </span>
              <span className="text-[11px] text-zinc-500">Estimated Burn</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-white tabular-nums">
                {telemetry?.currentTDEE ? telemetry.currentTDEE.toLocaleString() : "2,540"}
              </span>
              <span className="text-xs font-sans text-zinc-400">kcal/day</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-sans flex items-center gap-1.5">
              <span className="text-emerald-400 inline-flex items-center font-bold">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +24 kcal
              </span>
              <span>vs 14-day rolling average</span>
            </p>
          </div>

          {/* KPI 2: Trend Weight vs Raw Scale */}
          <div
            onClick={() => setChartMode("weight")}
            className={`p-6 cursor-pointer transition-colors relative ${
              chartMode === "weight" ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
            }`}
          >
            {chartMode === "weight" && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>
            )}
            <div className="flex items-center justify-between text-xs text-zinc-400 font-sans mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5 text-white" /> Trend Weight
              </span>
              <span className="text-[11px] text-zinc-500">Noise-Filtered</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-white tabular-nums">
                {telemetry?.currentTrend ? telemetry.currentTrend.toFixed(2) : "81.45"}
              </span>
              <span className="text-xs font-sans text-zinc-400">kg</span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 mt-2 font-sans">
              <span>Scale: {telemetry?.currentWeight ? `${telemetry.currentWeight.toFixed(1)} kg` : "--"}</span>
              <span className="text-zinc-400">
                Δ {telemetry?.currentWeight && telemetry?.currentTrend
                  ? `${(telemetry.currentWeight - telemetry.currentTrend > 0 ? "+" : "")}${(
                      telemetry.currentWeight - telemetry.currentTrend
                    ).toFixed(2)} kg`
                  : "0.0 kg"}
              </span>
            </div>
          </div>

          {/* KPI 3: Macro Coaching Target */}
          <div
            onClick={() => setChartMode("macros")}
            className={`p-6 cursor-pointer transition-colors relative ${
              chartMode === "macros" ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
            }`}
          >
            {chartMode === "macros" && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>
            )}
            <div className="flex items-center justify-between text-xs text-zinc-400 font-sans mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 text-white" /> Prescribed Targets
              </span>
              <span className="text-[11px] text-zinc-500">Algorithmic Plan</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-white tabular-nums">
                {telemetry?.macroTargets.recommendedCalories
                  ? telemetry.macroTargets.recommendedCalories.toLocaleString()
                  : "2,050"}
              </span>
              <span className="text-xs font-sans text-zinc-400">kcal/day</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2 font-sans">
              <span>P: {telemetry?.macroTargets.recommendedProtein ?? 180}g</span>
              <span>•</span>
              <span>C: {telemetry?.macroTargets.recommendedCarbs ?? 210}g</span>
              <span>•</span>
              <span>F: {telemetry?.macroTargets.recommendedFat ?? 55}g</span>
            </div>
          </div>
        </div>

        {/* Chart View Controls & Timeframe Selector Bar */}
        <div className="px-6 py-4 bg-[#0a0a0a] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          {/* Chart Mode Selector Pills */}
          <div className="inline-flex rounded-xl bg-white/[0.04] p-1 border border-white/10">
            <button
              onClick={() => setChartMode("expenditure")}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans uppercase tracking-wider transition-all ${
                chartMode === "expenditure"
                  ? "bg-white text-black font-bold shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Expenditure Engine
            </button>
            <button
              onClick={() => setChartMode("weight")}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans uppercase tracking-wider transition-all ${
                chartMode === "weight"
                  ? "bg-white text-black font-bold shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Weight Trend
            </button>
            <button
              onClick={() => setChartMode("macros")}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans uppercase tracking-wider transition-all ${
                chartMode === "macros"
                  ? "bg-white text-black font-bold shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Macro Targets
            </button>
          </div>

          {/* Timeframe Selector & Quick Weight Logger */}
          <div className="flex items-center gap-4">
            {/* Quick Weight Logger Form */}
            <form onSubmit={handleQuickWeightSubmit} className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-sans text-zinc-500">Today&apos;s Scale:</span>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  placeholder="81.5"
                  value={quickWeight}
                  onChange={(e) => setQuickWeight(e.target.value)}
                  className="w-20 px-2 py-1 rounded-lg bg-white/[0.05] border border-white/15 text-white font-sans text-xs text-center focus:outline-none focus:border-white focus:bg-white/10"
                />
                <span className="absolute right-2 top-1 text-[10px] font-sans text-zinc-500 pointer-events-none">
                  kg
                </span>
              </div>
              <button
                type="submit"
                disabled={weightSaving}
                className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white text-zinc-200 hover:text-black font-sans text-xs border border-white/15 transition-all"
              >
                {weightSaving ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : weightSavedSuccess ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  "Log"
                )}
              </button>
            </form>

            {/* Timeframe Buttons */}
            <div className="inline-flex rounded-xl bg-white/[0.04] p-1 border border-white/10">
              {(["7d", "14d", "30d", "90d"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-sans uppercase transition-all ${
                    timeframe === tf
                      ? "bg-white text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Kinetic Interactive SVG Chart */}
        <div className="p-6 bg-[#080808]">
          <KineticChart
            series={telemetry?.series || []}
            mode={chartMode}
            targetCalories={telemetry?.macroTargets.recommendedCalories ?? 2170}
          />
        </div>

        {/* Bottom Section: Spring Rings + Today's Log Breakdown */}
        <div className="p-6 sm:p-8 bg-[#0b0b0b] border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Spring Rings Widget (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-sans uppercase text-zinc-400 tracking-wider">
                Today&apos;s Physiological Rings
              </span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-zinc-400">
                Spring Physics
              </span>
            </div>

            <SpringRings
              calories={telemetry?.todayLog?.caloriesIn ?? 0}
              targetCalories={telemetry?.macroTargets.recommendedCalories ?? 2170}
              protein={telemetry?.todayLog?.proteinG ?? 0}
              targetProtein={telemetry?.macroTargets.recommendedProtein ?? 180}
              carbs={telemetry?.todayLog?.carbsG ?? 0}
              targetCarbs={telemetry?.macroTargets.recommendedCarbs ?? 210}
              fat={telemetry?.todayLog?.fatG ?? 0}
              targetFat={telemetry?.macroTargets.recommendedFat ?? 55}
            />
          </div>

          {/* Today's Logged Items Feed (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-white tracking-tight">
                  Today&apos;s Logged Nutrition Feed
                </span>
              </div>
              <span className="text-xs font-sans text-zinc-500">
                {telemetry?.todayLog?.foodItems?.length || 0} entries logged
              </span>
            </div>

            {/* List of items */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {telemetry?.todayLog?.foodItems && telemetry.todayLog.foodItems.length > 0 ? (
                telemetry.todayLog.foodItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.foodName}</div>
                      <div className="text-[11px] text-zinc-500 font-sans">
                        {item.servingGrams}g {item.brand ? `• ${item.brand}` : ""}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4 shrink-0 font-sans text-xs">
                      <div className="text-zinc-400 text-[11px] hidden sm:block">
                        P: {Math.round(item.protein)}g • C: {Math.round(item.carbs)}g • F: {Math.round(item.fat)}g
                      </div>
                      <div className="text-white font-bold tabular-nums">
                        {Math.round(item.calories)} <span className="text-zinc-500 font-normal">kcal</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-2">
                  <p className="text-xs text-zinc-400">No food items logged for today yet.</p>
                  <button
                    onClick={() => setSpeedLogOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white text-zinc-300 hover:text-black font-sans text-xs transition-all"
                  >
                    <Plus className="w-3 h-3" /> Log First Item
                  </button>
                </div>
              )}
            </div>

            {/* Daily Summary Bar */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-sans">
              <span className="text-zinc-500">Remaining Budget:</span>
              <span className="text-white font-bold tabular-nums">
                {Math.max(
                  0,
                  (telemetry?.macroTargets.recommendedCalories ?? 2170) -
                    (telemetry?.todayLog?.caloriesIn ?? 0)
                )}{" "}
                <span className="text-zinc-500 font-normal">kcal</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Speed Log Modal */}
      <SpeedLogModal
        open={speedLogOpen}
        onOpenChange={setSpeedLogOpen}
        onFoodLogged={() => fetchTelemetry(timeframe)}
      />

      {/* Weekly Check-In Modal */}
      {telemetry && (
        <CheckInModal
          open={checkInOpen}
          onOpenChange={setCheckInOpen}
          onCheckInComplete={() => fetchTelemetry(timeframe)}
          currentTDEE={telemetry.currentTDEE}
          currentTrendWeight={telemetry.currentTrend ?? 80.0}
          goalType={telemetry.user.goalType}
        />
      )}
    </div>
  );
}
