import React from "react";
import { Metadata } from "next";
import { ContentShell } from "@/components/content/content-shell";
import { DeficitCalculatorWidget } from "@/components/tools/deficit-calc";

export const metadata: Metadata = {
  title: "Calorie Deficit Calculator · Plan Sustainable Fat Loss",
  description:
    "Calculate your exact daily calorie deficit and daily target to lose 0.25 to 1 kg per week sustainably without metabolic crash.",
  alternates: {
    canonical: "/tools/calorie-deficit-calculator",
  },
};

export default function CalorieDeficitCalculatorPage() {
  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Calorie Deficit Calculator",
    applicationCategory: "HealthApplication",
    operatingSystem: "All",
    url: "https://osperformance.vercel.app/tools/calorie-deficit-calculator",
    description: "Safe, sustainable calorie deficit and fat loss timeline calculator.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <ContentShell
      eyebrow="Free Calculator"
      title="Calorie Deficit Calculator: Safe, Sustainable Fat Loss"
      subtitle="Find the exact daily calorie deficit required to reach your target weight loss rate without muscle wasting or energy crashes."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Tools", href: "/tools/calorie-deficit-calculator" },
      ]}
      sources={[
        "Hall, K. D. et al. (2011). Quantification of the effect of energy imbalance on bodyweight. The Lancet.",
        "Garthe, I. et al. (2011). Effect of two different weight-loss rates on body composition and strength and power-related performance in elite athletes. Int J Sport Nutr Exerc Metab.",
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />
      <DeficitCalculatorWidget />

      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          What is a calorie deficit and how is it calculated?
        </h2>
        <p>
          A calorie deficit occurs when you consume fewer calories than your body burns across a 24-hour period. Because 1 kilogram of body fat contains roughly 7,700 calories of chemical energy, losing 0.5 kg of fat per week requires a weekly deficit of 3,850 kcal, which equals approximately 550 kcal below your daily energy expenditure each day.
        </p>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          Why extreme deficits backfire
        </h2>
        <p>
          Cutting calories by 1,000+ kcal per day leads to elevated cortisol, severe loss of muscle mass, decreased metabolic rate (adaptive thermogenesis), and uncontrollable food cravings. Aiming for 0.5% to 1.0% of your total body weight loss per week allows you to sustain high training performance and preserve metabolic health.
        </p>
      </section>
    </ContentShell>
  );
}
