"use client";

import React, { useState } from "react";
import { ChevronDown, Atom } from "lucide-react";
import { Heading, Lead, Eyebrow, Card } from "@/components/ui/primitives";
import { GENERAL_FAQS } from "@/data/faqs";

export function FAQAndScience() {
  const [isScienceOpen, setIsScienceOpen] = useState(false);

  return (
    <section id="faq" className="py-6 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-14">
        <Eyebrow>FAQ</Eyebrow>
        <Heading as="h2" className="text-[#F5F5F4] mb-2.5 sm:mb-4">
          Questions, answered.
        </Heading>
        <Lead className="mx-auto">
          Simple answers first. The science is below if you want it.
        </Lead>
      </div>

      {/* Main FAQ Accordion (All answers present in Server HTML) */}
      <div className="max-w-3xl mx-auto space-y-1.5 sm:space-y-3 mb-4 sm:mb-12">
        {GENERAL_FAQS.map((item, idx) => (
          <details
            key={idx}
            open={idx === 0}
            className="group rounded-xl sm:rounded-2xl border border-white/[0.08] bg-[#151517] overflow-hidden transition-colors hover:border-white/20"
          >
            <summary className="w-full py-2.5 sm:py-4 px-3 sm:px-5 text-left flex items-center justify-between gap-2.5 sm:gap-4 cursor-pointer list-none select-none">
              <span className="text-xs sm:text-base font-semibold text-[#F5F5F4]">
                {item.question}
              </span>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A1A1AA] transition-transform duration-200 shrink-0 group-open:rotate-180 group-open:text-[#F5F5F4]" />
            </summary>
            <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-1 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed border-t border-white/[0.04]">
              {item.answer}
            </div>
          </details>
        ))}
      </div>

      {/* Expandable "The Science" Panel */}
      <Card id="science-faq" className="max-w-3xl mx-auto p-3.5 sm:p-7 relative overflow-hidden">
        <button
          onClick={() => setIsScienceOpen(!isScienceOpen)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
          aria-expanded={isScienceOpen}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FF5533]/15 border border-[#FF5533]/25 text-[#FF5533]">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#F5F5F4] group-hover:text-[#FF5533] transition-colors">
                  The science behind your targets
                </span>
              </div>
              <span className="text-xs text-[#A1A1AA]">
                For anyone who wants to see the math.
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#A1A1AA] transition-transform duration-200 shrink-0 ${
              isScienceOpen ? "rotate-180 text-[#FF5533]" : ""
            }`}
          />
        </button>

        <div
          className={`space-y-5 pt-6 mt-6 border-t border-white/[0.08] transition-all duration-300 ${
            isScienceOpen ? "block" : "hidden"
          }`}
        >
          {/* Trend weight */}
          <div className="p-4 rounded-2xl bg-[#0C0C0D] border border-white/[0.08] space-y-1.5">
            <div className="text-xs font-semibold text-[#3CC8C0] uppercase tracking-wider">
              Trend weight
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              Each day&apos;s weigh-in is blended with your previous trend using an exponentially weighted moving average (smoothing factor 0.1), so single-day swings carry very little weight.
            </p>
          </div>

          {/* Estimated daily burn */}
          <div className="p-4 rounded-2xl bg-[#0C0C0D] border border-white/[0.08] space-y-2">
            <div className="text-xs font-semibold text-[#FF5533] uppercase tracking-wider">
              Estimated daily burn
            </div>
            <div className="py-2.5 px-3 rounded-xl bg-[#151517] border border-white/10 text-center text-xs sm:text-sm font-semibold text-[#3CC8C0]">
              Estimated burn = average daily intake - (change in trend weight × 7,700 kcal ÷ number of days)
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Example: eating 2,450 kcal/day while your trend drops 0.35 kg in a week means you burn about 2,835 kcal/day.
            </p>
          </div>

          {/* Daily target */}
          <div className="p-4 rounded-2xl bg-[#0C0C0D] border border-white/[0.08] space-y-2">
            <div className="text-xs font-semibold text-[#F5B841] uppercase tracking-wider">
              Daily target
            </div>
            <div className="py-2.5 px-3 rounded-xl bg-[#151517] border border-white/10 text-center text-xs sm:text-sm font-semibold text-[#F5B841]">
              Daily target = estimated burn - deficit for your goal
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Losing 0.5 kg per week needs about 550 kcal/day below your burn.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
