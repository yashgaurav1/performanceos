import React from "react";
import { Metadata } from "next";
import { ContentShell } from "@/components/content/content-shell";
import { ProteinCalculatorWidget } from "@/components/tools/protein-calc";

export const metadata: Metadata = {
  title: "Daily Protein Calculator · For Lifting & Fat Loss",
  description:
    "Calculate your optimal daily protein target in grams per day based on body weight and fitness goals. Scientifically grounded in sports nutrition guidelines.",
  alternates: {
    canonical: "/tools/protein-calculator",
  },
};

export default function ProteinCalculatorPage() {
  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Daily Protein Calculator",
    applicationCategory: "HealthApplication",
    operatingSystem: "All",
    url: "https://osperformance.vercel.app/tools/protein-calculator",
    description: "Scientific protein target calculator based on lean mass and training goals.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <ContentShell
      eyebrow="Free Calculator"
      title="Protein Calculator: How Much Protein Do You Need Daily?"
      subtitle="Determine your target protein intake in grams per day based on your training demands, fat-loss goals, and total body weight."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Tools", href: "/tools/protein-calculator" },
      ]}
      sources={[
        "Morton, R. W. et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med.",
        "Helms, E. R. et al. (2014). Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. J Int Soc Sports Nutr.",
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />
      <ProteinCalculatorWidget />

      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          How much protein do you need when resistance training?
        </h2>
        <p>
          For individuals engaged in resistance training or trying to lose fat while preserving muscle, scientific consensus recommends between 1.6 and 2.2 grams of protein per kilogram of body weight per day (0.7 to 1.0 grams per pound). During an aggressive caloric deficit, increasing intake up to 2.4 g/kg helps protect lean tissue from breakdown.
        </p>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          Meeting your protein goal with Indian home food
        </h2>
        <p>
          Vegetarian and plant-forward Indian diets often rely on pulses, dairy, and grains. Key high-yield protein sources include paneer (low-fat cottage cheese), boiled eggs or egg whites, roasted chana, Greek yogurt / hung curd, sprouted lentils, and whey protein isolate. Distributing protein evenly across 3 to 4 meals maximizes daily muscle protein synthesis.
        </p>
      </section>
    </ContentShell>
  );
}
