import React from "react";
import { Metadata } from "next";
import { ContentShell } from "@/components/content/content-shell";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "The Science of Adaptive Calorie Targets · PerformanceOS",
  description:
    "How PerformanceOS uses exponentially weighted moving averages and thermodynamic energy balance to calculate your true daily burn and adaptive calorie targets.",
  alternates: {
    canonical: "/science",
  },
};

export default function SciencePage() {
  return (
    <ContentShell
      eyebrow="The Science"
      title="How PerformanceOS Calculates Your Calorie Targets"
      subtitle="The exact mathematics behind smoothed weight trends, estimated daily expenditure, and weekly target adjustments in plain English."
      sources={[
        "Hall, K. D. et al. (2011). Quantification of the effect of energy imbalance on bodyweight. The Lancet, 378(9793), 826-837.",
        "Mifflin, M. D. et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr, 51(2), 241-247.",
        "ICMR-NIN (2020). Nutrient Requirements for Indians. Indian Council of Medical Research.",
      ]}
    >
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] pt-2">
          Why does standard calorie tracking fail after two weeks?
        </h2>
        <p>
          Standard calorie trackers rely on static baseline formulas (like Harris-Benedict or Mifflin-St Jeor) calculated once from your height and weight. Because metabolic rate changes as you lose weight, adapt to training, and experience water weight shifts, static equations become inaccurate within 14 days. PerformanceOS recalculates your actual burn dynamically from your real logs and weight trend.
        </p>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          How is your smoothed trend weight calculated?
        </h2>
        <p>
          Scale weight fluctuates 1 to 2 kg daily due to sodium intake, glycogen storage, hydration, and digestion. PerformanceOS applies an Exponentially Weighted Moving Average (EWMA) with a smoothing coefficient of 0.10:
        </p>

        <Card className="p-5 font-sans text-xs sm:text-sm text-[#3CC8C0] bg-[#0C0C0D] border-white/10 text-center">
          Trend_Today = Trend_Yesterday + 0.10 × (RawScaleWeight - Trend_Yesterday)
        </Card>

        <p>
          This mathematical filter isolates genuine changes in lean mass and adipose tissue while filtering out short-term water noise. A salty dinner or heavy leg day will not derail your long-term plan.
        </p>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          How is estimated daily energy burn calculated?
        </h2>
        <p>
          Under the laws of thermodynamics, body mass changes reflect the difference between energy consumed and energy expended. One kilogram of human body tissue equates to approximately 7,700 kcal of stored chemical energy.
        </p>

        <Card className="p-5 font-sans text-xs sm:text-sm text-[#FF5533] bg-[#0C0C0D] border-white/10 text-center">
          Daily Burn = Average Daily Intake - (Δ Trend Weight × 7,700 kcal ÷ Number of Days)
        </Card>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm space-y-2">
          <div className="font-semibold text-[#F5F5F4]">Worked Example:</div>
          <p className="text-[#A1A1AA]">
            Suppose you logged an average intake of 2,450 kcal per day over 7 days, and your smoothed trend weight decreased by 0.35 kg over the week:
          </p>
          <p className="font-sans text-xs text-[#F5F5F4]">
            Daily Burn = 2,450 - (-0.35 × 7,700 ÷ 7) = 2,450 - (-385) = 2,835 kcal/day.
          </p>
          <p className="text-[#A1A1AA]">
            Your actual metabolic expenditure is 2,835 kcal per day, regardless of what an initial online formula estimated.
          </p>
        </div>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          How do weekly target updates work?
        </h2>
        <p>
          Your daily calorie and macronutrient targets update once weekly based on your chosen rate of progress. To lose 0.5 kg of body fat per week safely, an energy deficit of roughly 550 kcal per day below your true expenditure is required:
        </p>

        <Card className="p-5 font-sans text-xs sm:text-sm text-[#F5B841] bg-[#0C0C0D] border-white/10 text-center">
          Daily Target = Estimated Daily Burn - Goal Deficit
        </Card>

        <p>
          Using our example: 2,835 kcal burn minus 550 kcal deficit yields an updated daily target of approximately 2,285 kcal, paired with 1.8 to 2.2 g of protein per kilogram of body weight to preserve lean muscle tissue.
        </p>
      </section>
    </ContentShell>
  );
}
