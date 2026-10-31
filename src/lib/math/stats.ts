/** Small zero-dependency statistics helpers shared by the domain engines. */

export function sum(xs: readonly number[]): number {
  let t = 0;
  for (const x of xs) t += x;
  return t;
}

export function mean(xs: readonly number[]): number | null {
  return xs.length === 0 ? null : sum(xs) / xs.length;
}

export function round(x: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** Least-squares slope of ys against x = 0..n-1. */
export function linearSlope(ys: readonly number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = sum(ys) / n;
  let num = 0;
  let den = 0;
  ys.forEach((y, i) => {
    num += (i - xMean) * (y - yMean);
    den += (i - xMean) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

/** Exponential moving average over an ordered series; alpha = 2 / (span + 1). */
export function ema(values: readonly number[], span = 7): number[] {
  const alpha = 2 / (span + 1);
  const out: number[] = [];
  let prev: number | undefined;
  for (const v of values) {
    prev = prev === undefined ? v : alpha * v + (1 - alpha) * prev;
    out.push(prev);
  }
  return out;
}

/**
 * Weight trend diff: today's scale weight vs the EMA of all prior weigh-ins.
 * Returns null without at least one prior weigh-in.
 */
export function weightTrendDiff(
  series: readonly { date: string; kg: number }[],
  today: string,
  span = 7,
): { trendKg: number; diffKg: number } | null {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const prior = sorted.filter((p) => p.date < today);
  const todays = sorted.find((p) => p.date === today);
  if (prior.length === 0 || !todays) return null;
  const trend = ema(prior.map((p) => p.kg), span).at(-1) ?? todays.kg;
  return { trendKg: round(trend, 2), diffKg: round(todays.kg - trend, 2) };
}
