"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MessageSquare, User, CornerDownLeft } from "lucide-react";
import { Heading, Lead, Eyebrow, Card } from "@/components/ui/primitives";

interface ChatScenario {
  id: string;
  tabTitle: string;
  athleteMessage: string;
  coachIntro: string;
}

const CHAT_SCENARIOS: ChatScenario[] = [
  {
    id: "overeating",
    tabTitle: "Went over at dinner",
    athleteMessage:
      "Had biryani and gulab jamun last night, about 1,100 kcal over. Should I skip breakfast?",
    coachIntro:
      "No need to skip. One high day barely moves your weekly average, and skipping meals usually leads to overeating later. Have a normal breakfast with 30-40 g of protein and stay on your usual target today. Expect the scale to read 0.5-1 kg higher tomorrow from water and salt. It will settle within 2-3 days.",
  },
  {
    id: "spike",
    tabTitle: "Sudden weight jump",
    athleteMessage: "I'm up 1.3 kg overnight. What happened?",
    coachIntro:
      "That's water, not fat. Gaining 1.3 kg of fat would take roughly 10,000 extra calories. Yesterday's higher salt and carbs, plus leg day, explain the jump. Keep your plan the same. Your trend moved only 0.1 kg.",
  },
  {
    id: "stall",
    tabTitle: "Progress has stalled",
    athleteMessage: "My weight hasn't moved in 5 days.",
    coachIntro:
      "Your trend is still down 0.2 kg this week, so you are progressing, just more slowly than the daily numbers suggest. Give it one more week before changing anything. If your trend is flat after 14 days, I'll lower your target by about 150 kcal.",
  },
];

export function AICoachDemo() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scenario = CHAT_SCENARIOS[selectedIdx] ?? (CHAT_SCENARIOS[0]!);

  useEffect(() => {
    setIsTyping(true);
    setDisplayedText("");
    let currentIdx = 0;
    const fullText = scenario.coachIntro;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIdx < fullText.length) {
          setDisplayedText(fullText.slice(0, currentIdx + 3));
          currentIdx += 3;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 12);

      return () => clearInterval(interval);
    }, 200);

    return () => clearTimeout(timeout);
  }, [selectedIdx, scenario.coachIntro]);

  function handleSkipTyping() {
    if (isTyping) {
      setDisplayedText(scenario.coachIntro);
      setIsTyping(false);
    }
  }

  return (
    <section id="coach" className="py-6 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-12">
        <Eyebrow>AI coach</Eyebrow>
        <Heading as="h2" className="text-[#F5F5F4] mb-3 sm:mb-4">
          A coach that knows your last two weeks.
        </Heading>
        <Lead className="mx-auto">
          Ask anything about food, training or recovery. Your coach looks at your recent meals, weight trend, sleep and workouts, then gives you a clear next step - never guilt.
        </Lead>
      </div>

      {/* Scenario Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-2xl mx-auto mb-4 sm:mb-10">
        {CHAT_SCENARIOS.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setSelectedIdx(idx)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              idx === selectedIdx
                ? "bg-[#F5F5F4] text-[#0C0C0D] shadow-md scale-105"
                : "bg-[#151517] text-[#A1A1AA] border border-white/[0.08] hover:border-white/20 hover:text-white"
            }`}
          >
            {item.tabTitle}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <Card className="max-w-3xl mx-auto p-3 sm:p-7 relative overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-[#FF5533]/15 border border-[#FF5533]/25 flex items-center justify-center text-[#FF5533]">
              <Image
                src="/images/illus/coach.png"
                alt=""
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#F5F5F4]">Your coach</span>
                <span className="w-2 h-2 rounded-full bg-[#3CC8C0]" />
              </div>
              <span className="text-[11px] sm:text-xs text-[#A1A1AA]">Using your last 14 days</span>
            </div>
          </div>
        </div>

        {/* Conversation Transcript */}
        <div
          onClick={handleSkipTyping}
          className="py-3 sm:py-6 space-y-3 sm:space-y-5 cursor-pointer"
          title="Click to reveal full answer"
        >
          {/* Athlete Message */}
          <div className="flex items-start gap-2.5 sm:gap-3 justify-end">
            <div className="max-w-md p-2.5 sm:p-4 rounded-2xl rounded-tr-sm bg-[#1C1C1F] border border-white/10 text-xs sm:text-sm text-[#F5F5F4] leading-relaxed">
              {scenario.athleteMessage}
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#A1A1AA] text-xs shrink-0 mt-0.5">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          {/* Coach Streamed Response */}
          <div className="flex items-start gap-2.5 sm:gap-3 justify-start">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF5533]/20 border border-[#FF5533]/30 flex items-center justify-center text-[#FF5533] text-xs shrink-0 mt-0.5">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1 max-w-xl">
              <div className="p-2.5 sm:p-4 rounded-2xl rounded-tl-sm bg-[#0C0C0D] border border-white/[0.08] text-xs sm:text-sm text-[#D4D4D8] leading-relaxed">
                {displayedText}
                {isTyping && (
                  <span className="inline-block w-1.5 h-4 bg-[#FF5533] ml-1 animate-pulse align-middle" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input Mock */}
        <div className="pt-2.5 sm:pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] sm:text-xs text-[#A1A1AA]">
          <span>Ask about food, training or recovery...</span>
          <CornerDownLeft className="w-3.5 h-3.5 text-[#A1A1AA]" />
        </div>
      </Card>
    </section>
  );
}
