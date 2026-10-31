import fs from "fs";
import { FOODS_DATABASE, STANDARD_PORTIONS } from "../src/data/foods";

const lines = [
  "# PerformanceOS",
  "",
  "> AI diet coach and photo food logging app designed for Indian meals, strength training, focus tracking, and daily budgeting.",
  "",
  "## Overview",
  "PerformanceOS allows users to snap a photo of any meal (with deep support for Indian foods such as rotis, katoris, biryani, thalis), decomposes items with estimated portion sizes, and provides adaptive calorie targets calculated from 30-day weight trend analysis.",
  "",
  "## Brand Baselines",
  "- Daily estimated burn: 2,550 kcal",
  "- Daily target: 2,000 kcal",
  "- Calorie deficit: 550 kcal / day",
  "- Rate of progress: -0.5 kg / week fat loss",
  "- Protein target: 180 g / day",
  "",
  "## Standard Indian Portions (IFCT 2017 Baselines)",
  `- Standard katori: ${STANDARD_PORTIONS.katoriMl} ml (or 150 g)`,
  `- Medium phulka: ${STANDARD_PORTIONS.phulkaGrams} g each (2 phulkas = 70 g)`,
  `- Standard thali: ${STANDARD_PORTIONS.standardThaliCm} cm`,
  `- Tablespoon: ${STANDARD_PORTIONS.tablespoonMl} ml`,
  `- Teaspoon cooking oil: ${STANDARD_PORTIONS.teaspoonOilGrams} g (45 kcal)`,
  "",
  "## Verified Indian Foods Database (Calculated from IFCT 2017)",
  "All cooked values are calculated from raw ingredient composition tables:",
  "",
];

for (const [slug, food] of Object.entries(FOODS_DATABASE)) {
  const primaryPortion = food.portions[1] || food.portions[0]!;
  lines.push(`### ${food.name} (/calories/${slug})`);
  lines.push(`- Category: ${food.category}`);
  lines.push(`- Standard portion: ${primaryPortion.label} -> ${primaryPortion.calories} kcal, ${primaryPortion.protein}g protein, ${primaryPortion.carbs}g carbs, ${primaryPortion.fat}g fat`);
  lines.push(`- Base (100g): ${food.per100g.calories} kcal, ${food.per100g.protein}g protein, ${food.per100g.carbs}g carbs, ${food.per100g.fat}g fat`);
  lines.push(`- Cooked recipe yield: ~${food.recipe.yieldGrams}g`);
  lines.push(`- Lighter tip: ${food.lighterTip}`);
  lines.push("");
}

lines.push("## Key Features");
lines.push("- Photo Food Logging: Computer vision detects meal components, portions, and hidden cooking oils.");
lines.push("- Adaptive Daily Targets: Exponentially weighted moving average (EWMA) trend weight computes true daily expenditure, adjusting weekly.");
lines.push("- Personal AI Coach: In-depth context from the user's past 14 days of nutrition, sleep, focus, and strength training.");
lines.push("- Daily Operating System: Combines Strength Log (sets, reps, progressive overload), Focus Timer (deep work tracking), Daily Budget (remaining allowance), and Daily Big Three Priorities.");
lines.push("- Private & Offline First: Works seamlessly offline; zero ads, no third-party tracking, full data export available.");
lines.push("");
lines.push("## Core Reference Links");
lines.push("- Home: https://osperformance.vercel.app/");
lines.push("- The Science: https://osperformance.vercel.app/science");
lines.push("- Frequently Asked Questions: https://osperformance.vercel.app/faq");
lines.push("- Guides & Educational Hub: https://osperformance.vercel.app/guides");
lines.push("- Calories Directory: https://osperformance.vercel.app/calories/roti");
lines.push("- Free Calculators: https://osperformance.vercel.app/tools/tdee-calculator");
lines.push("- Privacy: https://osperformance.vercel.app/#privacy");
lines.push("- About & Designer: https://osperformance.vercel.app/about");

const content = lines.join("\n");
fs.writeFileSync("public/llms.txt", content, "utf8");
console.log("Successfully generated public/llms.txt from src/data/foods.ts");
