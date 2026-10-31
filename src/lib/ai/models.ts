import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/** USD per 1M tokens. */
export const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-3.8-flash": { input: 0.1, output: 0.4 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export type Provider = "google" | "openai" | "openrouter";

export function getGoogleApiKey(customKey?: string | null): string | null {
  const raw =
    customKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    null;
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^["']|["']$/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function activeProvider(customKey?: string | null): Provider | null {
  const pref = (process.env.AI_PROVIDER ?? "google").toLowerCase();
  const googleKey = getGoogleApiKey(customKey);
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openAIKey = process.env.OPENAI_API_KEY?.trim();

  if (pref === "openai" && openAIKey) return "openai";
  if (pref === "openrouter" && openRouterKey) return "openrouter";
  if (googleKey) return "google";
  if (openRouterKey) return "openrouter";
  if (openAIKey) return "openai";
  return null;
}

export function getModel(customKey?: string | null): { model: LanguageModel; modelId: string } | null {
  const p = activeProvider(customKey);
  const googleKey = getGoogleApiKey(customKey);
  if (googleKey && (p === "google" || !p)) {
    const customGoogle = createGoogleGenerativeAI({ apiKey: googleKey });
    // Use gemini-2.0-flash as the primary, high-compatibility production model
    const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    return { model: customGoogle(modelName), modelId: modelName };
  }
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (p === "openrouter" && openRouterKey) {
    const customOpenRouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterKey,
    });
    return { model: customOpenRouter("google/gemini-2.0-flash"), modelId: "google/gemini-2.0-flash" };
  }
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  if (p === "openai" && openAIKey) {
    const customOpenAI = createOpenAI({ apiKey: openAIKey });
    return { model: customOpenAI("gpt-4o-mini"), modelId: "gpt-4o-mini" };
  }
  return null;
}
