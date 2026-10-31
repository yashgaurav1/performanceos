"use client";

import { useState, useEffect } from "react";
import { Search, Barcode, Sparkles, Plus, Loader2, Check, X } from "lucide-react";
import type { NormalizedFoodResult } from "@/app/api/food/search/route";

interface SpeedLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFoodLogged: () => void;
  currentDate?: string;
}

export function SpeedLogModal({
  open,
  onOpenChange,
  onFoodLogged,
  currentDate = new Date().toISOString().split("T")[0],
}: SpeedLogModalProps) {
  const [tab, setTab] = useState<"search" | "ai">("search");
  const [query, setQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NormalizedFoodResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<NormalizedFoodResult | null>(null);
  const [servingGrams, setServingGrams] = useState(150);
  const [submitting, setSubmitting] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [aiParsedItems, setAiParsedItems] = useState<{
    foodName: string;
    servingGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[] | null>(null);

  // Debounced OpenFoodFacts API search
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const param = barcodeInput.trim() ? `barcode=${encodeURIComponent(barcodeInput.trim())}` : `q=${encodeURIComponent(query)}`;
        const res = await fetch(`/api/food/search?${param}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          if (data.results && data.results.length > 0) {
            setSelectedFood((prev) => prev ?? data.results[0]);
            setServingGrams((prev) => (prev !== 150 ? prev : data.results[0].servingGrams || 100));
          }
        }
      } catch (err) {
        console.error("Food search error:", err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, barcodeInput, open]);

  // Keyboard shortcut listener (ESC to close)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  // Compute live nutritional values based on serving slider
  const factor = (servingGrams || 100) / 100;
  const currentCals = selectedFood ? Math.round(selectedFood.kcalPer100g * factor) : 0;
  const currentProt = selectedFood ? Math.round(selectedFood.proteinPer100g * factor * 10) / 10 : 0;
  const currentCarb = selectedFood ? Math.round(selectedFood.carbsPer100g * factor * 10) / 10 : 0;
  const currentFat = selectedFood ? Math.round(selectedFood.fatPer100g * factor * 10) / 10 : 0;

  async function handleLogSingleFood() {
    if (!selectedFood) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/log/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: currentDate,
          foodName: selectedFood.foodName,
          brand: selectedFood.brand,
          barcode: selectedFood.barcode,
          servingGrams,
          calories: currentCals,
          protein: currentProt,
          carbs: currentCarb,
          fat: currentFat,
        }),
      });

      if (res.ok) {
        onFoodLogged();
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Log error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAiParse() {
    if (!aiText.trim()) return;
    setAiParsing(true);
    try {
      const res = await fetch("/api/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiParsedItems(data.items || []);
      }
    } catch (err) {
      console.error("AI parse error:", err);
    } finally {
      setAiParsing(false);
    }
  }

  async function handleLogAiItems() {
    if (!aiParsedItems || aiParsedItems.length === 0) return;
    setSubmitting(true);
    try {
      for (const item of aiParsedItems) {
        await fetch("/api/log/food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: currentDate,
            foodName: item.foodName,
            brand: "AI Natural Language",
            servingGrams: item.servingGrams,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          }),
        });
      }
      onFoodLogged();
      onOpenChange(false);
    } catch (err) {
      console.error("AI batch log error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0D0D0E] shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white font-bold text-xs">
              ⚡
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Speed Logging Terminal</h3>
              <p className="text-[11px] text-zinc-400">Live Nutrition Database & AI Parser</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5">
              <button
                type="button"
                onClick={() => setTab("search")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  tab === "search" ? "bg-white text-black shadow-xs" : "text-zinc-400 hover:text-white"
                }`}
              >
                Food Database
              </button>
              <button
                type="button"
                onClick={() => setTab("ai")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  tab === "ai" ? "bg-white text-black shadow-xs" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles size={12} />
                Natural Language
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab 1: Food Database Search & Barcode Lookup */}
        {tab === "search" && (
          <div className="p-6 space-y-5">
            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setBarcodeInput("");
                  }}
                  placeholder="Search food (e.g. Chicken breast, Oats, Greek yogurt)..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-black/50 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white transition-colors"
                  autoFocus
                />
              </div>

              <div className="relative">
                <Barcode size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    setQuery("");
                  }}
                  placeholder="Scan Barcode..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-black/50 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white transition-colors font-sans text-xs"
                />
              </div>
            </div>

            {/* Results & Detail Split View */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4 max-h-[300px]">
              {/* Results List */}
              <div className="space-y-1.5 overflow-y-auto pr-1 no-scrollbar max-h-[280px]">
                {loading && (
                  <div className="flex items-center justify-center py-8 text-zinc-400 gap-2 text-xs">
                    <Loader2 size={15} className="animate-spin" />
                    Searching nutrition database...
                  </div>
                )}

                {!loading && results.map((item) => {
                  const active = selectedFood?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedFood(item);
                        setServingGrams(item.servingGrams || 100);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        active
                          ? "border-white bg-white/10 shadow-xs"
                          : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate max-w-[220px]">
                          {item.foodName}
                        </span>
                        <span className="num text-[11px] font-bold text-zinc-300">
                          {item.kcalPer100g} <span className="text-[9px] text-zinc-500 font-normal">kcal/100g</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400">
                        <span className="truncate max-w-[140px]">{item.brand}</span>
                        <span className="num">
                          {item.proteinPer100g}g P · {item.carbsPer100g}g C · {item.fatPer100g}g F
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Gram Weight Adjuster & Macro Card */}
              {selectedFood ? (
                <div className="p-4 rounded-xl border border-white/15 bg-black/60 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                      Serving Weight
                    </span>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="num text-2xl font-bold text-white">{servingGrams}</span>
                      <span className="text-xs text-zinc-400 font-semibold">grams</span>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="5"
                      value={servingGrams}
                      onChange={(e) => setServingGrams(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer mb-4"
                    />

                    {/* Computed Nutrients */}
                    <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs">
                      <div className="flex justify-between num">
                        <span className="text-zinc-400 font-sans">Calories</span>
                        <span className="font-bold text-white">{currentCals} kcal</span>
                      </div>
                      <div className="flex justify-between num">
                        <span className="text-zinc-400 font-sans">Protein</span>
                        <span className="font-bold text-zinc-200">{currentProt}g</span>
                      </div>
                      <div className="flex justify-between num">
                        <span className="text-zinc-400 font-sans">Carbs</span>
                        <span className="font-bold text-zinc-200">{currentCarb}g</span>
                      </div>
                      <div className="flex justify-between num">
                        <span className="text-zinc-400 font-sans">Fat</span>
                        <span className="font-bold text-zinc-200">{currentFat}g</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogSingleFood}
                    disabled={submitting}
                    className="mt-4 w-full h-10 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 active:scale-95 transition-all shadow-xs"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Log Food
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-center text-xs text-zinc-500">
                  Select a food item to scale serving grams
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Natural Language AI Food Parser */}
        {tab === "ai" && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Describe Your Meal (Natural Language):
              </label>
              <textarea
                rows={3}
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder='e.g. "200g grilled chicken breast, 150g jasmine white rice, and 1 whole avocado"'
                className="w-full p-3.5 rounded-xl border border-white/10 bg-black/50 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors resize-none"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-zinc-500">
                Smart Natural Language Breakdown
              </span>
              <button
                type="button"
                onClick={handleAiParse}
                disabled={aiParsing || !aiText.trim()}
                className="px-4 h-9 rounded-xl border border-white/20 bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-white/20 active:scale-95 transition-all"
              >
                {aiParsing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Parse Nutrition
              </button>
            </div>

            {/* Parsed Items Breakdown */}
            {aiParsedItems && aiParsedItems.length > 0 && (
              <div className="p-4 rounded-xl border border-white/15 bg-white/[0.03] space-y-3">
                <span className="text-xs font-bold text-white block">Parsed Decomposed Items:</span>
                <div className="space-y-1.5">
                  {aiParsedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-black/40 text-xs num"
                    >
                      <div>
                        <span className="font-semibold text-white">{item.foodName}</span>
                        <span className="text-zinc-500 ml-1.5">({item.servingGrams}g)</span>
                      </div>
                      <div className="text-zinc-300">
                        <span className="font-bold text-white mr-2">{item.calories} kcal</span>
                        <span className="text-[11px] text-zinc-400">
                          {item.protein}g P · {item.carbs}g C · {item.fat}g F
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleLogAiItems}
                  disabled={submitting}
                  className="w-full h-10 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 active:scale-95 transition-all shadow-xs mt-3"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Log All Items to Food Log
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
