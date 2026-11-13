import "server-only";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { checkRateLimit } from "@/lib/rate-limiter";

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

const APP_CHECK_JWKS = createRemoteJWKSet(
  new URL("https://firebaseappcheck.googleapis.com/v1/jwks")
);

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "";

export interface ServerAuthResult {
  uid: string;
  /** True for the shared read-only demo athlete. */
  isDemo: boolean;
  /** True only when a Firebase ID token was cryptographically verified. */
  isVerified: boolean;
  /** Firebase anonymous sign-in or unverified demo caller. */
  isAnonymous: boolean;
  email?: string;
}

/**
 * Verifies the Firebase App Check token from the X-Firebase-AppCheck header.
 */
export async function verifyAppCheck(req: Request): Promise<{
  valid: boolean;
  appId?: string;
  errorResponse?: Response;
}> {
  const token = req.headers.get("x-firebase-appcheck");
  const enforce = process.env.ENFORCE_APP_CHECK === "true";

  if (!token) {
    if (enforce) {
      return {
        valid: false,
        errorResponse: NextResponse.json(
          {
            error: "Unauthorized: Missing X-Firebase-AppCheck header.",
            code: "APP_CHECK_MISSING",
          },
          { status: 401 }
        ),
      };
    }
    return { valid: true };
  }

  if (
    token === "performance-os-local-dev-app-check-token" &&
    process.env.NODE_ENV !== "production"
  ) {
    return { valid: true, appId: "performance-os-local-dev" };
  }

  try {
    const { payload } = await jwtVerify(token, APP_CHECK_JWKS);
    return {
      valid: true,
      appId: typeof payload.sub === "string" ? payload.sub : undefined,
    };
  } catch (err) {
    if (enforce) {
      return {
        valid: false,
        errorResponse: NextResponse.json(
          {
            error: "Unauthorized: Invalid or expired Firebase App Check token.",
            code: "APP_CHECK_INVALID",
            details: err instanceof Error ? err.message : String(err),
          },
          { status: 401 }
        ),
      };
    }
    console.warn("Firebase App Check un-enforced validation notice:", err);
    return { valid: true };
  }
}

/** The shared, read-only demo athlete. Unverified callers are always mapped here. */
export const DEMO_UID = "ayush";

/**
 * Resolves who is calling.
 *
 * Only a verified Firebase ID token establishes an identity. Client-supplied
 * headers are never trusted as a uid. In production, callers without a valid
 * token are rejected.
 */
export async function verifyServerAuth(req: Request): Promise<{
  auth: ServerAuthResult | null;
  errorResponse?: Response;
}> {
  const authHeader = req.headers.get("authorization");

  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (token) {
    const verified = await verifyIdTokenSafe(token);
    if (verified) {
      return {
        auth: {
          uid: verified.uid,
          email: verified.email,
          isDemo: false,
          isVerified: true,
          isAnonymous: verified.isAnonymous,
        },
      };
    }
  }

  // Local development without Firebase Admin: act as a read-only sample user.
  if (!token && process.env.NODE_ENV !== "production") {
    return { auth: { uid: DEMO_UID, isDemo: true, isVerified: false, isAnonymous: true } };
  }

  return {
    auth: null,
    errorResponse: NextResponse.json(
      { error: "Unauthorized: missing or invalid Firebase ID token.", code: "UNAUTHORIZED" },
      { status: 401 }
    ),
  };
}

async function verifyIdTokenSafe(
  token: string
): Promise<{ uid: string; email?: string; isAnonymous: boolean } | null> {
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      isAnonymous: decoded.firebase?.sign_in_provider === "anonymous",
    };
  } catch {
    // Admin SDK not configured or token rejected: verify the signature against Google's public keys.
  }
  if (!PROJECT_ID) return null;
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    if (!payload.sub) return null;
    const fb = payload.firebase as { sign_in_provider?: string } | undefined;
    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      isAnonymous: fb?.sign_in_provider === "anonymous",
    };
  } catch {
    return null;
  }
}

const AI_USAGE = "ai_usage";

const monthKey = (d = new Date()) => d.toISOString().slice(0, 7);

/**
 * Enforces the per-user monthly AI spend cap stored on ai_usage/{uid}
 * (server-only: Firestore rules deny all client access, so users can't reset it).
 * aiSpendMonth resets when aiSpendMonthKey (YYYY-MM) rolls over.
 */
export async function checkSpendCap(uid: string): Promise<{
  allowed: boolean;
  currentSpend: number;
  spendCap: number;
  errorResponse?: Response;
}> {
  let currentSpend = 0;
  let spendCap = 10.0;

  try {
    const snap = await getAdminFirestore().collection(AI_USAGE).doc(uid).get();
    const data = snap.exists ? snap.data() : undefined;
    if (data) {
      const sameMonth = data.aiSpendMonthKey === undefined || data.aiSpendMonthKey === monthKey();
      if (sameMonth && data.aiSpendMonth != null) currentSpend = Number(data.aiSpendMonth) || 0;
      if (data.aiSpendCap != null) spendCap = Number(data.aiSpendCap) || 10.0;
    }
  } catch (err) {
    console.warn("Firestore spend cap check notice:", err);
  }

  if (currentSpend >= spendCap) {
    return {
      allowed: false,
      currentSpend,
      spendCap,
      errorResponse: NextResponse.json(
        {
          error: `Monthly AI limit reached ($${currentSpend.toFixed(2)} / $${spendCap.toFixed(2)}). Use Quick Add instead.`,
          code: "SPEND_CAP_EXCEEDED",
          currentSpend,
          spendCap,
        },
        { status: 429 }
      ),
    };
  }

  return { allowed: true, currentSpend, spendCap };
}

/** Adds cost to ai_usage/{uid}.aiSpendMonth, starting a fresh total when the month changes. */
export async function recordSpend(uid: string, costUsd: number): Promise<void> {
  if (costUsd <= 0) return;
  const key = monthKey();
  try {
    const db = getAdminFirestore();
    const ref = db.collection(AI_USAGE).doc(uid);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : undefined;
      const prev = data?.aiSpendMonthKey === key ? Number(data?.aiSpendMonth) || 0 : 0;
      tx.set(
        ref,
        { aiSpendMonth: prev + costUsd, aiSpendMonthKey: key, aiSpendUpdatedAt: new Date().toISOString() },
        { merge: true }
      );
    });
  } catch (err) {
    console.warn("Failed to record AI spend in Firestore:", err);
  }
}

export type AiEndpoint = "coach" | "vision" | "weekly_review";

export interface RateLimitResult {
  allowed: boolean;
  errorResponse?: Response;
}

interface Bucket {
  key: string;
  perHour: number;
  perDay: number;
}

/** Signed-in (non-anonymous) users. */
const USER_LIMITS = { perHour: 30, perDay: 200 };
/** Each anonymous / demo visitor, keyed by hashed IP. */
const GUEST_LIMITS = { perHour: 8, perDay: 25 };
/** All anonymous / demo traffic combined, so rotating IPs or minting anonymous accounts can't run up the bill. */
const GUEST_GLOBAL_LIMITS = { perHour: 60, perDay: 300 };

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function bucketsFor(req: Request, auth: ServerAuthResult): Bucket[] {
  if (auth.isVerified && !auth.isAnonymous) {
    return [{ key: `user_${auth.uid}`, ...USER_LIMITS }];
  }
  const ipHash = createHash("sha256").update(clientIp(req)).digest("hex").slice(0, 24);
  const buckets: Bucket[] = [
    { key: `guest_ip_${ipHash}`, ...GUEST_LIMITS },
    { key: "guest_all", ...GUEST_GLOBAL_LIMITS },
  ];
  if (auth.isVerified) buckets.unshift({ key: `user_${auth.uid}`, ...GUEST_LIMITS });
  return buckets;
}

const rateLimited = () =>
  NextResponse.json(
    {
      error: "The coach is taking a short break. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      friendlyMessage: "The coach is taking a short break. Please try again later.",
    },
    { status: 429, headers: { "Retry-After": "3600" } }
  );

/**
 * Durable rate limit shared by every serverless instance, stored in
 * Firestore at rate_limits/{bucket}__{endpoint} and updated in a transaction.
 * If Firestore is unreachable it falls back to the per-instance in-memory limiter.
 */
export async function enforceAiRateLimit(
  req: Request,
  auth: ServerAuthResult,
  endpoint: AiEndpoint
): Promise<RateLimitResult> {
  const buckets = bucketsFor(req, auth);
  const now = new Date();
  const hourKey = now.toISOString().slice(0, 13);
  const dayKey = now.toISOString().slice(0, 10);

  try {
    const db = getAdminFirestore();
    const allowed = await db.runTransaction(async (tx) => {
      const refs = buckets.map((b) => db.collection("rate_limits").doc(`${b.key}__${endpoint}`));
      const snaps = await Promise.all(refs.map((r) => tx.get(r)));
      const counts = snaps.map((s) => {
        const d = (s.exists ? s.data() : undefined) ?? {};
        return {
          hour: d.hourKey === hourKey ? Number(d.hourCount) || 0 : 0,
          day: d.dayKey === dayKey ? Number(d.dayCount) || 0 : 0,
        };
      });
      const blocked = buckets.some((b, i) => {
        const c = counts[i];
        return c !== undefined && (c.hour >= b.perHour || c.day >= b.perDay);
      });
      if (blocked) return false;
      refs.forEach((ref, i) => {
        const c = counts[i] ?? { hour: 0, day: 0 };
        tx.set(ref, {
          hourKey,
          hourCount: c.hour + 1,
          dayKey,
          dayCount: c.day + 1,
          updatedAt: now.toISOString(),
        });
      });
      return true;
    });
    return allowed ? { allowed: true } : { allowed: false, errorResponse: rateLimited() };
  } catch (err) {
    console.warn(`Durable rate limit unavailable for ${endpoint}, using in-memory fallback:`, err);
    for (const b of buckets) {
      const hour = checkRateLimit(`${b.key}:${endpoint}:h`, b.perHour, 3_600_000);
      const day = checkRateLimit(`${b.key}:${endpoint}:d`, b.perDay, 86_400_000);
      if (!hour.ok || !day.ok) return { allowed: false, errorResponse: rateLimited() };
    }
    return { allowed: true };
  }
}

/**
 * One gate for every AI route: App Check, identity, monthly spend cap, rate limit.
 * Returns either the caller or the response to send back.
 */
export async function guardAiRequest(
  req: Request,
  endpoint: AiEndpoint
): Promise<{ auth: ServerAuthResult; errorResponse?: undefined } | { auth?: undefined; errorResponse: Response }> {
  const appCheck = await verifyAppCheck(req);
  if (!appCheck.valid && appCheck.errorResponse) return { errorResponse: appCheck.errorResponse };

  const { auth, errorResponse } = await verifyServerAuth(req);
  if (!auth) {
    return {
      errorResponse:
        errorResponse ?? NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 }),
    };
  }

  const cap = await checkSpendCap(auth.uid);
  if (!cap.allowed && cap.errorResponse) return { errorResponse: cap.errorResponse };

  const rate = await enforceAiRateLimit(req, auth, endpoint);
  if (!rate.allowed && rate.errorResponse) return { errorResponse: rate.errorResponse };

  return { auth };
}
