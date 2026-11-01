import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ContentShell } from "@/components/content/content-shell";
import { FOODS_DATABASE } from "@/data/foods";
import { Card } from "@/components/ui/primitives";
import { getBlurPlaceholder } from "@/lib/blur-data";

interface PageProps {
  params: Promise<{ food: string }>;
}

export async function generateStaticParams() {
  return Object.keys(FOODS_DATABASE).map((food) => ({
    food,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { food } = await params;
  const item = FOODS_DATABASE[food];
  if (!item) return {};

  return {
    title: `Calories in ${item.name} (${item.portions[0]?.calories || item.per100g.calories} kcal) · Macros & Portions`,
    description: `Verified calories and macros in ${item.name} calculated from IFCT 2017 raw values. Portions for katoris, plates, and grams with a lighter preparation tip.`,
    alternates: {
      canonical: `/calories/${food}`,
    },
  };
}

export default async function FoodCaloriesPage({ params }: PageProps) {
  const { food } = await params;
  const item = FOODS_DATABASE[food];
  if (!item) notFound();

  const primaryPortion = item.portions[1] || item.portions[0]!;

  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: item.name,
    description: item.description,
    image: item.photoSrc ? `https://osperformance.vercel.app${item.photoSrc}` : undefined,
    author: {
      "@type": "Person",
      name: "Yash Gaurav",
      jobTitle: "Designer of PerformanceOS",
      description: "BBA student and powerlifter at heart who designed and built PerformanceOS.",
      sameAs: "https://www.linkedin.com/in/yash-gaurav/",
    },
    recipeYield: `${item.recipe.yieldGrams} g`,
    recipeIngredient: item.recipe.ingredients.map(
      (ing) => `${ing.grams} g ${ing.name}`
    ),
    nutrition: {
      "@type": "NutritionInformation",
      servingSize: primaryPortion.label,
      calories: `${primaryPortion.calories} calories`,
      proteinContent: `${primaryPortion.protein} g`,
      carbohydrateContent: `${primaryPortion.carbs} g`,
      fatContent: `${primaryPortion.fat} g`,
    },
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://osperformance.vercel.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Calories",
        item: "https://osperformance.vercel.app/calories",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: item.name,
        item: `https://osperformance.vercel.app/calories/${food}`,
      },
    ],
  };

  return (
    <ContentShell
      eyebrow="Indian Food Nutrition · Calculated from IFCT 2017"
      title={`${item.name} Calories & Nutrition Facts`}
      subtitle={item.description}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Calories", href: `/calories/${food}` },
      ]}
      sources={[
        "Calculated from IFCT 2017 (Indian Food Composition Tables) raw ingredient values, National Institute of Nutrition (ICMR).",
        "ICMR-NIN Dietary Guidelines for Indians (2020).",
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      {/* Visual Media Header */}
      {item.photoSrc ? (
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden mb-8 border border-white/10 bg-[#0C0C0D] not-prose">
          <Image
            src={item.photoSrc}
            alt={`Photo of ${item.name}`}
            fill
            priority
            placeholder="blur"
            blurDataURL={getBlurPlaceholder(item.photoSrc.replace("/images/", ""))}
            className="object-cover"
            sizes="(max-width: 860px) 100vw, 860px"
          />
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[#151517] border border-white/10 flex items-center gap-4 mb-8 not-prose">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#0C0C0D] border border-white/10 shrink-0">
            <Image
              src={item.iconSrc}
              alt={item.name}
              fill
              className="object-cover p-2"
              sizes="64px"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F5F5F4]">{item.name}</h2>
            {item.hindiName && (
              <span className="text-xs text-[#A1A1AA] font-sans">{item.hindiName}</span>
            )}
          </div>
        </div>
      )}

      {/* AEO Core Direct Answer */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          How many calories and macros are in {item.name}?
        </h2>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-base leading-relaxed text-[#F5F5F4]">
          One standard serving of {item.name} ({primaryPortion.label}) contains approximately{" "}
          <strong>{primaryPortion.calories} calories</strong>, with{" "}
          <strong>{primaryPortion.protein} g of protein</strong>,{" "}
          <strong>{primaryPortion.carbs} g of carbohydrates</strong>, and{" "}
          <strong>{primaryPortion.fat} g of fat</strong>. Per 100 grams, it provides {item.per100g.calories} kcal.
        </div>
      </section>

      {/* Portion Breakout Table */}
      <section className="space-y-4 pt-6">
        <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F4]">
          Portion Size Breakdown
        </h3>
        <div className="overflow-x-auto not-prose">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[#A1A1AA] uppercase tracking-wider font-sans">
                <th className="py-3 px-3">Portion</th>
                <th className="py-3 px-3">Weight</th>
                <th className="py-3 px-3">Calories</th>
                <th className="py-3 px-3">Protein</th>
                <th className="py-3 px-3">Carbs</th>
                <th className="py-3 px-3">Fat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[#F5F5F4]">
              {item.portions.map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-semibold">{p.label}</td>
                  <td className="py-3 px-3 text-[#A1A1AA]">{p.grams} g</td>
                  <td className="py-3 px-3 font-bold text-[#FF5533]">{p.calories} kcal</td>
                  <td className="py-3 px-3 text-[#3CC8C0]">{p.protein} g</td>
                  <td className="py-3 px-3 text-[#A1A1AA]">{p.carbs} g</td>
                  <td className="py-3 px-3 text-[#F5B841]">{p.fat} g</td>
                </tr>
              ))}
              <tr className="bg-white/[0.02] font-sans">
                <td className="py-3 px-3 text-[#A1A1AA]">Standard Base</td>
                <td className="py-3 px-3 text-[#A1A1AA]">100 g</td>
                <td className="py-3 px-3 font-bold text-[#FF5533]">{item.per100g.calories} kcal</td>
                <td className="py-3 px-3 text-[#3CC8C0]">{item.per100g.protein} g</td>
                <td className="py-3 px-3 text-[#A1A1AA]">{item.per100g.carbs} g</td>
                <td className="py-3 px-3 text-[#F5B841]">{item.per100g.fat} g</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Recipe Breakdown Table */}
      <section className="space-y-4 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F4]">
            Calculated from IFCT 2017 ingredient values
          </h3>
          <span className="text-xs text-[#A1A1AA]">
            Cooked Yield: ~{item.recipe.yieldGrams} g
          </span>
        </div>
        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          {item.recipe.cookingNote}
        </p>
        <div className="overflow-x-auto not-prose">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[#A1A1AA] uppercase tracking-wider font-sans">
                <th className="py-2.5 px-3">Raw Ingredient</th>
                <th className="py-2.5 px-3">Raw Weight</th>
                <th className="py-2.5 px-3">Calories</th>
                <th className="py-2.5 px-3">Protein</th>
                <th className="py-2.5 px-3">Carbs</th>
                <th className="py-2.5 px-3">Fat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[#F5F5F4]">
              {item.recipe.ingredients.map((ing, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 font-medium">{ing.name}</td>
                  <td className="py-2.5 px-3 text-[#A1A1AA]">{ing.grams} g</td>
                  <td className="py-2.5 px-3 font-semibold text-[#FF5533]">{ing.calories} kcal</td>
                  <td className="py-2.5 px-3 text-[#3CC8C0]">{ing.protein} g</td>
                  <td className="py-2.5 px-3 text-[#A1A1AA]">{ing.carbs} g</td>
                  <td className="py-2.5 px-3 text-[#F5B841]">{ing.fat} g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lighter Version Tip */}
      <section className="pt-6">
        <div className="p-5 rounded-2xl bg-[#0C0C0D] border border-white/10 not-prose space-y-2">
          <span className="text-xs font-sans uppercase tracking-wider text-[#3CC8C0]">
            Lighter Preparation Tip
          </span>
          <p className="text-sm text-[#D4D4D8] leading-relaxed">
            {item.lighterTip}
          </p>
        </div>
      </section>

      {/* App CTA */}
      <div className="my-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#FF5533]/15 to-[#3CC8C0]/15 border border-white/15 not-prose flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-sans tracking-widest text-[#FF5533]">
            Instant Visual Logging
          </span>
          <h4 className="text-lg sm:text-xl font-bold text-[#F5F5F4] mt-1">
            Log {item.name} with a single photo
          </h4>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            PerformanceOS recognizes your plate, estimates katoris and phulkas, and fits them into your weekly targets.
          </p>
        </div>
        <Link
          href="/login"
          className="px-6 py-3 rounded-xl bg-[#F5F5F4] text-[#0C0C0D] text-xs font-bold hover:bg-white transition-all shrink-0 shadow-lg"
        >
          Try the Demo →
        </Link>
      </div>

      {/* Related Dishes */}
      {item.relatedSlugs.length > 0 && (
        <section className="pt-6 border-t border-white/[0.08] not-prose">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#A1A1AA] mb-4">
            Related Indian Dishes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {item.relatedSlugs.map((relSlug) => {
              const rel = FOODS_DATABASE[relSlug];
              if (!rel) return null;
              return (
                <Link key={relSlug} href={`/calories/${relSlug}`}>
                  <Card className="p-4 hover:border-white/20 transition-all flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#0C0C0D] shrink-0">
                      <Image
                        src={rel.iconSrc}
                        alt={rel.name}
                        fill
                        className="object-cover p-1"
                        sizes="32px"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F5F5F4] truncate">{rel.name}</div>
                      <div className="text-[10px] text-[#A1A1AA] font-sans">{rel.per100g.calories} kcal / 100g</div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </ContentShell>
  );
}
