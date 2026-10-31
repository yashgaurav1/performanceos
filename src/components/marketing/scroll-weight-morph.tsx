"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Scale, ArrowDownRight, Flame, Target } from "lucide-react";
import { TREND_DEMO_DATA } from "@/data/trend-demo";
import { Heading, Lead, Eyebrow, Card } from "@/components/ui/primitives";

export function ScrollWeightMorph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    function handleScroll() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const total = rect.height;
      const current = windowHeight - rect.top;
      const p = Math.min(Math.max(current / total, 0), 1);

      if (p < 0.4) {
        setActiveStep(1);
      } else if (p < 0.75) {
        setActiveStep(2);
      } else {
        setActiveStep(3);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // SVG Chart Geometry
  // 30 days of data: 78.2 kg -> 75.8 kg
  const svgWidth = 600;
  const svgHeight = 200;
  const padX = 24;
  const padY = 24;
  const minW = 75.0;
  const maxW = 79.5;

  const points = TREND_DEMO_DATA.map((pt, i) => {
    const x = padX + (i / (TREND_DEMO_DATA.length - 1)) * (svgWidth - padX * 2);
    const rawY = svgHeight - padY - ((pt.rawWeight - minW) / (maxW - minW)) * (svgHeight - padY * 2);
    const trendY = svgHeight - padY - ((pt.trendWeight - minW) / (maxW - minW)) * (svgHeight - padY * 2);
    return { x, rawY, trendY, pt };
  });

  const rawPath = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.rawY.toFixed(1)}`,
    ""
  );

  const trendPath = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.trendY.toFixed(1)}`,
    ""
  );

  return (
    <section id="how-it-works" ref={containerRef} className="py-6 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-14">
        <Eyebrow>How it works</Eyebrow>
        <Heading as="h2" className="text-[#F5F5F4] mb-3 sm:mb-4">
          Your scale is noisy. <br />
          Your plan shouldn&apos;t be.
        </Heading>
        <Lead className="mx-auto">
          <span className="hidden sm:inline">Scroll to see how PerformanceOS turns day-to-day weigh-ins into a trend you can trust.</span>
          <span className="sm:hidden">Tap through the three steps to see how PerformanceOS turns daily weigh-ins into a trend you can trust.</span>
        </Lead>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
        {/* Mobile View: Stepper Tabs + Single Active Step Card */}
        <div className="block lg:hidden space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { num: 1, label: "1. Weigh in" },
              { num: 2, label: "2. Real trend" },
              { num: 3, label: "3. Adapt" },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num as 1 | 2 | 3)}
                className={`py-1.5 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                  activeStep === s.num
                    ? "bg-[#FF5533] text-[#0C0C0D] shadow-md"
                    : "bg-[#151517] text-[#A1A1AA] border border-white/[0.08]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-[#151517] border border-white/20">
            <h3 className="text-xs font-semibold text-[#F5F5F4] mb-1">
              {activeStep === 1 ? "Weigh in each morning" : activeStep === 2 ? "See your real trend" : "Get targets that adapt"}
            </h3>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              {activeStep === 1
                ? "Your weight can swing 1-2 kg in a single day from water, salt and training. PerformanceOS treats those swings as noise, not failure."
                : activeStep === 2
                ? "A smoothed trend line shows what your body is actually doing week to week, so one heavy morning never derails your plan."
                : "Each week, your calorie and macro targets adjust to what you ate and how your trend moved. No guesswork and no extreme cuts."}
            </p>
          </div>
        </div>

        {/* Desktop Left Column: 3 Steps */}
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          {[
            {
              num: 1,
              title: "Weigh in each morning",
              desc: "Your weight can swing 1-2 kg in a single day from water, salt and training. PerformanceOS treats those swings as noise, not failure.",
            },
            {
              num: 2,
              title: "See your real trend",
              desc: "A smoothed trend line shows what your body is actually doing week to week, so one heavy morning never derails your plan.",
            },
            {
              num: 3,
              title: "Get targets that adapt",
              desc: "Each week, your calorie and macro targets adjust to what you ate and how your trend moved. No guesswork and no extreme cuts.",
            },
          ].map((step) => {
            const isCurrent = activeStep === step.num;
            return (
              <div
                key={step.num}
                onClick={() => setActiveStep(step.num as 1 | 2 | 3)}
                className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isCurrent
                    ? "bg-[#151517] border-white/20 shadow-xl"
                    : "bg-[#0C0C0D] border-white/[0.06] hover:bg-[#151517]/50"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? "bg-[#FF5533] text-[#0C0C0D] font-bold"
                        : "bg-white/10 text-[#A1A1AA]"
                    }`}
                  >
                    {step.num}
                  </span>
                  <h3 className="text-base font-semibold text-[#F5F5F4]">
                    {step.title}
                  </h3>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed pl-9">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Chart Viewport & Accent Illustration */}
        <div className="lg:col-span-7 flex flex-col lg:flex-row gap-4 items-stretch">
          <Card className="flex-1 p-3.5 sm:p-6 relative overflow-hidden">
            {/* Top Metric Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[#3CC8C0]">
                  <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <span className="text-[11px] sm:text-xs text-[#A1A1AA] block">
                    30 days: 78.2 kg → 75.8 kg
                  </span>
                  <span className="text-xs sm:text-base font-bold text-[#F5F5F4] flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3CC8C0]" />
                    <span>-2.4 kg trend loss</span>
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-medium">
                <div className="flex items-center gap-1.5 text-[#A1A1AA]">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#A1A1AA]" />
                  <span>Daily weigh-in</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#3CC8C0]">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#3CC8C0] shadow-[0_0_8px_#3CC8C0]" />
                  <span className="font-semibold">Your trend</span>
                </div>
              </div>
            </div>

            {/* SVG Canvas */}
            <div className="relative mt-4 sm:mt-6 h-40 sm:h-64 w-full">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Horizontal Grid lines */}
                <line
                  x1={padX}
                  y1={svgHeight - padY}
                  x2={svgWidth - padX}
                  y2={svgHeight - padY}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <line
                  x1={padX}
                  y1={svgHeight / 2}
                  x2={svgWidth - padX}
                  y2={svgHeight / 2}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <line
                  x1={padX}
                  y1={padY}
                  x2={svgWidth - padX}
                  y2={padY}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />

                {/* Raw scale points & jagged line */}
                <path
                  d={rawPath}
                  fill="none"
                  stroke="#52525B"
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                  className="transition-opacity duration-300"
                  style={{ opacity: activeStep === 1 ? 0.9 : 0.4 }}
                />

                {points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.rawY}
                    r={activeStep === 1 ? 3 : 2}
                    fill={activeStep === 1 ? "#F5F5F4" : "#A1A1AA"}
                    className="transition-all duration-300"
                  />
                ))}

                {/* Smoothed Trend Line (Active on Step 2 and 3) */}
                <path
                  d={trendPath}
                  fill="none"
                  stroke="#3CC8C0"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                  style={{
                    opacity: activeStep >= 2 ? 1 : 0.15,
                  }}
                />
              </svg>
            </div>

            {/* Bottom Result Card */}
            <div className="mt-4 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FF5533]" />
                <span className="text-[#A1A1AA]">Daily target:</span>
                <span className="font-bold text-[#F5F5F4]">2,000 kcal</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#F5B841]" />
                <span className="text-[#A1A1AA]">Estimated burn:</span>
                <span className="font-bold text-[#F5F5F4]">2,550 kcal</span>
              </div>
            </div>
          </Card>
          <div className="hidden lg:block w-48 shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-[#151517] relative min-h-[300px]">
            <Image
              src="/images/screens/trend.png"
              alt="PerformanceOS Trend Weight Interface"
              fill
              className="object-cover object-top"
              sizes="200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151517] via-transparent to-transparent opacity-30" />
          </div>
        </div>
      </div>
    </section>
  );
}
