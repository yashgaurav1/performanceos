import React from "react";
import dynamic from "next/dynamic";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { GENERAL_FAQS } from "@/data/faqs";

// Dynamic imports for below-the-fold sections to ensure maximum mobile performance
const InteractiveVisionDemo = dynamic(
  () =>
    import("@/components/marketing/interactive-vision-demo").then(
      (m) => m.InteractiveVisionDemo
    ),
  { ssr: true }
);

const ScrollWeightMorph = dynamic(
  () =>
    import("@/components/marketing/scroll-weight-morph").then(
      (m) => m.ScrollWeightMorph
    ),
  { ssr: true }
);

const AICoachDemo = dynamic(
  () =>
    import("@/components/marketing/ai-coach-demo").then((m) => m.AICoachDemo),
  { ssr: true }
);

const BentoLifeOS = dynamic(
  () =>
    import("@/components/marketing/bento-life-os").then((m) => m.BentoLifeOS),
  { ssr: true }
);

const FounderPrivacySection = dynamic(
  () =>
    import("@/components/marketing/founder-privacy-section").then(
      (m) => m.FounderPrivacySection
    ),
  { ssr: true }
);

const FAQAndScience = dynamic(
  () =>
    import("@/components/marketing/faq-and-science").then(
      (m) => m.FAQAndScience
    ),
  { ssr: true }
);

const FinalCTA = dynamic(
  () => import("@/components/marketing/final-cta").then((m) => m.FinalCTA),
  { ssr: true }
);

export const metadata = {
  title: "PerformanceOS · AI Diet Coach & Photo Food Logging",
  description:
    "Log meals with a photo, get calorie targets that adapt to your real progress, and keep training, focus and spending in one private app.",
  alternates: {
    canonical: "/",
  },
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://osperformance.vercel.app";

const jsonLdData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PerformanceOS",
    url: SITE_URL,
    description:
      "Log meals with a photo, get calorie targets that adapt to your real progress, and keep training, focus and spending in one private app.",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PerformanceOS",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    founder: {
      "@type": "Person",
      name: "Yash Gaurav",
      sameAs: [
        "https://www.linkedin.com/in/yash-gaurav/",
        "https://github.com/yash-gaurav",
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PerformanceOS",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, Android, iOS",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    featureList: [
      "Photo Food Logging",
      "Adaptive Calorie Targets",
      "14-Day Context AI Coach",
      "Strength Training Log",
      "Deep Work Focus Timer",
      "Daily Budget Allowance",
      "Offline Data Sync",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GENERAL_FAQS.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  },
];

export default function LandingPage() {
  return (
    <SmoothScroll>
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      <div className="min-h-screen bg-[#0C0C0D] text-[#F5F5F4] selection:bg-[#FF5533]/30 selection:text-white relative overflow-x-hidden">
        {/* Navigation */}
        <MarketingNav />

        <main className="relative z-10">
          {/* Section 1: Hero */}
          <HeroSection />

          {/* Section 2: Photo Logging Demo */}
          <InteractiveVisionDemo />

          {/* Section 3: Trend (How it works) */}
          <ScrollWeightMorph />

          {/* Section 4: AI Coach */}
          <AICoachDemo />

          {/* Section 5: Bento Grid (Train, Focus, Money, Goals) */}
          <BentoLifeOS />

          {/* Section 6: Founder & Privacy */}
          <FounderPrivacySection />

          {/* Section 7: FAQ & The Science */}
          <FAQAndScience />

          {/* Section 8: Final CTA */}
          <FinalCTA />
        </main>

        {/* Footer */}
        <MarketingFooter />
      </div>
    </SmoothScroll>
  );
}
