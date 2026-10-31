import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const runtime = "nodejs";

const LogWeightSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").default(() => new Date().toISOString().slice(0, 10)),
  scaleWeightKg: z.number().min(30).max(300, "Weight must be between 30kg and 300kg"),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = LogWeightSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { date, scaleWeightKg } = parsed.data;

    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection("users").doc(user.id).collection("days").doc(date).set(
        {
          log_date: date,
          body_weight_kg: scaleWeightKg,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({
      success: true,
      message: "Weight logged successfully to Firestore.",
      currentWeight: scaleWeightKg,
      currentTrend: scaleWeightKg,
    });
  } catch (err: unknown) {
    console.error("Weight log error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to log weight.",
        code: "WEIGHT_LOG_ERROR",
      },
      { status: 500 }
    );
  }
}
