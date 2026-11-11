import { NextResponse } from "next/server";
import { GoogleGenAI, Type, type FunctionDeclaration } from "@google/genai";
import { guardAiRequest, recordSpend } from "@/lib/ai/server-auth";
import { buildFourteenDaySummary, executeCoachTool } from "@/lib/ai/fourteen-day-summary";

export const runtime = "nodejs";
export const maxDuration = 60;

const WRITE_TOOLS = new Set(["log_meal", "update_targets"]);

interface MessageItem {
  role?: string;
  text?: string;
  content?: string;
  parts?: Array<{ type?: string; text?: string }>;
}

export async function POST(req: Request) {
  try {
    // App Check, verified identity, monthly spend cap and durable rate limit.
    const guard = await guardAiRequest(req, "coach");
    if (guard.errorResponse) return guard.errorResponse;
    const { auth } = guard;
    const uid = auth.uid;

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

    // Parse request body
    const body = (await req.json().catch(() => ({}))) as {
      messages?: MessageItem[];
      date?: string;
      today_live?: unknown;
    };

    const today = body.date || new Date().toISOString().slice(0, 10);
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];

    // Extract clean text turns
    const conversation = rawMessages
      .slice(-10)
      .map((m) => {
        let text = "";
        if (typeof m.text === "string") text = m.text;
        else if (typeof m.content === "string") text = m.content;
        else if (Array.isArray(m.parts)) {
          text = m.parts.map((p) => p.text || "").join(" ");
        }
        const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
        return { role, text: text.trim() };
      })
      .filter((m) => m.text.length > 0);

    // 4. Build 14-day telemetry summary on the server
    const telemetry = await buildFourteenDaySummary(uid, today);

    const systemInstruction = `You are the performanceos AI Neural Coach. You provide elite, adherence-neutral physiological coaching.
Ground every insight strictly in the athlete's 14-day telemetry and current targets.

${telemetry.summaryText}

CRITICAL RULES:
- If the user asks to log food or a meal (e.g. "log 2 eggs 140 kcal 12g protein" or "I ate a 500 kcal salad with 30g protein for lunch"), call the tool "log_meal".
- If the user wants to adjust their targets (calories, protein, carbs, fat, sleep, weight), call the tool "update_targets".
- If the user asks for a week review, weekly recap, or adherence summary, call the tool "get_week_summary".
- Be concise, direct, and actionable. Zero fluff, zero moralizing about missed targets. Treat nutrition and energy as physical thermodynamics.`;

    // Standard Server-Sent Events stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, unknown> | string) {
          const payload = typeof data === "string" ? data : JSON.stringify(data);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        }

        let promptTokens = 350;
        let outputTokens = 150;

        try {
          // Initialize @google/genai SDK
          const ai = new GoogleGenAI({ apiKey });

          const logMealDeclaration: FunctionDeclaration = {
            name: "log_meal",
            description: "Logs a food item or meal into the athlete's nutrition database.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                meal_title: { type: Type.STRING, description: "Descriptive name of the food or meal" },
                kcal: { type: Type.NUMBER, description: "Total energy in kcal" },
                protein_g: { type: Type.NUMBER, description: "Protein in grams" },
                carbs_g: { type: Type.NUMBER, description: "Carbohydrates in grams" },
                fat_g: { type: Type.NUMBER, description: "Fat in grams" },
                meal_slot: {
                  type: Type.STRING,
                  description: "Meal slot: breakfast, lunch, dinner, snack, or post_workout",
                },
                log_date: {
                  type: Type.STRING,
                  description: "ISO date YYYY-MM-DD for the meal (defaults to today)",
                },
              },
              required: ["meal_title", "kcal", "protein_g"],
            },
          };

          const updateTargetsDeclaration: FunctionDeclaration = {
            name: "update_targets",
            description: "Updates the athlete's daily physiological and metabolic targets.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                target_kcal: { type: Type.NUMBER, description: "Daily energy target in kcal" },
                target_protein_g: { type: Type.NUMBER, description: "Daily protein target in grams" },
                target_carbs_g: { type: Type.NUMBER, description: "Daily carbs target in grams" },
                target_fat_g: { type: Type.NUMBER, description: "Daily fat target in grams" },
                target_sleep_hours: { type: Type.NUMBER, description: "Daily target sleep in hours" },
                target_study_hours: { type: Type.NUMBER, description: "Daily target focus in hours" },
                body_weight_kg: { type: Type.NUMBER, description: "Athlete's reference weight in kg" },
              },
            },
          };

          const getWeekSummaryDeclaration: FunctionDeclaration = {
            name: "get_week_summary",
            description: "Calculates a 7-day adherence and physiological summary for the athlete.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                start_date: { type: Type.STRING, description: "Start date YYYY-MM-DD" },
              },
            },
          };

          const tools = [
            {
              functionDeclarations: [
                logMealDeclaration,
                updateTargetsDeclaration,
                getWeekSummaryDeclaration,
              ],
            },
          ];

          // Format contents for @google/genai
          const contents = conversation.map((c) => ({
            role: c.role === "model" ? "model" : "user",
            parts: [{ text: c.text }],
          }));

          if (contents.length === 0) {
            contents.push({ role: "user", parts: [{ text: "Hello coach." }] });
          }

          const streamResult = await ai.models.generateContentStream({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              tools,
              temperature: 0.3,
            },
          });

          const pendingCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

          for await (const chunk of streamResult) {
            if (chunk.text) {
              sendEvent({ type: "delta", text: chunk.text });
            }
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              for (const call of chunk.functionCalls) {
                if (call.name) {
                  const callArgs = (call.args || {}) as Record<string, unknown>;
                  pendingCalls.push({ name: call.name, args: callArgs });
                  sendEvent({ type: "tool_call", name: call.name, arguments: callArgs });
                }
              }
            }
            if (chunk.usageMetadata) {
              promptTokens = chunk.usageMetadata.promptTokenCount || promptTokens;
              outputTokens = chunk.usageMetadata.candidatesTokenCount || outputTokens;
            }
          }

          // If functions were requested, execute them and feed back to Gemini
          if (pendingCalls.length > 0) {
            for (const call of pendingCalls) {
              // The demo athlete is shared and read-only: never let a guest write to it.
              const toolExec =
                auth.isDemo && WRITE_TOOLS.has(call.name)
                  ? { success: false, result: "Demo mode is read-only. Sign in to save meals or change targets." }
                  : await executeCoachTool(call.name, call.args, uid, today);
              sendEvent({ type: "tool_result", name: call.name, result: toolExec.result });

              // Feed tool result back to Gemini for final response
              try {
                const followUpContents = [
                  ...contents,
                  {
                    role: "model",
                    parts: [{ functionCall: { name: call.name, args: call.args } }],
                  },
                  {
                    role: "user",
                    parts: [
                      {
                        functionResponse: {
                          name: call.name,
                          response: { output: toolExec.result },
                        },
                      },
                    ],
                  },
                ];

                const followUp = await ai.models.generateContentStream({
                  model: modelName,
                  contents: followUpContents,
                  config: {
                    systemInstruction,
                  },
                });

                for await (const followChunk of followUp) {
                  if (followChunk.text) {
                    sendEvent({ type: "delta", text: followChunk.text });
                  }
                }
              } catch (followErr) {
                console.warn("Follow-up streaming notice:", followErr);
                sendEvent({ type: "delta", text: `\n\n${toolExec.result}` });
              }
            }
          }

          // Enforce spend recording ($0.10/1M input, $0.40/1M output for gemini-3.8-flash)
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
          console.error("Gemini Coach Stream Error:", err);
          sendEvent({
            type: "delta",
            text: "The coach is taking a short break. Please try again later.",
          });
          sendEvent({ type: "done", error: "The coach is taking a short break. Please try again later." });
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
  } catch (err: unknown) {
    console.error("Coach API route error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const code = message.includes("Missing required environment variable")
      ? "MISSING_ENV_VAR"
      : "COACH_ERROR";
    return NextResponse.json({ error: message, code }, { status: 500 });
  }
}
