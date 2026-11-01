"use client";

import React from "react";
import Image from "next/image";
import { EyeOff, Lock, WifiOff, Download } from "lucide-react";
import { Heading, Lead, Eyebrow, Card } from "@/components/ui/primitives";
import { getBlurPlaceholder } from "@/lib/blur-data";

export function FounderPrivacySection() {
  const privacyPillars = [
    {
      icon: <EyeOff className="w-5 h-5 text-[#3CC8C0]" />,
      title: "No ads, ever",
      description:
        "No advertising trackers and no selling your data. Your meal photos are used only to log your meals.",
    },
    {
      icon: <Lock className="w-5 h-5 text-[#FF5533]" />,
      title: "Private to your account",
      description:
        "Every log is locked to your account. No other user can see or change it.",
    },
    {
      icon: <WifiOff className="w-5 h-5 text-[#F5B841]" />,
      title: "Works offline",
      description:
        "Log sets in a basement gym or meals on a flight. Everything syncs when you're back online.",
    },
    {
      icon: <Download className="w-5 h-5 text-[#3CC8C0]" />,
      title: "Export anytime",
      description:
        "Download your complete history in one click. No lock-in.",
    },
  ];

  return (
    <section id="privacy" className="py-6 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Privacy Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-14">
        <Eyebrow>Privacy</Eyebrow>
        <Heading as="h2" className="text-[#F5F5F4] mb-3 sm:mb-4">
          Your health data stays yours.
        </Heading>
        <Lead className="mx-auto">
          Your meals, body data and spending are personal. PerformanceOS is built so they stay that way.
        </Lead>
      </div>

      {/* 4 Privacy Pillars */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-5 max-w-4xl mx-auto">
        {privacyPillars.map((pillar, idx) => (
          <Card key={idx} className="p-2.5 sm:p-6 rounded-lg sm:rounded-2xl">
            <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-1 sm:mb-4">
              {pillar.icon}
            </div>
            <h3 className="text-xs sm:text-base font-bold text-[#F5F5F4] mb-0.5">
              {pillar.title}
            </h3>
            <p className="text-[10px] sm:text-sm text-[#A1A1AA] leading-relaxed">
              {pillar.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Compact Founder Block */}
      <div className="mt-6 sm:mt-12 max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl bg-[#151517] border border-white/[0.08] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
        <div className="relative w-24 h-24 sm:w-[120px] sm:h-[120px] rounded-full overflow-hidden border-2 border-white/10 shrink-0 shadow-lg">
          <Image
            src="/images/founder.jpg"
            alt="Yash Gaurav"
            fill
            placeholder="blur"
            blurDataURL={getBlurPlaceholder("founder.jpg")}
            className="object-cover"
            sizes="(max-width: 640px) 96px, 120px"
          />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="text-sm sm:text-base font-bold text-[#F5F5F4]">
            Designed and built by{" "}
            <a
              href="https://www.linkedin.com/in/yash-gaurav/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3CC8C0] hover:underline"
            >
              Yash Gaurav
            </a>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
            I&apos;m a BBA student and a powerlifter at heart, working my way back to being a gym freak. I built PerformanceOS because I wanted a tracker that understands Indian food and never makes you feel guilty.
          </p>
        </div>
      </div>
    </section>
  );
}
