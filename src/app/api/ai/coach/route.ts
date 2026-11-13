import { NextResponse } from "next/server";
import { GoogleGenAI, Type, type Content, type FunctionDeclaration } from "@google/genai";
import { guardAiRequest, recordSpend } from "@/lib/ai/server-auth";
import { buildFourteenDaySummary, executeCoachTool } from "@/lib/ai/fourteen-day-summary";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MessageItem {
  role?: string;
  text?: string;
  content?: string;
  parts?: Array<{ type?: string; text?: string }>;
}

/**
 * Tools the browser runs on the user's own data (Dexie → Firestore). The server
 * never writes user data: it streams { type: "action", name, args } and the client
 * validates and executes it (src/lib/ai/assistant-actions.ts).
 */
const CLIENT_ACTIONS: FunctionDeclaration[] = [
  {
    name: "start_timer",
    description: "Start a focus (Pomodoro) countdown timer in the app.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        minutes: { type: Type.NUMBER, description: "Length in minutes (1-240)" },
        subject: { type: Type.STRING, description: "What the user is focusing on, if said" },
      },
      required: ["minutes"],
    },
  },
  { name: "stop_timer", description: "Stop the running focus timer and save the focus time.", parameters: { type: Type.OBJECT, properties: {} } },
  {
    name: "add_task",
    description: "Add an item to the user's to-do list.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short task title in the user's words, without the time" },
        date: { type: Type.STRING, description: "YYYY-MM-DD; defaults to today" },
        due_time: { type: Type.STRING, description: "24h HH:MM if the user gave a time" },
        domain: { type: Type.STRING, description: "study | physique | career | life" },
        big_three: { type: Type.BOOLEAN, description: "True if the user called it a top priority" },
      },
      required: ["title"],
    },
  },
  {
    name: "log_food",
    description: "Log food by description using the app's food database, e.g. '2 roti, 1 katori dal, 200g chicken'. Prefer this over log_meal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "Foods with amounts, comma separated" },
        meal_slot: { type: Type.STRING, description: "breakfast | lunch | dinner | snack" },
      },
      required: ["text"],
    },
  },
  {
    name: "log_meal",
    description: "Log a meal with known calories when log_food can't describe it (packaged food, restaurant item with stated kcal).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        meal_title: { type: Type.STRING },
        kcal: { type: Type.NUMBER },
        protein_g: { type: Type.NUMBER },
        carbs_g: { type: Type.NUMBER },
        fat_g: { type: Type.NUMBER },
        meal_slot: { type: Type.STRING, description: "breakfast | lunch | dinner | snack" },
      },
      required: ["meal_title", "kcal"],
    },
  },
  {
    name: "log_expense",
    description: "Log money spent.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: "Amount in the user's currency" },
        note: { type: Type.STRING, description: "What it was for" },
        merchant: { type: Type.STRING, description: "Where" },
      },
      required: ["amount"],
    },
  },
  {
    name: "log_weight",
    description: "Log today's body weight.",
    parameters: { type: Type.OBJECT, properties: { kg: { type: Type.NUMBER } }, required: ["kg"] },
  },
  {
    name: "add_win",
    description: "Save a small win for today.",
    parameters: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ["text"] },
  },
  {
    name: "update_targets",
    description: "Change daily targets. Only when the user explicitly asks to change a target.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target_kcal: { type: Type.NUMBER },
        target_protein_g: { type: Type.NUMBER },
        target_carbs_g: { type: Type.NUMBER },
        target_fat_g: { type: Type.NUMBER },
        target_sleep_hours: { type: Type.NUMBER },
        target_study_hours: { type: Type.NUMBER },
        body_weight_kg: { type: Type.NUMBER },
      },
    },
  },
];

const SERVER_TOOLS: FunctionDeclaration[] = [
  {
    name: "get_week_summary",
    description: "Read a 7-day adherence summary of the user's logged data.",
    parameters: { type: Type.OBJECT, properties: { start_date: { type: Type.STRING, description: "YYYY-MM-DD" } } },
  },
];

const CLIENT_ACTION_NAMES = new Set(CLIENT_ACTIONS.map((d) => d.name));

export async function POST(req: Request) {
  try {
    // App Check, verified identity, monthly spend cap and durable rate limit.
    const guard = await guardAiRequest(req, "coach");
    if (guard.errorResponse) return guard.errorResponse;
    const { uid } = guard.auth;

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "The coach isn't configured yet.", code: "MISSING_ENV_VAR" }, { status: 500 });
    }
    const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

    const body = (await req.json().catch(() => ({}))) as { messages?: MessageItem[]; date?: string; local_time?: string };
    const today = /^\d{4}-\d{2}-\d{2}$/.test(body.date ?? "") ? (body.date as string) : new Date().toISOString().slice(0, 10);
    const localTime = typeof body.local_time === "string" ? body.local_time.slice(0, 40) : "";
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];

    const conversation = rawMessages
      .slice(-10)
      .map((m) => {
        const text =
          typeof m.text === "string" ? m.text : typeof m.content === "string" ? m.content : Array.isArray(m.parts) ? m.parts.map((p) => p.text || "").join(" ") : "";
        return { role: m.role === "assistant" || m.role === "model" ? "model" : "user", text: text.trim().slice(0, 2000) };
      })
      .filter((m) => m.text.length > 0);

    if (conversation.length === 0 || conversation[conversation.length - 1]?.role !== "user") {
      return NextResponse.json({ error: "Send a message for the coach to answer.", code: "INVALID_REQUEST" }, { status: 400 });
    }

    const telemetry = await buildFourteenDaySummary(uid, today);

    const systemInstruction = `You are the PerformanceOS assistant and coach. You can both answer questions and DO things in the app.
Today is ${today}${localTime ? ` and the user's local time is ${localTime}` : ""}.

When the user asks you to do something (start a timer, add a to-do, log food, money, weight or a win, change a target),
call the matching tool instead of describing it. You may call several tools for one message.
After acting, confirm in one short sentence. Don't repeat numbers the app already shows.

For questions, ground answers in the user's data below. Be concise, practical, and kind. No guilt, no moralizing.

${telemetry.summaryText}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown> | string) =>
          controller.enqueue(encoder.encode(`data: ${typeof data === "string" ? data : JSON.stringify(data)}\n\n`));

        let promptTokens = 0;
        let outputTokens = 0;

        try {
          const ai = new GoogleGenAI({ apiKey });
          const contents: Content[] = conversation.map((c) => ({ role: c.role, parts: [{ text: c.text }] }));
          const config = { systemInstruction, tools: [{ functionDeclarations: [...CLIENT_ACTIONS, ...SERVER_TOOLS] }], temperature: 0.3 };

          // Up to two rounds: the model may call tools, then writes its reply.
          for (let round = 0; round < 2; round++) {
            const result = await ai.models.generateContentStream({ model: modelName, contents, config });
            const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
            for await (const chunk of result) {
              if (chunk.text) send({ type: "delta", text: chunk.text });
              for (const call of chunk.functionCalls ?? []) {
                if (call.name) calls.push({ name: call.name, args: (call.args ?? {}) as Record<string, unknown> });
              }
              if (chunk.usageMetadata) {
                promptTokens += chunk.usageMetadata.promptTokenCount ?? 0;
                outputTokens += chunk.usageMetadata.candidatesTokenCount ?? 0;
              }
            }
            if (!calls.length) break;

            const responses = [];
            for (const call of calls) {
              let output: string;
              if (CLIENT_ACTION_NAMES.has(call.name)) {
                send({ type: "action", name: call.name, args: call.args });
                output = "Sent to the user's app; it will confirm on screen.";
              } else if (call.name === "get_week_summary") {
                output = (await executeCoachTool(call.name, call.args, uid, today)).result;
              } else {
                output = "Unknown tool.";
              }
              responses.push({ functionResponse: { name: call.name, response: { output } } });
            }
            contents.push({ role: "model", parts: calls.map((c) => ({ functionCall: { name: c.name, args: c.args } })) });
            contents.push({ role: "user", parts: responses });
          }

          const costUsd = (promptTokens * 0.1 + outputTokens * 0.4) / 1_000_000;
          await recordSpend(uid, costUsd);
          send({ type: "done", usage: { prompt_tokens: promptTokens, completion_tokens: outputTokens, cost_usd: costUsd } });
        } catch (err) {
          console.error("Coach stream error:", err);
          send({ type: "error", error: "The coach couldn't answer just now. Try again in a moment." });
        } finally {
          send("[DONE]");
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
    });
  } catch (err) {
    console.error("Coach API route error:", err);
    return NextResponse.json({ error: "The coach couldn't answer just now.", code: "COACH_ERROR" }, { status: 500 });
  }
}
