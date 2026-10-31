"use client";

import React, { useState } from "react";
import Image from "next/image";
import NumberFlow from "@number-flow/react";
import { SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { SCAN_MEALS, ScanMeal } from "@/data/scan-demo";
import { Heading, Lead, Eyebrow, MacroChip, Card } from "@/components/ui/primitives";
import { getBlurPlaceholder } from "@/lib/blur-data";

export function InteractiveVisionDemo() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [meals, setMeals] = useState<ScanMeal[]>(SCAN_MEALS);

  const currentMeal = meals[selectedIdx] ?? (meals[0]!);

  function handleSelectTab(idx: number) {
    if (idx === selectedIdx) return;
    setIsCrossfading(true);
    setSelectedIdx(idx);
    setTimeout(() => {
      setIsCrossfading(false);
    }, 250);
  }

  function handleGramsChange(itemId: string, newGrams: number) {
    setMeals((prev) =>
      prev.map((meal, mIdx) => {
        if (mIdx !== selectedIdx) return meal;
        return {
          ...meal,
          items: meal.items.map((item) => {
            if (item.id !== itemId) return item;
            return { ...item, grams: newGrams };
          }),
        };
      })
    );
  }

  // Calculate totals live from current grams and per 100g values
  const totalCalories = Math.round(
    currentMeal.items.reduce(
      (sum, item) => sum + (item.grams * item.kcalPer100g) / 100,
      0
    )
  );
  const totalProtein = Math.round(
    currentMeal.items.reduce(
      (sum, item) => sum + (item.grams * item.proteinPer100g) / 100,
      0
    )
  );
  const totalCarbs = Math.round(
    currentMeal.items.reduce(
      (sum, item) => sum + (item.grams * item.carbsPer100g) / 100,
      0
    )
  );
  const totalFat = Math.round(
    currentMeal.items.reduce(
      (sum, item) => sum + (item.grams * item.fatPer100g) / 100,
      0
    )
  );

  return (
    <section id="features" className="py-6 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-16">
        <Eyebrow>Photo logging</Eyebrow>
        <Heading as="h2" className="text-[#F5F5F4] mb-2.5 sm:mb-4">
          From plate to macros in seconds.
        </Heading>
        <Lead className="mx-auto">
          Pick a sample meal. PerformanceOS identifies each item, estimates portions using familiar references like rotis, katoris and thali plates, and lets you fine-tune anything with a slider.
        </Lead>
      </div>

      {/* 3 Clickable Meal Tabs with food icons - 360px mobile responsive */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 max-w-3xl mx-auto mb-3 sm:mb-10">
        {meals.map((meal, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <button
              key={meal.id}
              onClick={() => handleSelectTab(idx)}
              className={`p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 ${
                isSelected
                  ? "bg-[#1C1C1F] border-white/20 shadow-lg scale-[1.01]"
                  : "bg-[#151517] border-white/[0.08] hover:bg-[#1C1C1F]/60 hover:border-white/15"
              }`}
            >
              <div className="relative w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden bg-[#0C0C0D] border border-white/10 shrink-0">
                <Image
                  src={meal.iconSrc}
                  alt={meal.title}
                  fill
                  className="object-cover p-1"
                  sizes="40px"
                />
              </div>
              <div className="min-w-0 text-center sm:text-left w-full">
                <div className="hidden sm:block text-xs font-semibold text-[#F5F5F4] truncate">
                  {meal.tabLabel}
                </div>
                <div className="sm:hidden text-[10px] sm:text-xs font-semibold text-[#F5F5F4] truncate">
                  {meal.shortTabLabel}
                </div>
                <div className="hidden sm:block text-[11px] text-[#A1A1AA] truncate mt-0.5">
                  {meal.items.map((i) => i.name).join(" · ")}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Plate Card */}
      <Card className="max-w-4xl mx-auto p-2.5 sm:p-8">
        {/* Header Information Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-2.5 sm:pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#3CC8C0]/10 text-[#3CC8C0] border border-[#3CC8C0]/20">
                Confidence: High
              </span>
              <span className="text-[11px] sm:text-xs text-[#A1A1AA]">
                Portion reference: {currentMeal.portionRef}
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-[#F5F5F4]">
              {currentMeal.title}
            </h3>
          </div>

          {/* Sum Macro Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-center min-w-[64px] sm:min-w-[76px]">
              <span className="text-[9px] sm:text-[10px] text-[#A1A1AA] block uppercase font-medium">Calories</span>
              <span className="text-xs sm:text-sm font-bold text-[#FF5533]">
                <NumberFlow value={totalCalories} /> kcal
              </span>
            </div>
            <MacroChip label="P" value={totalProtein} unit="g" />
            <MacroChip label="C" value={totalCarbs} unit="g" />
            <MacroChip label="F" value={totalFat} unit="g" />
          </div>
        </div>

        {/* Real Food Photo with Pin Labels */}
        <div className="relative mt-2.5 sm:mt-6 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 aspect-[16/11] sm:aspect-[16/10] max-h-[145px] sm:max-h-[420px] w-full bg-[#0C0C0D]">
          <div
            className={`relative w-full h-full transition-opacity duration-250 ${
              isCrossfading ? "opacity-30" : "opacity-100"
            }`}
          >
            <Image
              src={currentMeal.photoSrc}
              alt={currentMeal.altText}
              fill
              placeholder="blur"
              blurDataURL={getBlurPlaceholder(currentMeal.photoSrc.replace("/images/", ""))}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 840px"
            />
            {/* Soft vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0D]/80 via-transparent to-[#0C0C0D]/20 pointer-events-none" />

            {/* Pinned Detection Labels Over the Photo */}
            {currentMeal.items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  left: `${item.coords.x}%`,
                  top: `${item.coords.y}%`,
                  animationDelay: `${idx * 80}ms`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#0C0C0D]/90 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs text-[#F5F5F4] shadow-lg shadow-black/60 pointer-events-none transition-all duration-300 whitespace-nowrap"
              >
                <span
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    idx === 0
                      ? "bg-[#FF7A59]"
                      : idx === 1
                      ? "bg-[#F5B841]"
                      : "bg-[#3CC8C0]"
                  }`}
                />
                <span className="font-semibold">{item.name}</span>
                <span className="text-[#A1A1AA] text-[10px] sm:text-[11px]">· {item.grams} g</span>
              </div>
            ))}
          </div>

          {/* Bottom helper strip */}
          <div className="hidden sm:flex absolute bottom-3 left-4 right-4 items-center justify-between text-xs text-[#A1A1AA] z-10 pointer-events-none">
            <span className="flex items-center gap-1.5 text-[#F5F5F4] bg-[#0C0C0D]/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC8C0]" />
              <span>Adjust any item - your totals update instantly.</span>
            </span>
          </div>
        </div>

        {/* Identified Items List with Sliders */}
        <div className="mt-3 sm:mt-8 space-y-1.5 sm:space-y-3">
          <div className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#A1A1AA] px-1">
            Identified Items & Portion Sliders
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:gap-3">
            {currentMeal.items.map((item) => {
              const itemCalories = Math.round((item.grams * item.kcalPer100g) / 100);
              const itemProtein = Math.round((item.grams * item.proteinPer100g) / 100);
              const itemCarbs = Math.round((item.grams * item.carbsPer100g) / 100);
              const itemFat = Math.round((item.grams * item.fatPer100g) / 100);

              const minSlider = Math.max(10, Math.round(item.baseGrams * 0.4));
              const maxSlider = Math.round(item.baseGrams * 2.0);

              return (
                <div
                  key={item.id}
                  className="p-2 sm:p-4 rounded-lg sm:rounded-2xl bg-[#0C0C0D] border border-white/[0.08] hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#F5F5F4]">
                        {item.name}
                      </h4>
                      {item.isOilOrGravy && (
                        <span className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#F5B841]/15 text-[#F5B841] border border-[#F5B841]/25">
                          Includes cooking oil
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#A1A1AA] mt-0.5">
                      {item.portion}
                    </p>

                    {/* Interactive Slider */}
                    <div className="mt-1.5 sm:mt-3 flex items-center gap-2 sm:gap-3 flex-wrap">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#A1A1AA]" />
                      <input
                        type="range"
                        min={minSlider}
                        max={maxSlider}
                        value={item.grams}
                        onChange={(e) => handleGramsChange(item.id, Number(e.target.value))}
                        className="w-24 sm:w-48 h-1.5 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer accent-[#FF5533]"
                        aria-label={`Adjust grams for ${item.name}`}
                      />
                      <span className="text-xs font-semibold text-[#F5F5F4] min-w-[45px]">
                        <NumberFlow value={item.grams} /> g
                      </span>
                      <span className="sm:hidden text-xs font-medium text-[#FF5533]">
                        · <NumberFlow value={itemCalories} /> kcal
                      </span>
                    </div>
                  </div>

                  {/* Individual Item Macro Chips (Desktop) */}
                  <div className="hidden sm:flex items-center gap-2 justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.06]">
                    <div className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-center min-w-[62px]">
                      <span className="text-[9px] text-[#A1A1AA] block font-medium">KCAL</span>
                      <span className="text-xs font-bold text-[#F5F5F4]">
                        <NumberFlow value={itemCalories} />
                      </span>
                    </div>
                    <MacroChip label="P" value={itemProtein} unit="g" />
                    <MacroChip label="C" value={itemCarbs} unit="g" />
                    <MacroChip label="F" value={itemFat} unit="g" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}


