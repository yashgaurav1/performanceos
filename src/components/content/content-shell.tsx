import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { getBlurPlaceholder } from "@/lib/blur-data";

interface ContentShellProps {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  sources?: string[];
  breadcrumbs?: { label: string; href: string }[];
}

export function ContentShell({
  children,
  eyebrow,
  title,
  subtitle,
  lastUpdated = "October 2026",
  sources = ["ICMR-NIN Dietary Guidelines for Indians (2020)", "IFCT 2017 (Indian Food Composition Tables)"],
  breadcrumbs = [{ label: "Home", href: "/" }],
}: ContentShellProps) {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#0C0C0D] text-[#F5F5F4] selection:bg-[#FF5533]/30 selection:text-white relative overflow-x-hidden">
        <MarketingNav />

        <main className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs text-[#A1A1AA] flex-wrap">
              {breadcrumbs.map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Link href={b.href} className="hover:text-[#F5F5F4] transition-colors">
                    {b.label}
                  </Link>
                  <span>/</span>
                </li>
              ))}
              <li className="text-[#F5F5F4] font-medium truncate max-w-[240px]">{title}</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12 border-b border-white/[0.08] pb-10">
            {eyebrow && (
              <span className="text-xs uppercase tracking-widest font-semibold text-[#FF5533] block mb-3">
                {eyebrow}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F5F5F4] tracking-tight leading-[1.15] mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base sm:text-lg text-[#A1A1AA] leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}

            <div className="mt-6 flex items-center gap-4 text-xs text-[#71717A]">
              <span>Last updated: {lastUpdated}</span>
              <span>·</span>
              <span>Evidence-based</span>
            </div>
          </header>

          {/* Main Content Body */}
          <article className="prose prose-invert prose-zinc max-w-none text-sm sm:text-base leading-relaxed text-[#D4D4D8] space-y-8">
            {children}
          </article>

          {/* Author Box */}
          <div className="mt-16 p-6 rounded-2xl bg-[#151517] border border-white/[0.08] flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
              <Image
                src="/images/founder.jpg"
                alt="Yash Gaurav"
                fill
                placeholder="blur"
                blurDataURL={getBlurPlaceholder("founder.jpg")}
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-[#F5F5F4]">
                Written by Yash Gaurav · Designer of PerformanceOS
              </div>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Independent product designer and engineer. Focused on metabolic calculations, sports nutrition, and mindful software design.
              </p>
            </div>
          </div>

          {/* Sources List */}
          {sources.length > 0 && (
            <div className="mt-8 p-5 rounded-xl bg-[#0C0C0D] border border-white/[0.06] text-xs text-[#A1A1AA] space-y-2">
              <span className="font-semibold text-[#F5F5F4] block uppercase tracking-wider text-[11px]">
                Sources & References
              </span>
              <ul className="list-disc pl-4 space-y-1">
                {sources.map((src, i) => (
                  <li key={i}>{src}</li>
                ))}
              </ul>
            </div>
          )}
        </main>

        <MarketingFooter />
      </div>
    </SmoothScroll>
  );
}
