import React from "react";
import { Metadata } from "next";
import { ContentShell } from "@/components/content/content-shell";
import { TDEECalculatorWidget } from "@/components/tools/tdee-calc";

export const metadata: Metadata = {
  title: "TDEE Calculator · Calculate Your Daily Energy Burn",
  description:
    "Free Total Daily Energy Expenditure (TDEE) calculator based on the Mifflin-St Jeor equation. Learn how your true daily burn adapts with training.",
  alternates: {
    canonical: "/tools/tdee-calculator",
  },
};

export default function TDEECalculatorPage() {
  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TDEE Calculator",
    applicationCategory: "HealthApplication",
    operatingSystem: "All",
    url: "https://osperformance.vercel.app/tools/tdee-calculator",
    description: "Free Total Daily Energy Expenditure (TDEE) calculator based on the Mifflin-St Jeor equation.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <ContentShell
      eyebrow="Free Calculator"
      title="TDEE Calculator: How Many Calories Do You Burn Daily?"
      subtitle="Estimate your Total Daily Energy Expenditure (TDEE) using the scientifically validated Mifflin-St Jeor formula, then learn how PerformanceOS refines it over time."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Tools", href: "/tools/tdee-calculator" },
      ]}
      sources={[
        "Mifflin, M. D. et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr.",
        "FAO/WHO/UNU (2004). Human energy requirements. Report of a Joint FAO/WHO/UNU Expert Consultation.",
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />
      <TDEECalculatorWidget />

      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          What is Total Daily Energy Expenditure (TDEE)?
        </h2>
        <p>
          Total Daily Energy Expenditure is the total number of calories your body burns in a 24-hour period. It is composed of your Basal Metabolic Rate (the energy required to stay alive at rest), the Thermic Effect of Food (energy used to digest nutrients), and physical activity (both daily movement and structured workouts).
        </p>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          Why online TDEE calculators are only a starting estimate
        </h2>
        <p>
          Formulas cannot measure differences in muscle mass, subconscious movement (NEAT), hormonal shifts, or metabolic adaptation during a diet. Two people with identical height, weight, and age can have daily expenditures that differ by 300 to 500 calories. Use this calculator as a baseline for your first 14 days; PerformanceOS then adapts your actual targets based on your scale trend and logged food.
        </p>
      </section>
    </ContentShell>
  );
}
