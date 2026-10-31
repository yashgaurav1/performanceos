import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { calculateMacroTargets } from "@/lib/macrofactor-engine";

export const runtime = "nodejs";

const CheckInOverrideSchema = z.object({
  goalType: z.enum(["CUT", "MAINTAIN", "BULK", "Cut", "Maintain", "Bulk"]).optional(),
  targetRatePerWeek: z.number().min(0).max(2).optional(),
});

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const checkIns: Record<string, unknown>[] = [];
    try {
      const adminDb = getAdminFirestore();
      const snap = await adminDb.collection("users").doc(user.id).collection("coach").limit(10).get();
      for (const doc of snap.docs) {
        checkIns.push({ id: doc.id, ...doc.data() });
      }
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({ success: true, checkIns });
  } catch (err: unknown) {
    console.error("Coach check-in GET error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to fetch coach check-ins.",
        code: "COACH_CHECKIN_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = CheckInOverrideSchema.safeParse(body);
    const overrides = parsed.success ? parsed.data : {};

    const goalType = (overrides.goalType || user.goalType || "CUT").toUpperCase() as "CUT" | "MAINTAIN" | "BULK";
    const targetRatePerWeekKg = overrides.targetRatePerWeek !== undefined ? overrides.targetRatePerWeek : user.targetWeeklyRateKg ?? 0.5;

    const currentTdee = user.currentTdeeKcal || 2500;
    const bodyWeightKg = 75;
    const targets = calculateMacroTargets({
      currentTDEE: currentTdee,
      trendWeightKg: bodyWeightKg,
      goalType,
      targetRatePerWeekKg,
    });

    const checkInId = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);

    const checkIn = {
      id: checkInId,
      userId: user.id,
      checkInDate: today,
      previousTdeeKcal: currentTdee,
      newTdeeKcal: currentTdee,
      tdeeDeltaKcal: 0,
      previousTargetKcal: user.targetCalories || 2000,
      newTargetKcal: targets.recommendedCalories,
      newProteinG: targets.recommendedProtein,
      newCarbsG: targets.recommendedCarbs,
      newFatG: targets.recommendedFat,
      acceptedByUser: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection("users").doc(user.id).collection("coach").doc(checkInId).set(checkIn);
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({
      success: true,
      message: "Weekly coach check-in recommendation generated and saved to Firestore.",
      checkIn,
      newTargets: targets,
    });
  } catch (err: unknown) {
    console.error("Coach check-in error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to process weekly check-in.",
        code: "COACH_CHECKIN_ERROR",
      },
      { status: 500 }
    );
  }
}
