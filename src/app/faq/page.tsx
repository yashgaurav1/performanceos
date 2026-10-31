import React from "react";
import { Metadata } from "next";
import { ContentShell } from "@/components/content/content-shell";
import { EXTENDED_FAQS } from "@/data/all-faqs";

export const metadata: Metadata = {
  title: "Frequently Asked Questions · PerformanceOS",
  description:
    "Common questions about photo food logging, adaptive calorie calculation, Indian food macro accuracy, and private fitness tracking.",
  alternates: {
    canonical: "/faq",
  },
};

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: EXTENDED_FAQS.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <ContentShell
      eyebrow="Help & Knowledge"
      title="Frequently Asked Questions"
      subtitle="Detailed, direct answers regarding photo food logging, adaptive energy burn, Indian nutrition, and privacy."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="space-y-4 not-prose">
        {EXTENDED_FAQS.map((faq, idx) => (
          <details
            key={idx}
            open={idx === 0}
            className="group rounded-2xl border border-white/[0.08] bg-[#151517] p-5 transition-colors hover:border-white/20"
          >
            <summary className="font-semibold text-base sm:text-lg text-[#F5F5F4] cursor-pointer list-none select-none flex items-center justify-between gap-4">
              <span>{faq.question}</span>
              <span className="text-xs text-[#A1A1AA] font-sans group-open:rotate-180 transition-transform duration-200">
                ▼
              </span>
            </summary>
            <p className="mt-3 text-sm text-[#A1A1AA] leading-relaxed border-t border-white/[0.04] pt-3">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </ContentShell>
  );
}
