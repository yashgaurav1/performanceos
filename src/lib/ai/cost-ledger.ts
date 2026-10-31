import "server-only";
import type { AIFeature, AIRunLedger } from "@/types/database.types";
import { DEFAULT_MONTHLY_CAP_USD, estimateCostUSD } from "./cost";
import { PRICING } from "./models";

export function monthlyCapUSD(): number {
  const v = Number(process.env.AI_MONTHLY_CAP_USD);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_MONTHLY_CAP_USD;
}

export async function monthToDateSpend(_auth: unknown, clientReported = 0): Promise<number> {
  return clientReported;
}

export async function assertUnderCap(_auth: unknown, clientReported = 0) {
  const spent = await monthToDateSpend(_auth, clientReported);
  const cap = monthlyCapUSD();
  return { ok: spent < cap, spent, cap };
}

type Usage = { inputTokens?: number; outputTokens?: number };

export function makeLedgerRow(
  userId: string | null,
  feature: AIFeature,
  modelId: string,
  usage: Usage,
  id: string = crypto.randomUUID()
): AIRunLedger {
  const input_tokens = usage.inputTokens ?? 0;
  const output_tokens = usage.outputTokens ?? 0;
  return {
    id,
    user_id: userId ?? "00000000-0000-0000-0000-000000000000",
    feature,
    model_id: modelId,
    input_tokens,
    output_tokens,
    estimated_cost_usd: estimateCostUSD(PRICING[modelId], input_tokens, output_tokens),
    created_at: new Date().toISOString(),
  };
}

export async function persistLedger(_auth: unknown, _row: AIRunLedger) {
  // Client mirrors AI cost ledger rows directly into Firestore
}

export async function recordRun(
  auth: unknown,
  feature: AIFeature,
  modelId: string,
  usage: Usage
): Promise<AIRunLedger> {
  const row = makeLedgerRow(null, feature, modelId, usage);
  await persistLedger(auth, row);
  return row;
}
