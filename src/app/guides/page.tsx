import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ContentShell } from "@/components/content/content-shell";
import { GUIDES } from "@/data/guides";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Evidence-Based Nutrition & Training Guides · PerformanceOS",
  description:
    "In-depth guides on energy balance, daily weight fluctuations, protein requirements, and counting calories in Indian food without a kitchen scale.",
  alternates: {
    canonical: "/guides",
  },
};

export default function GuidesHubPage() {
  return (
    <ContentShell
      eyebrow="Educational Hub"
      title="Guides & Scientific Resources"
      subtitle="Plain-English, evidence-backed guides on energy expenditure, Indian food portioning, and sustainable strength and nutrition habits."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
      ]}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 not-prose my-8">
        {GUIDES.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block">
            <Card className="p-6 h-full flex flex-col justify-between group-hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-3 font-sans">
                  <span className="uppercase tracking-wider text-[#FF5533]">{guide.category}</span>
                  <span>{guide.readTime}</span>
                </div>
                <h2 className="text-lg font-bold text-[#F5F5F4] group-hover:text-[#FF5533] transition-colors leading-snug">
                  {guide.title}
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-2 leading-relaxed">
                  {guide.subtitle}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/[0.06] text-xs font-semibold text-[#3CC8C0] flex items-center gap-1">
                Read guide <span>→</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </ContentShell>
  );
}
