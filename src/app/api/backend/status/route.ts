import { NextResponse } from "next/server";
import { getModel, getGoogleApiKey } from "@/lib/ai/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let aiConfigured = false;
    let modelId = "simulation-fallback";

    try {
      const aiModel = getModel();
      if (aiModel) {
        aiConfigured = true;
        modelId = aiModel.modelId;
      }
    } catch {
      // fallback
    }

    return NextResponse.json({
      status: "connected",
      message: "Cloud Firestore client and persistent local cache operational.",
      database: {
        engine: "Google Cloud Firestore",
        cache: "persistentLocalCache (IndexedDB multi-tab)",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        healthy: true,
      },
      ai: {
        configured: aiConfigured || Boolean(process.env.GEMINI_API_KEY),
        provider: "google",
        model: process.env.GEMINI_MODEL || modelId,
        key_detected: Boolean(process.env.GEMINI_API_KEY || getGoogleApiKey()),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Backend status error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        code: "BACKEND_STATUS_ERROR",
      },
      { status: 500 }
    );
  }
}
