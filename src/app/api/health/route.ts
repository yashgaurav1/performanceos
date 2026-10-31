import { NextResponse } from "next/server";
import { getAdminApp, getAdminAuth } from "@/lib/firebaseAdmin";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedDeepCheck: {
  success: boolean;
  error?: string;
  timestamp: number;
} | null = null;

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(req: Request) {
  try {
    const envStatus = {
      FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      FIREBASE_PRIVATE_KEY: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
      GEMINI_MODEL: Boolean(process.env.GEMINI_MODEL),
      NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
      NEXT_PUBLIC_FIREBASE_APP_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    };

    const firebaseAdminStatus = {
      initialized: false,
      error: undefined as string | undefined,
    };

    try {
      const app = getAdminApp();
      const auth = getAdminAuth();
      firebaseAdminStatus.initialized = Boolean(app && auth);
    } catch (adminErr) {
      firebaseAdminStatus.error = adminErr instanceof Error ? adminErr.message : String(adminErr);
    }

    const healthKeyHeader = req.headers.get("x-health-key");
    const configuredHealthKey = process.env.HEALTH_CHECK_KEY?.trim();
    const shouldRunDeepCheck = Boolean(configuredHealthKey && healthKeyHeader === configuredHealthKey);

    let deepCheckResult: { success: boolean; error?: string; cached?: boolean } | undefined = undefined;

    if (shouldRunDeepCheck) {
      const now = Date.now();
      if (cachedDeepCheck && now - cachedDeepCheck.timestamp < CACHE_DURATION_MS) {
        deepCheckResult = {
          success: cachedDeepCheck.success,
          error: cachedDeepCheck.error,
          cached: true,
        };
      } else {
        const geminiKey = process.env.GEMINI_API_KEY?.trim();
        const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
        if (geminiKey) {
          try {
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const res = await ai.models.generateContent({
              model: modelName,
              contents: "ping",
              config: {
                maxOutputTokens: 5,
              },
            });
            const success = Boolean(res && (res.text !== undefined || res.candidates));
            cachedDeepCheck = {
              success,
              timestamp: now,
            };
            deepCheckResult = { success, cached: false };
          } catch (geminiErr) {
            const error = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
            cachedDeepCheck = {
              success: false,
              error,
              timestamp: now,
            };
            deepCheckResult = { success: false, error, cached: false };
          }
        } else {
          deepCheckResult = {
            success: false,
            error: "GEMINI_API_KEY is not set in environment variables",
            cached: false,
          };
        }
      }
    }

    const isHealthy =
      envStatus.FIREBASE_PROJECT_ID &&
      firebaseAdminStatus.initialized &&
      envStatus.GEMINI_API_KEY &&
      (deepCheckResult ? deepCheckResult.success : true);

    return NextResponse.json({
      ok: Boolean(isHealthy),
      timestamp: new Date().toISOString(),
      env: envStatus,
      firebaseAdmin: firebaseAdminStatus,
      ...(deepCheckResult ? { deepCheck: deepCheckResult } : {}),
    });
  } catch (err: unknown) {
    console.error("Health check route error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        code: "HEALTH_CHECK_ERROR",
      },
      { status: 500 }
    );
  }
}
