import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SearchQuerySchema = z.object({
  q: z.string().optional(),
  barcode: z.string().optional(),
});

export interface NormalizedFoodResult {
  id: string;
  foodName: string;
  brand: string;
  barcode: string | null;
  servingGrams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  imageUrl?: string | null;
  source: "openfoodfacts" | "local_curated";
}

const CURATED_FALLBACK_FOODS: NormalizedFoodResult[] = [
  {
    id: "fb-1",
    foodName: "Chicken Breast (Boneless, Skinless)",
    brand: "Whole Foods / Fresh Cut",
    barcode: "023456789012",
    servingGrams: 100,
    kcalPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    imageUrl: null,
    source: "local_curated",
  },
  {
    id: "fb-2",
    foodName: "Jasmine White Rice (Cooked)",
    brand: "Royal Grain",
    barcode: "012345678901",
    servingGrams: 100,
    kcalPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatPer100g: 0.3,
    imageUrl: null,
    source: "local_curated",
  },
  {
    id: "fb-3",
    foodName: "Whey Protein Isolate 100%",
    brand: "Optimum Nutrition",
    barcode: "098765432109",
    servingGrams: 30,
    kcalPer100g: 375,
    proteinPer100g: 80,
    carbsPer100g: 6,
    fatPer100g: 3,
    imageUrl: null,
    source: "local_curated",
  },
  {
    id: "fb-4",
    foodName: "Greek Yogurt Non-Fat 0%",
    brand: "Fage Total",
    barcode: "087654321098",
    servingGrams: 170,
    kcalPer100g: 57,
    proteinPer100g: 10.3,
    carbsPer100g: 3.0,
    fatPer100g: 0,
    imageUrl: null,
    source: "local_curated",
  },
  {
    id: "fb-5",
    foodName: "Whole Large Egg",
    brand: "Farm Fresh Grade A",
    barcode: "076543210987",
    servingGrams: 50,
    kcalPer100g: 143,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    fatPer100g: 9.5,
    imageUrl: null,
    source: "local_curated",
  },
  {
    id: "fb-6",
    foodName: "Rolled Old Fashioned Oats",
    brand: "Quaker",
    barcode: "065432109876",
    servingGrams: 40,
    kcalPer100g: 389,
    proteinPer100g: 16.9,
    carbsPer100g: 66.3,
    fatPer100g: 6.9,
    imageUrl: null,
    source: "local_curated",
  },
  {
    id: "fb-7",
    foodName: "Atlantic Salmon Fillet",
    brand: "Wild Catch",
    barcode: "054321098765",
    servingGrams: 150,
    kcalPer100g: 208,
    proteinPer100g: 20.4,
    carbsPer100g: 0,
    fatPer100g: 13.4,
    imageUrl: null,
    source: "local_curated",
  },
  {
    id: "fb-8",
    foodName: "Fresh Avocado",
    brand: "Hass",
    barcode: "043210987654",
    servingGrams: 100,
    kcalPer100g: 160,
    proteinPer100g: 2.0,
    carbsPer100g: 8.5,
    fatPer100g: 14.7,
    imageUrl: null,
    source: "local_curated",
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = SearchQuerySchema.safeParse({
      q: searchParams.get("q") || undefined,
      barcode: searchParams.get("barcode") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid search query", code: "VALIDATION_ERROR", issues: parsed.error.issues }, { status: 400 });
    }

    const { q, barcode } = parsed.data;

    // 1. Direct Barcode Lookup via OpenFoodFacts API
    if (barcode?.trim()) {
      try {
        const code = barcode.trim();
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`, {
          headers: { "User-Agent": "performanceos - Web - Version 1.0" },
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === 1 && data.product) {
            const p = data.product;
            const nutriments = p.nutriments || {};
            const result: NormalizedFoodResult = {
              id: `off-${code}`,
              foodName: p.product_name || p.generic_name || "Unknown Barcode Item",
              brand: p.brands || "Generic",
              barcode: code,
              servingGrams: Number(p.serving_quantity) || 100,
              kcalPer100g: Math.round(Number(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0)),
              proteinPer100g: Math.round((Number(nutriments["proteins_100g"] || nutriments.proteins || 0)) * 10) / 10,
              carbsPer100g: Math.round((Number(nutriments["carbohydrates_100g"] || nutriments.carbohydrates || 0)) * 10) / 10,
              fatPer100g: Math.round((Number(nutriments["fat_100g"] || nutriments.fat || 0)) * 10) / 10,
              imageUrl: p.image_front_small_url || p.image_front_url || null,
              source: "openfoodfacts",
            };
            return NextResponse.json({ results: [result], query: code, mode: "barcode" });
          }
        }
      } catch (err) {
        console.warn("OpenFoodFacts barcode lookup notice:", err);
      }
    }

    // 2. Keyword Search via OpenFoodFacts REST API
    const query = q?.trim() || "";
    let results: NormalizedFoodResult[] = [];

    if (query.length > 0) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s fast timeout

        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=12`;
        const res = await fetch(url, {
          headers: { "User-Agent": "performanceos - Web - Version 1.0" },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          const products = Array.isArray(json.products) ? json.products : [];

          results = products
            .filter((p: Record<string, unknown>) => p.product_name && p.nutriments)
            .map((p: Record<string, unknown>) => {
              const nutriments = (p.nutriments as Record<string, unknown>) || {};
              const kcal = Number(nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"] ?? 0);
              const protein = Number(nutriments["proteins_100g"] ?? nutriments.proteins ?? 0);
              const carbs = Number(nutriments["carbohydrates_100g"] ?? nutriments.carbohydrates ?? 0);
              const fat = Number(nutriments["fat_100g"] ?? nutriments.fat ?? 0);

              return {
                id: `off-${p.code || Math.random().toString(36).slice(2, 8)}`,
                foodName: String(p.product_name || "Food Item"),
                brand: String(p.brands || "General"),
                barcode: p.code ? String(p.code) : null,
                servingGrams: Number(p.serving_quantity) || 100,
                kcalPer100g: Math.round(kcal),
                proteinPer100g: Math.round(protein * 10) / 10,
                carbsPer100g: Math.round(carbs * 10) / 10,
                fatPer100g: Math.round(fat * 10) / 10,
                imageUrl: (p.image_front_small_url as string) || null,
                source: "openfoodfacts" as const,
              };
            });
        }
      } catch {
        // Fast fallback to curated items
      }
    }

    // 3. Blend / Fallback to Curated Database if query matches or external API had few results
    const qLower = query.toLowerCase();
    const matchedFallbacks = CURATED_FALLBACK_FOODS.filter(
      (f) => f.foodName.toLowerCase().includes(qLower) || f.brand.toLowerCase().includes(qLower)
    );

    const merged = [...results, ...matchedFallbacks];
    const seen = new Set<string>();
    const finalResults = (merged.length > 0 ? merged : CURATED_FALLBACK_FOODS).filter((item) => {
      const key = item.foodName.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      results: finalResults.slice(0, 10),
      query,
      count: finalResults.length,
      connectedService: "OpenFoodFacts v2 REST API",
    });
  } catch (err: unknown) {
    console.error("Food search error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to execute food search.",
        code: "FOOD_SEARCH_ERROR",
      },
      { status: 500 }
    );
  }
}
