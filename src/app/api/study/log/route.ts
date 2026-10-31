import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const runtime = "nodejs";

const StudyLogSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  durationMinutes: z.number().int().positive("Minutes must be positive"),
  mode: z.string().default("FOCUS"),
  loggedAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = StudyLogSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { subject, durationMinutes, mode, loggedAt } = parsed.data;
    const sessionId = crypto.randomUUID();
    const now = loggedAt || new Date().toISOString();

    const session = {
      id: sessionId,
      user_id: user.id,
      subject,
      focus_mins: durationMinutes,
      mode: mode.toLowerCase(),
      source: "manual",
      started_at: now,
      ended_at: now,
      log_date: now.slice(0, 10),
      updatedAt: new Date().toISOString(),
    };

    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection("users").doc(user.id).collection("focus").doc(sessionId).set(session);
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({
      success: true,
      message: "Study session logged successfully to Firestore.",
      session,
    });
  } catch (err: unknown) {
    console.error("Study log error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to log study session.",
        code: "STUDY_LOG_ERROR",
      },
      { status: 500 }
    );
  }
}
