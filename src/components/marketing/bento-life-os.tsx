"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Heading, Lead, Eyebrow, Card } from "@/components/ui/primitives";

export function BentoLifeOS() {
  return (
    <section id="features" className="py-6 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-14">
        <Eyebrow>One app for your whole day</Eyebrow>
        <Heading as="h2" className="text-[#F5F5F4] mb-3 sm:mb-4">
          Nutrition is only part of the picture.
        </Heading>
        <Lead className="mx-auto">
          Food fuels your training. Sleep shapes your focus. Money affects your stress. PerformanceOS keeps all four together, so your coach can see how they connect.
        </Lead>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-6 max-w-5xl mx-auto">
        {/* CARD 1: TRAINING (Large, span 7 on md/lg) */}
        <Card className="col-span-2 md:col-span-7 p-3.5 sm:p-8 flex flex-col justify-between group overflow-hidden relative">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#FF5533]/10 border border-[#FF5533]/20 flex items-center justify-center p-1.5 sm:p-2">
                <Image
                  src="/images/illus/train.png"
                  alt=""
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#FF5533]/15 text-[#FF5533] border border-[#FF5533]/25">
                Weekly volume +12%
              </span>
            </div>
            <h3 className="text-base sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              Training · Strength log
            </h3>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 sm:mt-2 leading-relaxed max-w-md">
              Log sets, reps and effort in seconds with a gym-friendly keypad. See your weekly volume and know when to push or back off.
            </p>
          </div>

          {/* Real Training Interface Capture */}
          <div className="mt-3 sm:mt-6 h-36 sm:h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0D] relative">
            <Image
              src="/images/screens/train-bento.png"
              alt="PerformanceOS Training Interface"
              fill
              className="object-cover object-center opacity-90 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 550px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151517] via-[#151517]/20 to-transparent" />
          </div>
        </Card>

        {/* CARD 2: FOCUS (Span 1 on mobile, 5 on md/lg) */}
        <Card className="col-span-1 md:col-span-5 p-3 sm:p-8 flex flex-col justify-between group overflow-hidden relative">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-5">
              <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-[#3CC8C0]/10 border border-[#3CC8C0]/20 flex items-center justify-center p-1 sm:p-2">
                <Image
                  src="/images/illus/focus.png"
                  alt=""
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <span className="hidden sm:inline-flex text-xs font-semibold px-3 py-1 rounded-full bg-[#3CC8C0]/15 text-[#3CC8C0] border border-[#3CC8C0]/25">
                18-day streak
              </span>
            </div>
            <h3 className="text-sm sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              Focus · Deep work
            </h3>
            <p className="hidden sm:block text-xs sm:text-sm text-[#A1A1AA] mt-2 leading-relaxed">
              Run focus sessions, track your daily deep-work hours, and note what broke your concentration.
            </p>
          </div>

          <div className="mt-3 sm:mt-6 h-36 sm:h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0D] relative">
            <Image
              src="/images/screens/focus-bento.png"
              alt="PerformanceOS Focus Interface"
              fill
              className="object-cover object-center opacity-90 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151517] via-[#151517]/20 to-transparent" />
          </div>
        </Card>

        {/* CARD 3: MONEY (Span 1 on mobile, 5 on md/lg) */}
        <Card className="col-span-1 md:col-span-5 p-3 sm:p-8 flex flex-col justify-between group overflow-hidden relative">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-5">
              <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-[#F5B841]/10 border border-[#F5B841]/20 flex items-center justify-center p-1 sm:p-2">
                <Image
                  src="/images/illus/money.png"
                  alt=""
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <span className="hidden sm:inline-flex text-xs font-semibold px-3 py-1 rounded-full bg-[#F5B841]/15 text-[#F5B841] border border-[#F5B841]/25">
                12 days left
              </span>
            </div>
            <h3 className="text-sm sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              Money · Budget
            </h3>
            <p className="hidden sm:block text-xs sm:text-sm text-[#A1A1AA] mt-2 leading-relaxed">
              See exactly how much you can spend each day for the rest of the month - without complicated categories.
            </p>
          </div>

          <div className="mt-3 sm:mt-6 h-36 sm:h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0D] relative">
            <Image
              src="/images/screens/budget-bento.png"
              alt="PerformanceOS Budget Interface"
              fill
              className="object-cover object-center opacity-90 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151517] via-[#151517]/20 to-transparent" />
          </div>
        </Card>

        {/* CARD 4: GOALS (Span 2 on mobile, 7 on md/lg) */}
        <Card className="col-span-2 md:col-span-7 p-3.5 sm:p-8 flex flex-col justify-between group overflow-hidden relative">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-1.5 sm:p-2">
                <Image
                  src="/images/illus/goals.png"
                  alt=""
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 text-[#F5F5F4] border border-white/15">
                Your Big Three
              </span>
            </div>
            <h3 className="text-base sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              Goals · Daily priorities
            </h3>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 sm:mt-2 leading-relaxed max-w-md">
              Pick three priorities each morning. Anything unfinished carries forward, so nothing slips.
            </p>
          </div>

          <div className="mt-3 sm:mt-6 h-36 sm:h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0D] relative mb-4">
            <Image
              src="/images/screens/goals-bento.png"
              alt="PerformanceOS Goals Interface"
              fill
              className="object-cover object-center opacity-90 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 550px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151517] via-[#151517]/20 to-transparent" />
          </div>
          <div className="mt-2.5 space-y-1.5 sm:space-y-2">
            {[
              { text: "Hit 2,000 kcal and 180 g protein", done: true },
              { text: "Push day: bench 100 kg × 6", done: true },
              { text: "90 minutes of deep work", done: false, desktopOnly: true },
            ].map((goal, idx) => (
              <div
                key={idx}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[#0C0C0D] border border-white/[0.08] flex items-center justify-between text-xs ${
                  goal.desktopOnly ? "hidden sm:flex" : "flex"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      goal.done ? "text-[#3CC8C0]" : "text-[#A1A1AA]"
                    }`}
                  />
                  <span
                    className={
                      goal.done
                        ? "text-[#F5F5F4] line-through decoration-white/40"
                        : "text-[#F5F5F4]"
                    }
                  >
                    {goal.text}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#A1A1AA]">
                  {goal.done ? "Completed" : "In Progress"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

