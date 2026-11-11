/**
 * Best-effort, per-instance fixed-window limiter.
 *
 * Each serverless instance has its own Map, so this only blunts bursts. It is
 * NOT a real limit on Vercel. AI routes use the durable Firestore limiter in
 * src/lib/ai/server-auth.ts (enforceAiRateLimit) and fall back to this only
 * when Firestore is unreachable.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(ip: string, limit = 120, windowMs = 60_000): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = ipMap.get(ip);

  // Clean old entries if map gets too large
  if (ipMap.size > 10_000) {
    for (const [key, val] of ipMap.entries()) {
      if (val.resetAt <= now) ipMap.delete(key);
    }
  }

  if (!record || record.resetAt <= now) {
    const newRecord = { count: 1, resetAt: now + windowMs };
    ipMap.set(ip, newRecord);
    return { ok: true, remaining: limit - 1, resetAt: newRecord.resetAt };
  }

  if (record.count >= limit) {
    return { ok: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { ok: true, remaining: limit - record.count, resetAt: record.resetAt };
}
