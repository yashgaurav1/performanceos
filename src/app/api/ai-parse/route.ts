import { NextResponse } from "next/server";
import { z } from "zod";
import { getModel } from "@/lib/ai/models";
import { generateObject } from "ai";

export const runtime = "nodejs";

const RequestSchema = z.object({
  text: z.string().min(1, "Input text is required"),
});

const ParsedMealSchema = z.object({
  items: z.array(
    z.object({
      foodName: z.string(),
      servingGrams: z.number(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      confidence: z.string().optional(),
    })
  ),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
});

function deterministicParse(text: string) {
  const chunks = text
    .split(/,|\band\b|\bwith\b|\bplus\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const items = chunks.map((chunk) => {
    const gramMatch = chunk.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\b/i);
    const countMatch = chunk.match(/^(\d+)\s+([a-zA-Z\s]+)$/i);

    let grams = 100;
    let foodName = chunk.replace(/\b\d+(?:\.\d+)?\s*(?:g|grams?)\b/gi, "").trim();

    if (gramMatch && gramMatch[1]) {
      grams = parseFloat(gramMatch[1]);
    } else if (countMatch && countMatch[1] && countMatch[2]) {
      const count = parseInt(countMatch[1], 10);
      foodName = countMatch[2].trim();
      grams = count * 60;
    }

    if (!foodName) foodName = chunk;

    const lower = foodName.toLowerCase();

    let p100 = 10;
    let c100 = 15;
    let f100 = 5;
    let k100 = 145;

    if (lower.includes("chicken") || lower.includes("turkey") || lower.includes("breast")) {
      p100 = 31; c100 = 0; f100 = 3.6; k100 = 165;
    } else if (lower.includes("beef") || lower.includes("steak")) {
      p100 = 26; c100 = 0; f100 = 15; k100 = 245;
    } else if (lower.includes("salmon") || lower.includes("fish")) {
      p100 = 22; c100 = 0; f100 = 12; k100 = 200;
    } else if (lower.includes("rice") || lower.includes("jasmine") || lower.includes("basmati")) {
      p100 = 2.7; c100 = 28.2; f100 = 0.3; k100 = 130;
    } else if (lower.includes("oat") || lower.includes("oatmeal")) {
      p100 = 13; c100 = 66; f100 = 7; k100 = 380;
    } else if (lower.includes("potato") || lower.includes("sweet potato")) {
      p100 = 2; c100 = 21; f100 = 0.2; k100 = 90;
    } else if (lower.includes("egg")) {
      p100 = 12.6; c100 = 0.7; f100 = 9.5; k100 = 143;
    } else if (lower.includes("whey") || lower.includes("protein")) {
      p100 = 78; c100 = 6; f100 = 3; k100 = 365;
    } else if (lower.includes("yogurt") || lower.includes("curd")) {
      p100 = 10; c100 = 4; f100 = 0.5; k100 = 60;
    } else if (lower.includes("oil") || lower.includes("butter")) {
      p100 = 0; c100 = 0; f100 = 100; k100 = 884;
    } else if (lower.includes("paneer") || lower.includes("tofu")) {
      p100 = 18; c100 = 4; f100 = 18; k100 = 250;
    }

    const factor = grams / 100;
    const calories = Math.round(k100 * factor);
    const protein = Math.round(p100 * factor * 10) / 10;
    const carbs = Math.round(c100 * factor * 10) / 10;
    const fat = Math.round(f100 * factor * 10) / 10;

    return {
      foodName: foodName.replace(/\b\w/g, (l) => l.toUpperCase()),
      servingGrams: Math.round(grams),
      calories,
      protein,
      carbs,
      fat,
      confidence: "deterministic_evidence_based",
    };
  });

  const totalCalories = Math.round(items.reduce((s, i) => s + i.calories, 0));
  const totalProtein = Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10;
  const totalFat = Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10;

  return {
    items,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    mode: "deterministic_parser",
  };
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = RequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", code: "VALIDATION_ERROR", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { text } = parsed.data;

    // Check if an AI model is configured
    try {
      const ai = getModel();
      if (ai) {
        const { object } = await generateObject({
          model: ai.model,
          schema: ParsedMealSchema,
          prompt: `Parse the following natural language food description into realistic food items with accurate gram weights and macronutrients (calories, protein, carbs, fat):
"${text}"
Ensure values are realistic based on USDA food nutrition databases.`,
        });

        return NextResponse.json({
          ...object,
          mode: `neural_ai (${ai.modelId})`,
        });
      }
    } catch (err) {
      console.warn("AI generation notice, falling back to deterministic parser:", err);
    }

    // Deterministic parser fallback
    const result = deterministicParse(text);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("AI parse route error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to parse meal input.",
        code: "PARSE_ERROR",
      },
      { status: 500 }
    );
  }
}
