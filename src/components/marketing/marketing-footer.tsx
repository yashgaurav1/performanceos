"use client";

import React from "react";
import Link from "next/link";
import { PerformanceOSLogo } from "@/components/shell/brand-logo";

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#0C0C0D] py-5 sm:py-14 px-4 sm:px-6 lg:px-8 text-[#A1A1AA]">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start justify-between gap-4 sm:gap-10">
        {/* Left Column: Brand & Tagline */}
        <div className="space-y-2 sm:space-y-2.5">
          <PerformanceOSLogo markSize={28} href="/" />
          <p className="text-xs text-[#A1A1AA] max-w-sm leading-relaxed">
            Nutrition, training, focus and money - in one private app.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 gap-8 sm:gap-12 text-xs">
          <div>
            <span className="text-[#F5F5F4] font-semibold block mb-2 sm:mb-3">Product</span>
            <ul className="space-y-2 sm:space-y-2.5">
              <li>
                <a href="#features" className="hover:text-[#F5F5F4] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#F5F5F4] transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#coach" className="hover:text-[#F5F5F4] transition-colors">
                  Coach
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#F5F5F4] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-[#F5F5F4] font-semibold block mb-2 sm:mb-3">Explore</span>
            <ul className="space-y-2 sm:space-y-2.5">
              <li>
                <Link href="/science" className="hover:text-[#F5F5F4] transition-colors">
                  Science
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-[#F5F5F4] transition-colors">
                  Guides
                </Link>
              </li>
              <li>
                <a href="#privacy" className="hover:text-[#F5F5F4] transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#F5F5F4] transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="max-w-[1200px] mx-auto mt-4 sm:mt-12 pt-3 sm:pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs text-[#A1A1AA]">
        <div>
          © 2026 PerformanceOS. All rights reserved. · Designed by{" "}
          <a
            href="https://www.linkedin.com/in/yash-gaurav/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F5F5F4] hover:text-[#FF5533] underline underline-offset-4 font-medium transition-colors"
          >
            Yash Gaurav
          </a>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Built for Indian meals</span>
          <span>·</span>
          <span>Works offline</span>
          <span>·</span>
          <span>Private by default</span>
        </div>
      </div>
    </footer>
  );
}
