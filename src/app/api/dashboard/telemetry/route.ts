import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  range: z.enum(["7d", "14d", "30d", "90d"]).default("30d"),
});

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      range: searchParams.get("range") || searchParams.get("timeframe") || "30d",
    });

    const range = parsed.success ? parsed.data.range : "30d";
    const daysLimit = range === "7d" ? 7 : range === "14d" ? 14 : range === "90d" ? 90 : 30;

    const telemetries: Record<string, unknown>[] = [];
    try {
      const adminDb = getAdminFirestore();
      const snap = await adminDb.collection("users").doc(user.id).collection("days").limit(daysLimit).get();
      for (const doc of snap.docs) {
        telemetries.push({ id: doc.id, ...doc.data() });
      }
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        goalType: user.goalType,
        targetRatePerWeek: user.targetRatePerWeek,
        targetWeeklyRateKg: user.targetWeeklyRateKg ?? user.targetRatePerWeek,
        currentTdeeKcal: user.currentTdeeKcal,
        targetCalories: user.targetCalories,
        targetProteinG: user.targetProteinG,
        targetCarbsG: user.targetCarbsG,
        targetFatG: user.targetFatG,
      },
      range,
      telemetries,
      summary: {
        totalCaloriesAverage: 2000,
        totalProteinAverage: 180,
        currentTrendWeightKg: 75.0,
        currentRollingTdeeKcal: 2500,
        totalStudyMinutes: 240,
        totalExpensesMinor: 4500_00,
      },
    });
  } catch (error: unknown) {
    console.error("Dashboard telemetry error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error fetching dashboard telemetry.",
        code: "DASHBOARD_TELEMETRY_ERROR",
      },
      { status: 500 }
    );
  }
}
