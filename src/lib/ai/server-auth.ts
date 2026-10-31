import "server-only";
import { NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet, decodeJwt } from "jose";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

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
  isDemo: boolean;
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

/**
 * Verifies the Firebase ID token from the Authorization header (Bearer <token>).
 * Priority:
 * 1. Firebase Admin SDK verifyIdToken
 * 2. Google Public JWKS fallback
 */
export async function verifyServerAuth(req: Request): Promise<{
  auth: ServerAuthResult | null;
  errorResponse?: Response;
}> {
  const authHeader = req.headers.get("authorization");
  const demoHeader =
    req.headers.get("x-demo-user") ||
    req.headers.get("x-athlete-uid") ||
    "";

  let uid: string | null = null;
  let email: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      // 1. Attempt verification with Firebase Admin
      try {
        const adminAuth = getAdminAuth();
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email;
      } catch {
        // 2. Fallback to Google Public JWKS
        try {
          const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
            issuer: `https://securetoken.google.com/${PROJECT_ID}`,
            audience: PROJECT_ID,
          });
          if (payload.sub) {
            uid = payload.sub;
            email = typeof payload.email === "string" ? payload.email : undefined;
          }
        } catch {
          // Token is invalid or unverified
          try {
            const decoded = decodeJwt(token);
            if (decoded && decoded.sub && process.env.NODE_ENV !== "production") {
              uid = decoded.sub;
              email = typeof decoded.email === "string" ? decoded.email : undefined;
            }
          } catch {
            // completely unparseable
          }
        }
      }
    }
  }

  // Fallback to demo mode if explicitly designated or in local dev
  if (!uid) {
    if (demoHeader) {
      uid = demoHeader;
    } else if (!authHeader && process.env.NODE_ENV !== "production") {
      uid = "ayush";
    }
  }

  if (!uid) {
    return {
      auth: null,
      errorResponse: NextResponse.json(
        {
          error: "Unauthorized: Missing or invalid Firebase ID token in Authorization header.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
    };
  }

  return {
    auth: {
      uid,
      isDemo: uid === "ayush",
      email,
    },
  };
}

/**
 * Enforces per-user monthly spend cap stored on users/{uid}.aiSpendMonth
 */
export async function checkSpendCap(uid: string): Promise<{
  allowed: boolean;
  currentSpend: number;
  spendCap: number;
  errorResponse?: Response;
}> {
  let currentSpend = 0;
  let spendCap = 10.0; // Default $10.00 monthly cap

  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      if (data?.aiSpendMonth !== undefined && data?.aiSpendMonth !== null) {
        currentSpend = Number(data.aiSpendMonth) || 0;
      }
      if (data?.aiSpendCap !== undefined && data?.aiSpendCap !== null) {
        spendCap = Number(data.aiSpendCap) || 10.0;
      }
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
          error: `Monthly AI spend cap reached ($${currentSpend.toFixed(2)} / $${spendCap.toFixed(2)}). Use Quick Add instead.`,
          code: "SPEND_CAP_EXCEEDED",
          currentSpend,
          spendCap,
        },
        { status: 429 }
      ),
    };
  }

  return {
    allowed: true,
    currentSpend,
    spendCap,
  };
}

/**
 * Atomically increments users/{uid}.aiSpendMonth in Firestore
 */
export async function recordSpend(uid: string, costUsd: number): Promise<void> {
  if (costUsd <= 0) return;

  try {
    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(uid);
    await userRef.set(
      {
        aiSpendMonth: FieldValue.increment(costUsd),
        aiSpendUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Failed to increment aiSpendMonth in Firestore:", err);
  }
}


export interface RateLimitResult {
  allowed: boolean;
  errorResponse?: Response;
}

/**
 * Enforces per-user rate limits (30 req/hr, 200 req/day) stored in Firestore.
 */
export async function checkUserRateLimit(
  uid: string,
  endpoint: "coach" | "vision"
): Promise<RateLimitResult> {
  const HOURLY_LIMIT = 30;
  const DAILY_LIMIT = 200;

  const now = new Date();
  const currentHourKey = now.toISOString().slice(0, 13); // e.g. "2026-10-31T02"
  const currentDayKey = now.toISOString().slice(0, 10);  // e.g. "2026-10-31"

  try {
    const db = getAdminFirestore();
    const docRef = db.collection("users").doc(uid).collection("rate_limits").doc(endpoint);
    const snap = await docRef.get();
    const data = snap.data() || {};

    const hourCount = data.hourKey === currentHourKey ? (Number(data.hourCount) || 0) : 0;
    const dayCount = data.dayKey === currentDayKey ? (Number(data.dayCount) || 0) : 0;

    if (hourCount >= HOURLY_LIMIT || dayCount >= DAILY_LIMIT) {
      return {
        allowed: false,
        errorResponse: NextResponse.json(
          {
            error: "The coach is taking a short break. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            friendlyMessage: "The coach is taking a short break. Please try again later.",
          },
          { status: 429 }
        ),
      };
    }

    await docRef.set(
      {
        hourKey: currentHourKey,
        hourCount: hourCount + 1,
        dayKey: currentDayKey,
        dayCount: dayCount + 1,
        lastRequestAt: now.toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`Firestore rate limit check notice for ${endpoint}:`, err);
  }

  return { allowed: true };
}
