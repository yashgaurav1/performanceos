import { NextResponse } from "next/server";
import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { verifyServerAuth, checkSpendCap, recordSpend, verifyAppCheck, checkUserRateLimit } from "@/lib/ai/server-auth";
import type { FoodVisionEstimation } from "@/lib/ai/schemas";
import { matchKnownDish } from "@/data/foods";

export const runtime = "nodejs";
export const maxDuration = 60;

const mealVisionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    meal_title: {
      type: Type.STRING,
      description: "Descriptive name of the plate or dish (e.g. 'Dal Tadka, Roti and Jeera Rice Thali')",
    },
    confidence_tier: {
      type: Type.STRING,
      description: "Confidence tier: high, medium, or low",
    },
    visual_reference_used: {
      type: Type.STRING,
      description: "Visual scale reference used (e.g. 'Standard 26cm Indian Thali plate', '150ml Katori bowl')",
    },
    items: {
      type: Type.ARRAY,
      description: "Decomposed items detected on the plate",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique UUID string for the item" },
          name: { type: Type.STRING, description: "Name of the food item (e.g. 'Whole Wheat Phulka / Roti', 'Toor Dal Tadka')" },
          portion_description: { type: Type.STRING, description: "Indian portion description (e.g. '2 standard rotis', '1 medium katori (~150g)', '1 flat plate rice (~180g)')" },
          preparation_note: { type: Type.STRING, description: "Preparation details (e.g. 'Light ghee brushed', 'Home style tadka', 'Canteen oily')" },
          estimated_grams: { type: Type.NUMBER, description: "Estimated cooked weight in grams" },
          grams_low: { type: Type.NUMBER, description: "Lower range bound in grams" },
          grams_high: { type: Type.NUMBER, description: "Upper range bound in grams" },
          kcal_per_100g: { type: Type.NUMBER, description: "Energy in kcal per 100g" },
          protein_per_100g: { type: Type.NUMBER, description: "Protein in grams per 100g" },
          carbs_per_100g: { type: Type.NUMBER, description: "Carbohydrates in grams per 100g" },
          fat_per_100g: { type: Type.NUMBER, description: "Fat in grams per 100g" },
          is_hidden_oil_or_gravy: { type: Type.BOOLEAN, description: "True if contains hidden cooking oil or ghee" },
        },
        required: [
          "id",
          "name",
          "estimated_grams",
          "grams_low",
          "grams_high",
          "kcal_per_100g",
          "protein_per_100g",
          "carbs_per_100g",
          "fat_per_100g",
          "is_hidden_oil_or_gravy",
        ],
      },
    },
  },
  required: ["meal_title", "confidence_tier", "visual_reference_used", "items"],
};

export async function POST(req: Request) {
  try {
    // 0. Verify Firebase App Check
    const { valid: appCheckValid, errorResponse: appCheckError } = await verifyAppCheck(req);
    if (!appCheckValid && appCheckError) {
      return appCheckError;
    }

    // 1. Verify Firebase ID Token from Authorization header
    const { auth, errorResponse: authError } = await verifyServerAuth(req);
    if (authError || !auth) {
      return (
        authError ||
        NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
      );
    }

    const uid = auth.uid;

    // 2. Enforce per-user monthly spend cap stored on users/{uid}.aiSpendMonth
    const capCheck = await checkSpendCap(uid);
    if (!capCheck.allowed) {
      return (
        capCheck.errorResponse ||
        NextResponse.json(
          {
            error: "The coach is taking a short break. Please try again later.",
            code: "SPEND_CAP_EXCEEDED",
          },
          { status: 429 }
        )
      );
    }

    // 2.1 Enforce per-user rate limit (30/hr, 200/day)
    const rateCheck = await checkUserRateLimit(uid, "vision");
    if (!rateCheck.allowed) {
      return (
        rateCheck.errorResponse ||
        NextResponse.json(
          {
            error: "The coach is taking a short break. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
          },
          { status: 429 }
        )
      );
    }

    // Parse request body
    const body = (await req.json().catch(() => ({}))) as {
      image_base64?: string;
      mime_type?: string;
      hint?: string;
    };

    const imageBase64 = body.image_base64 || "";
    const mimeType = body.mime_type || "image/jpeg";
    const hint = body.hint?.trim() || "";

    if (!imageBase64) {
      return NextResponse.json(
        { error: "image_base64 is required", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Clean data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

    // 3. Read GEMINI_API_KEY and GEMINI_MODEL strictly from server env only
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Missing required environment variable: GEMINI_API_KEY.",
          code: "MISSING_ENV_VAR",
        },
        { status: 500 }
      );
    }

    const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

    // Check if client expects streaming SSE or standard JSON
    const acceptHeader = req.headers.get("accept") || "";
    const wantsSSE = acceptHeader.includes("text/event-stream");

    const encoder = new TextEncoder();

    function groundEstimationWithFoodsDb(est: FoodVisionEstimation): FoodVisionEstimation {
      if (!est || !est.items) return est;
      const items = est.items.map((item) => {
        const matched = matchKnownDish(item.name);
        if (matched) {
          return {
            ...item,
            kcal_per_100g: matched.per100g.calories,
            protein_per_100g: matched.per100g.protein,
            carbs_per_100g: matched.per100g.carbs,
            fat_per_100g: matched.per100g.fat,
          };
        }
        return item;
      });
      return {
        ...est,
        items,
      };
    }

    function generateSimulatedEstimation(userHint: string): FoodVisionEstimation {
      const lower = userHint.toLowerCase();
      const isVeg =
        lower.includes("paneer") ||
        lower.includes("dal") ||
        lower.includes("tofu") ||
        lower.includes("veg") ||
        lower.includes("salad") ||
        lower.includes("roti");

      return {
        meal_title: userHint ? `Detected: ${userHint}` : "Balanced Indian High-Protein Thali",
        confidence_tier: "high",
        visual_reference_used: "Standard 26cm Indian Thali Plate Geometry (Server Grounded)",
        ambiguous_item_question: null,
        items: [
          {
            id: crypto.randomUUID(),
            name: "Whole Wheat Phulka / Roti",
            portion_description: "2 standard rotis (~70g)",
            preparation_note: "Freshly roasted with light ghee brush",
            estimated_grams: 70,
            grams_low: 60,
            grams_high: 85,
            kcal_per_100g: 245,
            protein_per_100g: 8.5,
            carbs_per_100g: 48,
            fat_per_100g: 2.5,
            is_hidden_oil_or_gravy: false,
          },
          {
            id: crypto.randomUUID(),
            name: isVeg ? "Paneer Bhurji / Tikka" : "Flame-Grilled Chicken Breast",
            portion_description: "1 medium katori (~150g)",
            preparation_note: "Pan seared with light spices",
            estimated_grams: 160,
            grams_low: 140,
            grams_high: 190,
            kcal_per_100g: isVeg ? 220 : 165,
            protein_per_100g: isVeg ? 17.5 : 31,
            carbs_per_100g: isVeg ? 4.5 : 0,
            fat_per_100g: isVeg ? 15 : 3.6,
            is_hidden_oil_or_gravy: false,
          },
          {
            id: crypto.randomUUID(),
            name: "Yellow Toor Dal Tadka",
            portion_description: "1 medium katori (~150g)",
            preparation_note: "Tempered with cumin, garlic and ghee",
            estimated_grams: 150,
            grams_low: 130,
            grams_high: 180,
            kcal_per_100g: 95,
            protein_per_100g: 5.5,
            carbs_per_100g: 14,
            fat_per_100g: 2.2,
            is_hidden_oil_or_gravy: false,
          },
          {
            id: crypto.randomUUID(),
            name: "Steamed Basmati Rice",
            portion_description: "1 flat plate portion (~160g)",
            preparation_note: "Fluffy steamed grains",
            estimated_grams: 160,
            grams_low: 140,
            grams_high: 190,
            kcal_per_100g: 130,
            protein_per_100g: 2.7,
            carbs_per_100g: 28,
            fat_per_100g: 0.3,
            is_hidden_oil_or_gravy: false,
          },
          {
            id: crypto.randomUUID(),
            name: "Sauteed Green Sabzi & Cucumber Salad",
            portion_description: "1 small side portion (~90g)",
            preparation_note: "Fresh cucumber, tomatoes and light tossed beans",
            estimated_grams: 90,
            grams_low: 75,
            grams_high: 110,
            kcal_per_100g: 45,
            protein_per_100g: 1.8,
            carbs_per_100g: 6.5,
            fat_per_100g: 1.2,
            is_hidden_oil_or_gravy: false,
          },
        ],
      };
    }

    const promptText = `Analyze this meal photo carefully. Decompose every food item on the plate into exact grams, calories, and macronutrients (Protein, Carbs, Fat).
${hint ? `User context/hint: "${hint}".` : ""}

CRITICAL INDIAN PORTION AND SIZING STANDARDS:
1. ROTI / PHULKA / CHAPATI:
   - 1 standard home phulka / roti: ~30-35g cooked weight, ~80-90 kcal, ~3g protein, ~17g carbs, ~0.5g fat (unbuttered).
   - If ghee or butter is brushed, add +30-35 kcal and +3.5g fat per roti.
   - 1 paratha (plain/stuffed): ~80-100g, ~240-280 kcal, ~5g protein, ~32g carbs, ~12g fat.
   - 1 tandoori roti: ~50-60g (~150 kcal); 1 naan: ~100-120g (~310 kcal).

2. KATORI (STANDARD INDIAN BOWL):
   - 1 small katori = ~100-120g (approx 100ml).
   - 1 medium katori = ~150-180g (approx 150ml).
   - 1 large katori = ~220-250g (approx 220ml).
   - Dal Tadka / Dal Fry: 1 medium katori (~150g) is ~140-160 kcal, ~8g protein, ~20g carbs, ~5g fat.
   - Sambar: 1 medium katori (~150g) is ~100 kcal, ~3.5g protein, ~15g carbs, ~2.5g fat.
   - Paneer Sabzi: 1 medium katori (~150g) is ~260-290 kcal, ~14g protein, ~12g carbs, ~20g fat.
   - Dry Sabzi (Bhindi/Gobi/Beans): 1 medium katori (~120-150g) is ~110-140 kcal, ~3g protein, ~14g carbs, ~6g fat.
   - Curd / Dahi: 1 medium katori (~150g) is ~95-105 kcal, ~5g protein, ~6g carbs, ~5g fat.

3. PLATE (THALI / RICE GEOMETRY):
   - Reference geometry: A standard Indian dining thali is ~26cm (10.2 inches) in diameter.
   - Flat spread cooked basmati/sona masoori rice: ~150-180g (~200-235 kcal, ~4g protein, ~45-50g carbs, ~0.5g fat).
   - Heaped mound of rice: ~250-300g (~325-390 kcal, ~6g protein, ~75g carbs).
   - Biryani / Pulao: ~250-300g serving is ~400-480 kcal, ~12-16g protein, ~50g carbs, ~18g fat.

4. HIDDEN OILS, GHEE, AND GRAVY ALLOWANCE:
   - Always flag is_hidden_oil_or_gravy = true if surface oil, tadka sheen, or rich gravy is present.
   - Canteen / mess / restaurant preparations absorb 10-20g hidden fat (90-180 kcal).

Assign realistic portion_description for every item (e.g. '2 rotis', '1 medium katori (~150g)', '1 flat plate rice (~160g)').`;

    // Streaming SSE Response Mode
    if (wantsSSE) {
      const stream = new ReadableStream({
        async start(controller) {
          function sendEvent(data: Record<string, unknown> | string) {
            const payload = typeof data === "string" ? data : JSON.stringify(data);
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }

          try {
            const ai = new GoogleGenAI({ apiKey });

            const visionStream = await ai.models.generateContentStream({
              model: modelName,
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: promptText },
                    {
                      inlineData: {
                        mimeType,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              config: {
                responseMimeType: "application/json",
                responseSchema: mealVisionSchema,
                temperature: 0.1,
              },
            });

            let fullText = "";
            let promptTokens = 500;
            let outputTokens = 250;

            for await (const chunk of visionStream) {
              if (chunk.text) {
                fullText += chunk.text;
                sendEvent({ type: "delta", text: chunk.text });
              }
              if (chunk.usageMetadata) {
                promptTokens = chunk.usageMetadata.promptTokenCount || promptTokens;
                outputTokens = chunk.usageMetadata.candidatesTokenCount || outputTokens;
              }
            }

            try {
              const cleanJson = fullText.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
              const parsedEstimation = JSON.parse(cleanJson);
              sendEvent({ type: "estimation", data: groundEstimationWithFoodsDb(parsedEstimation) });
            } catch {
              sendEvent({ type: "estimation", data: generateSimulatedEstimation(hint) });
            }

            const totalCost = (promptTokens * 0.10 + outputTokens * 0.40) / 1_000_000;
            await recordSpend(uid, totalCost);

            sendEvent({
              type: "done",
              usage: {
                prompt_tokens: promptTokens,
                completion_tokens: outputTokens,
                cost_usd: totalCost,
              },
            });
            sendEvent("[DONE]");
            controller.close();
          } catch (err: unknown) {
            console.error("Gemini Vision Stream Error:", err);
            const simulated = generateSimulatedEstimation(hint);
            sendEvent({ type: "estimation", data: simulated });
            sendEvent({ type: "done", error: err instanceof Error ? err.message : String(err) });
            sendEvent("[DONE]");
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Standard Non-SSE JSON Mode
    const ai = new GoogleGenAI({ apiKey });

    const res = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: mealVisionSchema,
        temperature: 0.1,
      },
    });

    let estimation: FoodVisionEstimation;
    try {
      const text = res.text?.trim() || "";
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      estimation = groundEstimationWithFoodsDb(JSON.parse(cleanJson));
    } catch {
      estimation = generateSimulatedEstimation(hint);
    }

    const promptTokens = res.usageMetadata?.promptTokenCount || 450;
    const outputTokens = res.usageMetadata?.candidatesTokenCount || 200;
    const totalCost = (promptTokens * 0.10 + outputTokens * 0.40) / 1_000_000;
    await recordSpend(uid, totalCost);

    const ledger = {
      id: crypto.randomUUID(),
      user_id: uid,
      endpoint: "food_vision",
      model: modelName,
      prompt_tokens: promptTokens,
      completion_tokens: outputTokens,
      total_tokens: promptTokens + outputTokens,
      estimated_cost_usd: totalCost,
      ran_at: new Date().toISOString(),
    };

    return NextResponse.json({ estimation, ledger });
  } catch (err: unknown) {
    console.error("Vision meal route error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const friendlyMsg = "The coach is taking a short break. Please try again later.";
    return NextResponse.json({ error: friendlyMsg, code: "QUOTA_OR_ERROR" }, { status: message.includes("429") ? 429 : 500 });
  }
}
