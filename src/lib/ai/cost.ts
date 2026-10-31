/** Pure cost math shared by server and client. */
export const DEFAULT_MONTHLY_CAP_USD = 2;

export function estimateCostUSD(pricing: { input: number; output: number } | undefined, inputTokens: number, outputTokens: number): number {
  if (!pricing) return 0;
  return Math.round(((inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000) * 100_000) / 100_000;
}

export function monthStartISO(d = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
